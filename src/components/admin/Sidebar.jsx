import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";

const Sidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const tabs = [
    { key: "pending-users", label: "Pending Users" },
    { key: "all-users", label: "All Users" },
    { key: "reports-log", label: "Reports Log" },
    { key: "system-settings", label: "System Settings" },
  ];

  const handleLogout = () => {
    localStorage.removeItem("zapalertRole"); // or sessionStorage
    navigate("/");
  };

  return (
    <div className="bg-red-700 text-white h-full p-6 space-y-4 flex flex-col justify-between">
      <div>
        <h2 className="text-2xl font-bold mb-6">ZAPALERT Admin</h2>
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            to={`/admin/${tab.key}`}
            className={`block w-full text-left px-4 py-2 rounded hover:bg-red-600 ${
              location.pathname.includes(tab.key) ? "bg-red-600" : ""
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <button
        onClick={handleLogout}
        className="bg-white text-red-700 font-bold px-4 py-2 rounded hover:bg-gray-200"
      >
        Logout
      </button>
    </div>
  );
};

export default Sidebar;
