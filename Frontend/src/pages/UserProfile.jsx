import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";

import SymptomHistory from "./SymptomHistroy";
import Floating from "./Floating";
const API = import.meta.env.VITE_API;
const UserProfile = () => {
  const userPhone = localStorage.getItem("phone");
  const [appointments, setAppointments] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [toCancelId, setToCancelId] = useState(null);
  const [messages, setMessages] = useState([
    { sender: "bot", text: "Hello! I'm MediConnect. How can I help you today?" },
  ]);

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch(`${API}/get-user-appointments?phone=${userPhone}`);
        const data = await res.json();
        if (data.appointments) setAppointments(data.appointments);
      } catch {
        toast.error("Failed to fetch appointments.");
      }
    };
    fetchAppointments();
  }, [userPhone]);

  const cancelAppointment = async (id) => {
    try {
      const res = await fetch(`${API}/cancel-appointment/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Appointment cancelled.");
        setAppointments(appointments.filter((appt) => appt._id !== id));
      } else {
        toast.error("Failed to cancel appointment.");
      }
    } catch {
      toast.error("Error cancelling appointment.");
    }
  };

  const formatStatus = (date) => {
  if (!date || typeof date !== "string") return "Invalid";
  const parts = date.split('/');
  if (parts.length !== 3) return "Invalid";

  let [day, month, year] = parts;
  day = day?.padStart(2, '0') || '01';
  month = month?.padStart(2, '0') || '01';
  year = year || '1970';

  const apptDate = new Date(`${year}-${month}-${day}`);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  apptDate.setHours(0, 0, 0, 0);

  return apptDate < today ? "Completed" : "Upcoming";
};

  return (
    <div className="p-6  text-gray-200 space-y-6">
      <h2 className="text-2xl font-bold mb-4">Your Appointments</h2>

      {appointments.length === 0 ? (
        <p>No appointments found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {appointments.map((appt) => (
            <div key={appt._id} className="bg-gray-800 p-4 rounded-xl shadow-xl">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-semibold">{`Dr. ${appt.doctor_name}`}</h3>
                  <p className="text-sm text-gray-400">{appt.specialization}</p>
                  <p className="text-sm mt-1">{appt.location}</p>
                  <p className="text-sm">{`${appt.date} at ${appt.time}`}</p>
                  <p className="text-sm mt-1">Status: <strong>{formatStatus(appt.date)}</strong></p>
                  <p className="text-sm">
                    Doctor Status:{" "}
                    <span
                      className={`px-2 py-0.5 rounded-md text-white text-sm font-medium shadow-sm ${
                        appt.status === "Accepted" ? "bg-green-500" :
                        appt.status === "Rejected" ? "bg-red-500" : "bg-gray-500"
                      }`}
                    >
                      {appt.status}
                    </span>
                  </p>
                </div>
                <img src="/doctor-placeholder.png" alt="Doctor" className="h-16 w-16 rounded-full object-cover" />
              </div>

              <div className="mt-4 flex gap-2">
                {formatStatus(appt.date) === "Upcoming" && (
                  <button
                    className="bg-red-500 text-white px-3 py-1 rounded-xl hover:bg-red-600 active:scale-95 transition-all duration-200 shadow"
                    onClick={() => { setToCancelId(appt._id); setShowModal(true); }}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50  h-screen overflow-hidden" >
          <div className="bg-[#1e293b] p-8 rounded-2xl shadow-xl w-full max-w-md text-gray-200">
    {/* Title */}
    <h2 className="text-2xl font-semibold text-gray-100 mb-4 text-center">
      Cancel Appointment?
    </h2>

    {/* Description */}
    <p className="text-gray-400 text-center mb-8 leading-relaxed">
      Are you sure you want to cancel this appointment? This action cannot be undone.
    </p>

    {/* Buttons */}
    <div className="flex justify-center gap-4">
      <button
        onClick={async () => {
          await cancelAppointment(toCancelId);
          setShowModal(false);
          setToCancelId(null);
        }}
        className="px-5 py-2.5 rounded-xl bg-red-600 text-white font-medium shadow-lg hover:bg-red-700 active:scale-95 transition duration-150"
      >
        Yes, Cancel
      </button>
      <button
        onClick={() => {
          setShowModal(false);
          setToCancelId(null);
        }}
        className="px-5 py-2.5 rounded-xl bg-gray-700 text-gray-200 font-medium shadow-lg hover:bg-gray-600 active:scale-95 transition duration-150"
      >
        No, Keep It
      </button>
    </div>
  </div>
</div>

      )}

      <SymptomHistory userPhone={userPhone} />
      <Floating messages={messages} setMessages={setMessages} />
    </div>
  );
};

export default UserProfile;