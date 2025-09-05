import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
const API = import.meta.env.VITE_API;
const DoctorLogin = () => {
  const navigate = useNavigate();

  const [doctor, setDoctor] = useState({
    name: "",
    specialization: "",
    city: "",
    contact: "",
    fee: "",
    available_slots: {},
  });

  const [newDate, setNewDate] = useState("");
  const [newTime, setNewTime] = useState("");

  // Add Slot
  const addSlot = () => {
    if (!newDate || !newTime) {
      toast.error("Select both date and time.");
      return;
    }

    const formattedDate = newDate.toLocaleDateString("en-GB");
    const formattedTime = newTime.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

    setDoctor((prev) => ({
      ...prev,
      available_slots: {
        ...prev.available_slots,
        [formattedDate]: Array.from(
          new Set([...(prev.available_slots[formattedDate] || []), formattedTime])
        ),
      },
    }));

    setNewDate("");
    setNewTime("");
    toast.success("Slot added");
  };

  // Fetch doctor profile
  useEffect(() => {
    const contact = localStorage.getItem("doctorContact");

    const fetchDoc = async () => {
      try {
        const res = await fetch(
          `${API}/get-doctor-profile?contact=${contact}`
        );
        const data = await res.json();
        if (data.success) setDoctor(data.doctor);
      } catch (error) {
        console.error("Error fetching doctor profile:", error);
      }
    };

    if (contact) fetchDoc();
  }, []);

  const handleChange = (e) => {
    setDoctor({ ...doctor, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Object.keys(doctor.available_slots).length === 0) {
      toast.error("Please add at least one available slot.");
      return;
    }

    try {
      const res = await fetch(
        `${API}/doctor-login`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(doctor),
        }
      );

      const data = await res.json();
      if (data.success) {
        toast.success("Doctor Logged in");
        localStorage.setItem("doctorContact", doctor.contact);
        navigate("/doctor-dashboard");
      } else {
        toast.error(data.message || "Login failed");
      }
    } catch (err) {
      toast.error("Server error");
    }
  };

  return (
    <div className="text-gray-200 font-sans">
      {/* Page Header */}
      <section className="py-6 text-center">
        <h1 className="text-3xl font-bold mb-2">
          Doctor <span className="text-[#f43f5e]">Profile</span>
        </h1>
        <p className="text-gray-400 text-sm">
          Setup your profile and available slots securely.
        </p>
      </section>

      <div className="max-w-xl mx-auto bg-[#0f172a] border border-gray-700 rounded-xl shadow-md p-4 space-y-4">
        {/* Profile Fields */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {[
            { name: "name", label: "Full Name" },
            { name: "specialization", label: "Specialization" },
            { name: "city", label: "City" },
            { name: "contact", label: "Contact Number" },
            { name: "fee", label: "Consultation Fee" },
          ].map((field) => (
            <div key={field.name}>
              <label className="block text-xs font-medium text-gray-400 mb-1">
                {field.label}
              </label>
              <input
                type="text"
                name={field.name}
                placeholder={field.label}
                value={doctor[field.name]}
                onChange={handleChange}
                required
                className="w-full px-2 py-1.5 border border-gray-600 bg-[#1e293b] text-gray-200 rounded-md shadow-sm text-sm focus:ring-[#f43f5e] focus:border-[#f43f5e] outline-none"
              />
            </div>
          ))}

          {/* Slot Section */}
          <div>
            <label className="block text-xs font-medium text-gray-400 mb-2">
              Available Slots
            </label>

            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
              <DatePicker
                selected={newDate}
                onChange={(date) => setNewDate(date)}
                dateFormat="dd/MM/yyyy"
                minDate={new Date()}
                className="cursor-pointer border p-2 rounded-md w-full sm:w-[180px] text-sm bg-[#1e293b] text-gray-200 border-gray-600"
                placeholderText="Date"
              />

              <DatePicker
                selected={newTime}
                onChange={(time) => setNewTime(time)}
                showTimeSelect
                showTimeSelectOnly
                timeIntervals={30}
                timeCaption="Time"
                dateFormat="h:mm aa"
                className="cursor-pointer border p-2 rounded-md w-full sm:w-[140px] text-sm bg-[#1e293b] text-gray-200 border-gray-600"
                placeholderText="Time"
              />

              <button
                type="button"
                onClick={addSlot}
                className="cursor-pointer bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-md transition shadow"
              >
                Add
              </button>
            </div>
          </div>

          {/* Preview Slots */}
          {Object.keys(doctor.available_slots).length > 0 && (
            <div className="bg-[#1e293b] p-3 rounded-md border border-gray-700">
              <h3 className="font-semibold mb-2 text-[#f43f5e] text-sm">
                Preview Slots
              </h3>
              {Object.entries(doctor.available_slots).map(([date, times]) => (
                <div key={date} className="mb-1">
                  <p className="font-medium text-xs">{date}:</p>
                  <ul className="list-disc list-inside ml-4 text-gray-300 text-xs">
                    {times.map((time, idx) => (
                      <li key={idx}>{time}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="cursor-pointer bg-[#f43f5e] hover:bg-[#be123c] text-white px-4 py-2 rounded-md text-sm transition shadow"
            >
              Save & Login
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default DoctorLogin;