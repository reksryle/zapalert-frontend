// frontend/src/pages/Login.jsx
import React, { useState, useEffect } from "react";
import axios from "../api/axios";
import { useNavigate, useLocation } from "react-router-dom";

const Login = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    axios
      .get("/auth/session", { withCredentials: true })
      .then((res) => {
        const { role } = res.data;
        // Redirect only if not already in dashboard
        if (
          (role === "resident" && location.pathname !== "/resident") ||
          (role === "responder" && location.pathname !== "/responder") ||
          (role === "admin" && location.pathname !== "/admin")
        ) {
          navigate(`/${role}`);
        }
      })
      .catch(() => {
        // Not logged in – no action
      });
  }, [navigate, location]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      // Trim and lowercase username
      const normalizedUsername = username.trim().toLowerCase();

      const res = await axios.post(
        "/auth/login",
        { username: normalizedUsername, password },
        { withCredentials: true }
      );

      const { role } = res.data;
      navigate(`/${role}`);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed.");
    }
  };


  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
      <form
        onSubmit={handleLogin}
        className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-sm space-y-6"
      >
        <h2 className="text-3xl font-bold text-center text-red-800">ZAPALERT</h2>
        <p className="text-sm text-center text-gray-500">Login to your account</p>
        {error && <p className="text-red-600 text-sm text-center">{error}</p>}

        <input
          type="text"
          placeholder="Username"
          className="w-full px-4 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="w-full px-4 py-2 border border-red-300 rounded-md focus:outline-none focus:ring-2 focus:ring-red-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />

        <button
          type="submit"
          className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition"
        >
          Login
        </button>

        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <a href="/signup" className="text-red-700 hover:underline">
            Sign up
          </a>
        </p>
      </form>
    </div>
  );
};

export default Login;
