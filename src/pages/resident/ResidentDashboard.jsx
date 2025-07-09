// pages/resident/ResidentDashboard.jsx
import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

const ResidentDashboard = () => {
  const navigate = useNavigate();
  const [fullName, setFullName] = useState("Resident");

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem("zapalert_user"));
    if (storedUser) {
      const name = `${storedUser.firstName} ${storedUser.lastName}`;
      setFullName(name);
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Top Bar */}
      <header className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, {fullName}!
        </h1>
        <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
      </header>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-4 rounded-2xl shadow-md">
          <h2 className="text-lg font-semibold">Total Reports</h2>
          <p className="text-3xl font-bold text-indigo-600">12</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-md">
          <h2 className="text-lg font-semibold">Pending</h2>
          <p className="text-3xl font-bold text-yellow-500">3</p>
        </div>
        <div className="bg-white p-4 rounded-2xl shadow-md">
          <h2 className="text-lg font-semibold">Approved</h2>
          <p className="text-3xl font-bold text-green-500">9</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <button
          onClick={() => navigate("/report-incident")}
          className="bg-red-500 hover:bg-red-600 text-white py-4 px-6 rounded-2xl shadow-md w-full"
        >
          📢 Report Incident
        </button>
        <button
          onClick={() => navigate("/my-reports")}
          className="bg-blue-500 hover:bg-blue-600 text-white py-4 px-6 rounded-2xl shadow-md w-full"
        >
          📋 View My Reports
        </button>
        <button
          onClick={() => navigate("/announcements")}
          className="bg-purple-500 hover:bg-purple-600 text-white py-4 px-6 rounded-2xl shadow-md w-full"
        >
          📣 Announcements
        </button>
      </div>

      {/* Announcements Preview */}
      <div className="bg-white rounded-2xl shadow-md p-4">
        <h2 className="text-xl font-semibold mb-2">Latest Announcements</h2>
        <ul className="space-y-2">
          <li className="border-l-4 border-indigo-500 pl-2">
            🚨 Power outage in Purok 3 tonight at 9 PM.
          </li>
          <li className="border-l-4 border-green-500 pl-2">
            🛡️ Safety drill scheduled for next Monday.
          </li>
          <li className="border-l-4 border-red-500 pl-2">
            ⚠️ Heavy rain alert issued by PAGASA.
          </li>
        </ul>
      </div>
    </div>
  );
};

export default ResidentDashboard;
