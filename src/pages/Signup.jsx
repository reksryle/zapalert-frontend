// frontend/src/pages/Signup.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast, ToastContainer, Slide } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import Select from "react-select";

const Signup = () => {
  const navigate = useNavigate();

  // ✅ Loading screen state
  const [isLoading, setIsLoading] = useState(true);

  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    age: "",
    username: "",
    password: "",
    contactNumber: "",
    barrio: "",
    barangay: "Zapatera",
    role: "resident",
  });

  const [idImage, setIdImage] = useState(null);
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const barrioOptions = [
    { value: "Bayabas", label: "Bayabas" },
    { value: "Caimito", label: "Caimito" },
    { value: "Creekside", label: "Creekside" },
    { value: "Green Mosque", label: "Green Mosque" },
    { value: "Lemonsito", label: "Lemonsito" },
    { value: "Lower Mangga", label: "Lower Mangga" },
    { value: "Sab-ah", label: "Sab-ah" },
    { value: "Upper Mangga", label: "Upper Mangga" },
  ];

  useEffect(() => {
    // Simulate a short loading time (1s)
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });
  const handleFileChange = (e) => setIdImage(e.target.files[0]);

  // ✅ Toast style
  const toastStyle = {
    toastId: "signupToast",
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
      width: "240px",
      marginTop: "20px",
    },
    closeButton: false,
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isSubmitting) return;

    const ageNum = parseInt(form.age);
    if (!idImage) {
      toast.error("Please upload a valid ID image.", toastStyle);
      return;
    }
    if (!agree) {
      toast.error("You must agree before submitting.", toastStyle);
      return;
    }
    if (isNaN(ageNum) || ageNum < 7 || ageNum > 100) {
      toast.error("Age must be between 7 and 100.", toastStyle);
      return;
    }
    if (/^\d+$/.test(form.username)) {
      toast.error("Username must include at least one letter, not all numbers.", toastStyle);
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => formData.append(key, value));
    formData.append("validId", idImage);

    try {
      setIsSubmitting(true);
      await axios.post(`${import.meta.env.VITE_API_URL}/auth/signup`, formData, {
        withCredentials: true,
      });
      toast.success("Signup successful. Please wait for admin approval.", toastStyle);
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed.", toastStyle);
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormIncomplete =
    !form.firstName.trim() ||
    !form.lastName.trim() ||
    !form.age ||
    !form.username.trim() ||
    /^\d+$/.test(form.username) ||
    !form.password.trim() ||
    !form.contactNumber.trim() ||
    !form.barrio ||
    !idImage ||
    !agree;

  // ✅ Centered Minimal Modern ZapAlert Loader with Loading Text
  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-red-600 to-red-800">

        {/* Logo inside rotating ring */}
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

        {/* Animations */}
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

      <form
        onSubmit={handleSubmit}
        className="relative bg-white/90 backdrop-blur-md rounded-xl shadow-lg w-full max-w-md p-6 space-y-4"
      >
        <img
          src="/icons/zapalert-icon-512.png"
          alt="ZapAlert Logo"
          className="absolute inset-0 w-full h-full object-contain opacity-10 pointer-events-none"
        />

        <div className="relative z-10 space-y-4">
          <div className="text-center mb-2">
            <h2 className="text-2xl font-bold text-red-700">Create Account</h2>
            <p className="text-gray-600 text-sm">Fill in your details</p>
          </div>

          {/* First / Last Name */}
          <div className="grid grid-cols-2 gap-4">
            <input
              type="text"
              name="firstName"
              placeholder="First Name"
              value={form.firstName}
              onChange={handleChange}
              className="w-full px-3 py-2 font-semibold text-gray-900 bg-transparent border-2 border-red-400 rounded-md focus:ring-2 focus:ring-red-500"
              required
            />
            <input
              type="text"
              name="lastName"
              placeholder="Last Name"
              value={form.lastName}
              onChange={handleChange}
              className="w-full px-3 py-2 font-semibold text-gray-900 bg-transparent border-2 border-red-400 rounded-md focus:ring-2 focus:ring-red-500"
              required
            />
          </div>

          {/* Age */}
          <input
            type="number"
            name="age"
            placeholder="Age"
            value={form.age}
            onChange={handleChange}
            min="7"
            max="100"
            className="w-full px-3 py-2 font-semibold text-gray-900 bg-transparent border-2 border-red-400 rounded-md focus:ring-2 focus:ring-red-500"
            required
          />

          {/* Username */}
          <div>
            <input
              type="text"
              name="username"
              placeholder="Username"
              value={form.username}
              onChange={handleChange}
              className="w-full px-3 py-2 font-semibold text-gray-900 bg-transparent border-2 border-red-400 rounded-md focus:ring-2 focus:ring-red-500"
              required
            />
            <p className="text-xs text-gray-500 mt-1 text-center">
              * Username must include letters (not all numbers)
            </p>
          </div>

          {/* Password */}
          <div className="relative">
            <input
              type={showPassword ? "text" : "password"}
              name="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-3 py-2 font-semibold text-gray-900 bg-transparent border-2 border-red-400 rounded-md focus:ring-2 focus:ring-red-500 pr-12"
              required
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-gray-600 hover:text-red-600"
            >
              {showPassword ? "Hide" : "Show"}
            </button>
          </div>

          {/* Contact */}
          <input
            type="tel"
            name="contactNumber"
            placeholder="Contact Number (09XXXXXXXXX)"
            value={form.contactNumber}
            onChange={(e) => {
              const value = e.target.value;
              if (/^\d{0,11}$/.test(value)) handleChange(e);
            }}
            pattern="^09\d{9}$"
            maxLength={11}
            className="w-full px-3 py-2 font-semibold text-gray-900 bg-transparent border-2 border-red-400 rounded-md focus:ring-2 focus:ring-red-500"
            required
          />

          {/* Barrio + Barangay */}
          <div className="grid grid-cols-3 gap-4">
            <input
              type="text"
              name="barangay"
              value="Zapatera"
              readOnly
              className="col-span-1 px-3 py-2 font-semibold text-gray-700 border-2 border-red-400 rounded-md bg-gray-100"
            />
            <div className="col-span-2">
              <Select
                options={barrioOptions}
                value={barrioOptions.find((o) => o.value === form.barrio)}
                onChange={(s) => setForm({ ...form, barrio: s.value })}
                placeholder="Select your Barrio"
                isSearchable
                styles={{
                  control: (base) => ({
                    ...base,
                    borderColor: "#f87171",
                    borderWidth: "2px",
                    borderRadius: "0.375rem",
                    padding: "2px 4px",
                    boxShadow: "none",
                    backgroundColor: "transparent",
                  }),
                }}
              />
            </div>
          </div>

          {/* Role */}
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full px-3 py-2 font-semibold text-gray-900 bg-transparent border-2 border-red-400 rounded-md focus:ring-2 focus:ring-red-500"
          >
            <option value="resident">Resident</option>
            <option value="responder">Responder</option>
          </select>

          {/* Upload ID */}
          <div>
            <label
              htmlFor="validId"
              className="block text-sm font-semibold text-gray-700 mb-1"
            >
              Upload valid ID to verify your residency:
            </label>
            <div className="flex items-center justify-between border-2 border-dashed border-red-400 rounded-md px-3 py-2 bg-gray-50">
              <input
                type="file"
                id="validId"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                required
              />
              <span className="text-sm text-gray-600">
                {idImage ? idImage.name : "No file chosen"}
              </span>
              <label
                htmlFor="validId"
                className="px-3 py-1 bg-gradient-to-r from-orange-400 to-red-600 text-white rounded-md cursor-pointer hover:scale-105 transition text-sm"
              >
                Browse
              </label>
            </div>
          </div>

          {/* Agreement */}
          <label className="flex items-start space-x-2 text-sm text-gray-700">
            <input
              type="checkbox"
              checked={agree}
              onChange={(e) => setAgree(e.target.checked)}
              className="mt-1"
              required
            />
            <span>
              I confirm that I am of legal age (18+) or a minor with consent.  
              I agree to use this app responsibly for emergencies only.
            </span>
          </label>

          {/* Submit */}
          <button
            type="submit"
            disabled={isFormIncomplete || isSubmitting}
            className={`w-full py-3 bg-gradient-to-r from-orange-400 to-red-600 text-white font-semibold rounded-md transition ${
              isFormIncomplete || isSubmitting
                ? "opacity-50 cursor-not-allowed"
                : "hover:scale-105"
            }`}
          >
            {isSubmitting ? "Submitting..." : "Sign Up"}
          </button>

          <p className="text-center text-sm text-gray-600">
            Already have an account?{" "}
            <a href="/" className="text-red-700 font-semibold hover:underline">
              Login
            </a>
          </p>
        </div>
      </form>
    </div>
  );
};

export default Signup;
