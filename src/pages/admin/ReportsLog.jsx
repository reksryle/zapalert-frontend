import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const ReportIcon = new L.Icon({
  iconUrl: "/icons/marker.png",
  iconSize: [40, 40],
});

const ReportsLog = () => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchKeyword, setSearchKeyword] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const reportsPerPage = 20;

  useEffect(() => {
    fetchReports(); // initial load

    const interval = setInterval(fetchReports, 2000); // auto-refresh every 5s

    return () => clearInterval(interval); // cleanup
  }, []);

  const fetchReports = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/reports`);
      setReports(response.data.filter((r) => !r.archived));
    } catch (error) {
      toast.error("Failed to fetch reports.");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/reports/${selectedReport._id}`, {
        withCredentials: true,
      });
      toast.success("Report permanently deleted.");
      fetchReports();
      setSelectedReport(null);
      setShowDeleteConfirm(false);
    } catch (error) {
      toast.error("Failed to delete report.");
    }
  };

  const handleExportCSV = () => {
    const rows = reports.map(({ _id, type, status, description, username, latitude, longitude }) => ({
      id: _id,
      type,
      status,
      description,
      username,
      latitude,
      longitude,
    }));

    const escapeCSV = (str) => `"${(str || "").replace(/"/g, '""')}"`;

    const csv = [
      ["ID", "Type", "Status", "Description", "Username", "Latitude", "Longitude"],
      ...rows.map((row) =>
        [
          escapeCSV(row.id),
          escapeCSV(row.type),
          escapeCSV(row.status),
          escapeCSV(row.description),
          escapeCSV(row.username),
          row.latitude,
          row.longitude,
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;

    const today = new Date();
    const formattedDate = today.toLocaleDateString("en-CA");
    a.download = `BRGY_REPORTS-${formattedDate}.csv`;

    a.click();
  };

  const filteredReports = reports.filter((report) => {
    const normalize = (str) =>
      str.toLowerCase().replace(/_/g, " ");

    const matchesStatus =
      statusFilter === "all" ||
      normalize(report.status) === statusFilter ||
      (statusFilter === "resolved" && normalize(report.status) === "responded");

    const matchesKeyword = Object.values(report).some(
      (value) =>
        typeof value === "string" &&
        value.toLowerCase().includes(searchKeyword.toLowerCase())
    );
    return matchesStatus && matchesKeyword;
  });

  const totalPages = Math.ceil(filteredReports.length / reportsPerPage);
  const currentReports = filteredReports.slice(
    (currentPage - 1) * reportsPerPage,
    currentPage * reportsPerPage
  );

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Reports Log</h1>

      {/* Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {["all", "pending", "on the way", "resolved"].map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded-md border ${
                statusFilter === status
                  ? "bg-blue-600 text-white"
                  : "bg-white text-gray-700 hover:bg-gray-100"
              }`}
            >
              {status === "all" ? "All" : status.replace("_", " ").toUpperCase()}
            </button>
          ))}
        </div>
        <input
          type="text"
          placeholder="Search by username or description"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="w-full md:w-64 px-4 py-2 border rounded-md"
        />
        <button
          onClick={handleExportCSV}
          className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Export Sheets
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto shadow-md rounded-lg">
        <table className="min-w-full bg-white text-sm">
          <thead className="bg-gray-200">
            <tr>
              <th className="py-2 px-4 text-left">Username</th>
              <th className="py-2 px-4 text-left">Type</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Date & Time</th>
              <th className="py-2 px-4 text-left">View</th>
            </tr>
          </thead>
          <tbody>
            {currentReports.map((report) => (
              <tr key={report._id} className="hover:bg-gray-100">
                <td className="py-2 px-4">{report.username}</td>
                <td className="py-2 px-4">{report.type}</td>
                <td className="py-2 px-4 capitalize">{report.status.replace("_", " ")}</td>
                <td className="py-2 px-4">{new Date(report.createdAt).toLocaleString()}</td>
                <td className="py-2 px-4">
                  <button
                    onClick={() => setSelectedReport(report)}
                    className="text-blue-600 hover:underline text-sm"
                  >
                    Details
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="flex justify-end mt-4 gap-2">
        {[...Array(totalPages)].map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentPage(idx + 1)}
            className={`px-3 py-1 border rounded-md ${
              currentPage === idx + 1 ? "bg-blue-600 text-white" : "bg-white"
            }`}
          >
            {idx + 1}
          </button>
        ))}
      </div>

      {/* Details Modal */}
      {selectedReport && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setSelectedReport(null)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-md p-6 w-full max-w-2xl shadow-lg relative"
          >
            <button
              onClick={() => setSelectedReport(null)}
              className="absolute top-3 right-3 text-gray-500 hover:text-red-600 text-xl"
            >
              ×
            </button>
            <h2 className="text-xl font-semibold mb-4">Report Details</h2>
            <div className="space-y-2 text-sm">
              <p><strong>User:</strong> {selectedReport.username}</p>
              <p><strong>Type:</strong> {selectedReport.type}</p>
              <p><strong>Status:</strong> {selectedReport.status.replace("_", " ")}</p>
              <p><strong>Description:</strong> {selectedReport.description}</p>
              <p><strong>Location:</strong> {selectedReport.latitude}, {selectedReport.longitude}</p>
              <p><strong>Date:</strong> {new Date(selectedReport.createdAt).toLocaleString()}</p>
            </div>
            <div className="mt-4 h-64 w-full rounded overflow-hidden">
              <MapContainer
                center={[selectedReport.latitude, selectedReport.longitude]}
                zoom={16}
                scrollWheelZoom={true}
                className="h-full w-full z-0"
              >
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                <Marker position={[selectedReport.latitude, selectedReport.longitude]} icon={ReportIcon}>
                  <Popup>Emergency Location</Popup>
                </Marker>
              </MapContainer>
            </div>

            {/* Delete Button */}
            <div className="mt-6 flex justify-center">
              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Delete Modal */}
      {showDeleteConfirm && (
        <div
          className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50"
          onClick={() => setShowDeleteConfirm(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white p-6 rounded-md w-full max-w-sm shadow-lg text-center"
          >
            <h2 className="text-lg font-semibold mb-4">Are you sure you want to delete this report?</h2>
            <div className="flex justify-center gap-4">
              <button
                onClick={handleDelete}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Confirm Delete
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReportsLog;
