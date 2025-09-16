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
import useNetworkStatus from "../../hooks/useNetworkStatus"; // ✅ added

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

      {/* Coming Soon Overlay Links */}
      <div className="space-y-2 mt-2">
        <button
          type="button"
          disabled
          className="relative flex items-center w-full px-4 py-3 rounded-lg font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
        >
          {/* Profile Icon */}
          <img src="/icons/usericon.png" alt="Profile" className="w-5 h-5 mr-3" />
          <span className="ml-2">Profile</span>
          <span className="absolute top-0 right-0 bg-yellow-300 text-xs font-bold px-2 py-0.5 rounded-bl-lg">
            Coming Soon
          </span>
        </button>

        <button
          type="button"
          disabled
          className="relative flex items-center w-full px-4 py-3 rounded-lg font-medium text-gray-400 bg-gray-50 cursor-not-allowed"
        >
          {/* Settings Icon */}
          <img src="/icons/settingsicon.png" alt="Settings" className="w-5 h-5 mr-3" />
          <span className="ml-2">Settings</span>
          <span className="absolute top-0 right-0 bg-yellow-300 text-xs font-bold px-2 py-0.5 rounded-bl-lg">
            Coming Soon
          </span>
        </button>
      </div>
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
const EmergencyForm = ({ location, setLocation, user, networkStatus }) => {
  const [type, setType] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [pendingReport, setPendingReport] = useState(null);
  const offlineToastId = useRef(null);

  const sendReport = async (reportData, isDraft = false) => {
    try {
      await axios.post("/reports", reportData);
      toast.success(
        isDraft ? "📝 Draft report sent successfully!" : "🚨 Emergency report submitted!"
      );
      setType("");
      setDescription("");
      setPendingReport(null);
      localStorage.removeItem("resident-draft");
    } catch (err) {
      console.error("Report submission failed:", err);
      toast.error("❌ Failed to submit report.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!location.latitude || !location.longitude) {
      alert("Still fetching location. Please wait.");
      return;
    }

    const reportData = {
      type,
      description,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      age: user.age,
      contactNumber: user.contactNumber,
      latitude: location.latitude,
      longitude: location.longitude,
    };

    setSubmitting(true);

    if (networkStatus === "offline") {
      if (!offlineToastId.current) {
        offlineToastId.current = toast.loading(
          "Report saved as draft. It will send automatically when connection is back.",
          { duration: Infinity, icon: "📝" }
        );
      }
      setPendingReport(reportData);
      return;
    }

    sendReport(reportData); // online normal submit
  };

  // Retry pending report when back online
  useEffect(() => {
    if (networkStatus === "online" && pendingReport) {
      if (offlineToastId.current) {
        toast.dismiss(offlineToastId.current);
        offlineToastId.current = null;
      }
      sendReport(pendingReport, true);
    }
    if (networkStatus === "online" && !pendingReport && offlineToastId.current) {
      toast.dismiss(offlineToastId.current);
      offlineToastId.current = null;
    }
  }, [networkStatus, pendingReport]);

  // Load draft from localStorage
  useEffect(() => {
    const draft = localStorage.getItem("resident-draft");
    if (draft) {
      const parsed = JSON.parse(draft);
      setType(parsed.type || "");
      setDescription(parsed.description || "");
      if (parsed.pendingReport) {
        setPendingReport(parsed.pendingReport);
        setSubmitting(true);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(
      "resident-draft",
      JSON.stringify({ type, description, pendingReport })
    );
  }, [type, description, pendingReport]);

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
            disabled={submitting}
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
            disabled={submitting}
          />
        </div>

          <div>
            <label className="block font-medium mb-1">Your Location:</label>
            {!location.latitude || !location.longitude ? (
              <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 flex items-center justify-center bg-white relative">
                {/* Mini Map Loader */}
                <div className="absolute inset-0 bg-white/90 flex flex-col items-center justify-center transition-opacity duration-500 animate-fadeIn">
                  <div className="relative w-16 h-16 flex items-center justify-center mb-2">
                    <div className="absolute inset-0 rounded-full border-4 border-gray-300 border-t-red-600 animate-spin"></div>
                    <img
                      src="/icons/zapalert-logo.png"
                      alt="ZapAlert Logo"
                      className="w-10 h-10 animate-bounce"
                    />
                  </div>
                  <span className="mt-2 text-gray-700 font-medium">Getting your location...</span>
                </div>
              </div>
            ) : (
              <div className="h-64 w-full rounded-lg overflow-hidden border border-gray-300 relative">
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
                    draggable={!submitting}
                    eventHandlers={{
                      dragend: (e) => {
                        const { lat, lng } = e.target.getLatLng();
                        setLocation({ latitude: lat, longitude: lng });
                      },
                    }}
                  >
                    <Tooltip permanent direction="top" offset={[3, -35]} opacity={1}>
                      <div style={{ fontWeight: "bold" }}>Your Location</div>
                      <div>Drag to adjust</div>
                    </Tooltip>
                  </Marker>
                  <RecenterMap lat={location.latitude} lng={location.longitude} />
                </MapContainer>
              </div>
            )}
          </div>

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-red-600 hover:bg-red-700 text-white text-lg font-semibold py-2 px-4 rounded-lg transition"
        >
          {submitting
            ? networkStatus === "offline"
              ? "Waiting for connection..."
              : "Submitting..."
            : "Submit Emergency Report"}
        </button>
      </form>
    </div>
  );
};

// ---------------- Main Dashboard ----------------
const ResidentDashboard = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true); // ✅ loader state
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

  const networkStatus = useNetworkStatus();
  const wasOffline = useRef(false);
  const onlineTimeout = useRef(null);

  const [showTutorial, setShowTutorial] = useState(false);

  // ---------------- Network Toast ----------------
  useEffect(() => {
    let id;
    if (networkStatus === "offline") {
      wasOffline.current = true;
      if (onlineTimeout.current) {
        clearTimeout(onlineTimeout.current);
        onlineTimeout.current = null;
      }
      id = toast.loading("No connection", { duration: Infinity });
    } else if (networkStatus === "online") {
      if (wasOffline.current) {
        onlineTimeout.current = setTimeout(() => {
          toast.dismiss();
          toast.success("Connected to network");
          wasOffline.current = false;
          onlineTimeout.current = null;
        }, 2000);
      } else {
        toast.dismiss();
      }
    }
    return () => {
      if (id) toast.dismiss(id);
      if (onlineTimeout.current) clearTimeout(onlineTimeout.current);
    };
  }, [networkStatus]);

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

          // first hide loader
          setLoading(true);
          setTimeout(() => {
            setLoading(false);

            // ✅ Show tutorial only after loader is gone
            if (!sessionStorage.getItem("locationTutorialShown")) {
              setShowTutorial(true);
              sessionStorage.setItem("locationTutorialShown", "true");
            }
          }, 2000); // same 500ms fade
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
    if (loading) return;
    const socket = io(import.meta.env.VITE_SOCKET_URL, {
      withCredentials: true,
      query: { username: user.username },
    });
    socket.emit("join-resident", user.username);

    socket.on("notify-resident", (data) => {
      const message = `🟡 Responder ${data.responderName} is on its way to your ${data.type} report!`;
      toast.success(message, { duration: 3000 });
      audioRef.current?.play().catch(() => {});
      setNotifications((prev) => [{ message, timestamp: new Date().toLocaleString() }, ...prev]);
      setHasNewNotif(true);
    });

    socket.on("responded", (data) => {
      const message = `🟢 Responder ${data.responderName} responded to your ${data.type} report.`;
      toast.success(message, { duration: 3000 });
      respondedAudioRef.current?.play().catch(() => {});
      setNotifications((prev) => [{ message, timestamp: new Date().toLocaleString() }, ...prev]);
      setHasNewNotif(true);
    });

    socket.on("declined", (data) => {
      const message = `🔴 Responder ${data.responderName} declined your ${data.type} report.`;
      toast.error(message, { duration: 3000 });
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
    sessionStorage.removeItem("locationTutorialShown");
    navigate("/");
  };

  const links = [{ name: "Dashboard", path: "/resident", icon: <Home size={20} className="mr-3" /> }];

  // ---------------- Loading Screen ----------------
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
        <div className="relative w-48 h-48 flex items-center justify-center mb-6">
          <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-yellow-400 animate-spin"></div>
          <img
            src="/icons/zapalert-logo.png"
            alt="ZapAlert Logo"
            className="w-32 h-32 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] animate-bounce"
          />
        </div>
        <p className="text-white text-2xl font-bold animate-blink">Loading...</p>

      <style>
        {`
          @keyframes bounce { 0%,100%{transform:translateY(0);}50%{transform:translateY(-15px);} }
          .animate-bounce { animation: bounce 1s infinite; }

          @keyframes spin { 0%{transform:rotate(0deg);}100%{transform:rotate(360deg);} }
          .animate-spin { animation: spin 2s linear infinite; }

          @keyframes blink { 0%,50%,100%{opacity:1;}25%,75%{opacity:0;} }
          .animate-blink { animation: blink 1s infinite; }

          @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
          .animate-fadeIn { animation: fadeIn 0.5s ease-in-out forwards; }

          /* ---------------- New: Popup Scale Animation ---------------- */
          @keyframes popupIn {
            0% { transform: scale(0.8); opacity: 0; }
            60% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
          .animate-popupIn {
            animation: popupIn 0.4s ease-out forwards;
          }
        `}
      </style>
      </div>
    );
  }

