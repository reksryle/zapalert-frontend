import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, AlertCircle, LogOut } from "lucide-react";

const Sidebar = () => {
  const location = useLocation();

  const links = [
    {
      name: "Dashboard",
      path: "/resident",
      icon: <Home size={20} className="mr-2" />,
    },
    {
      name: "Submit Report",
      path: "/resident",
      icon: <AlertCircle size={20} className="mr-2" />,
    },
  ];

  const handleLogout = () => {
    localStorage.removeItem("zapalertRole");
    localStorage.removeItem("user");
    window.location.href = "/";
  };

  return (
    <div className="w-64 bg-white border-r shadow-md h-full p-6">
      <h2 className="text-xl font-bold text-red-700 mb-6">ZAPALERT</h2>

      <nav className="space-y-2">
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`flex items-center px-3 py-2 rounded-md text-sm font-medium ${
              location.pathname === link.path
                ? "bg-red-100 text-red-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {link.icon}
            {link.name}
          </Link>
        ))}
      </nav>

      <div className="mt-10">
        <button
          onClick={handleLogout}
          className="flex items-center w-full text-left px-3 py-2 rounded-md text-sm text-red-600 hover:bg-red-50 font-medium"
        >
          <LogOut size={20} className="mr-2" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default Sidebar;
