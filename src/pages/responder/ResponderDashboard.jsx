import React, { useEffect, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios from "../../api/axios";
import { io } from "socket.io-client";
import toast, { Toaster } from "react-hot-toast";
import { MapContainer, TileLayer, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import AutoOpenMarker from "../../components/AutoOpenMarker";
import { Bell, Menu, X, Home, LogOut } from "lucide-react";
import useEmergencyReports from "../../hooks/useEmergencyReports";
import showAnnouncementToast from "../../utils/showAnnouncementToast";
import useNetworkStatus from "../../hooks/useNetworkStatus";

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


// ---------------- Emergency List (Modified for Offline Support) ----------------
const EmergencyList = ({ onTheWayIds, setOnTheWayIds, arrivedIds, setArrivedIds }) => {
  const { reports, markAsOnTheWay, markAsResponded, declineReport } = useEmergencyReports(false);

  // Offline pending responses stored in localStorage
  const [pendingResponses, setPendingResponses] = useState(
    JSON.parse(localStorage.getItem("pendingResponses") || "[]")
  );

  // Track toast IDs for offline responses
  const pendingToastIds = useRef({});

  // Sync ARRIVED state
  useEffect(() => {
    const currentResponder = JSON.parse(localStorage.getItem("zapalert-user"));
    if (!currentResponder?._id) return;

    const alreadyArrived = reports
      .filter((r) =>
        r.responders?.some(
          (res) =>
            res.responderId?.toString() === currentResponder._id &&
            res.action === "arrived"
        )
      )
      .map((r) => r._id);

    setArrivedIds(alreadyArrived);
  }, [reports, setArrivedIds]);

  // ---------------- Offline & Auto-Send ----------------
  const savePending = (reportId, action, reportName, residentName) => {
    const updated = [...pendingResponses, { reportId, action, reportName, residentName }];
    setPendingResponses(updated);
    localStorage.setItem("pendingResponses", JSON.stringify(updated));

    // Show persistent toast until sent
    if (!pendingToastIds.current[reportId]) {
      pendingToastIds.current[reportId] = toast.loading(
        `Your response for ${reportName} will be sent to ${residentName} once online...`,
        { duration: Infinity }
      );
    }
  };


  const sendPending = async () => {
    if (!navigator.onLine || pendingResponses.length === 0) return;

    const remaining = [];
    for (let p of pendingResponses) {
      try {
        if (p.action === "on_the_way") await markAsOnTheWay(p.reportId, reports.find(r => r._id === p.reportId));
        else if (p.action === "responded") await markAsResponded(p.reportId);
        else if (p.action === "declined") await declineReport(p.reportId);
        else if (p.action === "arrived") await axios.patch(`/reports/${p.reportId}/arrived`, {}, { withCredentials: true });

        // Dismiss the pending toast and show success
        if (pendingToastIds.current[p.reportId]) {
          toast.dismiss(pendingToastIds.current[p.reportId]);
          toast.success(`Your response for "${p.reportName}" has been submitted.`);
          delete pendingToastIds.current[p.reportId];
        }
      } catch {
        remaining.push(p); // keep failed ones
      }
    }
    setPendingResponses(remaining);
    localStorage.setItem("pendingResponses", JSON.stringify(remaining));
  };

  useEffect(() => {
    window.addEventListener("online", sendPending);
    sendPending(); // attempt on mount
    return () => window.removeEventListener("online", sendPending);
  }, [pendingResponses]);

  // ---------------- Modified Handlers ----------------
  const handleOnTheWay = (id, report) => {
    if (navigator.onLine) {
      markAsOnTheWay(id, report);
      if (!onTheWayIds.includes(id)) setOnTheWayIds([...onTheWayIds, id]);
      // ✅ REMOVE this toast, it will only show after offline draft is sent
      // toast.success(`Your response for "${report.type} Report" has been submitted to "${report.firstName} ${report.lastName}".`);
    } else {
      savePending(id, "on_the_way", `${report.type} Report`, `${report.firstName} ${report.lastName}`);
      if (!onTheWayIds.includes(id)) setOnTheWayIds([...onTheWayIds, id]);
    }
  };

  const handleResponded = (id, report) => {
    if (navigator.onLine) {
      markAsResponded(id);
      // ✅ REMOVE immediate toast
      // toast.success(`Your response for "${report.type} Report" has been submitted.`);
    } else savePending(id, "responded", `${report.type} Report`);
  };

  const handleDecline = (id, report) => {
    if (navigator.onLine) {
      declineReport(id);
      // ✅ REMOVE immediate toast
      // toast.success(`Your response for "${report.type} Report" has been submitted.`);
    } else savePending(id, "declined", `${report.type} Report`);
  };

  const handleArrived = async (id, report) => {
    if (navigator.onLine) {
      try {
        await axios.patch(`/reports/${id}/arrived`, {}, { withCredentials: true });
        if (!arrivedIds.includes(id)) setArrivedIds([...arrivedIds, id]);
        // ✅ REMOVE immediate toast
        // toast.success(`Your response for "${report.type} Report" has been submitted.`);
      } catch (err) {
        savePending(id, "arrived", `${report.type} Report`);
      }
    } else savePending(id, "arrived", `${report.type} Report`);
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
            const isArrived = arrivedIds.includes(report._id);

            return (
              <li
                key={report._id}
                className={`p-4 rounded shadow-inner flex justify-between items-start transition-all ${
                  isOnTheWay || isArrived ? "bg-yellow-100" : "bg-white hover:shadow-lg hover:bg-gray-50"
                }`}
              >
                <div>
                  <p className="text-lg font-medium text-red-700">{report.type} Report</p>
                  <p className="text-sm text-gray-700">{report.description}</p>
                  <p className="text-sm text-gray-500">𝗙𝗿𝗼𝗺: {report.firstName} {report.lastName}</p>
                  <p className="text-sm text-gray-500">𝗔𝗴𝗲: {report.age ?? "N/A"}</p>
                  <p className="text-sm text-gray-500">𝗖𝗼𝗻𝘁𝗮𝗰𝘁: {report.contactNumber ?? "N/A"}</p>
                  <p className="text-xs text-gray-400 mt-1">𝗥𝗲𝗽𝗼𝗿𝘁𝗲𝗱 𝗮𝘁: {formatPHTime(report.createdAt)}</p>
                </div>
                <div className="flex flex-col gap-2 text-xs">
                  {!isArrived && (
                    <button
                      type="button"
                      onClick={() => handleOnTheWay(report._id, report)}
                      className="px-3 py-1 rounded-lg bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition"
                    >
                      𝗢𝗡 𝗧𝗛𝗘 𝗪𝗔𝗬
                    </button>
                  )}
                  {isOnTheWay && !isArrived && !pendingResponses.some(p => p.reportId === report._id && p.action === "on_the_way") && (
                    <button
                      type="button"
                      onClick={() => handleArrived(report._id, report)}
                      className="px-3 py-1 rounded-lg bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200 transition"
                    >
                      ARRIVE?
                    </button>
                  )}
                  {isArrived && (
                    <button
                      disabled
                      className="px-3 py-1 rounded-lg bg-green-200 text-green-700 font-bold cursor-default"
                    >
                      𝗔𝗥𝗥𝗜𝗩𝗘𝗗
                    </button>
                  )}
                  {isOnTheWay &&
                  !pendingResponses.some(p => p.reportId === report._id && p.action === "on_the_way") && (
                    <button
                      type="button"
                      onClick={() => handleResponded(report._id, report)}
                      className="px-3 py-1 rounded-lg bg-green-100 text-green-700 font-semibold hover:bg-green-200 transition"
                    >
                      𝗥𝗘𝗦𝗣𝗢𝗡𝗗𝗘𝗗
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleDecline(report._id, report)}
                    className="px-3 py-1 rounded-lg bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition"
                  >
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
const MapView = ({
  responderNotifications,
  setResponderNotifications,
  hasNewNotif,
  setHasNewNotif,
  onTheWayIds,
  setOnTheWayIds,
  arrivedIds,
  setArrivedIds
}) => {
  const zapateraCenter = [10.306711119471714, 123.9011395473235];
  const { reports, markAsOnTheWay, markAsResponded, declineReport } = useEmergencyReports(true);
  const [showDropdown, setShowDropdown] = useState(false);
  const audioInitialized = useRef(false);
  const announcementAudioRef = useRef(null);

  // Preload sounds once
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
            onTheWay={(id, r) => {
              markAsOnTheWay(id, r);
              if (!onTheWayIds.includes(id)) setOnTheWayIds([...onTheWayIds, id]);
            }}
            onResponded={markAsResponded}
            onDecline={declineReport}
            onTheWayIds={onTheWayIds}
            arrivedIds={arrivedIds}
            setOnTheWayIds={setOnTheWayIds}
            setArrivedIds={setArrivedIds}
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
          <div className="absolute right-0 mt-2 w-80 max-w-[90vw] bg-white/90 backdrop-blur-md shadow-2xl border rounded-2xl z-[200]">
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
              className="w-full text-center py-2 text-sm text-red-600 hover:bg-gray-100 rounded-b-2xl"
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
  const networkStatus = useNetworkStatus();
  const wasOffline = useRef(false);
  const onlineTimeout = useRef(null);
  const [showTutorial, setShowTutorial] = useState(false);
  

  const [responderNotifications, setResponderNotifications] = useState(() => {
    const stored = localStorage.getItem("responder-notifications");
    return stored ? JSON.parse(stored) : [];
  });
  const [hasNewNotif, setHasNewNotif] = useState(() => {
    const stored = localStorage.getItem("responder-hasNewNotif");
    if (stored !== null) return JSON.parse(stored);
    return responderNotifications.length > 0;
  });

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


  // ---------------- Shared ON THE WAY / ARRIVED states ----------------
  const [onTheWayIds, setOnTheWayIds] = useState([]);
  const [arrivedIds, setArrivedIds] = useState([]);

  const links = [
    { name: "Dashboard", path: "/responder", icon: <Home size={20} className="mr-3" /> }
  ];

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch {
      console.warn("Logout failed or already logged out.");
    }
    setShowTutorial(false); 
    localStorage.removeItem("responder-notifications");
    localStorage.removeItem("responder-hasNewNotif");

    sessionStorage.removeItem("responderTutorialShown");

    navigate("/");
  };

  // ---------------- Session ----------------
  useEffect(() => {
    axios
      .get("/auth/session", { withCredentials: true })
      .then((res) => {
        if (res.data.role !== "responder") {
          navigate("/");
        } else {
          setUsername(res.data.username);
          setFullName(res.data.firstName + " " + res.data.lastName);

setTimeout(() => {
  setLoading(false);

  // Show tutorial only once per session
  if (!sessionStorage.getItem("responderTutorialShown")) {
    setShowTutorial(true);
    sessionStorage.setItem("responderTutorialShown", "true");
  }
}, 2000);
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

      toast(message);
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
    responderSocket.on("notify-arrived", (data) =>
      pushNotif(data, "🔵 [responder] has arrived at the [type] report of [resident]", "/sounds/imhere.mp3")
    );

    return () => responderSocket.disconnect();
  }, [loading, username]);

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

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-red-50 to-red-100">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
        links={links}
        location={location}
      />

      <main className="flex-1 overflow-auto p-6">
        <button
          type="button"
          onClick={() => setSidebarOpen(true)}
          className="fixed top-4 left-4 z-[100] bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white p-2 rounded-md shadow-md hover:scale-105 transition-transform duration-200"
        >
          <Menu size={24} />
        </button>

        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-red-800 mb-2 tracking-wide">
            Responder <br />Dashboard
          </h1>
          <p className="text-lg text-gray-700">Welcome {fullName}!</p>
        </div>


        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <EmergencyList
            onTheWayIds={onTheWayIds}
            setOnTheWayIds={setOnTheWayIds}
            arrivedIds={arrivedIds}
            setArrivedIds={setArrivedIds}
          />

          <MapView
            responderNotifications={responderNotifications}
            setResponderNotifications={setResponderNotifications}
            hasNewNotif={hasNewNotif}
            setHasNewNotif={setHasNewNotif}
            onTheWayIds={onTheWayIds}
            setOnTheWayIds={setOnTheWayIds}
            arrivedIds={arrivedIds}
            setArrivedIds={setArrivedIds}
          />
        </div>
      </main>
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
              To use ZapAlert effectively, please turn on your device's location so emergencies can be handled quickly.
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
      <Toaster position="top-right" />
    </div>
  );
};

export default ResponderDashboard;
