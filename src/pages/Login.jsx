// pages/Login.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaEye, FaEyeSlash } from "react-icons/fa"; 

const Login = () => {
  const navigate = useNavigate();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post("https://zapalert-backend.onrender.com/api/auth/login", {
        username,
        password,
      });

      const user = res.data.user;

      localStorage.setItem("zapalert_user", JSON.stringify(user));

      const { role } = user;
      if (role === "resident") navigate("/resident");
      else if (role === "responder") navigate("/responder");
      else if (role === "admin") navigate("/admin");
      else setError("Unknown role");
    } catch (err) {
      setError(err.response?.data?.message || "Login failed");
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

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            className="w-full px-4 py-2 border border-red-300 rounded-md pr-10 focus:outline-none focus:ring-2 focus:ring-red-500"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <span
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 cursor-pointer"
          >
            {showPassword ? <FaEyeSlash /> : <FaEye />}
          </span>
        </div>

        <button
          type="submit"
          className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition"
        >
          Login
        </button>

        <p className="text-center text-sm text-gray-600">
          Don’t have an account?{" "}
          <a href="/signup" className="text-red-700 hover:underline">Sign up</a>
        </p>
      </form>
    </div>
  );
};

export default Login;
