import toast from "react-hot-toast";

const showAnnouncementToast = (message) => {
  const audio = new Audio("/sounds/announcement.mp3");
  audio.play();

  toast.custom(
    (t) => (
      <div
        className={`bg-white text-black p-6 rounded-xl shadow-lg border-2 border-red-500 w-full max-w-md mx-auto text-center transition-all ${
          t.visible ? "opacity-100" : "opacity-0"
        }`}
        style={{ wordWrap: "break-word", whiteSpace: "pre-wrap" }}
      >
        <strong className="text-xl block mb-2">ANNOUNCEMENT</strong>
        <p className="text-md text-gray-800 break-words whitespace-pre-wrap">{message}</p>

        <button
          onClick={() => toast.dismiss(t.id)}
          className="mt-4 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Close
        </button>
      </div>
    ),
    {
      duration: Infinity,
      position: "top-center",
    }
  );
};

export default showAnnouncementToast;
