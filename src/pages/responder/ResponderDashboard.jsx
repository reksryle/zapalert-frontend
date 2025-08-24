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
import { Bell } from "lucide-react";

const ResponderDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");

  const [responderNotifications, setResponderNotifications] = useState(() => {
    const stored = localStorage.getItem("responder-notifications");
    return stored ? JSON.parse(stored) : [];
  });

  const [hasNewNotif, setHasNewNotif] = useState(false);

  // Session check
  useEffect(() => {
    axios
      .get("/auth/session", { withCredentials: true })
      .then((res) => {
        if (res.data.role !== "responder") {
          navigate("/");
        } else {
          setUsername(res.data.username);
          setLoading(false);
        }
      })
      .catch(() => navigate("/"));
  }, [navigate]);

  // Socket setup for announcements only
  useEffect(() => {
    if (loading) return;

    socket.connect();
    socket.emit("join-responder", username);

    const handleAnnouncement = (data) => showAnnouncementToast(data.message);

    socket.on("public-announcement", handleAnnouncement);

    return () => {
      socket.off("public-announcement", handleAnnouncement);
      socket.disconnect();
    };
  }, [loading, username]);


  useEffect(() => {
    localStorage.setItem("responder-notifications", JSON.stringify(responderNotifications));
  }, [responderNotifications]);

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-gray-100">
      <Toaster position="top-right" />

      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <Sidebar />
      </div>

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto relative">
        <h1 className="text-3xl font-bold text-red-800 mb-6">Responder Dashboard</h1>

        {/* Emergency Panels */}
        <EmergencyList />
        <MapView
          responderNotifications={responderNotifications}
          setResponderNotifications={setResponderNotifications}
          hasNewNotif={hasNewNotif}
          setHasNewNotif={setHasNewNotif}
        />
        <NotificationsPanel responderNotifications={responderNotifications} />
      </div>
    </div>
  );
};

export default ResponderDashboard;
