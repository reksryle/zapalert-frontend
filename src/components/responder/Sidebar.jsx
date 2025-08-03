import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Home, User, LogOut } from "lucide-react";
import axios from "../../api/axios";

const ResponderSidebar = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const links = [
    { name: "Dashboard", path: "/responder", icon: <Home size={20} className="mr-3" /> },
    { name: "Profile", path: "/responder/profile", icon: <User size={20} className="mr-3" /> },
  ];

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout", {}, { withCredentials: true });
    } catch (err) {
      console.warn("Logout failed or already logged out.");
    }
    localStorage.removeItem("responder-notifications");
    navigate("/");
  };

  return (
    <div className="w-64 h-screen bg-white border-r shadow-md p-6 flex flex-col">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-red-600 tracking-wide">ZAPALERT</h1>
      </div>

      <nav className="flex-1 space-y-2">
        {links.map((link) => (
          <Link
            key={link.name}
            to={link.path}
            className={`flex items-center px-4 py-2 rounded-lg font-medium transition-colors ${
              location.pathname === link.path
                ? "bg-red-100 text-red-700"
                : "text-gray-700 hover:bg-gray-100"
            }`}
          >
            {link.icon}
            <span>{link.name}</span>
          </Link>
        ))}
      </nav>

      <div className="mt-8">
        <button
          onClick={handleLogout}
          className="flex items-center w-full px-4 py-2 rounded-lg text-red-600 font-medium hover:bg-red-50 transition-colors"
        >
          <LogOut size={20} className="mr-3" />
          Logout
        </button>
      </div>
    </div>
  );
};

export default ResponderSidebar;
