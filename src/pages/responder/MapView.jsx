import React, { useEffect, useRef } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import useEmergencyReports from "../../hooks/useEmergencyReports";
import AutoOpenMarker from "../../components/AutoOpenMarker";

// 📌 Map emergency types to icons
const iconMap = {
  Fire: new L.Icon({ iconUrl: "/icons/fire.png", iconSize: [32, 32] }),
  Flood: new L.Icon({ iconUrl: "/icons/flood.png", iconSize: [32, 32] }),
  Crime: new L.Icon({ iconUrl: "/icons/crime.png", iconSize: [32, 32] }),
  Medical: new L.Icon({ iconUrl: "/icons/medical.png", iconSize: [32, 32] }),
  Other: new L.Icon({ iconUrl: "/icons/other.png", iconSize: [32, 32] }),
};

const getIcon = (type) => iconMap[type] || iconMap["Other"];

// 🗺️ Force map to recenter and resize after load
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


const MapView = () => {
  const zapateraCenter = [10.306711119471714, 123.9011395473235];
  const { reports, markAsOnTheWay, markAsResponded, declineReport } =
    useEmergencyReports(true);

  const audioInitialized = useRef(false);
  const audioMapRef = useRef({});

  // ✅ Preload and store emergency sounds after first click
useEffect(() => {
  const allowAudio = () => {
    if (!audioInitialized.current) {
      const types = ["fire", "medical", "crime", "flood", "other"];
      const map = {};

      types.forEach((type) => {
        const audio = new Audio(`/sounds/${type}.mp3`);
        audio.load();
        map[type] = audio;

        // Prime audio by playing and immediately pausing silently
        audio.play().then(() => {
          audio.pause();
          audio.currentTime = 0;
        }).catch(() => {
          // Ignore play errors, e.g. if autoplay is blocked
        });
      });

      audioMapRef.current = map;
      audioInitialized.current = true;
    }
  };

  window.addEventListener("click", allowAudio, { once: true });
  return () => window.removeEventListener("click", allowAudio);
}, []);


  // 🔊 Play the correct sound for a given emergency type
  const playSound = (type) => {
    const sound = audioMapRef.current[type.toLowerCase()];
    if (sound) {
      sound.currentTime = 0;
      sound.play().catch(() => {});
    }
  };

  return (
    <div className="relative h-[500px] w-full">
      <MapContainer
        center={zapateraCenter}
        zoom={18}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <ForceCenter center={zapateraCenter} />
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
        <Circle
          center={zapateraCenter}
          radius={300}
          pathOptions={{
            color: "blue",
            fillColor: "lightblue",
            fillOpacity: 0.3,
          }}
        />

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

      {/* 🧭 Legend */}
      <div className="absolute right-4 top-4 bg-white p-3 rounded shadow-md z-[1000] text-sm">
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
    </div>
  );
};

export default MapView;
