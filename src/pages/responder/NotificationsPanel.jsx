import React from "react";
import useEmergencyReports from "../../hooks/useEmergencyReports";

const NotificationsPanel = ({ responderNotifications = [] }) => {
  const { reports } = useEmergencyReports(false);

  return (
    <div className="mt-8">
      <h2 className="text-xl font-semibold mb-4">🔔 Notifications</h2>

      {responderNotifications.length === 0 && reports.length === 0 ? (
        <p className="text-gray-500">No current notifications.</p>
      ) : (
        <ul className="space-y-2 max-h-80 overflow-y-auto">
          {responderNotifications.map((note, idx) => (
            <li key={`res-${idx}`} className="bg-red-100 p-3 rounded text-sm">
              {note.message}
              <div className="text-xs text-gray-400 mt-1">{note.timestamp}</div>
            </li>
          ))}

          {reports.map((report) => (
            <li key={report._id} className="bg-yellow-100 p-3 rounded text-sm">
              <span className="font-medium">🚨 {report.type} Report:</span>{" "}
              {report.firstName} {report.lastName} reported "{report.description}"
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPanel;
