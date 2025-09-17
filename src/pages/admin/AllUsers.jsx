import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL;
const BASE_IMAGE_URL = import.meta.env.VITE_IMAGE_URL || "https://zapalert-backend.onrender.com";

const AllUsers = () => {
  const [allUsers, setAllUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [roleFilter, setRoleFilter] = useState("All");
  const [statusFilter, setStatusFilter] = useState("All");
  const [barangayFilter, setBarangayFilter] = useState("All");
  const [barrioFilter, setBarrioFilter] = useState("All");
  const [searchUsername, setSearchUsername] = useState("");
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("");
  const [selectedTab, setSelectedTab] = useState("Profile");

  const fetchAllUsers = async () => {
    try {
      const res = await axios.get(`${BASE_URL}/auth/all-users`, { withCredentials: true });
      setAllUsers(res.data);
      setFilteredUsers(res.data);
    } catch (err) {
      console.error("Error fetching all users:", err);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const filtered = allUsers.filter((user) => {
      const roleMatch = roleFilter === "All" || user.role?.toLowerCase() === roleFilter.toLowerCase();  
      const statusMatch = statusFilter === "All" || user.status === statusFilter.toLowerCase();
      const barangayMatch = barangayFilter === "All" || user.barangay === barangayFilter;
      const barrioMatch = barrioFilter === "All" || user.barrio === barrioFilter;

      const text = searchUsername.toLowerCase();
      const matchesSearch =
        user.username?.toLowerCase().includes(text) ||
        user.firstName?.toLowerCase().includes(text) ||
        user.lastName?.toLowerCase().includes(text) ||
        `${user.firstName} ${user.lastName}`.toLowerCase().includes(text) ||
        user.contactNumber?.toLowerCase().includes(text) ||
        user.barangay?.toLowerCase().includes(text) ||
        user.barrio?.toLowerCase().includes(text) ||
        user.age?.toString().includes(text);

      return roleMatch && statusMatch && barangayMatch && barrioMatch && matchesSearch;
    });
    setFilteredUsers(filtered);
  }, [roleFilter, statusFilter, barangayFilter, barrioFilter, searchUsername, allUsers]);

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && setSelectedUser(null);
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, []);

  const getRoleColor = (role) => {
    return role === "responder" ? "bg-red-100 text-red-800" : "bg-blue-100 text-blue-800";
  };

  const getStatusColor = (status) => {
    return status === "approved" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800";
  };

  const handleApprove = async (id) => {
    if (!window.confirm("Are you sure you want to approve this user?")) return;
    try {
      await axios.patch(`${BASE_URL}/auth/approve/${id}`, {}, { withCredentials: true });
      fetchAllUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error("Approve failed", error);
    }
  };

  const handleReject = async (id) => {
    if (!window.confirm("Are you sure you want to reject this user?")) return;
    try {
      await axios.delete(`${BASE_URL}/auth/reject/${id}`, { withCredentials: true });
      fetchAllUsers();
      setSelectedUser(null);
    } catch (error) {
      console.error("Reject failed", error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`${BASE_URL}/auth/reject/${id}`, { withCredentials: true });
      fetchAllUsers();
      setSelectedUser(null);
      toast.success("User deleted successfully.");
    } catch (error) {
      toast.error("Failed to delete user.");
    }
  };

  const barangayOptions = [...new Set(allUsers.map((u) => u.barangay))];
  const barrioOptions = [...new Set(allUsers.map((u) => u.barrio).filter(Boolean))].sort();

  return (
    <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl shadow-lg p-6">
      <h1 className="text-2xl font-bold mb-6 text-gray-800">All Registered Users</h1>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
        <select 
          className="p-3 border-2 border-red-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          value={roleFilter} 
          onChange={(e) => setRoleFilter(e.target.value)}
        >
          <option value="All">All Roles</option>
          <option value="Resident">Resident</option>
          <option value="Responder">Responder</option>
        </select>

        <select 
          className="p-3 border-2 border-red-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          value={statusFilter} 
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="All">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
        </select>

        <select 
          className="p-3 border-2 border-red-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          value={barangayFilter} 
          onChange={(e) => setBarangayFilter(e.target.value)}
        >
          <option value="All">All Barangays</option>
          {barangayOptions.map((b, i) => (
            <option key={i} value={b}>{b}</option>
          ))}
        </select>

        <select 
          className="p-3 border-2 border-red-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          value={barrioFilter} 
          onChange={(e) => setBarrioFilter(e.target.value)}
        >
          <option value="All">All Barrios</option>
          {barrioOptions.map((b, i) => (
            <option key={i} value={b}>{b}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search users..."
          className="p-3 border-2 border-red-200 rounded-xl bg-white/80 backdrop-blur-sm focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <div className="text-center py-12 bg-white/80 rounded-2xl shadow-inner">
          <p className="text-gray-600 text-lg">No matching users found.</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-2xl shadow-lg bg-white/80 backdrop-blur-sm">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gradient-to-r from-red-500 to-orange-500 text-white">
              <tr>
                <th className="py-3 px-4 rounded-tl-2xl">Name</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Role</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Contact #</th>
                <th className="py-3 px-4">Age</th>
                <th className="py-3 px-4">Barrio</th>
                <th className="py-3 px-4 rounded-tr-2xl">Barangay</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className={`border-b border-red-100 hover:bg-red-50/50 cursor-pointer transition-all ${
                    selectedUser?._id === user._id ? "bg-red-100" : ""
                  }`}
                  onClick={() => {
                    setSelectedUser(user);
                    setSelectedTab("Profile");
                    setDeleteConfirmInput("");
                  }}
                >
                  <td className="py-3 px-4 font-medium">{user.firstName} {user.lastName}</td>
                  <td className="py-3 px-4">{user.username}</td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getRoleColor(user.role)}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusColor(user.status)}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">{user.contactNumber || "N/A"}</td>
                  <td className="py-3 px-4">{user.age ?? "N/A"}</td>
                  <td className="py-3 px-4">{user.barrio || "—"}</td>
                  <td className="py-3 px-4">{user.barangay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl p-6 w-full max-w-md sm:max-w-lg max-h-[80vh] overflow-y-auto relative shadow-2xl border border-red-200">
            <button className="absolute top-4 right-4 text-2xl text-red-600 hover:text-red-800 transition-colors" onClick={() => setSelectedUser(null)}>×</button>

            <h2 className="text-xl font-bold mb-4 text-gray-800">User Information</h2>

            <div className="mb-4">
              <div className="flex border-b border-red-200">
                {["Profile", "Valid ID", "Actions"].map((tab) => (
                  <button
                    key={tab}
                    className={`px-4 py-2 font-semibold transition-all ${
                      selectedTab === tab 
                        ? "border-b-2 border-red-600 text-red-600" 
                        : "text-gray-600 hover:text-red-600"
                    }`}
                    onClick={() => setSelectedTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {selectedTab === "Profile" && (
              <div className="space-y-3 text-sm">
                <p><strong>Name:</strong> {selectedUser.firstName} {selectedUser.lastName}</p>
                <p><strong>Username:</strong> {selectedUser.username}</p>
                <p><strong>Contact Number:</strong> {selectedUser.contactNumber}</p>
                <p><strong>Age:</strong> {selectedUser.age}</p>
                <p><strong>Barangay:</strong> {selectedUser.barangay}</p>
                <p><strong>Barrio:</strong> {selectedUser.barrio}</p>
                <p><strong>Role:</strong> {selectedUser.role}</p>
                <p><strong>Status:</strong> {selectedUser.status}</p>
              </div>
            )}

            {selectedTab === "Valid ID" && (
              <div className="mt-4 flex justify-center">
                {selectedUser.idImagePath ? (
                  <a
                    href={`${BASE_IMAGE_URL}/${selectedUser.idImagePath.replace(/\\/g, "/")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group"
                  >
                    <img
                      src={`${BASE_IMAGE_URL}/${selectedUser.idImagePath.replace(/\\/g, "/")}`}
                      alt="Valid ID"
                      className="w-[350px] h-[220px] object-cover border-2 border-red-200 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 group-hover:scale-105"
                    />
                    <span className="absolute bottom-3 left-1/2 transform -translate-x-1/2 text-xs bg-black/80 text-white rounded-full px-3 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      View Full Picture
                    </span>
                  </a>
                ) : (
                  <p className="text-center text-gray-500 py-8">No ID uploaded</p>
                )}
              </div>
            )}

            {selectedTab === "Actions" && (
              <div className="mt-6 space-y-4">
                {selectedUser.status === "pending" && (
                  <div className="flex gap-3">
                    <button 
                      className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-xl hover:from-green-600 hover:to-green-700 transition-all shadow-lg"
                      onClick={() => handleApprove(selectedUser._id)}
                    >
                      Approve
                    </button>
                    <button 
                      className="flex-1 bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-2 rounded-xl hover:from-red-600 hover:to-red-700 transition-all shadow-lg"
                      onClick={() => handleReject(selectedUser._id)}
                    >
                      Reject
                    </button>
                  </div>
                )}
                {selectedUser.status === "approved" && (
                  <>
                    <p className="text-sm text-gray-600 text-center">
                      Type <strong>delete {selectedUser.username}</strong> to confirm:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmInput}
                      onChange={(e) => setDeleteConfirmInput(e.target.value)}
                      placeholder="Enter confirmation"
                      className="w-full p-3 border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400"
                    />
                    <button
                      className={`w-full py-3 px-4 rounded-xl text-white font-semibold transition-all shadow-lg ${
                        deleteConfirmInput === `delete ${selectedUser.username}`
                          ? "bg-gradient-to-r from-red-600 to-red-700 hover:from-red-700 hover:to-red-800"
                          : "bg-gray-400 cursor-not-allowed"
                      }`}
                      onClick={() => handleDelete(selectedUser._id)}
                      disabled={deleteConfirmInput !== `delete ${selectedUser.username}`}
                    >
                      Delete User
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AllUsers;