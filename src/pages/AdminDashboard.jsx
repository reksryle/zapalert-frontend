import React, { useEffect, useState } from "react";
import axios from "axios";

const AdminDashboard = () => {
  const [pendingUsers, setPendingUsers] = useState([]);

  const fetchPending = async () => {
    const res = await axios.get("http://localhost:5001/api/auth/pending-users");
    setPendingUsers(res.data);
  };

  useEffect(() => {
    fetchPending();
  }, []);

  const approveUser = async (id) => {
    await axios.patch(`http://localhost:5001/api/auth/approve/${id}`);
    fetchPending();
  };

  const rejectUser = async (id) => {
    await axios.delete(`http://localhost:5001/api/auth/reject/${id}`);
    fetchPending();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 p-10 text-white">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      <p className="mb-4">Pending Registrations</p>

      {pendingUsers.length === 0 ? (
        <p>No pending users</p>
      ) : (
        <div className="bg-white text-black rounded-xl p-4 space-y-4">
          {pendingUsers.map((user) => (
            <div key={user._id} className="flex justify-between items-center border-b pb-3">
              <div>
                <p className="font-bold">
                  {user.firstName} {user.lastName}
                </p>
                <p className="text-sm text-gray-500">{user.username} — {user.role}</p>
              </div>
              <div className="space-x-2">
                <button
                  onClick={() => approveUser(user._id)}
                  className="bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => rejectUser(user._id)}
                  className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;
