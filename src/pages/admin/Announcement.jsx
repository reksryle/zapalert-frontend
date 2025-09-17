import React, { useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";

const BASE_URL = import.meta.env.VITE_API_URL;

const Announcement = () => {
  const [message, setMessage] = useState("");

  const handlePost = async () => {
    if (!message.trim()) return toast.error("Announcement is empty");

    try {
      await axios.post(`${BASE_URL}/announcement`, { message }, { withCredentials: true });
      toast.success("Announcement sent to all users!");
      setMessage("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send announcement");
    }
  };

  return (
    <div className="bg-gradient-to-br from-white via-red-50 to-orange-50 rounded-2xl shadow-lg p-6 max-w-xl mx-auto border border-red-200">
      <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Public Announcement</h2>

      <textarea
        className="w-full p-4 border-2 border-red-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-400 bg-white/80 backdrop-blur-sm resize-none text-sm"
        rows={5}
        placeholder="Type your announcement here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        className="w-full mt-4 bg-gradient-to-r from-red-500 to-orange-500 text-white py-3 px-6 rounded-xl font-semibold hover:from-red-600 hover:to-orange-600 transition-all duration-300 shadow-lg hover:shadow-xl"
        onClick={handlePost}
      >
        Post Announcement
      </button>
    </div>
  );
};

export default Announcement;