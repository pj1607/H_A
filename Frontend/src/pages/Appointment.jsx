import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { CalendarDays, Phone, MapPin, Stethoscope } from "lucide-react";
const API = import.meta.env.VITE_API;


const Appointment = () => {
  const [doctors, setDoctors] = useState([]);
  const [specialty, setSpecialty] = useState("");
  const [location, setLocation] = useState("");
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [loadingDoctors, setLoadingDoctors] = useState(true); 
  const [bookingLoading, setBookingLoading] = useState(false); 

  const userPhone = localStorage.getItem("phone");
  const userName = localStorage.getItem("user_name");

  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    age: "",
    location: "",
  });

  useEffect(() => {
    setLoadingDoctors(true);
    fetch(`${API}/all_doctors`)
      .then((res) => res.json())
      .then((data) => setDoctors(data.doctors || data))
      .catch((err) => console.error("Error:", err))
      
      .finally(() => setLoadingDoctors(false)); 
  }, []);

  const filteredDoctors = doctors.filter(
    (doc, idx, self) =>
      (specialty
        ? doc.specialization.toLowerCase().includes(specialty.toLowerCase())
        : true) &&
      (location
        ? doc.city.toLowerCase().includes(location.toLowerCase())
        : true) &&
      idx ===
        self.findIndex((d) => d.name === doc.name && d.contact === doc.contact)
  );

  const openModal = (slotInfo) => {
    setSelectedSlot(slotInfo);
    setShowModal(true);
  };

  const bookAppointment = async () => {
    if (!formData.age || !formData.location || !selectedSlot) {
      toast.warn("Please fill in all the required fields.");
      return;
    }

    const payload = {
      user_name: userName,
      email: `${formData.phone}@mail.com`,
      amount: selectedSlot.fee,
      phone: userPhone,
      age: formData.age,
      location: formData.location,
      doctor_name: selectedSlot.doctor_name,
      specialization: selectedSlot.specialization,
      contact: selectedSlot.contact,
      date: selectedSlot.date,
      time: selectedSlot.time,
    };

    try {
      setBookingLoading(true); 
      const res = await fetch(
        `${API}/book-appointment`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }
      );
      const data = await res.json();

      if (res.ok) {
        toast.success(data.message);
        setShowModal(false);
        setSelectedSlot(null);
        setFormData({ name: "", phone: "", age: "", location: "" });
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Payment Error:", error);
      toast.error("Booking failed. Please try again.");
    } finally {
      setBookingLoading(false); 
    }
  };

  return (
    <div className=" text-gray-200">
      {/* Header Banner */}
      <section className="py-10 px-6 flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Book Your <span className="text-[#f43f5e]">Appointment</span>
          </h1>
          <p className="text-gray-400 max-w-xl">
            Find trusted doctors, choose a time slot, and confirm instantly.
          </p>
        </div>

        {/* Filters moved here to the right */}
        <div className="flex gap-3 mt-6 md:mt-0">
          <input
            type="text"
            placeholder="Search Specialization"
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className="p-2 rounded-xl border border-gray-700 bg-[#1e293b] text-gray-200 w-40 md:w-52 focus:ring-2 focus:ring-[#f43f5e] outline-none"
          />
          <input
            type="text"
            placeholder="Search City"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="p-2 rounded-xl border border-gray-700 bg-[#1e293b] text-gray-200 w-40 md:w-52 focus:ring-2 focus:ring-[#f43f5e] outline-none"
          />
        </div>
      </section>

      {/* Loader while fetching doctors */}
      {loadingDoctors ? (
        <div className="flex justify-center items-center py-20">
          <div className="w-10 h-10 border-4 border-[#f43f5e] border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : (
        <section className="px-6 pb-20 max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-8">
          {filteredDoctors.map((doc, idx) => (
            <div
              key={idx}
              className="bg-[#1e293b] border border-gray-700 hover:border-[#f43f5e] transition-all p-6 rounded-2xl shadow-md hover:shadow-lg flex flex-col md:flex-row gap-6"
            >
              {/* Doctor Info */}
              <div className="flex gap-4 md:w-1/2">
                <img
                  src={`https://ui-avatars.com/api/?name=${doc.name.replace(
                    " ",
                    "+"
                  )}&background=random&size=128`}
                  alt="doctor"
                  className="w-24 h-24 rounded-full object-cover border-2 border-[#f43f5e]"
                />
                <div>
                  <h2 className="text-xl font-bold text-[#f43f5e]">
                    {doc.name}
                  </h2>
                  <p className="text-gray-300 flex items-center gap-1">
                    <Stethoscope size={16} /> {doc.specialization}
                  </p>
                  <p className="text-gray-400 flex items-center gap-1 text-sm">
                    <MapPin size={14} /> {doc.city}
                  </p>
                  <p className="text-gray-400 flex items-center gap-1 text-sm">
                    <Phone size={14} /> {doc.contact}
                  </p>
                  <p className="text-sm text-gray-300 mt-1">
                    Fee: <span className="font-semibold">{doc.fee}</span>
                  </p>
                </div>
              </div>

              {/* Slots */}
              <div className="md:w-1/2">
                {doc.available_slots &&
                  Object.entries(doc.available_slots).map(([date, slots]) => (
                    <div key={date} className="mb-4">
                      <p className="font-semibold text-gray-200 flex items-center gap-1">
                        <CalendarDays size={16} /> {date}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {slots.map((slot) => {
                          const isBooked =
                            doc.booked_slots?.[date]?.includes(slot);

                          let isoDate = "";
                          if (date && date.includes("/")) {
                            const parts = date.split("/");
                            if (parts.length === 3) {
                              const [day, month, year] = parts;
                              isoDate = `${year}-${month.padStart(
                                2,
                                "0"
                              )}-${day.padStart(2, "0")}`;
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
                                  doctor_name: doc.name,
                                  specialization: doc.specialization,
                                  contact: doc.contact,
                                  fee: doc.fee,
                                  date,
                                  time: slot,
                                })
                              }
                              disabled={isDisabled}
                              className={`px-3 py-1 rounded-lg text-sm transition
                              ${
                                isDisabled
                                  ? "bg-gray-600 text-gray-300 cursor-not-allowed"
                                  : "bg-[#f43f5e] text-white hover:bg-[#be123c] active:scale-95 shadow-md"
                              }`}
                            >
                              {slot}{" "}
                              {isBooked
                                ? "(Booked)"
                                : isPastDate
                                ? "(Past)"
                                : ""}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </section>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#1e293b] p-8 rounded-2xl shadow-xl w-full max-w-md text-gray-200">
            <h2 className="text-2xl font-bold mb-6 text-center text-[#f43f5e]">
              Confirm Appointment
            </h2>
            <div className="space-y-4">
              <input
                type="number"
                placeholder="Age"
                value={formData.age}
                onChange={(e) =>
                  setFormData({ ...formData, age: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-[#0f172a] border border-gray-600 focus:ring-2 focus:ring-[#f43f5e] outline-none"
              />
              <input
                type="text"
                placeholder="Location"
                value={formData.location}
                onChange={(e) =>
                  setFormData({ ...formData, location: e.target.value })
                }
                className="w-full px-4 py-2 rounded-lg bg-[#0f172a] border border-gray-600 focus:ring-2 focus:ring-[#f43f5e] outline-none"
              />
              <button
                onClick={bookAppointment}
                disabled={bookingLoading}
                className={`w-full py-2 rounded-lg font-semibold transition ${
                  bookingLoading
                    ? "bg-gray-600 cursor-not-allowed"
                    : "bg-[#f43f5e] hover:bg-[#be123c] active:scale-95"
                }`}
              >
                {bookingLoading ? "Booking..." : "Confirm Booking"}
              </button>
              <button
                onClick={() => {
                  setShowModal(false);
                  setSelectedSlot(null);
                  setFormData({ name: "", phone: "", age: "", location: "" });
                }}
                className="text-gray-400 w-full mt-2 hover:text-red-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Appointment;
