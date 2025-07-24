import { useEffect, useRef, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";

const socket = io(
  import.meta.env.VITE_BACKEND_URL.replace(/^http/, "ws"),
  {
    transports: ["websocket"], // ⬅️ Forces pure WebSocket (no polling)
  }
);

// ✅ Sound map
const soundMap = {
  Fire: "/sounds/fire.mp3",
  Medical: "/sounds/medical.mp3",
  Crime: "/sounds/crime.mp3",
  Flood: "/sounds/flood.mp3",
  Other: "/sounds/other.mp3",
};

const useEmergencyReports = (enableToasts = false) => {
  const [reports, setReports] = useState([]);
  const latestIds = useRef(new Set());
  const audioReady = useRef(false); // ✅ Track if user unlocked audio
  const preloadedAudios = useRef({}); // ✅ Store audio instances

  // 🔓 Enable audio on first user interaction
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

      audioReady.current = true; // ✅ Now safe to play sound
    };

    window.addEventListener("click", unlockAudio, { once: true });
    return () => window.removeEventListener("click", unlockAudio);
  }, []);

  // ✅ Play sound only if audio is ready
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

  // ✅ Fetch reports
  const fetchReports = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/api/reports`);
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

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  const declineReport = async (id) => {
    try {
      await axios.delete(`${import.meta.env.VITE_BACKEND_URL}/api/reports/${id}`);
      toast.success("🗑️ Report declined");
      fetchReports();
    } catch {
      toast.error("❌ Failed to decline report");
    }
  };

  const markAsResponded = async (id) => {
    try {
      await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/${id}/respond`);
      toast.success("✅ Marked as responded");
      fetchReports();
    } catch {
      toast.error("❌ Failed to mark as responded");
    }
  };

  const markAsOnTheWay = async (id, report) => {
    try {
      const storedUser = JSON.parse(localStorage.getItem("user"));
      const responderUsername = storedUser?.username;
      const responderName = storedUser
        ? `${storedUser.firstName} ${storedUser.lastName}`
        : "Responder";

      await axios.patch(`${import.meta.env.VITE_BACKEND_URL}/api/reports/${id}/ontheway`, {
        responderName,
      });

      socket.emit("responder-update", {
        toUsername: report.username,
        responderUsername,
        type: report.type,
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
