import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const PendingUsers = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  const fetchPending = async () => {
    try {
      const res = await axios.get("https://zapalert-backend.onrender.comhost:5001/api/auth/pending-users");
      setPendingUsers(res.data);
    } catch (err) {
      console.error("Error fetching pending users:", err);
    }
  };

  const approveUser = async (id) => {
    try {
      await axios.patch(`https://zapalert-backend.onrender.com/api/auth/approve/${id}`);
      toast.success("User approved successfully!");
      fetchPending();
    } catch (error) {
      toast.error("Failed to approve user.");
      console.error(error);
    }
  };

  const rejectUser = async (id) => {
    try {
      await axios.delete(`https://zapalert-backend.onrender.com/api/auth/reject/${id}`);
      toast.success("User rejected and deleted.");
      fetchPending();
    } catch (error) {
      toast.error("Failed to reject user.");
      console.error(error);
    }
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">👥 Pending User Requests</h1>

      {pendingUsers.length === 0 ? (
        <p className="text-gray-600">No pending users.</p>
      ) : (
        <div className="grid gap-6">
          {pendingUsers.map((user) => (
            <div
              key={user._id}
              className="bg-white shadow rounded-lg p-5 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-4 items-center border"
            >
              {/* Left: User Info */}
              <div>
                <h2 className="text-lg font-semibold">
                  {user.firstName} {user.lastName}
                </h2>
                <div className="text-sm text-gray-700 space-y-1 mt-1">
                  <p><b>Username:</b> {user.username}</p>
                  <p><b>Role:</b> {user.role}</p>
                  <p><b>Status:</b> {user.status}</p>
                  <p><b>Age:</b> {user.age}</p>
                  <p><b>Contact No.:</b> {user.contactNumber}</p>
                  <p><b>Barangay:</b> {user.barangay}</p>
                  <p><b>Barrio:</b> {user.barrio}</p>
                  <a
                    href={`https://zapalert-backend.onrender.com/${user.idImagePath.replace(/\\/g, "/")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 underline hover:text-blue-800 inline-block mt-1"
                  >
                    View Full ID
                  </a>
                </div>
              </div>

              {/* Right: ID Image + Actions */}
              <div className="flex flex-col items-center gap-2 min-w-[9rem]">
                <img
                  src={`https://zapalert-backend.onrender.com/${user.idImagePath.replace(/\\/g, "/")}`}
                  alt="Valid ID"
                  className="w-32 h-20 object-cover border rounded-md cursor-pointer hover:scale-105 transition-transform"
                  onClick={() => setSelectedImage(`https://zapalert-backend.onrender.com/${user.idImagePath.replace(/\\/g, "/")}`)}
                />
                <button
                  onClick={() => approveUser(user._id)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-1 rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectUser(user._id)}
                  className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-1 rounded"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-lg p-4 max-w-3xl max-h-[90vh] overflow-auto relative"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Full ID"
              className="rounded max-w-full max-h-[80vh] mx-auto"
            />
            <button
              className="absolute top-2 right-3 text-red-600 font-bold text-xl"
              onClick={() => setSelectedImage(null)}
            >
              ×
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PendingUsers;
