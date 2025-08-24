import { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || "http://localhost:5001";

const socket = io(SOCKET_URL, {
  withCredentials: true,
});

const soundMap = {
  Fire: "/sounds/fire.mp3",
  Medical: "/sounds/medical.mp3",
  Crime: "/sounds/crime.mp3",
  Flood: "/sounds/flood.mp3",
  Other: "/sounds/other.mp3",
};

const HIDDEN_KEY = "responder-hidden-report-ids";

const useEmergencyReports = (enableToasts = false) => {
  const [reports, setReports] = useState([]);
  const [user, setUser] = useState(null);
  const latestIds = useRef(new Set());

  // 🔒 Keep a Set of hidden IDs (per responder, persisted locally)
  const hiddenIdsRef = useRef(new Set());
  // load hidden IDs on first mount
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");
      hiddenIdsRef.current = new Set(saved);
    } catch { /* ignore */ }
  }, []);

  // 🔊 preload sounds
  const audioReady = useRef(false);
  const preloadedAudios = useRef({});
  useEffect(() => {
    const unlockAudio = () => {
      Object.entries(soundMap).forEach(([type, path]) => {
        const audio = new Audio(path);
        audio.load();
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {});
        preloadedAudios.current[type] = audio;
      });
      audioReady.current = true;
    };

    window.addEventListener("click", unlockAudio, { once: true });
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  const playSoundForType = (type) => {
    if (!audioReady.current) return;
    const audio = preloadedAudios.current[type] || preloadedAudios.current["Other"];
    if (audio) {
      audio.currentTime = 0;
      audio.play().catch(() => {});
    }
  };

  const persistHidden = () => {
    try {
      localStorage.setItem(HIDDEN_KEY, JSON.stringify([...hiddenIdsRef.current]));
    } catch { /* ignore */ }
  };

  const hideLocally = (id) => {
    hiddenIdsRef.current.add(id);
    persistHidden();
    setReports((prev) => prev.filter((r) => r._id !== id));
  };

  const fetchReports = async () => {
    try {
      // ensure we have the latest hidden list across multiple components
      try {
        const saved = JSON.parse(localStorage.getItem(HIDDEN_KEY) || "[]");
        for (const id of saved) hiddenIdsRef.current.add(id);
      } catch {}

      const res = await axios.get(`${API_URL}/reports`, {
        withCredentials: true,
      });

      // keep anything not globally responded (if any) AND not hidden for this responder
      const newReports = res.data
        .filter((r) => r.status !== "responded")
        .filter((r) => !hiddenIdsRef.current.has(r._id));

      const incomingIds = new Set(newReports.map((r) => r._id));

      if (enableToasts) {
        newReports.forEach((r) => {
          if (!latestIds.current.has(r._id)) {
            toast.success(`📢 New ${r.type} report from ${r.firstName} ${r.lastName}`);
            playSoundForType(r.type);
          }
        });
      }

      latestIds.current = incomingIds;
      setReports(newReports);
    } catch (err) {
      console.error("❌ Failed to load reports:", err);
    }
  };

  const fetchUser = async () => {
    try {
      const res = await axios.get(`${API_URL}/auth/session`, {
        withCredentials: true,
      });
      setUser(res.data.user);
    } catch (err) {
      console.error("⚠️ Could not fetch logged-in user:", err);
    }
  };

  useEffect(() => {
    fetchUser();
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const declineReport = async (id) => {
    try {
      await axios.delete(`${API_URL}/reports/${id}`, {
        withCredentials: true,
      });

      // ✅ hide only for me
      hideLocally(id);
      toast.success("🗑️ Report declined");

      // 🚫 Do NOT emit socket 'declined' here (backend already notifies the resident)
      // (kept intentionally empty)
    } catch {
      toast.error("❌ Failed to decline report");
    }
  };

  const markAsResponded = async (id) => {
    try {
      await axios.patch(`${API_URL}/reports/${id}/respond`, {}, {
        withCredentials: true,
      });

      // ✅ hide only for me
      hideLocally(id);
      toast.success("✅ Marked as responded");

      // 🚫 Do NOT emit socket 'responded' here (backend already notifies the resident)
    } catch {
      toast.error("❌ Failed to mark as responded");
    }
  };

  const markAsOnTheWay = async (id) => {
    try {
      await axios.patch(`${API_URL}/reports/${id}/ontheway`, {}, {
        withCredentials: true,
      });
      toast.success("🚓 Status: On our way");
      // keep visible to others; we do not hide locally on on-the-way
      fetchReports();
    } catch {
      toast.error("❌ Failed to update status");
    }
  };

  return { reports, markAsOnTheWay, markAsResponded, declineReport };
};

export default useEmergencyReports;
