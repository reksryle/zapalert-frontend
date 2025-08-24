import React from "react";
import useEmergencyReports from "../../hooks/useEmergencyReports";

const EmergencyList = () => {
  const { reports, markAsOnTheWay, markAsResponded, declineReport } = useEmergencyReports(false);

  const formatPHTime = (isoString) => {
    if (!isoString) return "N/A";
    return new Date(isoString).toLocaleString("en-PH", {
      timeZone: "Asia/Manila",
      year: "numeric",
      month: "short",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hour12: true,
    });
  };

  return (
    <div className="mb-6">
      <h2 className="text-xl font-semibold mb-4">Emergency List</h2>

      {reports.length === 0 ? (
        <p className="text-gray-500">No active emergencies.</p>
      ) : (
        <ul className="space-y-4">
          {reports.map((report) => (
            <li
              key={report._id}
              className="bg-white p-4 rounded shadow flex justify-between items-start"
            >
              <div>
                <p className="text-lg font-medium text-red-700">{report.type}</p>
                <p className="text-sm text-gray-700">{report.description}</p>
                <p className="text-sm text-gray-500">
                  From: {report.firstName} {report.lastName}, Age: {report.age ?? "N/A"}
                </p>
                <p className="text-sm text-gray-500">
                  Contact: {report.contactNumber ?? "N/A"}
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Reported at: {formatPHTime(report.createdAt)}
                </p>
              </div>
              <div className="flex flex-col gap-1 text-xs">
                <button
                  onClick={() => markAsOnTheWay(report._id, report)}
                  className="text-blue-600 hover:underline"
                >
                  🚓 On our way
                </button>
                <button
                  onClick={() => markAsResponded(report._id)}
                  className="text-green-600 hover:underline"
                >
                  ✅ Responded
                </button>
                <button
                  onClick={() => declineReport(report._id)}
                  className="text-red-600 hover:underline"
                >
                  ❌ Decline
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default EmergencyList;
