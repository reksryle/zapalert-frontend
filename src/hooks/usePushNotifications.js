import { useEffect } from "react";
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function usePushNotifications(user) {
  useEffect(() => {
    if (!user?.username) return; // 👈 ensures username exists
    if (!("serviceWorker" in navigator && "PushManager" in window)) return;

    (async () => {
      try {
        // Register SW
        const registration = await navigator.serviceWorker.register("/sw.js");

        const permission = await Notification.requestPermission();
        if (permission !== "granted") return;

        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(import.meta.env.VITE_VAPID_PUBLIC_KEY),
        });

        // Send subscription + username
        await axios.post(
          `${BASE_URL}/push/subscribe`,
          { username: user.username, subscription },
          { withCredentials: true }
        );

        console.log("Push subscription saved ✅");
      } catch (err) {
        console.error("❌ Push subscription failed:", err);
      }
    })();
  }, [user?.username]); // 👈 runs only when username is defined
}

// Helper: convert VAPID key
function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}
