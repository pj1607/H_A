import React, { useState, useEffect } from "react";
import toast from "react-hot-toast";
const API = import.meta.env.VITE_API;
const SymptomChecker = () => {
  const [query, setQuery] = useState("");
  const [answer, setAnswer] = useState("");
  const [specialist, setSpecialist] = useState("");
  const [doctors, setDoctors] = useState([]);
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({ name: "", phone: "", age: "", location: "" });
  const [loading, setLoading] = useState(false);
  const [diagnosis, setDiagnosis] = useState([]);
  const [followUp, setFollowUp] = useState("");
  const [conversation, setConversation] = useState([]);
  const [followUpReply, setFollowUpReply] = useState("");
  const [followUpCount, setFollowUpCount] = useState(0);
  const [finalSuggestion, setFinalSuggestion] = useState(null);
  const [showDoctors, setShowDoctors] = useState(false);
  const [emergencyAsked, setEmergencyAsked] = useState(false);
  const userPhone = localStorage.getItem("phone");

  useEffect(() => {
    const lastUserMsg = conversation.slice().reverse().find((msg) => msg.role === "user");
    if (lastUserMsg && /yes|doctor|suggest/i.test(lastUserMsg.message)) {
      setShowDoctors(true);
    }
  }, [conversation]);

  const handleFollowUpReply = async () => {
    const currentUserId = localStorage.getItem("user_id") || "guest";

    const updatedHistory = [...conversation, { role: "user", message: followUpReply }];

    setConversation(updatedHistory);
    console.log("Sending follow-up count:", followUpCount);

    try {
      const res = await fetch(`${API}/follow-up`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversation: updatedHistory,
          count: followUpCount,
          user_id: currentUserId,
          emergency_asked: emergencyAsked,
        }),
      });

      const data = await res.json();
      console.log("Backend response:", data);
      console.log("Follow-up count:", followUpCount);

      if (data.emergency_asked !== undefined) {
        setEmergencyAsked(data.emergency_asked);
      }
      if (data.doctors) {
        setDoctors(data.doctors);
      }

      const newConversation = [...updatedHistory];

      const lastMessages = conversation.slice(-4).map((msg) => msg.message.toLowerCase());

      if (data.answer && !lastMessages.includes(data.answer.toLowerCase())) {
        newConversation.push({ role: "assistant", message: data.answer });
      }

      if (data.specialist) {
        setSpecialist(data.specialist);
        getDoctors(data.specialist);
      }

      if (data.follow_up_question?.trim()) {
        newConversation.push({ role: "assistant", message: data.follow_up_question });
      }

      setConversation(newConversation);
      setFollowUp("");

      if (data.final && /doctor|remedy|specialist/i.test(followUpReply)) {
        console.log(" Is result.final true?", data.final);
        setFinalSuggestion(data);
        const userInputMsgs = updatedHistory.filter((msg) => msg.role === "user");
        const symptoms = userInputMsgs.at(-1)?.message || "N/A";

        const reportPayload = {
          user_id: localStorage.getItem("user_id") || "guest",
          date: new Date().toISOString(),
          symptoms: symptoms,
          ai_suggestion: data.answer,
          suggested_tests: data.tests || [],
          urgency: "Low",
          full_conversation: newConversation,
          phone: userPhone,
        };

        try {
          const reportRes = await fetch(`${API}/save-report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reportPayload),
          });

          const reportData = await reportRes.json();
          console.log("Report saved:", reportData);
        } catch (err) {
          console.error("Failed to save report:", err);
        }
      } else {
        setFollowUp(data.follow_up_question || "");
        setFollowUpCount((prev) => prev + 1);
      }

      setFollowUpReply("");
    } catch (err) {
      console.error("Follow-up failed:", err);
      toast.error("Follow-up failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!query.trim()) {
      toast.warn("Please describe your symptoms.");
      return;
    }
    setLoading(true);

    const data = new FormData();
    data.append("query", query);

    try {
      const res = await fetch(`${API}/symptom-check`, {
        method: "POST",
        body: data,
      });

      const result = await res.json();

      const updated = [
        { role: "user", message: query },
        { role: "assistant", message: result.answer || "Sorry, I couldn't understand that." },
      ];

      const newConversation = [...updated];

      if (result.follow_up_question) {
        newConversation.push({ role: "assistant", message: result.follow_up_question });
      }

      setConversation(newConversation);
      setAnswer(result.answer);
      setSpecialist(result.specialist);
      setFollowUp(result.follow_up_question);
      setFollowUpCount(0);

      console.log("Is result.final true?", result.final);
      if (result.final) {
        setFinalSuggestion(result);

        const fullConversation = [{ role: "user", message: query }, { role: "assistant", message: result.answer }];
        if (result.follow_up_question) {
          fullConversation.push({ role: "assistant", message: result.follow_up_question });
        }

        const reportPayload = {
          user_id: localStorage.getItem("user_id") || "guest",
          date: new Date().toISOString(),
          symptoms: query,
          ai_suggestion: result.answer,
          suggested_tests: result.tests || [],
          urgency: "Low",
          full_conversation: fullConversation,
          phone: userPhone,
        };

        try {
          const reportRes = await fetch(`${API}/save-report`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(reportPayload),
          });

          const reportData = await reportRes.json();
          console.log("Report saved:", reportData);
        } catch (err) {
          console.error("Failed to save report:", err);
        }
      }

      if (result.specialist) {
        getDoctors(result.specialist);
      }

      toast.success("Symptoms checked!");
      setLoading(false);
    } catch (err) {
      console.error("Error:", err);
      toast.error("Failed to check symptoms.");
      setLoading(false);
    }
  };

  const getDoctors = async (specialization) => {
    try {
      const res = await fetch(`${API}/find-doctors`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ specialization }),
      });
      const data = await res.json();
      console.log("Doctors found:", data.doctors);
      setDoctors(data.doctors);
    } catch (err) {
      console.error("Error fetching doctors:", err);
    }
  };

  const openModal = (slotInfo) => {
    setSelectedSlot(slotInfo);
    setShowModal(true);
  };

  const bookAppointment = async () => {
    if (!formData.name || !formData.phone || !selectedSlot) {
      toast.warn("Please fill in all the required fields.");
      return;
    }

    const payload = {
      user_name: formData.name,
      phone: formData.phone,
      age: formData.age,
      location: formData.location,
      doctor_name: selectedSlot.doctor_name,
      contact: selectedSlot.contact,
      specialization: selectedSlot.specialization,
      date: selectedSlot.date,
      time: selectedSlot.time,
    };

    try {
      const res = await fetch(`${API}/book-appointment`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      toast.success(data.message);
      setShowModal(false);
      setFormData({ name: "", phone: "", age: "", location: "" });
    } catch (err) {
      console.error("Booking failed:", err);
      toast.error("Booking failed. Please try again.");
    }
  };

  return (
    <div className="mt-10  text-gray-200 font-sans ">
      <div className="p-6 max-w-3xl mx-auto">

         <h1 className="text-2xl md:text-3xl font-bold mb-2">
     Symptom <span className="text-[#f43f5e]">Checker</span>
    </h1>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            placeholder="Describe your symptoms..."
            className="w-full px-4 py-3  mt-5 rounded-lg border border-gray-600 bg-[#1e293b] text-gray-200 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#f43f5e]"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
   <button
             type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-lg font-semibold shadow-md transition transform hover:scale-[1.02] active:scale-95 ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-[#f43f5e] hover:bg-[#be123c] text-white"
            }`}
          >
            {loading ? "Checking..." : " Check"}
          </button>
      
        </form>

        {/* AI Advice (when answer present and not final suggestion) */}
        {answer && !finalSuggestion && (
          <div className="bg-[#1e293b] p-4 mt-4 rounded-lg border border-gray-700 text-gray-200">
            <h2 className="font-semibold mb-2 text-[#f43f5e]">AI Advice</h2>
            <p className="text-gray-200">{answer}</p>

            {specialist && (
              <p className="mt-2 text-sm text-gray-400">
                Recommended Specialist: <span className="font-semibold text-gray-100">{specialist}</span>
              </p>
            )}
          </div>
        )}

        {/* Conversation */}
        <div className="mt-4 space-y-2">
          {conversation.map((msg, idx) => (
            <div
              key={idx}
              className={`p-2 my-1 rounded max-w-md break-words ${
                msg.role === "user"
                  ? "ml-auto text-right bg-[#f43f5e] text-white"
                  : "mr-auto text-left bg-[#1e293b] text-gray-200 border border-gray-700"
              }`}
            >
              {msg.message}
            </div>
          ))}
        </div>

        {/* Final suggestion / doctor's available */}
        {conversation.length > 0 &&
          finalSuggestion &&
          followUpCount >= 3 &&
          conversation.slice(-4).some((msg) => msg.role === "user" && /yes|doctor|suggest/i.test(msg.message)) && (
            <div className="bg-[#1e293b] p-4 mt-4 rounded border border-gray-700 text-gray-200">
              <h3 className="font-semibold mb-2 text-[#f43f5e]">Doctor's Available</h3>
              <p className="mb-2">{finalSuggestion.answer}</p>
            </div>
          )}

        {/* Follow-up question */}
        {!finalSuggestion && (followUp?.trim() !== "" || answer?.trim() !== "") && (
          <div className="bg-[#1e293b] p-4 mt-4 rounded border border-gray-700 text-gray-200">
            <h2 className="font-semibold mb-2 text-[#f43f5e]">Follow-up Question</h2>
            <p className="mb-3 text-gray-200">{followUp}</p>

            <input
              type="text"
              placeholder="Your answer..."
              className="w-full p-2 border border-gray-600 rounded mb-2 bg-[#0f172a] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f43f5e]"
              value={followUpReply}
              onChange={(e) => setFollowUpReply(e.target.value)}
            />

            <button
              onClick={handleFollowUpReply}
              className="bg-[#f43f5e] text-white px-4 py-2 rounded hover:bg-[#be123c] active:scale-95 transition"
            >
              Submit Follow-up Answer
            </button>
          </div>
        )}

        {/* Doctors list */}
        {showDoctors && specialist && doctors.length > 0 && (
          <div className="mt-6">
            <h3 className="text-lg font-bold mb-2 text-gray-100">Available {specialist}s</h3>
            {doctors.map((doctor, index) => (
              <div key={index} className="bg-[#1e293b] p-4 rounded-lg shadow mb-4 border border-gray-700">
                <h2 className="text-xl font-semibold text-gray-100">{doctor.name}</h2>
                <p className="text-sm text-gray-400">Location: {doctor.city}, {doctor.state}</p>
                <p className="text-sm text-gray-400">Contact: {doctor.contact}</p>

                {doctor.available_slots && Object.entries(doctor.available_slots).map(([date, slots]) => (
                  <div key={date} className="mt-3">
                    <p className="font-semibold text-gray-200">{date}</p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {slots.map((slot) => {
                        const isBooked = doctor.booked_slots?.[date]?.includes(slot);

                        let isoDate = "";
                        if (date && date.includes("/")) {
                          const parts = date.split("/");
                          if (parts.length === 3) {
                            const [day, month, year] = parts;
                            isoDate = `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
                          }
                        }

                        const slotDate = new Date(isoDate);
                        const today = new Date();
                        slotDate.setHours(0, 0, 0, 0);
                        today.setHours(0, 0, 0, 0);

                        const isPastDate = slotDate < today;
                        const isDisabled = isBooked || isPastDate;

                        return (
                          <button
                            key={slot}
                            onClick={() =>
                              !isDisabled &&
                              openModal({
                                doctor_name: doctor.name,
                                specialization: doctor.specialization,
                                contact: doctor.contact,
                                date,
                                time: slot,
                              })
                            }
                            disabled={isDisabled}
                            className={`px-3 py-1 rounded text-sm transition ${
                              isDisabled
                                ? "bg-gray-600 text-white cursor-not-allowed"
                                : "bg-green-500 text-white hover:bg-green-600 active:scale-95 shadow-sm"
                            }`}
                          >
                            {slot} {isBooked ? "(Booked)" : isPastDate ? "(Past)" : ""}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* Booking Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 px-4">
            <div className="bg-[#1e293b] rounded-2xl shadow-xl w-full max-w-md px-6 py-8 transition-all border border-gray-700">
              <h2 className="text-2xl font-semibold mb-6 text-center text-gray-100">Book Appointment</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Your Name"
                  required
                  className="w-full px-4 py-2 border border-gray-600 rounded-xl bg-[#0f172a] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f43f5e]"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Phone Number"
                  required
                  className="w-full px-4 py-2 border border-gray-600 rounded-xl bg-[#0f172a] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f43f5e]"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                />
                <input
                  type="text"
                  placeholder="Age"
                  required
                  className="w-full px-4 py-2 border border-gray-600 rounded-xl bg-[#0f172a] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f43f5e]"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                />
                <input
                  type="text"
                  required
                  placeholder="Location"
                  className="w-full px-4 py-2 border border-gray-600 rounded-xl bg-[#0f172a] text-gray-200 focus:outline-none focus:ring-2 focus:ring-[#f43f5e]"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
                <button
                  onClick={bookAppointment}
                  className="w-full bg-[#f43f5e] text-white font-medium px-4 py-2 rounded-xl mt-2 hover:bg-[#be123c] active:scale-95 transition-all duration-200 shadow-md"
                >
                  Confirm Booking
                </button>
                <button
                  onClick={() => setShowModal(false)}
                  className="w-full mt-2 py-2 rounded-xl text-center text-gray-300 hover:text-gray-100 transition"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SymptomChecker;