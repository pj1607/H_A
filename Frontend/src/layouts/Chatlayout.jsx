import Floating from "../pages/Floating";
import Sidebar from "../pages/Sidebar";
import { useState } from  "react";

const ChatLayout = () => {

    const [messages, setMessages] = useState([
    { sender: "bot", text: "👩‍⚕️ Hello! I'm MediConnect. How can I help you today?" },
  ]);
      const startNewChat = () => {
    setMessages([ { sender: "bot", text: "👩‍⚕️ Hello! I'm MediConnect. How can I help you today?" },]);
  };
  return (
    <div className="flex h-screen">
      <Sidebar startNewChat={startNewChat} />
      <Floating messages={messages} setMessages={setMessages} />
      
    </div>
  );
};

export default ChatLayout;
