// src/pages/admin/AdminDashboard.jsx
import React, { useEffect, useState } from "react";
import { Outlet, useNavigate, useLocation } from "react-router-dom";
import axios from "../../api/axios";
import { Menu, X, UserCheck, Users, FileText, Megaphone, LogOut } from "lucide-react";

// ---------------- Sidebar ----------------
const Sidebar = ({ sidebarOpen, setSidebarOpen, handleLogout, links, location }) => (
  <div
    className={`fixed top-0 left-0 h-full w-64 bg-white text-gray-900 shadow-lg z-[2000] transform transition-transform duration-300 ${
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    {/* Logo Section */}
    <div className="flex flex-col items-center justify-center p-6 border-b border-gray-200 relative">
      <img src="/icons/zapalert-logo.png" alt="Logo" className="w-20 h-20 mb-2" />
      <h1 className="text-3xl font-extrabold tracking-widest text-red-600">ZAPALERT</h1>
      <button type="button" onClick={() => setSidebarOpen(false)} className="absolute top-6 right-6">
        <X size={24} className="text-gray-900" />
      </button>
    </div>

    {/* Navigation Links */}
    <nav className="flex-1 p-6 space-y-2 overflow-y-auto">
      {links.map((link) => (
        <button
          key={link.path || link.name}
          onClick={() => {
            if (link.path) window.location.href = link.path;
            setSidebarOpen(false);
          }}
          className={`flex items-center w-full px-4 py-3 rounded-lg font-medium transition-all duration-200 hover:bg-red-100 hover:text-red-700 ${
            location.pathname === link.path ? "bg-red-50 text-red-700 shadow-inner" : "text-gray-900"
          }`}
        >
          {link.icon}
          <span className="ml-2">{link.name}</span>
        </button>
      ))}
    </nav>

    {/* Logout */}
    <div className="p-6 border-t border-gray-200">
      <button
        type="button"
        onClick={handleLogout}
        className="flex items-center w-full px-4 py-3 rounded-lg font-medium text-gray-900 hover:bg-red-100 hover:text-red-700 transition-all"
      >
        <LogOut size={20} className="mr-3" />
        Logout
      </button>
    </div>
  </div>
);

// ---------------- Main Admin Dashboard ----------------
const AdminDashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // 🔑 Links for admin
  const links = [
    { name: "Pending Users", path: "/admin/pending-users", icon: <UserCheck size={20} className="mr-3" /> },
    { name: "All Users", path: "/admin/all-users", icon: <Users size={20} className="mr-3" /> },
    { name: "Reports Log", path: "/admin/reports-log", icon: <FileText size={20} className="mr-3" /> },
    { name: "Announce", path: "/admin/announcement", icon: <Megaphone size={20} className="mr-3" /> },
  ];

  // ✅ Logout handler
  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch {
      console.warn("Logout failed or already logged out.");
    }
    localStorage.removeItem("zapalertRole");
    localStorage.removeItem("user");
    navigate("/");
  };

  // ✅ Session check
  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get("/auth/check-session", { withCredentials: true });
        if (res.data.role !== "admin") navigate("/");
      } catch (err) {
        console.error("Admin session check failed:", err);
        navigate("/");
      }
    };
    checkSession();
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-gradient-to-b from-red-50 to-red-100">
      {/* Burger Button */}
      <button
        type="button"
        onClick={() => setSidebarOpen(true)}
        className="fixed top-4 left-4 z-[100] bg-gradient-to-r from-red-500 via-red-600 to-red-700 text-white p-2 rounded-md shadow-md hover:scale-105 transition-transform duration-200"
      >
        <Menu size={24} />
      </button>

      {/* Sidebar */}
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        handleLogout={handleLogout}
        links={links}
        location={location}
      />

      {/* Main Content */}
      <div className="flex-1 p-6 overflow-y-auto relative">
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-5xl font-extrabold text-red-800 mb-2 tracking-wide">
            Admin <br /> Dashboard
          </h1>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;
