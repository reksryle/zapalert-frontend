// src/components/AutoOpenMarker.jsx
import { useEffect, useRef } from "react";
import { Marker, Popup } from "react-leaflet";

const AutoOpenMarker = ({
  report,
  icon,
  onTheWay,
  onResponded,
  onDecline,
}) => {
  const markerRef = useRef(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      if (markerRef.current && markerRef.current._popup) {
        markerRef.current.openPopup();
      }
    }, 0); // ⏱ Delay execution to let Leaflet finish mounting

    return () => clearTimeout(timer); // Clean up
  }, []);

  const handleOnTheWay = () => {
    onTheWay(report._id, report);
  };

  const handleResponded = () => {
    onResponded(report._id);
  };

  const handleDecline = () => {
    onDecline(report._id);
  };

  return (
    <Marker
      position={[report.latitude, report.longitude]}
      icon={icon}
      ref={markerRef}
    >
      <Popup>
        <div className="text-sm">
          <div><strong>{report.type}</strong></div>
          <div>{report.description}</div>

          <div className="text-gray-500">
            By: {report.firstName} {report.lastName}
          </div>
          <div className="text-gray-500">Age: {report.age || "N/A"}</div>
          <div className="text-gray-500">
            Contact: {report.contactNumber || "N/A"}
          </div>

          <div className="flex gap-2 mt-2">
            <button
              onClick={handleOnTheWay}
              className="text-blue-600 text-xs hover:underline"
            >
              🚓 On our way
            </button>
            <button
              onClick={handleResponded}
              className="text-green-600 text-xs hover:underline"
            >
              ✅ Responded
            </button>
            <button
              onClick={handleDecline}
              className="text-red-600 text-xs hover:underline"
            >
              ❌ Decline
            </button>
          </div>
        </div>
      </Popup>
    </Marker>
  );
};

export default AutoOpenMarker;
