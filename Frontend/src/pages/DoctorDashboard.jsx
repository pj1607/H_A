import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Calendar, Clock, Phone, MapPin, Video, CheckCircle2, XCircle } from "lucide-react";
const API = import.meta.env.VITE_API;
const DoctorDashboard = () => {
  const navigate = useNavigate();
  const contact = localStorage.getItem("doctorContact");

  const [appointments, setAppointments] = useState([]);
  const [toCancelId, setToCancelId] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleId, setRescheduleId] = useState(null);
  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  useEffect(() => {
    const fetchAppointments = async () => {
      try {
        const res = await fetch(
          `${API}/get-doctor-appointment?contact=${contact}`
        );
        const data = await res.json();
        setAppointments(data.appointments || []);
      } catch {
        toast.error("Failed to load appointments");
      }
    };
    fetchAppointments();
  }, [contact]);

  const cancelAppointment = async (id) => {
    try {
      const res = await fetch(
        `${API}/cancel-appointment/${id}`,
        { method: "DELETE" }
      );
      if (res.ok) {
        toast.success("Appointment cancelled");
        setAppointments((prev) => prev.filter((appt) => appt._id !== id));
      }
    } catch {
      toast.error("Error cancelling appointment");
    }
  };

  const formatStatus = (date, time) => {
    const apptDateTime = new Date(`${date} ${time}`);
    return apptDateTime < new Date() ? "Completed" : "Upcoming";
  };

  const handleStatusUpdate = async (id, status) => {
    try {
      let res = await fetch(
        `${API}/update-appointment-status/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        }
      );
      if (res.ok) {
        toast.success(`Appointment ${status}`);
        setAppointments((prev) =>
          prev.map((appt) =>
            appt._id === id ? { ...appt, status } : appt
          )
        );
      } else {
        toast.error("Failed to update appointment");
      }
    } catch {
      toast.error("Server error");
    }
  };

  const handleSchedule = async (id) => {
    if (!newDate || !newTime) {
      toast.error("Select both new date and time");
      return;
    }

    const formattedDate = newDate.toLocaleDateString("en-GB");
    const formattedTime = newTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    try {
      const re = await fetch(
        `${API}/reschedule-appointment/${id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ date: formattedDate, time: formattedTime }),
        }
      );
      if (re.ok) {
        toast.success("Appointment rescheduled");
        setAppointments((prev) =>
          prev.map((appt) =>
            appt._id === rescheduleId
              ? { ...appt, date: formattedDate, time: formattedTime }
              : appt
          )
        );
        setShowRescheduleModal(false);
        setRescheduleId(null);
      } else {
        toast.error("Failed to reschedule");
      }
    } catch {
      toast.error("Server error");
    }
  };

  return (
    <div className=" text-gray-200 p-6">
       {/* Page Header */}
      <section className="py-6 text-center">
        <h1 className="text-3xl font-bold mb-2">
        Doctor <span className="text-[#f43f5e]">Dashboard</span>
        </h1>
        <p className="text-gray-400 text-sm">
           Manage and monitor all your appointments here
        </p>
      </section>

      {/* Appointment Cards */}
      {appointments.length === 0 ? (
        <p className="text-center text-gray-400">No appointments found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          {appointments.map((appt) => (
            <div
              key={appt._id}
              className="bg-[#1e293b] border border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition"
            >
              <h3 className="text-xl font-bold text-gray-100 mb-2">
                {appt.user_name}
              </h3>
              <p className="flex items-center gap-2 text-gray-300">
                <Phone className="w-4 h-4 text-[#f43f5e]" /> {appt.phone}
              </p>
              <p className="flex items-center gap-2 text-gray-300">
                <MapPin className="w-4 h-4 text-[#f43f5e]" /> {appt.location}
              </p>
              <p className="flex items-center gap-2 text-gray-300">
                <Calendar className="w-4 h-4 text-[#f43f5e]" /> {appt.date}
                <Clock className="w-4 h-4 ml-3 text-[#f43f5e]" /> {appt.time}
              </p>
              <p className="text-sm text-gray-400 mt-2">
                Status:{" "}
                <span className="font-semibold text-yellow-400">
                  {formatStatus(appt.date, appt.time)}
                </span>
              </p>

              {appt.status && (
                <span
                  className={`inline-block mt-3 px-3 py-1 rounded-full text-xs font-semibold
                  ${
                    appt.status === "Accepted"
                      ? "bg-green-500/20 text-green-400"
                      : appt.status === "Rejected"
                      ? "bg-red-500/20 text-red-400"
                      : "bg-yellow-500/20 text-yellow-400"
                  }`}
                >
                  {appt.status}
                </span>
              )}

              {/* Action Buttons */}
              <div className="flex flex-wrap gap-3 mt-4">
                {formatStatus(appt.date, appt.time) === "Upcoming" && (
                  <>
                    <button
                      className="cursor-pointer bg-red-600 px-4 py-2 rounded-lg text-white hover:bg-red-700 transition"
                      onClick={() => {
                        setToCancelId(appt._id);
                        setShowModal(true);
                      }}
                    >
                      Cancel
                    </button>
                    <button
                      className="cursor-pointer bg-yellow-500 px-4 py-2 rounded-lg text-white hover:bg-yellow-600 transition"
                      onClick={() => {
                        setRescheduleId(appt._id);
                        setShowRescheduleModal(true);
                      }}
                    >
                      Reschedule
                    </button>
                    <button
                      className="cursor-pointer bg-green-600 px-4 py-2 rounded-lg text-white hover:bg-green-700 transition flex items-center gap-2"
                      onClick={() =>
                        navigate(`/video-call?doctorId=${contact}`)
                      }
                    >
                      <Video className="w-4 h-4" /> Start Call
                    </button>
                  </>
                )}

                {appt.status === "Pending" && (
                  <>
                    <button
                      className="cursor-pointer bg-blue-600 px-3 py-2 rounded-lg text-white hover:bg-blue-700 transition flex items-center gap-2"
                      onClick={() => handleStatusUpdate(appt._id, "Accepted")}
                    >
                      <CheckCircle2 className="w-4 h-4" /> Accept
                    </button>
                    <button
                      className="cursor-pointer bg-gray-600 px-3 py-2 rounded-lg text-white hover:bg-gray-700 transition flex items-center gap-2"
                      onClick={() => handleStatusUpdate(appt._id, "Rejected")}
                    >
                      <XCircle className="w-4 h-4" /> Reject
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-2">Cancel Appointment?</h2>
            <p className="text-sm text-gray-500 mb-4">
              Are you sure you want to cancel this appointment?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
              >
                No
              </button>
              <button
                onClick={async () => {
                  await cancelAppointment(toCancelId);
                  setShowModal(false);
                }}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Yes, Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reschedule Modal */}
      {showRescheduleModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
          <div className="bg-white text-gray-800 rounded-xl shadow-lg p-6 max-w-sm w-full">
            <h2 className="text-lg font-bold mb-4">Reschedule Appointment</h2>
            <div className="space-y-3">
              <DatePicker
                selected={newDate}
                onChange={(date) => setNewDate(date)}
                dateFormat="dd/MM/yyyy"
                minDate={new Date()}
                className="border p-2 rounded w-full"
                placeholderText="📅 Select Date"
              />
              <DatePicker
                selected={newTime}
                onChange={(time) => setNewTime(time)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={30}
                timeCaption="Time"
                dateFormat="h:mm aa"
                className="border p-2 rounded w-full"
                placeholderText="⏰ Select Time"
              />
            </div>
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => setShowRescheduleModal(false)}
                className="px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSchedule(rescheduleId)}
                className="px-4 py-2 rounded-md bg-yellow-500 text-white hover:bg-yellow-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default DoctorDashboard;