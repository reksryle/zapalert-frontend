import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import Sidebar from "../../components/resident/Sidebar";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { Bell } from "lucide-react";
import showAnnouncementToast from "../../utils/showAnnouncementToast";

// Custom Marker Icon
const markerIcon = new L.Icon({
  iconUrl: "/icons/marker.png",
  iconSize: [32, 32],
  iconAnchor: [16, 32],
});

// Auto center map on location
const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 18);
  }, [lat, lng]);
  return null;
};

const ResidentDashboard = () => {
  const navigate = useNavigate();
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [location, setLocation] = useState({ latitude: null, longitude: null });

  const user = JSON.parse(localStorage.getItem("user") || "{}");
  const role = localStorage.getItem("zapalertRole");
  const { firstName = "Unknown", lastName = "Resident", username = "unknown", age = "N/A", contactNumber = "N/A" } = user;

  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem("resident-notifications");
    return stored ? JSON.parse(stored) : [];
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [hasNewNotif, setHasNewNotif] = useState(false);

  const audioRef = useRef(null);
  const audioInitialized = useRef(false);

  useEffect(() => {
    const allowSound = () => {
      if (!audioInitialized.current) {
        audioRef.current = new Audio("/sounds/ontheway.mp3");
        audioInitialized.current = true;
      }
    };
    window.addEventListener("click", allowSound, { once: true });
    return () => window.removeEventListener("click", allowSound);
  }, []);

  useEffect(() => {
    if (!user || role !== "resident") {
      navigate("/");
    }
  }, [navigate, role, user]);

  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
        });
      },
      (err) => {
        console.error("Location error:", err);
        alert("Unable to fetch location.");
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  useEffect(() => {
    const socket = io(
      import.meta.env.VITE_BACKEND_URL.replace(/^http/, "ws"), // ⬅️ Use wss:// or ws:// automatically
      {
        transports: ["websocket"], // ⬅️ Ensure websocket-only (no polling fallback)
      }
    );

    socket.emit("join-resident", username);

    socket.on("notify-resident", (data) => {
      toast.success(`🚑 Responder ${data.responderName} is on their way to your ${data.type} report!`);

      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => console.warn("🔇 Sound error:", err));
      }

      const newNotif = {
        message: `Responder ${data.responderName} is on their way to your ${data.type} report!`,
        timestamp: new Date().toLocaleString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setHasNewNotif(true);
    });

    socket.on("public-announcement", (data) => {
      showAnnouncementToast(data.message);

      const newNotif = {
        message: `𝗔𝗡𝗡𝗢𝗨𝗡𝗖𝗘𝗠𝗘𝗡𝗧: ${data.message}`,
        timestamp: new Date().toLocaleString(),
      };

      setNotifications((prev) => [newNotif, ...prev]);
      setHasNewNotif(true);
    });

    return () => socket.disconnect();
  }, [username]);


  useEffect(() => {
    localStorage.setItem("resident-notifications", JSON.stringify(notifications));
  }, [notifications]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location.latitude || !location.longitude) {
      alert("Still fetching location. Please wait.");
      return;
    }

    try {
      setSubmitting(true);
        await axios.post(`${import.meta.env.VITE_BACKEND_URL}/api/reports`, {
        type,
        description,
        username,
        firstName,
        lastName,
        age,
        contactNumber,
        latitude: location.latitude,
        longitude: location.longitude,
      });
      toast.success("🚨 Emergency report submitted!");
      setType("");
      setDescription("");
    } catch (err) {
      console.error("Report submission failed:", err);
      toast.error("❌ Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("zapalertRole");
    localStorage.removeItem("user");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto relative">
        <Toaster position="top-right" />

        {/* 🔔 Notification Bell */}
        <div className="absolute right-8 top-8 z-50">
          <div className="relative inline-block">
            <button
              className="relative"
              onClick={() => {
                setShowDropdown((prev) => !prev);
                setHasNewNotif(false);
              }}
            >
              <Bell className="h-6 w-6 text-gray-800" />
              {hasNewNotif && (
                <span className="absolute top-0 right-0 block h-2 w-2 rounded-full bg-red-500"></span>
              )}
            </button>

            {showDropdown && (
              <div className="absolute right-0 mt-2 w-64 bg-white shadow-lg border rounded z-50">
                <div className="p-3 font-semibold border-b">Notifications</div>
                <ul className="max-h-60 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="p-3 text-gray-500">No notifications</li>
                  ) : (
                    notifications.map((note, index) => (
                      <li key={index} className="p-3 border-b text-sm">
                        <p>{note.message}</p>
                        <p className="text-xs text-gray-400">{note.timestamp}</p>
                      </li>
                    ))
                  )}
                </ul>
                <button
                  onClick={() => {
                    setNotifications([]);
                    localStorage.removeItem("resident-notifications");
                    setHasNewNotif(false);
                  }}
                  className="w-full text-center py-2 text-sm text-red-600 hover:bg-gray-100"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Header */}
        <div className="flex items-center justify-between mb-6 mt-2">
          <h1 className="text-3xl font-semibold tracking-tight">Emergency Report</h1>
        </div>

        {/* Form Card */}
        <div className="bg-white rounded-2xl shadow-lg p-6 max-w-3xl mx-auto space-y-6 border border-gray-200">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block font-medium mb-1">Type of Emergency:</label>
              <select
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                value={type}
                onChange={(e) => setType(e.target.value)}
                required
              >
                <option value="">-- Select Emergency Type --</option>
                <option value="Flood">Flood</option>
                <option value="Fire">Fire</option>
                <option value="Crime">Crime</option>
                <option value="Medical">Medical</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label className="block font-medium mb-1">Description:</label>
              <textarea
                className="w-full border border-gray-300 rounded-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-red-400"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={4}
                placeholder="Brief description of the situation"
              />
            </div>

            {location.latitude && location.longitude && (
              <div>
                <label className="block font-medium mb-1">Your Location:</label>
                <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300">
                  <MapContainer
                    center={[location.latitude, location.longitude]}
                    zoom={18}
                    scrollWheelZoom={false}
                    style={{ height: "100%", width: "100%" }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/">OpenStreetMap</a>'
                    />
                    <Marker position={[location.latitude, location.longitude]} icon={markerIcon} />
                    <RecenterMap lat={location.latitude} lng={location.longitude} />
                  </MapContainer>
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full bg-red-600 hover:bg-red-700 text-white text-lg font-semibold py-2 px-4 rounded-lg transition"
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
