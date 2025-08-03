import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../../api/axios";
import Sidebar from "../../components/admin/Sidebar";
import { Outlet } from "react-router-dom";

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const checkSession = async () => {
      try {
        const res = await axios.get("/auth/check-session", {
          withCredentials: true,
        });

        if (res.data.role !== "admin") {
          navigate("/");
        }
      } catch (err) {
        console.error("Admin session check failed:", err);
        navigate("/");
      }
    };

    checkSession();
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
