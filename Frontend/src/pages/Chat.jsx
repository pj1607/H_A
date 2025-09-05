import React, { useState } from "react";
import toast from "react-hot-toast";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Mic, Send, Calendar, Clock } from "lucide-react";
const API = import.meta.env.VITE_API;
const Chat = ({ messages, setMessages }) => {
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [lang, setLang] = useState("en");
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedTime, setSelectedTime] = useState(null);
  const [bookingState, setBookingState] = useState({});
  const [lastBotMessage, setLastBotMessage] = useState(null);

  const speak = (text) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang === "hi" ? "hi-IN" : "en-US";
    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (textOverride = null) => {
    const finalInput = textOverride !== null ? textOverride : input;
    if (!finalInput.trim()) return;

    setMessages((prev) => [...prev, { sender: "user", text: finalInput }]);
    setInput("");

    if (!selectedDate || !selectedTime) {
      toast.warn("Please select both date and time.");
      return;
    }

    try {
      const dateStr = selectedDate.toLocaleDateString("en-CA");
      const hours = selectedTime.getHours().toString().padStart(2, "0");
      const minutes = selectedTime.getMinutes().toString().padStart(2, "0");
      const timeStr = `${hours}:${minutes}`;

      const res = await fetch(
        `${API}/book-appoint`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...bookingState,
            user_input: finalInput,
            date: dateStr,
            time: timeStr,
          }),
        }
      );

      const data = await res.json();
      const explanation = data.text || "No response from server.";
      const ans =
        typeof explanation === "object"
          ? JSON.stringify(explanation, null, 2)
          : String(explanation);

      setBookingState(data.state || {});
      const botMessage = { sender: "bot", text: ans };
      setMessages((prev) => [...prev, botMessage]);
      setLastBotMessage(botMessage);
    } catch (err) {
      console.error("❌ API Error:", err);
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
      alert("Speech recognition not supported. Use Chrome.");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = lang === "hi" ? "hi-IN" : "en-US";
    recognition.interimResults = false;

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
    <div className="h-screen flex flex-col bg-gradient-to-br from-white to-sky-50">
      {/* Top bar */}
      <div className="p-4 bg-[#1e293b] text-white shadow-md flex flex-wrap justify-between items-center">
        <h1 className="text-lg font-semibold"> Book Appointment</h1>
        <select
          value={lang}
          onChange={(e) => setLang(e.target.value)}
          className="border border-gray-500 bg-[#0f172a] p-2 rounded text-sm"
        >
          <option value="en">English</option>
          <option value="hi">Hindi</option>
        </select>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-4">
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`flex ${
              msg.sender === "user" ? "justify-end" : "justify-start"
            }`}
          >
            <div
              className={`px-4 py-3 rounded-2xl shadow max-w-sm text-sm ${
                msg.sender === "user"
                  ? "bg-green-100 text-gray-800"
                  : "bg-white border border-blue-100 text-gray-700"
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
      </div>

      {/* Date & Time Selection */}
      <div className="px-4 py-3 bg-blue-50 border-t flex flex-col sm:flex-row gap-2">
        <div className="flex items-center gap-2 w-full sm:w-1/2">
          <Calendar className="w-5 h-5 text-gray-500" />
          <DatePicker
            selected={selectedDate}
            onChange={(date) => setSelectedDate(date)}
            dateFormat="dd/MM/yyyy"
            minDate={new Date()}
            className="border p-2 rounded w-full"
            placeholderText="📅 Select Date"
          />
        </div>
        <div className="flex items-center gap-2 w-full sm:w-1/2">
          <Clock className="w-5 h-5 text-gray-500" />
          <DatePicker
            selected={selectedTime}
            onChange={(time) => setSelectedTime(time)}
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={30}
            timeCaption="Time"
            dateFormat="h:mm aa"
            className="border p-2 rounded w-full"
            placeholderText="⏰ Select Time"
          />
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-4 bg-white flex gap-3 items-center border-t shadow-md">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          className="flex-1 border border-gray-300 p-3 rounded focus:outline-none"
          placeholder="Type your question..."
        />
        <button
          onClick={handleSend}
          className="bg-blue-500 hover:bg-blue-600 text-white p-3 rounded-full shadow-md"
        >
          <Send className="w-5 h-5" />
        </button>
        <button
          onClick={startVoiceInput}
          title="Tap to speak"
          className={`p-3 rounded-full text-white shadow-md ${
            isListening ? "bg-red-500" : "bg-gray-700"
          }`}
        >
          <Mic className="w-5 h-5" />
        </button>
      </div>

    </div>
  );
};

export default Chat;