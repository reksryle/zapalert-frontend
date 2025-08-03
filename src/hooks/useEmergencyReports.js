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

const useEmergencyReports = (enableToasts = false) => {
  const [reports, setReports] = useState([]);
  const [user, setUser] = useState(null);
  const latestIds = useRef(new Set());
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
      audio.play().catch((err) => {
        console.warn("🔇 Could not play sound:", err);
      });
    }
  };

  const fetchReports = async () => {
    try {
      const res = await axios.get(`${API_URL}/reports`, {
        withCredentials: true,
      });
      const newReports = res.data.filter((r) => r.status !== "responded");
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
      toast.success("🗑️ Report declined");

      const toUsername = reports.find((r) => r._id === id)?.username;
      const type = reports.find((r) => r._id === id)?.type || "Emergency";

      if (toUsername && user) {
        socket.emit("declined", {
          username: toUsername,
          responderName: `${user.firstName} ${user.lastName}`,
          type,
        });
      }

      fetchReports();
    } catch {
      toast.error("❌ Failed to decline report");
    }
  };

  const markAsResponded = async (id) => {
    try {
      await axios.patch(`${API_URL}/reports/${id}/respond`, {}, {
        withCredentials: true,
      });
      toast.success("✅ Marked as responded");

      const toUsername = reports.find((r) => r._id === id)?.username;
      const type = reports.find((r) => r._id === id)?.type || "Emergency";

      if (toUsername && user) {
        socket.emit("responded", {
          username: toUsername,
          responderName: `${user.firstName} ${user.lastName}`,
          type,
        });
      }

      fetchReports();
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
      fetchReports();
    } catch {
      toast.error("❌ Failed to update status");
    }
  };

  return { reports, markAsOnTheWay, markAsResponded, declineReport };
};

export default useEmergencyReports;
