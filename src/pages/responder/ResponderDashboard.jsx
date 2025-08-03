import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/responder/Sidebar";
import EmergencyList from "./EmergencyList";
import MapView from "./MapView";
import NotificationsPanel from "./NotificationsPanel";
import axios from "../../api/axios";
import socket from "../../socket"; // shared socket instance
import toast, { Toaster } from "react-hot-toast";
import showAnnouncementToast from "../../utils/showAnnouncementToast";

const ResponderDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  // Session check
  useEffect(() => {
    axios
      .get("/auth/session", { withCredentials: true })
      .then((res) => {
        if (res.data.role !== "responder") {
          navigate("/");
        } else {
          setUsername(res.data.username); // optional: in case needed for join-responder
          setLoading(false);
        }
      })
      .catch(() => {
        navigate("/");
      });
  }, [navigate]);

  // Socket setup
  useEffect(() => {
    if (loading) return;

    socket.connect();
    console.log("✅ Responder socket connected:", socket.id);

    socket.emit("join-responder", username);

    const handleAnnouncement = (data) => {
      showAnnouncementToast(data.message);
    };

    const handleNotifyResponder = (data) => {
      toast.success(`${data.fullName} is responding to your report.`);

      const audio = new Audio("/sounds/notify.mp3");
      audio.play().catch((err) => {
        console.error("Sound playback failed:", err);
      });
    };

    socket.on("public-announcement", handleAnnouncement);
    socket.on("notify-responder", handleNotifyResponder);

    socket.on("disconnect", () => {
      console.warn("❌ Responder socket disconnected");
    });

    return () => {
      socket.off("public-announcement", handleAnnouncement);
      socket.off("notify-responder", handleNotifyResponder);
      socket.disconnect();
    };
  }, [loading, username]);

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toaster position="top-right" />
      <div className="w-64 bg-white shadow-lg">
        <Sidebar />
      </div>
      <div className="flex-1 p-6 overflow-y-auto">
        <h1 className="text-3xl font-bold text-red-800 mb-6">Responder Dashboard</h1>
        <EmergencyList />
        <MapView />
        <NotificationsPanel />
      </div>
    </div>
  );
};

export default ResponderDashboard;
