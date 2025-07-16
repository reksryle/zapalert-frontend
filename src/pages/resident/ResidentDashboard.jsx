import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/resident/Sidebar";// ✅ Adjust if you placed Sidebar elsewhere

const ResidentDashboard = () => {
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const user = JSON.parse(localStorage.getItem("user"));
  const role = localStorage.getItem("zapalertRole");

  // ✅ Block access if no user or wrong role
  useEffect(() => {
    if (!user || role !== "resident") {
      navigate("/");
    }
  }, [navigate, role, user]);

  const firstName = user?.firstName || "Unknown";
  const lastName = user?.lastName || "Resident";
  const username = user?.username || "unknown";
  const age = user?.age || "N/A";

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const latitude = position.coords.latitude;
        const longitude = position.coords.longitude;

        try {
          setSubmitting(true);

          await axios.post("https://zapalert-backend.onrender.com/api/reports", {
            type,
            description,
            username,
            firstName,
            lastName,
            latitude,
            longitude,
          });

          alert("🚨 Emergency report submitted!");
          setType("");
          setDescription("");
        } catch (error) {
          console.error("❌ Failed to submit report:", error);
          alert("❌ Failed to submit report.");
        } finally {
          setSubmitting(false);
        }
      },
      (error) => {
        console.error("❌ Location error:", error);
        alert("Failed to get your location. Please try again.");
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleLogout = () => {
    localStorage.removeItem("zapalertRole");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar />

      <div className="flex-1 p-6 overflow-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">📍 Emergency Report Form</h1>
          <button
            onClick={handleLogout}
            className="text-red-600 font-semibold hover:underline"
          >
            🔒 Logout
          </button>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-md max-w-2xl">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-semibold">Type of Emergency:</label>
              <select
                className="w-full border rounded p-2"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="">-- Select Type --</option>
                <option value="Flood">Flood</option>
                <option value="Fire">Fire</option>
                <option value="Landslide">Landslide</option>
                <option value="Medical">Medical</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold">Description:</label>
              <textarea
                className="w-full border rounded p-2"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows="4"
                placeholder="Brief description of the situation"
                required
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
            >
              {submitting ? "Submitting..." : "🚨 Submit Emergency"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
