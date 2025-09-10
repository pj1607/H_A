import { useState } from "react";
import SymptomChat from "./SymptomChat";
import Sidebar from "./Sidebar";
import { MessageCircle, X } from "lucide-react";

const Floating = ({ messages, setMessages }) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        className="cursor-pointer fixed bottom-4 right-4 bg-[#f43f5e] text-white p-3 rounded-full shadow-lg 
                   z-50 hover:bg-[#be123c] transition transform hover:scale-110 active:scale-95"
        onClick={() => setOpen(!open)}
        title="Chat with AI Assistant"
      >
        {open ? <X size={24} /> : <MessageCircle size={24} />}
      </button>

      {open && (
        <div className="fixed bottom-20 right-4 w-[95%] sm:w-[90%] md:w-[800px] h-[85vh] max-h-[90vh] 
                        bg-gradient-to-br from-[#0f172a] via-[#1e293b] to-[#0f172a] 
                        rounded-2xl shadow-2xl flex flex-col sm:flex-row overflow-hidden z-50 border border-gray-700">

          {/* Sidebar (hidden on mobile) */}
          <div className="hidden sm:block sm:w-1/3 h-full overflow-y-auto border-r border-gray-700 
                          bg-gradient-to-b from-[#1e293b] to-[#0f172a]">
            <Sidebar
              startNewChat={() => setMessages([])}
              onSelectHistory={(restoredMsgs) => setMessages(restoredMsgs)} // 👈 added
            />
          </div>

          {/* Chat */}
          <div className="w-full sm:w-2/3 h-full flex flex-col bg-[#0f172a]">
            <SymptomChat messages={messages} setMessages={setMessages} />
          </div>
        </div>
      )}
    </>
  );
};

export default Floating;
