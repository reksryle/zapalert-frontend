import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/responder/Sidebar";
import EmergencyList from "./EmergencyList";
import MapView from "./MapView";
import NotificationsPanel from "./NotificationsPanel";

const ResponderDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("zapalertRole");
    if (role !== "responder") {
      navigate("/"); // 🔒 Redirect to login or home if not a responder
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-lg">
        <Sidebar />
      </div>

      {/* Main Content */}
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
  