import React, { useEffect, useState } from "react";

// Temporary hardcoded data – we'll connect it to backend later
const dummyNotifications = [
  {
    id: 1,
    message: "🚨 New fire emergency reported in Zone 3!",
    time: "Just now",
  },
  {
    id: 2,
    message: "✅ Emergency in Zone 1 marked as resolved.",
    time: "10 minutes ago",
  },
];

const NotificationsPanel = () => {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    // Simulate fetching from backend
    setNotifications(dummyNotifications);
  }, []);

  return (
    <div className="bg-white rounded-xl shadow p-4 mt-6">
      <h2 className="text-xl font-bold text-red-800 mb-4">Notifications</h2>
      {notifications.length === 0 ? (
        <p className="text-gray-500">No notifications yet.</p>
      ) : (
        <ul className="space-y-3">
          {notifications.map((notif) => (
            <li
              key={notif.id}
              className="bg-red-50 border-l-4 border-red-500 p-3 rounded"
            >
              <p className="text-red-900">{notif.message}</p>
              <p className="text-xs text-gray-500">{notif.time}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default NotificationsPanel;
