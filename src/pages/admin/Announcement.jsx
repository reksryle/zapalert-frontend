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

      toast.success("Announcement sent to all users.");
      setMessage("");
    } catch (err) {
      console.error(err);
      toast.error("Failed to send announcement");
    }
  };

  return (
    <div className="p-4 max-w-xl mx-auto">
      <h2 className="text-xl font-bold mb-4">Public Announcement</h2>

      <textarea
        className="w-full p-2 border rounded"
        rows={4}
        placeholder="Type your announcement here..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button
        className="mt-3 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        onClick={handlePost}
      >
        Post Announcement
      </button>
    </div>
  );
};

export default Announcement;
