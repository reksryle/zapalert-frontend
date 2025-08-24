import React, { useEffect, useRef, useState } from "react";
import { MapContainer, TileLayer, Circle, useMap } from "react-leaflet";
import L from "leaflet";
import useEmergencyReports from "../../hooks/useEmergencyReports";
import AutoOpenMarker from "../../components/AutoOpenMarker";
import { Bell } from "lucide-react";
import socket from "../../socket";

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
          map.setView(center, 17);
        } catch (err) {
          console.error("Map error:", err);
        }
      }
    }, 200);
    return () => clearTimeout(timer);
  }, [center, map]);
  return null;
};

const MapView = ({ responderNotifications, setResponderNotifications, hasNewNotif, setHasNewNotif }) => {
  const zapateraCenter = [10.306711119471714, 123.9011395473235];
  const { reports, markAsOnTheWay, markAsResponded, declineReport } = useEmergencyReports(true);

  const audioInitialized = useRef(false);
  const audioMapRef = useRef({});
  const [showDropdown, setShowDropdown] = useState(false);

  // Preload audio
  useEffect(() => {
    const allowAudio = () => {
      if (!audioInitialized.current) {
        const types = ["fire", "medical", "crime", "flood", "other"];
        const map = {};
        types.forEach((type) => {
          const audio = new Audio(`/sounds/${type}.mp3`);
          audio.load();
          map[type] = audio;
          audio.play().then(() => { audio.pause(); audio.currentTime = 0; }).catch(() => {});
        });
        audioMapRef.current = map;
        audioInitialized.current = true;
      }
    };
    window.addEventListener("click", allowAudio, { once: true });
    return () => window.removeEventListener("click", allowAudio);
  }, []);

  const playSound = (type) => {
    const sound = audioMapRef.current[type.toLowerCase()];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  };

  // Socket notifications
  useEffect(() => {
    const handleDeclined = (data) => {
      const message = `🔴 ${data.responderName} declined the ${data.type} report of ${data.residentName}`;
      new Audio("/sounds/declined.mp3").play().catch(() => {});
      setResponderNotifications((prev) => [{ ...data, message, timestamp: new Date().toLocaleString() }, ...prev]);
      setHasNewNotif(true);
    };

    const handleOnTheWay = (data) => {
      const message = `🟡 ${data.responderName} is on its way to the ${data.type} report of ${data.residentName}`;
      new Audio("/sounds/ontheway.mp3").play().catch(() => {});
      setResponderNotifications((prev) => [{ ...data, message, timestamp: new Date().toLocaleString() }, ...prev]);
      setHasNewNotif(true);
    };

    const handleResponded = (data) => {
      const message = `🟢 ${data.responderName} has responded to the ${data.type} report of ${data.residentName}`;
      new Audio("/sounds/responded.mp3").play().catch(() => {});
      setResponderNotifications((prev) => [{ ...data, message, timestamp: new Date().toLocaleString() }, ...prev]);
      setHasNewNotif(true);
    };

    socket.on("responder-declined", handleDeclined);
    socket.on("notify-on-the-way", handleOnTheWay);
    socket.on("notify-responded", handleResponded);

    return () => {
      // Proper cleanup
      socket.off("responder-declined", handleDeclined);
      socket.off("notify-on-the-way", handleOnTheWay);
      socket.off("notify-responded", handleResponded);
    };
  }, [setResponderNotifications, setHasNewNotif]);

  return (
    <div className="relative h-[500px] w-full">
      <MapContainer center={zapateraCenter} zoom={18} scrollWheelZoom style={{ height: "100%", width: "100%" }}>
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
        <strong className="block mb-2">🗺️ Legend</strong>
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
          <button className="relative bg-white p-1 rounded-full shadow" onClick={() => { setShowDropdown((prev) => !prev); setHasNewNotif(false); }}>
            <Bell className="h-6 w-6 text-gray-800" />
            {hasNewNotif && <span className="absolute top-0 right-0 block h-3 w-3 rounded-full bg-red-600 border-2 border-white"></span>}
          </button>
          {showDropdown && (
            <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg border rounded z-[200]">
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
              <button onClick={() => { setResponderNotifications([]); localStorage.removeItem("responder-notifications"); setHasNewNotif(false); }}
                className="w-full text-center py-2 text-sm text-red-600 hover:bg-gray-100">
                Clear All
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MapView;
