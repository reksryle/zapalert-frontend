import { useEffect, useState, useRef } from "react";
import axios from "axios";
import { toast, Slide } from "react-toastify";

const BASE_URL = import.meta.env.VITE_API_URL;

export default function useNetworkStatus() {
  const [status, setStatus] = useState("checking");
  const lastStatus = useRef("checking");
  const hasBeenOffline = useRef(false); // ✅ track if we've ever been offline
  const toastId = "network-status";

  const toastStyle = (type) => ({
    toastId,
    position: "top-center",
    autoClose: type === "success" ? 2500 : false,
    hideProgressBar: true,
    closeOnClick: true,
    pauseOnHover: true,
    draggable: true,
    transition: Slide,
    style: {
      backgroundColor: "#fff",
      color: type === "success" ? "#16a34a" : "#b91c1c",
      border: `1px solid ${type === "success" ? "#16a34a" : "#f87171"}`,
      borderRadius: "12px",
      padding: "12px 16px",
      fontSize: "0.95rem",
      fontWeight: "500",
      textAlign: "center",
      boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
      width: "320px",
      marginTop: "20px",
    },
    closeButton: false,
  });

  useEffect(() => {
    const showToast = (message, type) => {
      if (!toast.isActive(toastId)) {
        toast[type](message, toastStyle(type));
      } else {
        toast.update(toastId, { render: message, type, ...toastStyle(type) });
      }
    };

    const checkConnection = async () => {
      if (!navigator.onLine) {
        if (lastStatus.current !== "offline") {
          setStatus("offline");
          lastStatus.current = "offline";
          hasBeenOffline.current = true; // ✅ mark that we've gone offline
          showToast("No connection", "error");
        }
        return;
      }

      try {
        await axios.get(`${BASE_URL}/health`, { timeout: 5000 });

        if (lastStatus.current !== "online") {
          setStatus("online");
          lastStatus.current = "online";

          // ✅ only show "Connected" toast if we've ever been offline
          if (hasBeenOffline.current) {
            showToast("Connected to network", "success");
            hasBeenOffline.current = false; // reset
          }
        }
      } catch {
        if (lastStatus.current !== "offline") {
          setStatus("offline");
          lastStatus.current = "offline";
          hasBeenOffline.current = true;
          showToast("No internet access", "error");
        }
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);

    window.addEventListener("online", checkConnection);
    window.addEventListener("offline", checkConnection);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", checkConnection);
      window.removeEventListener("offline", checkConnection);
    };
  }, []);

  return status; // "offline" | "online"
}
