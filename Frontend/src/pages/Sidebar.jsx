import { useState, useEffect } from "react";
import { Trash2, Loader2, X } from "lucide-react"; // Loader & close icon
const API = import.meta.env.VITE_API;

const Sidebar = ({ startNewChat, onSelectHistory }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(null); // store chatId to delete

  const handleNewChatClick = () => {
    setLoading(true);
    startNewChat();
    setTimeout(() => setLoading(false), 1000);
  };

  // fetch history
  const fetchHistory = async () => {
    const phone = localStorage.getItem("phone");
    if (!phone) return;

    try {
      const res = await fetch(`${API}/history?phone=${phone}`);
      const data = await res.json();
      setHistory(data.history || []);
    } catch (err) {
      console.error("Error fetching history", err);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  // delete single chat
  const handleDelete = async (chatId) => {
    setDeleteLoading(true);
    try {
      const res = await fetch(`${API}/history/${chatId}`, {
        method: "DELETE",
      });
      const result = await res.json();
      if (result.success) {
        setHistory((prev) => prev.filter((chat) => chat.id !== chatId));
        setConfirmDelete(null);
      } else {
        console.error("Failed to delete chat:", result.message);
      }
    } catch (err) {
      console.error("Error deleting chat", err);
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-4 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 rounded-xl shadow-xl relative">
      {/* New Chat Button */}
      <button
        onClick={handleNewChatClick}
        className={`cursor-pointer mb-4 px-4 py-3 rounded-full text-white flex items-center justify-center gap-2 transition-all duration-200 ${
          loading
            ? "bg-red-400 cursor-not-allowed"
            : "bg-red-500 hover:bg-red-600 hover:scale-105 shadow-xl"
        }`}
        disabled={loading}
      >
        {loading ? "Resetting..." : "New Chat"}
      </button>

      {/* Chat History */}
      <h2 className="text-lg font-semibold mb-3 text-gray-200">Chat History</h2>
      {history.length === 0 ? (
        <p className="text-gray-400">No previous chats found.</p>
      ) : (
        <ul className="space-y-3 overflow-y-auto">
          {history.map((item, idx) => {
            const firstMsg = item.messages?.[0];
            const preview = item.messages
              ?.slice(0, 3)
              .map((m) => `${m.sender === "user" ? "Q" : "A"}: ${m.text}`)
              .join(" • ");

            return (
              <li
                key={idx}
                className="relative bg-gradient-to-r from-gray-800 to-gray-900 p-3 rounded-xl shadow-xl hover:from-gray-700 hover:to-gray-800 transition-colors"
              >
                {/* Delete Button */}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setConfirmDelete(item.id);
                  }}
                  className="cursor-pointer absolute top-2 right-2 text-gray-400 hover:text-red-500 transition"
                  title="Delete chat"
                >
                  <Trash2 size={16} />
                </button>

                {/* Select chat */}
                <div
                  onClick={() =>
                    onSelectHistory && onSelectHistory(item.messages || [])
                  }
                  className="cursor-pointer"
                >
                  <div className="font-medium text-sm text-gray-200 break-words">
                    {firstMsg?.sender === "user"
                      ? `Q: ${firstMsg.text}`
                      : "Chat"}
                  </div>

                  <div className="text-xs text-gray-400 break-words mt-1 truncate">
                    {preview}
                  </div>

                  <div className="text-xs text-gray-500 mt-1">
                    {new Date(item.created_at).toLocaleString()}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {/* Confirmation Modal */}
      {confirmDelete && (
        <div className=" bg-black/50  fixed inset-0 flex items-center justify-center  z-50">
          <div className="bg-gray-800 p-6 rounded-xl w-[90%] sm:w-[400px] relative">
            <button
              onClick={() => setConfirmDelete(null)}
              className="cursor-pointer absolute top-3 right-3 text-gray-400 hover:text-gray-200"
            >
              <X size={20} />
            </button>
            <h3 className="text-lg font-semibold text-gray-200 mb-4">
              Confirm Delete
            </h3>
            <p className="text-gray-400 mb-6">
              Are you sure you want to delete this chat? This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setConfirmDelete(null)}
                className="cursor-pointer px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(confirmDelete)}
                className="cursor-pointer px-4 py-2 rounded-lg bg-red-500 hover:bg-red-600 text-white flex items-center gap-2"
                disabled={deleteLoading}
              >
                {deleteLoading && <Loader2 className="animate-spin w-4 h-4" />}
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sidebar;
