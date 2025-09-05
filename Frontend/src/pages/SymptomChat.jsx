import { useState, useRef, useEffect } from "react";
import toast from "react-hot-toast";
import { Mic, Send } from "lucide-react";

const API = import.meta.env.VITE_API;

const SymptomChat = ({ messages, setMessages }) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const phone = localStorage.getItem("phone");
  const messagesEndRef = useRef(null);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (textOverride = null) => {
    const finalInput = textOverride !== null ? textOverride : input;
    if (!finalInput.trim()) return;
    if (finalInput === messages[messages.length - 1]?.text) return;

    const newMessages = [...messages, { sender: "user", text: finalInput }];
    setMessages(newMessages);
    setInput("");

    try {
      const res = await fetch(
          `${API}/chat-agent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: finalInput, phone }),
        }
      );

      const data = await res.json();
      const explanation = data.text || "No response from server.";
      const ans =
        typeof explanation === "object"
          ? JSON.stringify(explanation, null, 2)
          : String(explanation);

      const botMessage = { sender: "bot", text: ans };
      setMessages((prev) => [...prev, botMessage]);
    } catch (err) {
      console.error("API Error:", err);
      setMessages((prev) => [
        ...prev,
        { sender: "bot", text: "Failed to get response" },
      ]);
    }
  };

  const startVoiceInput = () => {
    const SpeechRecognition =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported. Please use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "en-US";
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    setIsListening(true);
    recognition.start();

    recognition.onresult = (e) => {
      const transcript = e.results[0][0].transcript;
      setInput(transcript);
      setIsListening(false);
      handleSend(transcript);
    };

    recognition.onerror = (e) => {
      console.error("Speech recognition error:", e);
      setIsListening(false);
    };
  };

  return (
<div className="flex flex-col h-full bg-[#0f172a] text-gray-200 font-sans">

      {/* Header */}
      <section className="py-8 text-center">
        <h1 className="text-2xl font-bold mb-2">
          Symptom <span className="text-[#f43f5e]">Assistant</span>
        </h1>
        <p className="text-gray-400">
          Chat with our AI to analyze your symptoms
        </p>
      </section>

      {/* Chat Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4 max-w-3xl mx-auto w-full">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-3 rounded-2xl shadow text-sm max-w-[80%] sm:max-w-md break-words ${
                msg.sender === "user"
                  ? "bg-[#f43f5e] text-white"
                  : "bg-[#1e293b] border border-gray-700 text-gray-200"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {/* Dummy div to scroll into view */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Box */}
      <div className="p-4 bg-[#1e293b] border-t border-gray-700 flex flex-col sm:flex-row gap-3 items-center sticky bottom-0 z-10">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSend();
          }}
          className="w-full flex-1 border border-gray-600 bg-[#0f172a] p-3 rounded-lg text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f43f5e]"
          placeholder="Type your symptoms..."
        />
        <div className="flex gap-2 w-full sm:w-auto justify-end">
          <button
            onClick={() => handleSend()}
            className="flex items-center gap-2 bg-[#f43f5e] hover:bg-[#be123c] text-white px-4 py-2 rounded-lg font-medium shadow transition w-full sm:w-auto"
          >
            <Send className="w-4 h-4" /> Send
          </button>
          <button
            onClick={startVoiceInput}
            title="Tap to speak"
            className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-white shadow transition ${
              isListening ? "bg-red-600" : "bg-gray-700 hover:bg-gray-600"
            }`}
          >
            <Mic className="w-4 h-4" />
            {isListening ? "Listening..." : "Speak"}
          </button>
        </div>
      </div>

    </div>
  );
};

export default SymptomChat;
