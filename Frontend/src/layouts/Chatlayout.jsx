import Floating from "../pages/Floating";
import Sidebar from "../pages/Sidebar";
import { useState } from  "react";

const ChatLayout = () => {

    const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! I'm MediConnect, view and manage your symptom history." },
  ]);
      const startNewChat = () => {
    setMessages([ { sender: "bot", text: " Hello! I'm MediConnect, view and manage your symptom history." },]);
  };
  return (
    <div className="flex h-screen">
      <Sidebar startNewChat={startNewChat} />
      <Floating messages={messages} setMessages={setMessages} />
      
    </div>
  );
};

export default ChatLayout;
