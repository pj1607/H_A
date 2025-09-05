import { useState, useEffect } from "react";
const API = import.meta.env.VITE_API;
const Sidebar = ({ startNewChat }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleNewChatClick = () => {
    setLoading(true);
    startNewChat();
    setTimeout(() => setLoading(false), 1000);
  };

  useEffect(() => {
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

    fetchHistory();
  }, []);

  return (
    <div className="h-full overflow-y-auto p-4 bg-gradient-to-b from-gray-900 to-gray-800 border-r border-gray-700 rounded-xl shadow-xl">
      <button
        onClick={handleNewChatClick}
        className={`mb-4 px-4 py-3 rounded-full text-white flex items-center justify-center gap-2 transition-all duration-200 ${
          loading
            ? "bg-red-400 cursor-not-allowed"
            : "bg-red-500 hover:bg-red-600 hover:scale-105 shadow-xl"
        }`}
        disabled={loading}
      >
        {loading ? "Resetting..." : "New Chat"}
      </button>

      <h2 className="text-lg font-semibold mb-3 text-gray-200">Chat History</h2>
      {history.length === 0 ? (
        <p className="text-gray-400">No previous chats found.</p>
      ) : (
        <ul className="space-y-3 overflow-y-auto">
          {history.map((item, idx) => (
            <li
              key={idx}
              className="bg-gradient-to-r from-gray-800 to-gray-900 p-3 rounded-xl shadow-xl hover:from-gray-700 hover:to-gray-800 cursor-pointer transition-colors"
            >
              <div className="font-medium text-sm text-gray-200 break-words">
                Q: {item.question}
              </div>
              <div className="text-xs text-gray-400 break-words mt-1">
                A: {item.answer}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {new Date(item.created_at).toLocaleString()}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default Sidebar;