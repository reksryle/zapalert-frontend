import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL;

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
    return role === "responder" ? "text-red-600" : "text-blue-600";
  };

  const getStatusColor = (status) => {
    return status === "approved" ? "text-green-600" : "text-orange-500";
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
    <div>
      <h1 className="text-2xl font-semibold mb-4">All Registered Users</h1>

      <div className="flex flex-wrap gap-4 mb-4">
        <select className="p-2 border rounded" value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
          <option value="All">All Roles</option>
          <option value="Resident">Resident</option>
          <option value="Responder">Responder</option>
        </select>

        <select className="p-2 border rounded" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="All">All Statuses</option>
          <option value="Approved">Approved</option>
          <option value="Pending">Pending</option>
        </select>

        <select className="p-2 border rounded" value={barangayFilter} onChange={(e) => setBarangayFilter(e.target.value)}>
          <option value="All">All Barangays</option>
          {barangayOptions.map((b, i) => (
            <option key={i} value={b}>{b}</option>
          ))}
        </select>

        <select className="p-2 border rounded" value={barrioFilter} onChange={(e) => setBarrioFilter(e.target.value)}>
          <option value="All">All Barrios</option>
          {barrioOptions.map((b, i) => (
            <option key={i} value={b}>{b}</option>
          ))}
        </select>

        <input
          type="text"
          placeholder="Search"
          className="p-2 border rounded"
          value={searchUsername}
          onChange={(e) => setSearchUsername(e.target.value)}
        />
      </div>

      {filteredUsers.length === 0 ? (
        <p>No matching users found.</p>
      ) : (
        <div className="overflow-x-auto rounded shadow bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-gray-800 text-white">
              <tr>
                <th className="py-2 px-4">Name</th>
                <th className="py-2 px-4">Username</th>
                <th className="py-2 px-4">Role</th>
                <th className="py-2 px-4">Status</th>
                <th className="py-2 px-4">Contact #</th>
                <th className="py-2 px-4">Age</th>
                <th className="py-2 px-4">Barrio</th>
                <th className="py-2 px-4">Barangay</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr
                  key={user._id}
                  className={`border-b hover:bg-gray-100 cursor-pointer ${
                    selectedUser?._id === user._id ? "bg-blue-50" : ""
                  }`}
                  onClick={() => {
                    setSelectedUser(user);
                    setSelectedTab("Profile");
                    setDeleteConfirmInput("");
                  }}
                >
                  <td className="py-2 px-4">{user.firstName} {user.lastName}</td>
                  <td className="py-2 px-4">{user.username}</td>
                  <td className={`py-2 px-4 capitalize ${getRoleColor(user.role)}`}>{user.role}</td>
                  <td className={`py-2 px-4 capitalize ${getStatusColor(user.status)}`}>{user.status}</td>
                  <td className="py-2 px-4">{user.contactNumber || "N/A"}</td>
                  <td className="py-2 px-4">{user.age ?? "N/A"}</td>
                  <td className="py-2 px-4">{user.barrio || "—"}</td>
                  <td className="py-2 px-4">{user.barangay}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedUser && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded-lg w-full max-w-md sm:max-w-lg max-h-[80vh] overflow-y-auto relative shadow-lg">
            <button className="absolute top-2 right-3 text-xl font-bold" onClick={() => setSelectedUser(null)}>×</button>

            <h2 className="text-lg font-semibold mb-4">User Information</h2>

            <div className="mb-4">
              <div className="flex border-b">
                {["Profile", "Valid ID", "Actions"].map((tab) => (
                  <button
                    key={tab}
                    className={`px-4 py-2 font-medium ${selectedTab === tab ? "border-b-2 border-blue-600 text-blue-600" : "text-gray-600 hover:text-blue-600"}`}
                    onClick={() => setSelectedTab(tab)}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {selectedTab === "Profile" && (
              <div className="space-y-2">
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
                    href={`${BASE_URL}/${selectedUser.idImagePath.replace(/\\/g, "/")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="relative group"
                  >
                    <img
                      src={`${BASE_URL}/${selectedUser.idImagePath.replace(/\\/g, "/")}`}
                      alt="Valid ID"
                      className="w-[350px] h-[220px] object-cover border rounded shadow hover:opacity-90 transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute bottom-2 left-1/2 transform -translate-x-1/2 text-xs bg-black text-white rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      View Full Picture
                    </span>
                  </a>
                ) : (
                  <p className="text-center text-gray-500">No ID uploaded</p>
                )}
              </div>
            )}

            {selectedTab === "Actions" && (
              <div className="mt-6 space-y-3">
                {selectedUser.status === "pending" && (
                  <div className="flex gap-2">
                    <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-1 rounded w-full" onClick={() => handleApprove(selectedUser._id)}>
                      Approve
                    </button>
                    <button className="bg-red-600 hover:bg-red-700 text-white px-4 py-1 rounded w-full" onClick={() => handleReject(selectedUser._id)}>
                      Reject
                    </button>
                  </div>
                )}
                {selectedUser.status === "approved" && (
                  <>
                    <p className="text-sm text-gray-600">
                      Type <strong>delete {selectedUser.username}</strong> to confirm:
                    </p>
                    <input
                      type="text"
                      value={deleteConfirmInput}
                      onChange={(e) => setDeleteConfirmInput(e.target.value)}
                      placeholder="Enter confirmation"
                      className="w-full p-2 border rounded"
                    />
                    <button
                      className={`w-full mt-2 py-2 px-4 rounded text-white ${
                        deleteConfirmInput === `delete ${selectedUser.username}`
                          ? "bg-red-600 hover:bg-red-700"
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
