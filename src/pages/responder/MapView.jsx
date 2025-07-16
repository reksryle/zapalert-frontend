import React, { useEffect, useState } from "react";
import {
  MapContainer,
  TileLayer,
  Circle,
  Marker,
  Popup,
  useMap,
} from "react-leaflet";
import L from "leaflet";
import axios from "axios";
import "leaflet/dist/leaflet.css";
import toast from "react-hot-toast";

// 🔥 Custom icons for each type
const iconMap = {
  Fire: new L.Icon({ iconUrl: "/icons/fire.png", iconSize: [32, 32] }),
  Flood: new L.Icon({ iconUrl: "/icons/flood.png", iconSize: [32, 32] }),
  Landslide: new L.Icon({ iconUrl: "/icons/landslide.png", iconSize: [32, 32] }),
  Medical: new L.Icon({ iconUrl: "/icons/medical.png", iconSize: [32, 32] }),
  Other: new L.Icon({ iconUrl: "/icons/other.png", iconSize: [32, 32] }),
};

// Helper to get icon URL
const getIconUrl = (type) => {
  return iconMap[type]?.options.iconUrl || iconMap["Other"].options.iconUrl;
};

// Force map center
const ForceCenter = ({ center }) => {
  const map = useMap();
  useEffect(() => {
    setTimeout(() => {
      map.invalidateSize();
      map.setView(center, 17);
    }, 200);
  }, [center]);
  return null;
};

const MapView = () => {
  const zapateraCenter = [10.306711119471714, 123.9011395473235];
  const [reports, setReports] = useState([]);

  const fetchReports = () => {
    axios
      .get("https://zapalert-backend.onrender.com/api/reports")
      .then((res) =>
        setReports(res.data.filter((r) => r.status !== "responded"))
      )
      .catch((err) => console.error("Error loading reports:", err));
  };

  const declineReport = async (id) => {
    try {
      await axios.delete(`https://zapalert-backend.onrender.com/api/reports/${id}`);
      toast.success("🗑️ Report declined");
      fetchReports();
    } catch (err) {
      toast.error("❌ Failed to decline report");
    }
  };

  const markAsResponded = async (id) => {
    try {
      await axios.patch(`https://zapalert-backend.onrender.com/api/reports/${id}/respond`);
      toast.success("✅ Marked as responded");
      fetchReports();
    } catch (err) {
      toast.error("❌ Failed to mark as responded");
    }
  };

  useEffect(() => {
    fetchReports();
    const interval = setInterval(fetchReports, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="relative h-screen w-full">
      <MapContainer
        center={zapateraCenter}
        zoom={18}
        scrollWheelZoom={true}
        style={{ height: "100%", width: "100%" }}
      >
        <ForceCenter center={zapateraCenter} />
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        />

        {/* 🔵 Radius */}
        <Circle
          center={zapateraCenter}
          radius={300}
          pathOptions={{
            color: "blue",
            fillColor: "lightblue",
            fillOpacity: 0.3,
          }}
        />

        {/* 📍 Markers */}
        {reports.map((report) => {
          const icon = L.icon({
            iconUrl: getIconUrl(report.type),
            iconSize: [35, 35],
            iconAnchor: [17, 35],
            popupAnchor: [0, -30],
          });

          return (
            <Marker
              key={report._id}
              position={[report.latitude, report.longitude]}
              icon={icon}
            >
              <Popup>
                <div className="text-sm space-y-1">
                  <div><strong>{report.type}</strong></div>
                  <div>{report.description}</div>
                  <div className="text-gray-500 text-xs">By: {report.firstName} {report.lastName}</div>
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => markAsResponded(report._id)}
                      className="text-green-600 text-xs hover:underline"
                    >
                      ✅ Responded
                    </button>
                    <button
                      onClick={() => declineReport(report._id)}
                      className="text-red-600 text-xs hover:underline"
                    >
                      ❌ Decline
                    </button>
                  </div>
                </div>
              </Popup>
            </Marker>
          );
        })}
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
