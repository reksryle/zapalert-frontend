// pages/Signup.jsx
import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import Select from "react-select";
const API_BASE = import.meta.env.VITE_API_BASE_URL;

const Signup = () => {
  const navigate = useNavigate();

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


  const [idImage, setIdImage] = useState(null);
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setIdImage(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const ageNum = parseInt(form.age);
    if (!idImage) {
      toast.error("Please upload a valid ID image.");
      return;
    }
    if (!agree) {
      toast.error("You must agree to the confirmation before submitting.");
      return;
    }
    if (isNaN(ageNum) || ageNum < 7 || ageNum > 100) {
      toast.error("Age must be between 7 and 100.");
      return;
    }

    const formData = new FormData();
    Object.entries(form).forEach(([key, value]) => {
      formData.append(key, value);
    });
    formData.append("validId", idImage);

    try {
      await axios.post("https://zapalert-backend.onrender.com/api/auth/signup", formData);
      toast.success("Signup successful. Please wait for admin approval.");
      setTimeout(() => navigate("/"), 2000);
    } catch (err) {
      toast.error(err.response?.data?.message || "Signup failed.");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 to-red-800 flex items-center justify-center">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-10 rounded-2xl shadow-lg w-full max-w-lg space-y-4"
      >
        <h2 className="text-3xl font-bold text-center text-red-800">Create Account</h2>
        <p className="text-sm text-center text-gray-500">Fill out the form below</p>

        <div className="grid grid-cols-2 gap-3">
          <input
            type="text"
            name="firstName"
            placeholder="First Name"
            value={form.firstName}
            onChange={handleChange}
            className="px-4 py-2 border border-red-300 rounded-md"
            required
          />
          <input
            type="text"
            name="lastName"
            placeholder="Last Name"
            value={form.lastName}
            onChange={handleChange}
            className="px-4 py-2 border border-red-300 rounded-md"
            required
          />
        </div>

        <input
          type="number"
          name="age"
          placeholder="Age"
          value={form.age}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-red-300 rounded-md"
          min="7"
          max="100"
          required
        />

        <input
          type="text"
          name="username"
          placeholder="Username"
          value={form.username}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-red-300 rounded-md"
          required
        />

        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            name="password"
            placeholder="Password"
            value={form.password}
            onChange={handleChange}
            className="w-full px-4 py-2 border border-red-300 rounded-md pr-10"
            required
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute top-1/2 right-3 transform -translate-y-1/2 text-sm text-gray-600"
          >
            {showPassword ? "Hide" : "Show"}
          </button>
        </div>

        <input
          type="tel"
          name="contactNumber"
          placeholder="Contact Number (09XXXXXXXXX)"
          value={form.contactNumber}
          onChange={(e) => {
            const value = e.target.value;
            // Allow only digits and maximum 11 characters
            if (/^\d{0,11}$/.test(value)) {
              handleChange(e); // your existing handler
            }
          }}
          pattern="^09\d{9}$"
          maxLength={11}
          className="w-full px-4 py-2 border border-red-300 rounded-md"
          required
        />


        <input
          type="text"
          name="barangay"
          value="Zapatera"
          readOnly
          className="w-full px-4 py-2 border border-red-300 rounded-md bg-gray-100 text-gray-500"
        />
        
        <Select
          options={barrioOptions}
          value={barrioOptions.find(option => option.value === form.barrio)}
          onChange={(selected) => setForm({ ...form, barrio: selected.value })}
          placeholder="Select or type your Barrio"
          isSearchable
          className="border border-red-300 rounded-md"
          styles={{
            control: (base) => ({
              ...base,
              padding: "2px 4px",
              borderColor: "#fca5a5", // Tailwind's red-300
            }),
          }}
        />

        <select
          name="role"
          value={form.role}
          onChange={handleChange}
          className="w-full px-4 py-2 border border-red-300 rounded-md"
          required
        >
          <option value="resident">Resident</option>
          <option value="responder">Responder</option>
        </select>

        <div>
          <label htmlFor="validId" className="block text-sm text-gray-700 mb-1">
            Upload a clear photo of your Valid ID (Please capture it horizontally)
          </label>
          <input
            type="file"
            id="validId"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full px-4 py-2 border border-red-300 rounded-md"
            required
          />
        </div>

        <label className="flex items-start space-x-2 text-sm text-gray-600">
          <input
            type="checkbox"
            checked={agree}
            onChange={(e) => setAgree(e.target.checked)}
            className="mt-1"
            required
          />
          <span>
            I confirm that I am of legal age (18+) or a minor using this system with consent.
            I agree to use this app responsibly for emergency reporting purposes.
          </span>
        </label>

        <button
          type="submit"
          disabled={!agree}
          className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition disabled:opacity-50"
        >
          Sign Up
        </button>

        <p className="text-center text-sm text-gray-600">
          Already have an account?{" "}
          <a href="/" className="text-red-700 hover:underline">Login</a>
        </p>
      </form>
    </div>
  );
};

export default Signup;
