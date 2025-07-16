import React, { useEffect, useState } from "react";
import axios from "axios";

const API = import.meta.env.VITE_API_URL;

const EmergencyList = () => {
  const [emergencies, setEmergencies] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEmergencies = async () => {
      try {
        const res = await axios.get(`${API}/emergencies`);
        console.log("🚨 Emergency API Response:", res.data);

        if (Array.isArray(res.data)) {
          setEmergencies(res.data);
        } else {
          console.error("❌ Expected array but got:", res.data);
          setEmergencies([]); // fallback to prevent crash
        }
      } catch (error) {
        console.error("❌ Failed to fetch emergencies:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEmergencies();
  }, []);

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-red-800 mb-4">Emergency Reports</h2>

      {loading ? (
        <p>Loading...</p>
      ) : !Array.isArray(emergencies) || emergencies.length === 0 ? (
        <p>No emergencies reported yet.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border rounded-lg shadow">
            <thead className="bg-red-700 text-white">
              <tr>
                <th className="py-2 px-4 text-left">Type</th>
                <th className="py-2 px-4 text-left">Location</th>
                <th className="py-2 px-4 text-left">Reported By</th>
                <th className="py-2 px-4 text-left">Status</th>
                <th className="py-2 px-4 text-left">Date</th>
              </tr>
            </thead>
            <tbody>
              {emergencies.map((emergency, index) => (
                <tr key={index} className="border-t">
                  <td className="py-2 px-4">{emergency.type}</td>
                  <td className="py-2 px-4">{emergency.location}</td>
                  <td className="py-2 px-4">{emergency.reportedBy}</td>
                  <td className="py-2 px-4">
                    <span
                      className={`px-2 py-1 rounded text-sm ${
                        emergency.status === "pending"
                          ? "bg-yellow-200 text-yellow-800"
                          : emergency.status === "responding"
                          ? "bg-blue-200 text-blue-800"
                          : "bg-green-200 text-green-800"
                      }`}
                    >
                      {emergency.status}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    {new Date(emergency.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default EmergencyList;
