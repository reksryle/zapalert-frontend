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

  // Determine states
  const isOnTheWay = onTheWayIds.includes(report._id);
  const isArrived = arrivedIds.includes(report._id);

  const handleOnTheWay = () => {
    onTheWay(report._id, report);
    if (!isOnTheWay) setOnTheWayIds((prev) => [...prev, report._id]);
    setTimeout(() => markerRef.current?.openPopup(), 0);
  };

  const handleArrived = async () => {
    try {
      await axios.patch(`/reports/${report._id}/arrived`, {}, { withCredentials: true });
      if (!isArrived) setArrivedIds((prev) => [...prev, report._id]);
    } catch (err) {
      console.error("Arrived notify failed", err);
    }
    setTimeout(() => markerRef.current?.openPopup(), 0);
  };

  const handleResponded = () => onResponded(report._id);
  const handleDecline = () => onDecline(report._id);

  const popupBg = isOnTheWay || isArrived ? "bg-yellow-100" : "bg-white";

  const currentIcon = isArrived
    ? new L.Icon({ iconUrl: "/icons/arrived.png", iconSize: [35, 35] })
    : isOnTheWay
    ? new L.Icon({ iconUrl: "/icons/otw.png", iconSize: [35, 35] })
    : icon;

  // Format timestamp
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
            <strong>{report.type} Report</strong>
          </div>

          <div>{report.description}</div>
          <div className="text-gray-500">By: {report.firstName} {report.lastName}</div>
          <div className="text-gray-500">Age: {report.age || "N/A"}</div>
          <div className="text-gray-500">Contact: {report.contactNumber || "N/A"}</div>
          <div className="text-xs text-gray-400 mt-1">
            𝗥𝗲𝗽𝗼𝗿𝘁𝗲𝗱 𝗮𝘁: {formatPHTime(report.createdAt)}
          </div>

          {/* Button Flow */}
          <div className="flex flex-col gap-1 mt-2">
            {/* Step 1: Initial */}
            {!isOnTheWay && !isArrived && (
              <div className="flex gap-1 w-full">
                <button
                  onClick={handleOnTheWay}
                  className="flex-1 px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition text-[10px]"
                >
                  𝗢𝗡 𝗧𝗛𝗘 𝗪𝗔𝗬
                </button>
                <button
                  onClick={handleDecline}
                  className="flex-1 px-1.5 py-0.5 rounded-md bg-red-100 text-red-700 font-semibold hover:bg-red-200 transition text-[10px]"
                >
                  𝗗𝗘𝗖𝗟𝗜𝗡𝗘
                </button>
              </div>
            )}

            {/* Step 2: After ON THE WAY */}
            {isOnTheWay && !isArrived && (
              <div className="flex gap-1 w-full">
                <button
                  onClick={handleArrived}
                  className="flex-1 px-1.5 py-0.5 rounded-md bg-purple-100 text-purple-700 font-semibold hover:bg-purple-200 transition text-[10px]"
                >
                  ARRIVE
                </button>
                <button
                  onClick={handleOnTheWay}
                  className="flex-1 px-1.5 py-0.5 rounded-md bg-blue-100 text-blue-700 font-semibold hover:bg-blue-200 transition text-[10px]"
                >
                  𝗦𝗧𝗜𝗟𝗟 𝗢𝗧𝗪
                </button>
                <button
                  onClick={handleDecline}
                  className="flex-1 px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition text-[10px]"
                >
                  CANCEL
                </button>
              </div>
            )}

            {/* Step 3: After ARRIVED */}
            {isArrived && (
              <div className="flex gap-1 w-full">
                <button
                  onClick={handleResponded}
                  className="flex-1 px-1.5 py-0.5 rounded-md bg-green-100 text-green-700 font-semibold hover:bg-green-200 transition text-[10px]"
                >
                  𝗥𝗘𝗦𝗣𝗢𝗡𝗗𝗘𝗗
                </button>
                <button
                  onClick={handleDecline}
                  className="flex-1 px-1.5 py-0.5 rounded-md bg-gray-100 text-gray-700 font-semibold hover:bg-gray-200 transition text-[10px]"
                >
                  CANCEL
                </button>
              </div>
            )}
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default AutoOpenMarker;
