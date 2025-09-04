// src/pages/responder/ResponderDashboard.jsx
import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../api/axios";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { MapContainer, TileLayer, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import AutoOpenMarker from "../../components/AutoOpenMarker";
import { Bell, Menu, X, Home, User, LogOut } from "lucide-react";
import useEmergencyReports from "../../hooks/useEmergencyReports";
import showAnnouncementToast from "../../utils/showAnnouncementToast";

// ---------------- Map Helper ----------------
const iconMap = {
  Fire: new L.Icon({ iconUrl: "/icons/fire.png", iconSize: [32, 32] }),
  Flood: new L.Icon({ iconUrl: "/icons/flood.png", iconSize: [32, 32] }),
  Crime: new L.Icon({ iconUrl: "/icons/crime.png", iconSize: [32, 32] }),
  Medical: new L.Icon({ iconUrl: "/icons/medical.png", iconSize: [32, 32] }),
  Other: new L.Icon({ iconUrl: "/icons/other.png", iconSize: [32, 32] }),
};
const getIcon = (type) => iconMap[type] || iconMap["Other"];

const ForceCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    const timer = setTimeout(() => {
      if (map && map.getCenter) {
        try {
          map.invalidateSize();
          map.setView(center, 16);
        } catch (err) {
          console.error("Map error:", err);
        }
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [center, map]);
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
    <div className="flex flex-col items-center justify-center p-6 border-b border-gray-200">
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

// ---------------- Emergency List ----------------
const EmergencyList = () => {
  const { reports, markAsOnTheWay, markAsResponded, declineReport } = useEmergencyReports(false);
  const [onTheWayIds, setOnTheWayIds] = useState([]);

  const handleOnTheWay = (id, report) => {
    markAsOnTheWay(id, report);
    if (!onTheWayIds.includes(id)) setOnTheWayIds((prev) => [...prev, id]);
  };

  const formatPHTime = (isoString) =>
    new Date(isoString).toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });

  return (
    <div className="mb-6 max-h-[300px] overflow-y-auto">
      <h2 className="text-xl font-semibold mb-4 text-red-800">Emergency List</h2>
      {reports.length === 0 ? (
        <p className="text-gray-500">No active emergencies.</p>
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => {
            const isOnTheWay = onTheWayIds.includes(report._id);
            return (
              <li
                key={report._id}
                className={`p-4 rounded shadow-inner flex justify-between items-start transition-all ${
                  isOnTheWay ? "bg-yellow-100" : "bg-white hover:shadow-lg hover:bg-gray-50"
                }`}
              >
                <div>
                  <p className="text-lg font-medium text-red-700">{report.type}</p>
                  <p className="text-sm text-gray-700">{report.description}</p>
                  <p className="text-sm text-gray-500">
                    𝗙𝗿𝗼𝗺: {report.firstName} {report.lastName}
                  </p>
                  <p className="text-sm text-gray-500">𝗔𝗴𝗲: {report.age ?? "N/A"}</p>
                  <p className="text-sm text-gray-500">𝗖𝗼𝗻𝘁𝗮𝗰𝘁: {report.contactNumber ?? "N/A"}</p>
                  <p className="text-xs text-gray-400 mt-1">𝗥𝗲𝗽𝗼𝗿𝘁𝗲𝗱 𝗮𝘁: {formatPHTime(report.createdAt)}</p>
                </div>
                <div className="flex flex-col gap-1 text-xs">
                  <button
                    type="button"
                    onClick={() => handleOnTheWay(report._id, report)}
                    className="text-blue-600 hover:underline"
                  >
                    𝗢𝗡 𝗧𝗛𝗘 𝗪𝗔𝗬
                  </button>
                  <button type="button" onClick={() => markAsResponded(report._id)} className="text-green-600 hover:underline">
                    𝗥𝗘𝗦𝗣𝗢𝗡𝗗𝗘𝗗
                  </button>
                  <button type="button" onClick={() => declineReport(report._id)} className="text-red-600 hover:underline">
                    𝗗𝗘𝗖𝗟𝗜𝗡𝗘
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
};

// ---------------- Map View ----------------
const MapView = ({ responderNotifications, setResponderNotifications, hasNewNotif, setHasNewNotif }) => {
  const zapateraCenter = [10.306711119471714, 123.9011395473235];
  const { reports, markAsOnTheWay, markAsResponded, declineReport } = useEmergencyReports(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const audioInitialized = useRef(false);
  const announcementAudioRef = useRef(null);

  useEffect(() => {
    const allowAudio = () => {
      if (!audioInitialized.current) {
        ["fire", "medical", "crime", "flood", "other"].forEach((type) => {
          const audio = new Audio(`/sounds/${type}.mp3`);
          audio.load();
          audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
        });
        announcementAudioRef.current = new Audio("/sounds/announcement.mp3");
        audioInitialized.current = true;
      }
    };
    window.addEventListener("click", allowAudio, { once: true });
    return () => window.removeEventListener("click", allowAudio);
  }, []);

  return (
    <div className="relative h-[500px] w-full rounded shadow-md overflow-hidden">
      <MapContainer center={zapateraCenter} zoom={16} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
        <ForceCenter center={zapateraCenter} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Circle center={zapateraCenter} radius={300} pathOptions={{ color: "blue", fillColor: "lightblue", fillOpacity: 0.3 }} />
        {reports.map((report) => (
          <AutoOpenMarker
            key={report._id}
            report={report}
            icon={getIcon(report.type)}
            onTheWay={markAsOnTheWay}
            onResponded={markAsResponded}
            onDecline={declineReport}
          />
        ))}
      </MapContainer>

      {/* Legend */}
      <div className="absolute right-4 bottom-4 bg-white p-3 rounded shadow-md z-[1000] text-sm">
        <strong className="block mb-2">Legend</strong>
        <ul className="space-y-1">
          {Object.entries(iconMap).map(([type, icon]) => (
            <li key={type} className="flex items-center gap-2">
              <img src={icon.options.iconUrl} alt={type} className="w-5 h-5" />
              {type}
            </li>
          ))}
        </ul>
      </div>

      {/* Notification Bell */}
      <div className="absolute right-4 top-4 z-[1500]">
        <div className="relative inline-block">
          <button
            type="button"
            className="relative bg-white p-1 rounded-full shadow"
            onClick={(e) => {
              e.stopPropagation();
              setShowDropdown((prev) => !prev);
              setHasNewNotif(false);
            }}
          >
            <Bell className="h-6 w-6 text-gray-800" />
            {hasNewNotif && responderNotifications.length > 0 && (
              <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-600 border-2 border-white"></span>
            )}
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white/90 backdrop-blur-sm shadow-xl border rounded-xl z-[200]">
              <div className="p-3 font-semibold border-b">Notifications</div>
              <ul className="max-h-60 overflow-y-auto">
                {responderNotifications.length === 0 ? (
                  <li className="p-3 text-gray-500">No notifications</li>
                ) : (
                  responderNotifications.map((note, idx) => (
                    <li key={idx} className="p-3 border-b text-sm">
                      {note.message}
                      <div className="text-xs text-gray-400 mt-1">{note.timestamp}</div>
                    </li>
                  ))
                )}
              </ul>
              <button
                onClick={() => {
                  setResponderNotifications([]);
                  localStorage.removeItem("responder-notifications");
                  localStorage.removeItem("responder-hasNewNotif");
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
    </div>
  );
};

// ---------------- Main Dashboard ----------------
const ResponderDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [loading, setLoading] = useState(true);
  const [username, setUsername] = useState("");
  const [fullName, setFullName] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const [responderNotifications, setResponderNotifications] = useState(() => {
    const stored = localStorage.getItem("responder-notifications");
    return stored ? JSON.parse(stored) : [];
  });
  const [hasNewNotif, setHasNewNotif] = useState(() => {
    const stored = localStorage.getItem("responder-hasNewNotif");
    if (stored !== null) return JSON.parse(stored);
    return responderNotifications.length > 0;
  });

  const links = [
    { name: "Dashboard", path: "/responder", icon: <Home size={20} className="mr-3" /> },
    { name: "Profile", path: "/responder/profile", icon: <User size={20} className="mr-3" /> },
  ];

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch {
      console.warn("Logout failed or already logged out.");
    }
    localStorage.removeItem("responder-notifications");
    localStorage.removeItem("responder-hasNewNotif");
    navigate("/");
  };

  // ---------------- Session ----------------
  useEffect(() => {
    axios
      .get("/auth/session", { withCredentials: true })
      .then((res) => {
        if (res.data.role !== "responder") navigate("/");
        else {
          setFullName(`${res.data.firstName} ${res.data.lastName}`);
          setUsername(res.data.username);
          setLoading(false);
        }
      })
      .catch(() => navigate("/"));
  }, [navigate]);

  // ---------------- Socket ----------------
  useEffect(() => {
    if (loading) return;

    const responderSocket = io(import.meta.env.VITE_SOCKET_URL, { withCredentials: true });
    responderSocket.emit("join-responder", username);

    responderSocket.on("public-announcement", (data) => {
      showAnnouncementToast(data.message);
      const newNotif = {
        message: `𝗔𝗡𝗡𝗢𝗨𝗡𝗖𝗘𝗠𝗘𝗡𝗧: ${data.message}`,
        timestamp: new Date().toLocaleString(),
      };
      setResponderNotifications((prev) => [newNotif, ...prev]);
      setHasNewNotif(true);
    });

    const pushNotif = (data, template, soundFile) => {
      const message = template
        .replace("[responder]", data.responderName)
        .replace("[type]", data.type)
        .replace("[resident]", data.residentName);
      new Audio(soundFile).play().catch(() => {});
      setResponderNotifications((prev) => [{ ...data, message, timestamp: new Date().toLocaleString() }, ...prev]);
      setHasNewNotif(true);
    };

    responderSocket.on("responder-declined", (data) =>
      pushNotif(data, "🔴 [responder] declined the [type] report of [resident]", "/sounds/responderdeclined.mp3")
    );
    responderSocket.on("notify-on-the-way", (data) =>
      pushNotif(data, "🟡 [responder] is on its way to the [type] report of [resident]", "/sounds/responderontheway.mp3")
    );
    responderSocket.on("notify-responded", (data) =>
      pushNotif(data, "🟢 [responder] has responded to the [type] report of [resident]", "/sounds/responderresponded.mp3")
    );

    return () => responderSocket.disconnect();
  }, [loading, username]);

  // ---------------- Persist notifications ----------------
  useEffect(() => {
    localStorage.setItem("responder-notifications", JSON.stringify(responderNotifications));
    localStorage.setItem("responder-hasNewNotif", JSON.stringify(hasNewNotif));
  }, [responderNotifications, hasNewNotif]);

  if (loading) return null;

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-red-50 to-red-100">
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
        location={location}
      />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto relative">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-red-800 mb-2 tracking-wide">Responder Dashboard</h1>
          <p className="text-lg text-gray-700">Welcome {fullName}!</p>
        </div>

        <EmergencyList />

        <MapView
          responderNotifications={responderNotifications}
          setResponderNotifications={setResponderNotifications}
          hasNewNotif={hasNewNotif}
          setHasNewNotif={setHasNewNotif}
        />
      </div>
    </div>
  );
};

export default ResponderDashboard;
