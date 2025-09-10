// src/pages/resident/ResidentDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../api/axios";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Tooltip, useMap } from "react-leaflet";
import L from "leaflet";
import { Bell, Menu, X, LogOut, Home } from "lucide-react";
import showAnnouncementToast from "../../utils/showAnnouncementToast";

// ---------------- Map Helpers ----------------
const markerIcon = new L.Icon({
  iconUrl: "/icons/marker.png",
  iconSize: [40, 40],
  iconAnchor: [16, 32],
});

const RecenterMap = ({ lat, lng }) => {
  const map = useMap();
  useEffect(() => {
    map.setView([lat, lng], 18);
  }, [lat, lng]);
  return null;
};

// ---------------- Sidebar ----------------
const Sidebar = ({ sidebarOpen, setSidebarOpen, handleLogout, links, location }) => (
  <div
    className={`fixed top-0 left-0 h-full w-64 bg-white text-gray-900 shadow-lg z-[2000] transform transition-transform duration-300 ${
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    {/* Logo Section */}
    <div className="flex flex-col items-center justify-center p-6 border-b border-gray-200 relative">
      <img src="/icons/zapalert-logo.png" alt="Logo" className="w-20 h-20 mb-2" />
      <h1 className="text-3xl font-extrabold tracking-widest text-red-600">ZAPALERT</h1>
      <button type="button" onClick={() => setSidebarOpen(false)} className="absolute top-6 right-6">
        <X size={24} className="text-gray-900" />
      </button>
    </div>

    {/* Navigation Links */}
    <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
      {links.map((link) => (
        <button
          key={link.path || link.name}
          onClick={() => {
            if (link.onClick) link.onClick();
            if (link.path) window.location.href = link.path;
            setSidebarOpen(false);
          }}
          className={`flex items-center w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-red-100 hover:text-red-700 ${
            location.pathname === link.path ? "bg-red-50 text-red-700 shadow-inner" : "text-gray-900"
          }`}
        >
          {link.icon && link.icon}
          <span className="ml-2">{link.name}</span>
        </button>
      ))}
    </nav>

    {/* Logout */}
    <div className="p-6 border-t border-gray-200">
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center w-full px-4 py-3 rounded-lg font-medium text-gray-900 hover:bg-red-100 hover:text-red-700 transition-all"
      >
        <LogOut size={20} className="mr-3" />
        Logout
      </button>
    </div>
  </div>
);

// ---------------- Emergency Form ----------------
const EmergencyForm = ({ location, setLocation, user }) => {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();

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
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        age: user.age,
        contactNumber: user.contactNumber,
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

  return (
    <div className="bg-white rounded-2xl shadow-lg p-6 max-w-3xl mx-auto space-y-6 border border-gray-200 mb-6">
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
                        backgroundColor: "#fef3c7",
                        padding: "10px 14px",
                        borderRadius: "5px",
                        boxShadow: "0 4px 10px rgba(0,0,0,0.2)",
                        fontSize: "12px",
                        lineHeight: "1.4",
                        textAlign: "center",
                        fontFamily: "sans-serif",
                        color: "#78350f",
                      }}
                    >
                      <div style={{ fontWeight: 800, fontSize: "14px" }}>Your Location</div>
                      <div>Drag to adjust</div>
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
  );
};

// ---------------- Main Dashboard ----------------
const ResidentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const locationRouter = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [user, setUser] = useState({
    firstName: "Unknown",
    lastName: "Resident",
    username: "unknown",
    age: "N/A",
    contactNumber: "N/A",
  });
  const [location, setLocation] = useState({ latitude: null, longitude: null });
  const [notifications, setNotifications] = useState(() => {
    const stored = localStorage.getItem("resident-notifications");
    return stored ? JSON.parse(stored) : [];
  });
  const [hasNewNotif, setHasNewNotif] = useState(() => {
    const stored = localStorage.getItem("resident-hasNew");
    return stored ? JSON.parse(stored) : notifications.length > 0;
  });
  const [showDropdown, setShowDropdown] = useState(false);

  const audioRef = useRef(null);
  const respondedAudioRef = useRef(null);
  const declinedAudioRef = useRef(null);
  const announcementAudioRef = useRef(null);
  const audioInitialized = useRef(false);

  // ---------------- Session ----------------
  useEffect(() => {
    axios
      .get("/auth/session", { withCredentials: true })
      .then((res) => {
        if (res.data.role !== "resident") {
          navigate("/");
        } else {
          setUser(res.data);
          setLoading(false);   // ✅ mark session ready
        }
      })
      .catch(() => navigate("/"));
  }, [navigate]);


  // ---------------- Geolocation ----------------
  useEffect(() => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setLocation({ latitude: pos.coords.latitude, longitude: pos.coords.longitude }),
      (err) => console.error("Location error:", err),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  }, []);

  // ---------------- Audio ----------------
  useEffect(() => {
    const initAudio = () => {
      if (!audioInitialized.current) {
        audioRef.current = new Audio("/sounds/ontheway.mp3");
        respondedAudioRef.current = new Audio("/sounds/responded.mp3");
        declinedAudioRef.current = new Audio("/sounds/declined.mp3");
        announcementAudioRef.current = new Audio("/sounds/announcement.mp3");
        audioInitialized.current = true;
      }
    };
    window.addEventListener("click", initAudio, { once: true });
    return () => window.removeEventListener("click", initAudio);
  }, []);

  // ---------------- Socket ----------------
  useEffect(() => {
    if (loading) return; // ✅ don’t connect until user is known

    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
      query: { username: user.username },  // ✅ pass username immediately
    });

    socket.emit("join-resident", user.username);

    socket.on("notify-resident", (data) => {
      const message = `🟡 Responder ${data.responderName} is on its way to your ${data.type} report!`;
      toast.success(message, { duration: 6000 });
      audioRef.current?.play().catch(() => {});
      setNotifications((prev) => [{ message, timestamp: new Date().toLocaleString() }, ...prev]);
      setHasNewNotif(true);
    });

    socket.on("responded", (data) => {
      const message = `🟢 Responder ${data.responderName} responded to your ${data.type} report.`;
      toast.success(message, { duration: 6000 });
      respondedAudioRef.current?.play().catch(() => {});
      setNotifications((prev) => [{ message, timestamp: new Date().toLocaleString() }, ...prev]);
      setHasNewNotif(true);
    });

    socket.on("declined", (data) => {
      const message = `🔴 Responder ${data.responderName} declined your ${data.type} report.`;
      toast.error(message, { duration: 6000 });
      declinedAudioRef.current?.play().catch(() => {});
      setNotifications((prev) => [{ message, timestamp: new Date().toLocaleString() }, ...prev]);
      setHasNewNotif(true);
    });

    socket.on("public-announcement", (data) => {
      showAnnouncementToast(data.message, () => {
        announcementAudioRef.current.pause();
        announcementAudioRef.current.currentTime = 0;
      });
      setNotifications((prev) => [
        { message: `𝗔𝗡𝗡𝗢𝗨𝗡𝗖𝗘𝗠𝗘𝗡𝗧: ${data.message}`, timestamp: new Date().toLocaleString() },
        ...prev,
      ]);
      setHasNewNotif(true);
    });

    return () => socket.disconnect();
  }, [loading, user.username]);


  // ---------------- Persist Notifications ----------------
  useEffect(() => {
    localStorage.setItem("resident-notifications", JSON.stringify(notifications));
    localStorage.setItem("resident-hasNew", JSON.stringify(hasNewNotif));
  }, [notifications, hasNewNotif]);

  // ---------------- Logout ----------------
  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch {}
    localStorage.removeItem("resident-notifications");
    localStorage.removeItem("resident-hasNew");
    navigate("/");
  };

  // ---------------- Sidebar Links ----------------
  const links = [{ name: "Dashboard", path: "/resident", icon: <Home size={20} className="mr-3" /> }];

  return (
    <div className="flex min-h-screen bg-red-50">
      <Toaster position="top-right" />

      {/* Burger Button */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-[100] bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white p-2 rounded-md shadow-md hover:scale-105 transition-transform duration-200"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
        links={links}
        location={locationRouter}
      />

      {/* Main Content */}
      <div className="flex-1 p-4 overflow-y-auto relative">
        <div className="text-center mb-6">
          <h1 className="text-4xl font-extrabold text-red-800 mb-2 tracking-wide">
            Resident <br /> Dashboard
          </h1>
          <p className="text-lg text-gray-700">Welcome {user.firstName}!</p>
        </div>

        {/* Emergency Form */}
        <EmergencyForm location={location} setLocation={setLocation} user={user} />

        {/* Notification Bell */}
        <div className="fixed top-4 right-4 z-[1500]">
          <div className="relative inline-block">
            <button
              type="button"
              className="relative bg-white p-1 rounded-full shadow"
              onClick={() => {
                setShowDropdown((prev) => !prev);
                setHasNewNotif(false);
                localStorage.setItem("resident-hasNew", JSON.stringify(false));
              }}
            >
              <Bell className="h-6 w-6 text-gray-800" />
              {hasNewNotif && notifications.length > 0 && (
                <span className="absolute top-0 right-0 h-3 w-3 rounded-full bg-red-600 border-2 border-white"></span>
              )}
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 w-96 bg-white/90 backdrop-blur-md shadow-2xl border rounded-2xl z-[200]">
                <div className="p-3 font-semibold border-b text-gray-800">Notifications</div>
                <ul className="max-h-72 overflow-y-auto">
                  {notifications.length === 0 ? (
                    <li className="p-3 text-gray-500">No notifications</li>
                  ) : (
                    notifications.map((note, idx) => (
                      <li key={idx} className="p-3 border-b text-sm text-gray-800">
                        {note.message}
                        <div className="text-xs text-gray-400 mt-1">{note.timestamp}</div>
                      </li>
                    ))
                  )}
                </ul>
                <button
                  onClick={() => {
                    setNotifications([]);
                    localStorage.removeItem("resident-notifications");
                    setHasNewNotif(false);
                    localStorage.removeItem("resident-hasNew");
                  }}
                  className="w-full text-center py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-2xl"
                >
                  Clear All
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResidentDashboard;
