import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL;
const BASE_IMAGE_URL = import.meta.env.VITE_IMAGE_URL || "https://zapalert-backend.onrender.com";

const PendingUsers = () => {
  const [pendingUsers, setPendingUsers] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
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
    <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl shadow-lg p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">Pending User Requests</h1>

      {pendingUsers.length === 0 ? (
        <div className="text-center py-12 bg-white/80 rounded-2xl shadow-inner">
          <p className="text-gray-600 text-lg">No pending users.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {pendingUsers.map((user) => {
            const imgURL = `${BASE_IMAGE_URL}/${user.idImagePath.replace(/\\/g, "/")}`;
            return (
              <div
                key={user._id}
                className="bg-white/90 backdrop-blur-sm shadow-lg rounded-2xl p-6 grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-6 items-center border-2 border-red-100 hover:border-red-200 transition-all"
              >
                {/* Left: User Info */}
                <div>
                  <h2 className="text-xl font-semibold text-gray-800 mb-2">
                    {user.firstName} {user.lastName}
                  </h2>
                  <div className="text-sm text-gray-700 space-y-2">
                    <p><b>Username:</b> {user.username}</p>
                    <p><b>Role:</b> <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-full text-xs font-semibold">{user.role}</span></p>
                    <p><b>Status:</b> <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded-full text-xs font-semibold">{user.status}</span></p>
                    <p><b>Age:</b> {user.age}</p>
                    <p><b>Contact No.:</b> {user.contactNumber}</p>
                    <p><b>Barangay:</b> {user.barangay}</p>
                    <p><b>Barrio:</b> {user.barrio}</p>

                  </div>
                </div>

                {/* Right: ID Image + Actions */}
                <div className="flex flex-col items-center gap-4 min-w-[10rem]">
                  <img
                    src={imgURL}
                    alt="Valid ID"
                    className="w-36 h-24 object-cover border-2 border-red-200 rounded-xl cursor-pointer hover:scale-105 transition-transform shadow-md"
                    onClick={() => setSelectedImage(imgURL)}
                  />
                  <div className="flex flex-col gap-2 w-full">
                    <button
                      onClick={() => approveUser(user._id)}
                      className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-green-600 hover:to-green-700 transition-all shadow-md"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleRejectClick(user._id)}
                      className="w-full bg-gradient-to-r from-red-500 to-red-600 text-white py-2 px-4 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 transition-all shadow-md"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Image Modal */}
      {selectedImage && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
          onClick={() => setSelectedImage(null)}
        >
          <div
            className="bg-white rounded-2xl p-6 max-w-3xl max-h-[90vh] overflow-auto relative shadow-2xl border-2 border-red-200"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={selectedImage}
              alt="Full ID"
              className="rounded-xl max-w-full max-h-[80vh] mx-auto shadow-lg"
            />
            <button
              className="absolute top-4 right-4 text-red-600 hover:text-red-800 text-2xl font-bold bg-white/80 rounded-full p-1 shadow-md"
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
            className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl shadow-xl w-80 max-w-full p-6 border-t-4 border-red-600"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-center text-xl font-bold mb-4 text-gray-800">Reject User?</h2>
            <p className="mb-6 text-center text-red-600 font-medium">
              Are you sure you want to reject this user? This action cannot be undone.
            </p>
            <div className="flex justify-center gap-4">
              <button
                className="px-5 py-2 rounded-xl bg-gray-200 hover:bg-gray-300 transition-all font-semibold"
                onClick={() => setModalOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-5 py-2 rounded-xl text-white font-semibold transition-all bg-gradient-to-r from-red-500 via-red-600 to-red-700 hover:from-red-600 hover:to-red-800 shadow-md"
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