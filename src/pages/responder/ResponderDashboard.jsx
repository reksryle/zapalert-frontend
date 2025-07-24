import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/responder/Sidebar";
import EmergencyList from "./EmergencyList";
import MapView from "./MapView";
import NotificationsPanel from "./NotificationsPanel";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import showAnnouncementToast from "../../utils/showAnnouncementToast"; // ✅

const ResponderDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("zapalertRole");
    if (role !== "responder") {
      navigate("/");
    }
  }, [navigate]);

  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_BACKEND_URL.replace(/^http/, "ws"), // ensures wss:// in production
      {
        transports: ["websocket"], // optional, but recommended to force websocket only
      }
    );

    socket.on("public-announcement", (data) => {
      showAnnouncementToast(data.message);
    });

    return () => socket.disconnect();
  }, []);


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