// ---------------- Main Dashboard Content ----------------
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
      <EmergencyForm
        location={location}
        setLocation={setLocation}
        user={user}
        networkStatus={networkStatus}
      />

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
            <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white/90 backdrop-blur-md shadow-2xl border rounded-2xl z-[200]">
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

      {/* ---------------- Tutorial Popup ---------------- */}
      {showTutorial && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-fadeIn">
          <div className="bg-white/90 backdrop-blur-md rounded-3xl max-w-sm w-full p-6 space-y-5 text-gray-800 relative shadow-2xl transform scale-95 animate-popupIn border border-white/30">
            
            {/* Accent bar */}
            <div className="absolute top-0 left-1/2 transform -translate-x-1/2 -translate-y-2 w-16 h-1 rounded-full bg-red-600 shadow-md"></div>

            {/* Title */}
            <h3 className="text-2xl font-extrabold text-red-700 text-center">
              Enable Location
            </h3>

            {/* Description */}
            <p className="text-sm text-gray-700 text-center leading-relaxed">
              To use ZapAlert effectively, please turn on your device's location so responders can reach you quickly.
            </p>

            {/* Image / GIF */}
            <img
              src="/tutorial/turnlocation.gif"
              alt="Enable Location"
              className="w-full rounded-xl shadow-lg border border-gray-200"
            />

            {/* Button */}
            <button
              onClick={() => setShowTutorial(false)}
              className="w-full py-3 bg-gradient-to-r from-red-600 via-red-500 to-orange-400 text-white font-bold rounded-xl shadow-lg hover:scale-105 hover:shadow-xl transition transform duration-300"
            >
              Got it
            </button>
          </div>
        </div>
      )}
    </div>
  </div>
);
}

export default ResidentDashboard;
