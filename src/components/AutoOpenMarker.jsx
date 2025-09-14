// src/components/AutoOpenMarker.jsx
import { useEffect, useRef, useState } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import axios from "../api/axios";

const AutoOpenMarker = ({ report, icon, onTheWay, onResponded, onDecline }) => {
  const markerRef = useRef(null);
  const [onTheWayState, setOnTheWayState] = useState(false);
  const [arrivedState, setArrivedState] = useState(false);

  // Open popup on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (markerRef.current && markerRef.current._popup) {
        markerRef.current.openPopup();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  // Initialize onTheWay and arrived states from report responders
  useEffect(() => {
    const currentResponder = JSON.parse(localStorage.getItem("zapalert-user"));
    if (!currentResponder?._id) return;

    const responderAction = report.responders?.find(
      (res) => res.responderId?.toString() === currentResponder._id
    );

    if (responderAction?.action === "on-the-way") setOnTheWayState(true);
    if (responderAction?.action === "arrived") setArrivedState(true);
  }, [report.responders]);

  const handleOnTheWay = () => {
    onTheWay(report._id, report);
    setOnTheWayState(true);

    // Keep popup open
    if (markerRef.current && markerRef.current._popup) {
      markerRef.current.openPopup();
    }
  };

  const handleArrived = async () => {
    try {
      await axios.patch(`/reports/${report._id}/arrived`, {}, { withCredentials: true });
      setArrivedState(true);
    } catch (err) {
      console.error("Arrived notify failed", err);
    }
  };

  const handleResponded = () => onResponded(report._id);
  const handleDecline = () => onDecline(report._id);

  // Determine popup background color
  const popupBg = onTheWayState || arrivedState ? "bg-yellow-100" : "bg-white";

  // Create a yellow icon for "ON THE WAY" / "ARRIVED" state
  const currentIcon = onTheWayState || arrivedState
    ? new L.Icon({
        iconUrl: "/icons/otw.png", // <-- make sure this yellow icon exists
        iconSize: [35, 35],
      })
    : icon;

  return (
    <Marker position={[report.latitude, report.longitude]} icon={currentIcon} ref={markerRef}>
      <Popup className={popupBg}>
        <div className="text-sm">
          <div><strong>{report.type}</strong></div>
          <div>{report.description}</div>
          <div className="text-gray-500">By: {report.firstName} {report.lastName}</div>
          <div className="text-gray-500">Age: {report.age || "N/A"}</div>
          <div className="text-gray-500">Contact: {report.contactNumber || "N/A"}</div>

          <div className="flex gap-2 mt-2">
            {!onTheWayState && !arrivedState && (
              <button onClick={handleOnTheWay} className="text-blue-600 text-xs hover:underline">
                𝗢𝗡 𝗧𝗛𝗘 𝗪𝗔𝗬
              </button>
            )}

            {onTheWayState && !arrivedState && (
              <button onClick={handleArrived} className="text-purple-600 text-xs hover:underline">
                ARRIVED?
              </button>
            )}

            {arrivedState && (
              <button disabled className="font-bold text-green-700 text-xs">
                𝗔𝗥𝗥𝗜𝗩𝗘𝗗
              </button>
            )}

            <button onClick={handleResponded} className="text-green-600 text-xs hover:underline">
              𝗥𝗘𝗦𝗣𝗢𝗡𝗗𝗘𝗗
            </button>

            <button onClick={handleDecline} className="text-red-600 text-xs hover:underline">
              𝗗𝗘𝗖𝗟𝗜𝗡𝗘
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default AutoOpenMarker;
