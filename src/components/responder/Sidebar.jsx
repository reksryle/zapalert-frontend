// components/Sidebar.jsx
import React from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  return (
    <div className="w-64 bg-white border-r h-full p-6 shadow-md">
      <h2 className="text-xl font-bold mb-6">ZAPALERT!</h2>
      <nav className="space-y-4">
        <Link to="/resident" className="block text-gray-800 hover:text-red-600">
          🏠 Dashboard
        </Link>
        <Link to="/resident/profile" className="block text-gray-800 hover:text-red-600">
          👤 Profile
        </Link>
        <button
          onClick={() => {
            localStorage.removeItem("user");
            window.location.href = "/";
          }}
          className="text-red-600 font-bold"
        >
          🚪 Logout
        </button>
      </nav>
    </div>
  );
};

export default Sidebar;
