import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL;
const BASE_IMAGE_URL = import.meta.env.VITE_IMAGE_URL || "https://zapalert-backend.onrender.com";

const PendingUsers = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);

  // Modal state for rejecting user only
  const [modalOpen, setModalOpen] = useState(false);
  const [modalUserId, setModalUserId] = useState(null);

  const fetchPending = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/auth/pending-users`, {
        withCredentials: true,
      });
      setPendingUsers(res.data);
    } catch (err) {
      console.error("Error fetching pending users:", err);
    }
  };

  const approveUser = async (id) => {
    try {
      await axios.patch(`${BASE_URL}/auth/approve/${id}`, null, {
        withCredentials: true,
      });
      toast.success("User approved successfully!");
      fetchPending();
    } catch (error) {
      toast.error("Failed to approve user.");
      console.error(error);
    }
  };

  const rejectUser = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/auth/reject/${id}`, {
        withCredentials: true,
      });
      toast.success("User rejected and deleted.");
      fetchPending();
    } catch (error) {
      toast.error("Failed to reject user.");
      console.error(error);
    }
  };

  // Open reject confirmation modal
  const handleRejectClick = (id) => {
    setModalUserId(id);
    setModalOpen(true);
  };

  const handleConfirmReject = () => {
    rejectUser(modalUserId);
    setModalOpen(false);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div className="px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Pending User Requests</h1>

      {pendingUsers.length === 0 ? (
        <p className="text-gray-600">No pending users.</p>
      ) : (
        <div className="grid gap-6">
          {pendingUsers.map((user) => {
            const imgURL = `${BASE_IMAGE_URL}/${user.idImagePath.replace(/\\/g, "/")}`;
            return (
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
                      href={imgURL}
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
                    src={imgURL}
                    alt="Valid ID"
                    className="w-32 h-20 object-cover border rounded-md cursor-pointer hover:scale-105 transition-transform"
                    onClick={() => setSelectedImage(imgURL)}
                  />
                  {/* Approve executes immediately */}
                  <button
                    onClick={() => approveUser(user._id)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white text-sm py-1 rounded"
                  >
                    Approve
                  </button>
                  {/* Reject opens modal */}
                  <button
                    onClick={() => handleRejectClick(user._id)}
                    className="w-full bg-red-600 hover:bg-red-700 text-white text-sm py-1 rounded"
                  >
                    Reject
                  </button>
                </div>
              </div>
            );
          })}
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

      {/* Reject Confirmation Modal */}
      {modalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={() => setModalOpen(false)}
        >
          <div
            className="bg-white rounded-xl shadow-xl w-80 max-w-full p-6 border-t-4 border-red-600"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-center text-lg font-bold mb-3 text-gray-800">Reject User?</h2>
            <p className="mb-5 text-center text-red-600">
              Are you sure you want to reject this user? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-3">
              <button
                className="px-4 py-2 rounded-lg bg-gray-200 hover:bg-gray-300 transition"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-2 rounded-lg text-white font-semibold transition bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800"
                onClick={handleConfirmReject}
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default PendingUsers;
