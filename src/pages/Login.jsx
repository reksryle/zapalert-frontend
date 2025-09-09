// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { useNavigate, useLocation } from "react-router-dom";
import { toast, ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showModal, setShowModal] = useState(false);

  // ✅ Loading screen state
  const [isLoading, setIsLoading] = useState(true);

  const toastStyle = {
    toastId: "loginToast",
    position: "top-center",
    autoClose: 2500,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    transition: Slide,
    style: {
      backgroundColor: "#fff",
      color: "#b91c1c",
      border: "1px solid #f87171",
      borderRadius: "12px",
      padding: "12px 16px",
      fontSize: "0.95rem",
      fontWeight: "500",
      textAlign: "center",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      width: "280px",
      marginTop: "20px",
    },
    closeButton: false,
  };

  useEffect(() => {
    // ✅ Simulate a short loading time (1s)
    const timer = setTimeout(() => setIsLoading(false), 1000);

    axios
      .get("/auth/session", { withCredentials: true })
      .then((res) => {
        const { role } = res.data;
        if (
          (role === "resident" && location.pathname !== "/resident") ||
          (role === "responder" && location.pathname !== "/responder") ||
          (role === "admin" && location.pathname !== "/admin")
        ) {
          navigate(`/${role}`);
        }
      })
      .catch(() => {
        if (!sessionStorage.getItem("popupShown")) {
          const modalTimer = setTimeout(() => {
            setShowModal(true);
            sessionStorage.setItem("popupShown", "true");
          }, 2000);
          return () => clearTimeout(modalTimer);
        }
      });

    return () => clearTimeout(timer);
  }, [navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const normalizedUsername = username.trim().toLowerCase();
      const res = await axios.post(
        "/auth/login",
        { username: normalizedUsername, password },
        { withCredentials: true }
      );
      const { role } = res.data;
      navigate(`/${role}`);
    } catch (err) {
      toast.error(
        err.response?.data?.message || "Invalid username or password",
        toastStyle
      );
    }
  };

  // ✅ Minimal Modern ZapAlert Loader
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-600 to-red-800">
        <div className="relative w-48 h-48 flex items-center justify-center mb-6">
          {/* Rotating ring */}
          <div className="absolute inset-0 rounded-full border-8 border-transparent border-t-yellow-400 animate-spin"></div>
          {/* Logo */}
          <img
            src="/icons/zapalert-logo.png"
            alt="ZapAlert Logo"
            className="w-32 h-32 drop-shadow-[0_0_20px_rgba(0,0,0,0.8)] animate-bounce"
          />
        </div>
        {/* Blinking Loading Text */}
        <p className="text-white text-2xl font-bold animate-blink">Loading...</p>

        {/* Loader Animations */}
        <style>
          {`
            @keyframes bounce {
              0%, 100% { transform: translateY(0); }
              50% { transform: translateY(-15px); }
            }
            .animate-bounce {
              animation: bounce 1s infinite;
            }

            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
            .animate-spin {
              animation: spin 2s linear infinite;
            }

            @keyframes blink {
              0%, 50%, 100% { opacity: 1; }
              25%, 75% { opacity: 0; }
            }
            .animate-blink {
              animation: blink 1s infinite;
            }
          `}
        </style>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center p-4 relative">
      <ToastContainer newestOnTop limit={3} />

      {/* Login Card */}
      <form
        onSubmit={handleLogin}
        className="relative bg-white/90 backdrop-blur-md rounded-xl shadow-lg w-full max-w-md p-8 space-y-5"
      >
        {/* Logo & Title */}
        <div className="flex flex-col items-center text-center mb-6 animate-fadeIn">
          <img
            src="/icons/zapalert-full-logo.png"
            alt="ZAPALERT Logo"
            className="h-24 w-auto mb-3"
          />
          <h1 className="text-4xl font-extrabold text-red-600 tracking-wide drop-shadow-sm">
            ZAPALERT
          </h1>
          <p className="text-gray-500 text-sm mt-1 max-w-xs">
            Emergency Monitoring & Reporting System
          </p>
        </div>

        {/* Guide */}
        <div className="mb-4">
          <h2 className="text-xl font-semibold text-red-800 text-left">Sign in</h2>
          <p className="text-sm text-gray-600 text-left">Login to your account</p>
        </div>

        {/* Inputs */}
        <input
          type="text"
          placeholder="Username"
          className="w-full px-3 py-2 font-semibold text-gray-900 bg-transparent border-2 border-red-400 rounded-md focus:ring-2 focus:ring-red-500 transition"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-3 py-2 font-semibold text-gray-900 bg-transparent border-2 border-red-400 rounded-md focus:ring-2 focus:ring-red-500 transition"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        {/* Login Button */}
        <button
          type="submit"
          className="w-full py-3 bg-gradient-to-r from-orange-400 to-red-600 text-white font-semibold rounded-md hover:scale-105 transition"
        >
          Login
        </button>

        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <a
            href="/signup"
            className="text-red-500 font-semibold hover:underline"
          >
            Sign up
          </a>
        </p>
      </form>

      {/* Info Popup with animation */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-4">
          <div
            className="bg-white rounded-xl max-w-md w-full p-6 text-gray-800 relative shadow-xl transform transition-all duration-500 ease-out scale-90 opacity-0 animate-popup"
            style={{ animation: "popupAnim 0.4s forwards" }}
          >
            <h3 className="text-xl font-bold mb-3 text-red-700 text-center">
              Welcome to ZapAlert!
            </h3>
            <p className="text-sm text-gray-600 text-center">
              ZapAlert is an emergency alert and monitoring system for <strong>Barangay Zapatera</strong>. 
              It allows residents to report incidents and ensures quick notifications for responders. 
              This is a CAPSTONE Project developed by students of 
              Asian College of Technology.
            </p>
            <button
              onClick={() => setShowModal(false)}
              className="w-full mt-4 py-2 bg-gradient-to-r from-red-600 to-orange-400 text-white font-semibold rounded-md hover:scale-105 transition"
            >
              Continue to Login
            </button>
          </div>
        </div>
      )}

      {/* Popup Animation Keyframes */}
      <style>
        {`
          @keyframes popupAnim {
            0% { transform: scale(0.9); opacity: 0; }
            60% { transform: scale(1.05); opacity: 1; }
            100% { transform: scale(1); opacity: 1; }
          }
        `}
      </style>
    </div>
  );
};

export default Login;
