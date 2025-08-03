// 👇 Keep all your existing imports
import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import Sidebar from "../../components/resident/Sidebar";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { Bell } from "lucide-react";
import showAnnouncementToast from "../../utils/showAnnouncementToast";

// 📍 Custom Marker Icon
const markerIcon = new L.Icon({
  iconUrl: "/icons/marker.png",
  iconSize: [40, 40],
  iconAnchor: [16, 32],
});

// 🗺️ Auto-center map hook
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

  const [user, setUser] = useState({
    firstName: "Unknown",
    lastName: "Resident",
    username: "unknown",
    age: "N/A",
    contactNumber: "N/A",
  });

  const { firstName, lastName, username, age, contactNumber } = user;

  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem("resident-notifications");
    return stored ? JSON.parse(stored) : [];
  });

  const [showDropdown, setShowDropdown] = useState(false);
  const [hasNewNotif, setHasNewNotif] = useState(false);

  const audioRef = useRef(null);
  const respondedAudioRef = useRef(null);
  const declinedAudioRef = useRef(null);
  const announcementAudioRef = useRef(null);
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
    respondedAudioRef.current = new Audio("/sounds/responded.mp3");
    declinedAudioRef.current = new Audio("/sounds/declined.mp3");
  }, []);

  useEffect(() => {
    axios
      .get("/auth/session", { withCredentials: true })
      .then((res) => {
        if (res.data.role !== "resident") {
          navigate("/");
        } else {
          const {
            firstName,
            lastName,
            username,
            age,
            contactNumber,
          } = res.data;
          setUser({ firstName, lastName, username, age, contactNumber });
        }
      })
      .catch(() => {
        navigate("/");
      });
  }, [navigate]);

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
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
    });
    socket.emit("join-resident", username);

    socket.on("notify-resident", (data) => {
      toast.success(`🚑 Responder ${data.responderName} is on their way to your ${data.type} report!`);
      if (audioRef.current) {
        audioRef.current.currentTime = 0;
        audioRef.current.play().catch((err) => console.warn("🔇 Sound error:", err));
      }

      const newNotif = {
        message: `🟡 Responder ${data.responderName} is on their way to your ${data.type} report!`,
        timestamp: new Date().toLocaleString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setHasNewNotif(true);
    });

    socket.on("responded", (data) => {
      toast.success(`✅ Responder ${data.responderName} has responded to your ${data.type} report.`);
      if (respondedAudioRef.current) {
        respondedAudioRef.current.currentTime = 0;
        respondedAudioRef.current.play().catch((err) => console.warn("🔇 Responded sound error:", err));
      }

      const newNotif = {
        message: `🟢 Responder ${data.responderName} marked your ${data.type} report as responded.`,
        timestamp: new Date().toLocaleString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setHasNewNotif(true);
    });

    socket.on("declined", (data) => {
      toast.error(`❌ Responder ${data.responderName} declined your ${data.type} report.`);
      if (declinedAudioRef.current) {
        declinedAudioRef.current.currentTime = 0;
        declinedAudioRef.current.play().catch((err) => console.warn("🔇 Declined sound error:", err));
      }

      const newNotif = {
        message: `🔴 Responder ${data.responderName} declined your ${data.type} report.`,
        timestamp: new Date().toLocaleString(),
      };
      setNotifications((prev) => [newNotif, ...prev]);
      setHasNewNotif(true);
    });

    socket.on("public-announcement", (data) => {
      // Play announcement audio
      if (announcementAudioRef.current) {
        announcementAudioRef.current.currentTime = 0;
        announcementAudioRef.current.play().catch((err) => console.warn("🔇 Announcement sound error:", err));
      }

      // Show toast with onClose callback
      showAnnouncementToast(data.message, () => {
        if (announcementAudioRef.current) {
          announcementAudioRef.current.pause();
          announcementAudioRef.current.currentTime = 0;
        }
      });

      // Save to notification list
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
      await axios.post("/reports", {
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

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.warn("Logout failed or already logged out.");
    }
    localStorage.removeItem("resident-notifications");
    navigate("/");
  };

  return (
    <div className="flex h-screen bg-gray-50 text-gray-800">
      <Sidebar />
      <div className="flex-1 p-8 overflow-auto relative">
        <audio ref={respondedAudioRef} src="/sounds/responded.mp3" preload="auto" />
        <audio ref={declinedAudioRef} src="/sounds/declined.mp3" preload="auto" />
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

        {/* 🧾 Emergency Report Form */}
        <div className="flex items-center justify-between mb-6 mt-2">
          <h1 className="text-3xl font-semibold tracking-tight">Emergency Report</h1>
        </div>

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
                    <Marker
                      position={[location.latitude, location.longitude]}
                      icon={markerIcon}
                      draggable={true}
                      eventHandlers={{
                        dragend: (e) => {
                          const { lat, lng } = e.target.getLatLng();
                          setLocation({ latitude: lat, longitude: lng });
                        },
                      }}
                    >
                      <Tooltip
                        permanent
                        direction="top"
                        offset={[3, -35]}
                        opacity={1}
                        className="!bg-transparent !border-none !p-0"
                      >
                        <div
                          style={{
                            position: "relative",
                            backgroundColor: "#fef3c7", // warm yellow
                            padding: "10px 14px",
                            borderRadius: "5px",
                            boxShadow: "0 4px 10px rgba(0, 0, 0, 0.2)",
                            fontSize: "12px",
                            lineHeight: "1.4",
                            textAlign: "center",
                            fontFamily: "sans-serif",
                            color: "#78350f", // dark text for yellow bg
                          }}
                        >
                          <div style={{ fontWeight: 800, fontSize: "14px" }}>Your Location</div>
                          <div>Drag to adjust</div>

                          {/* Triangle Pointer */}
                          <div
                            style={{
                              content: "''",
                              position: "absolute",
                              bottom: -8,
                              left: "50%",
                              transform: "translateX(-50%)",
                              width: 0,
                              height: 0,
                              borderLeft: "8px solid transparent",
                              borderRight: "8px solid transparent",
                              borderTop: "8px solid #fef3c7",
                            }}
                          />
                        </div>
                      </Tooltip>
                    </Marker>
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
              {submitting ? "Submitting..." : "Submit Emergency Report"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
