// pages/admin/AdminDashboard.jsx
import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Sidebar from "../../components/admin/Sidebar";
import { Outlet } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const role = localStorage.getItem("zapalertRole"); // ✅ Use localStorage, not sessionStorage

    console.log("Role from localStorage:", role); // ✅ Optional debug log

    if (!role) return; // ✅ Wait for role to be available
    if (role !== "admin") {
      navigate("/"); // Redirect to login if not admin
    }
  }, [navigate]);

  return (
    <div className="flex min-h-screen bg-gray-100">
      <div className="w-64 bg-white shadow-lg">
        <Sidebar />
      </div>

      <div className="flex-1 p-6 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
};

export default AdminDashboard;
