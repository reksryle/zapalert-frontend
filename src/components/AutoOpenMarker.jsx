import { useEffect, useRef } from "react";
import { Marker, Popup } from "react-leaflet";
import L from "leaflet";
import axios from "../api/axios";

const AutoOpenMarker = ({
  report,
  icon,
  onTheWay,
  onResponded,
  onDecline,
  onTheWayIds,
  arrivedIds,
  setOnTheWayIds,
  setArrivedIds
}) => {
  const markerRef = useRef(null);

  // Keep popup open on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      if (markerRef.current && markerRef.current._popup) {
        markerRef.current.openPopup();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, []);

  const currentResponderId = JSON.parse(localStorage.getItem("zapalert-user"))?._id;

  // Determine states based on parent arrays
  const isOnTheWay = onTheWayIds.includes(report._id);
  const isArrived = arrivedIds.includes(report._id);

  const handleOnTheWay = () => {
    onTheWay(report._id, report);
    if (!isOnTheWay) setOnTheWayIds((prev) => [...prev, report._id]);

    setTimeout(() => {
      if (markerRef.current && markerRef.current._popup) markerRef.current.openPopup();
    }, 0);
  };

  const handleArrived = async () => {
    try {
      await axios.patch(`/reports/${report._id}/arrived`, {}, { withCredentials: true });
      if (!isArrived) setArrivedIds((prev) => [...prev, report._id]);
    } catch (err) {
      console.error("Arrived notify failed", err);
    }

    setTimeout(() => {
      if (markerRef.current && markerRef.current._popup) markerRef.current.openPopup();
    }, 0);
  };

  const handleResponded = () => onResponded(report._id);
  const handleDecline = () => onDecline(report._id);

  const popupBg = isOnTheWay || isArrived ? "bg-yellow-100" : "bg-white";

  const currentIcon = isArrived
    ? new L.Icon({ iconUrl: "/icons/arrived.png", iconSize: [35, 35] })
    : isOnTheWay
    ? new L.Icon({ iconUrl: "/icons/otw.png", iconSize: [35, 35] })
    : icon;

  // Format timestamp like EmergencyList
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
    <Marker position={[report.latitude, report.longitude]} icon={currentIcon} ref={markerRef}>
      <Popup className={popupBg}>
        <div className="text-sm">
          <div className="flex items-center justify-between">
            <strong>{report.type}</strong>
            {isOnTheWay && !isArrived && (
              <button
                onClick={handleArrived}
                className="text-purple-600 text-xs hover:underline ml-2"
              >
                ARRIVED?
              </button>
            )}
            {isArrived && (
              <button disabled className="font-bold text-green-700 text-xs ml-2">
                𝗔𝗥𝗥𝗜𝗩𝗘𝗗
              </button>
            )}
          </div>

          <div>{report.description}</div>
          <div className="text-gray-500">By: {report.firstName} {report.lastName}</div>
          <div className="text-gray-500">Age: {report.age || "N/A"}</div>
          <div className="text-gray-500">Contact: {report.contactNumber || "N/A"}</div>
          <div className="text-xs text-gray-400 mt-1">
            𝗥𝗲𝗽𝗼𝗿𝘁𝗲𝗱 𝗮𝘁: {formatPHTime(report.createdAt)}
          </div>

          <div className="flex gap-2 mt-2">
            {!isArrived && (
              <button
                onClick={handleOnTheWay}
                className="text-blue-600 text-xs hover:underline"
              >
                𝗢𝗡 𝗧𝗛𝗘 𝗪𝗔𝗬
              </button>
            )}

            <button
              onClick={handleResponded}
              className="text-green-600 text-xs hover:underline"
            >
              𝗥𝗘𝗦𝗣𝗢𝗡𝗗𝗘𝗗
            </button>

            <button
              onClick={handleDecline}
              className="text-red-600 text-xs hover:underline"
            >
              𝗗𝗘𝗖𝗟𝗜𝗡𝗘
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default AutoOpenMarker;
