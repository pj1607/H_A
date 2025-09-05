import React from "react";
import h from "../assets/h.jpg";
import d from "../assets/d.jpg";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Mail,
  Phone,
  User,
  Stethoscope,
  ClipboardList,
  Hospital,
  MessageSquareHeart,
} from "lucide-react";

const Home = () => {
  const navigate = useNavigate();
  const role = localStorage.getItem("role") || "user";

  const userFeatures = [
    {
      title: "Find & Book Doctors",
      desc: "Search doctors by specialty & book appointments",
      icon: Stethoscope
    },
    {
      title: "Symptom Checker AI",
      desc: "Describe symptoms, get instant AI insights",
      icon: MessageSquareHeart
    },
    {
      title: "Nearby Hospitals",
      desc: "Search hospitals by your location",
      icon: Hospital
    },
    {
      title: "Medical Report Summary",
      desc: "Upload reports & get quick health summary",
      icon: ClipboardList
    },
  ];

  const doctorFeatures = [
    {
      title: "Doctor Dashboard",
      desc: "View appointments and manage patients",
      icon: ClipboardList,
      route: "/doctor-dashboard",
    },
    {
      title: "Doctor Profile",
      desc: "Manage your profile & specialties",
      icon: User,
      route: "/doctorLogin",
    },
  ];

  const features = role === "doctor" ? doctorFeatures : userFeatures;

  return (
    <div className="mt-10 min-h-screen text-gray-200 font-sans overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 px-6 max-w-7xl mx-auto text-center">
        {/* Animated Background Circles */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 w-[600px] h-[600px] bg-pink-300 rounded-full opacity-20 animate-pulse-slow -z-10"></div>
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[400px] bg-blue-400 rounded-full opacity-20 animate-pulse-slow -z-10"></div>

        {/* Vertical Lines */}
        <div className="absolute top-0 left-1/3 transform -translate-x-1/2 h-full w-px bg-white opacity-5"></div>
        <div className="absolute top-0 left-2/3 transform -translate-x-1/2 h-full w-px bg-white opacity-5"></div>

        {/* Floating SVG Illustration */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-72 max-w-full sm:w-64 h-96 animate-float z-0">
          <svg
            viewBox="0 0 1200 800"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-labelledby="title desc"
          >
            <title id="title">Healthy Lifestyle Illustration</title>
            <desc id="desc">
              A big heart with an ECG line and three people: one meditating, one cheering, and one holding a clock, plus decorative veggies.
            </desc>
            <defs>
              <linearGradient id="heartGrad" x1="0" x2="1" y1="0" y2="1">
                <stop offset="0" stopColor="#ff6b8a" />
                <stop offset="1" stopColor="#f1305a" />
              </linearGradient>
              <filter id="soft" x="-20%" y="-20%" width="140%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="12" floodOpacity="0.18" />
              </filter>
            </defs>

            {/* Heart Shape */}
            <g filter="url(#soft)" opacity="0.12">
              <path
                d="
                  M600,240
                  C560,160 452,120 376,160
                  C260,220 256,392 360,498
                  L600,736
                  L840,498
                  C944,392 940,220 824,160
                  C748,120 640,160 600,240
                "
                fill="url(#heartGrad)"
              />
            </g>

            {/* ECG Line */}
            <path
              d="M350,420 L460,420 L495,340 L540,520 L590,360 L640,520 L690,420 L850,420"
              opacity="0.19"
              fill="none"
              stroke="#ffffff"
              strokeWidth="16"
              strokeLinejoin="round"
              strokeLinecap="round"
            />

            {/* Right: cheering person */}
            <g transform="translate(990,560)" opacity="0.19">
              <path
                d="M-60,-40 Q-90,-110 -120,-160 M60,-40 Q90,-110 120,-160"
                fill="none"
                stroke="#ef7ab0"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <rect x="-40" y="-40" width="80" height="140" rx="24" fill="#f9a8d4" />
              <circle cx="0" cy="-90" r="32" fill="#ffd7b5" />
              <rect x="-32" y="100" width="24" height="70" rx="10" fill="#6b7280" />
              <rect x="8" y="100" width="24" height="70" rx="10" fill="#6b7280" />
            </g>
          </svg>
        </div>

        {/* Hero Text */}
        <h1 className="relative text-5xl md:text-6xl font-extrabold leading-tight mb-6 z-10">
          All-In-One{" "}
          <span className="bg-clip-text text-transparent bg-gradient-to-r from-pink-500 to-red-500 animate-gradient-x">
            Healthcare
          </span>{" "}
          Platform
        </h1>

        <p className="relative text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-8 animate-fadeIn z-10">
          Book appointments, consult AI, manage reports, search hospitals, and more — all in one place.
        </p>

        <div className="relative flex justify-center gap-4 animate-fadeIn delay-200 z-10">
          <button
            onClick={() => navigate("/symptom-checker")}
            className="bg-[#f43f5e] hover:bg-[#be123c] text-white px-6 py-3 rounded-lg shadow-md transition transform hover:scale-105 active:scale-95"
          >
            Try Symptom Checker
          </button>
        </div>
      </section>

      {/* Feature Banner 1 */}
      <section className="py-20 relative overflow-hidden">
        <div className="max-w-6xl mx-auto flex flex-col-reverse md:flex-row items-center gap-12 px-6 relative z-10">
          <div className="md:w-1/2 text-center md:text-left space-y-6">
            <h2 className="text-4xl md:text-5xl font-extrabold text-white mb-2 relative inline-block">
              Expert Doctors You Can Trust
            </h2>
            <p className="text-gray-300 text-lg md:text-xl">
              Connect with certified healthcare professionals, book appointments instantly, and get personalized care.
            </p>
            <button
              onClick={() => navigate("/appointment")}
              className="bg-white/10 backdrop-blur-md text-white font-semibold px-6 py-3 rounded-xl border border-white/20 shadow-lg transition transform hover:scale-105 hover:bg-white/20 active:scale-95"
            >
              Book Now
            </button>
          </div>

          <div className="md:w-1/2 relative">
            <div className="rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition duration-500">
              <img src={h} alt="Doctors" className="w-full h-full object-cover" />
            </div>
          </div>
        </div>

        {/* Background Decorative Lines */}
        <div className="absolute top-0 left-1/2 transform -translate-x-1/2 h-full w-px bg-white opacity-5"></div>
        <div className="absolute top-0 left-1/3 transform -translate-x-1/2 h-full w-px bg-white opacity-3"></div>
        <div className="absolute top-0 left-2/3 transform -translate-x-1/2 h-full w-px bg-white opacity-3"></div>
      </section>

      {/* Features Grid */}
<section className="py-16 px-4 relative overflow-hidden">
  <div className="max-w-5xl mx-auto grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 place-items-center relative">
    {features.map(({ title, desc, icon: Icon }, idx) => (
      <div key={idx} className="relative flex flex-col items-center group">
        {/* Circle Icon */}
        <div className="w-24 h-24 sm:w-28 sm:h-28 flex items-center justify-center rounded-full bg-gradient-to-tr from-pink-500 to-red-500 text-white shadow-lg transform transition-all duration-500 group-hover:scale-110">
          <Icon className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
        </div>

        {/* Title */}
        <h3 className="mt-3 text-base sm:text-lg font-semibold text-white text-center">{title}</h3>

        {/* Description */}
        <p className="mt-1 text-xs sm:text-sm text-gray-300 text-center">{desc}</p>

        {/* Decorative Ring */}
        <div className="absolute w-28 h-28 sm:w-36 sm:h-36 rounded-full border-2 border-pink-500/20 top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 animate-spin-slow pointer-events-none"></div>
      </div>
    ))}
  </div>

  {/* Background blobs */}
  <div className="absolute -top-12 -left-12 w-20 h-20 sm:w-40 sm:h-40 bg-pink-600 opacity-10 rounded-full blur-3xl"></div>
  <div className="absolute -bottom-12 -right-12 w-32 h-32 sm:w-72 sm:h-72 bg-blue-500 opacity-10 rounded-full blur-3xl"></div>

  <style jsx>{`
    @keyframes spin-slow {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .animate-spin-slow {
      animation: spin-slow 20s linear infinite;
    }
  `}</style>
</section>


   {/* Feature Banner 2 - Modern Card UI */}
<section className="py-16 relative overflow-hidden ">
  <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-10 px-4 md:px-6 relative">

    {/* Image Card with Floating Shadow */}
    <div className="md:w-1/2 relative flex justify-center md:justify-start">
      <div className="relative w-full md:w-4/5 rounded-3xl overflow-hidden shadow-2xl transform hover:scale-105 transition duration-500">
        <img src={d} alt="Healthcare" className="w-full h-full object-cover" />
        {/* Decorative overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-black/30"></div>
      </div>
      {/* Floating colored circle */}
      <div className="absolute -top-10 -left-10 w-24 h-24 bg-pink-500 opacity-20 rounded-full blur-3xl animate-pulse-slow pointer-events-none"></div>
    </div>

    {/* Text Content Card */}
    <div className="md:w-1/2 relative bg-gray-900/50 backdrop-blur-md rounded-3xl p-8 shadow-xl text-center md:text-left">
      <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
        Your Health, Our Priority
      </h2>
      <p className="text-gray-300 mb-6 text-sm md:text-base">
        Get AI-powered symptom analysis, hospital search, and secure health reports to stay ahead of your wellness journey.
      </p>
      <button
        onClick={() => navigate("/medicalReport")}
        className="bg-gradient-to-r from-pink-500 to-red-500 hover:from-red-500 hover:to-pink-500 text-white px-6 py-3 rounded-xl shadow-lg transition transform hover:scale-105 active:scale-95"
      >
        Try Medical Report Summary
      </button>
      {/* Decorative small circle */}
      <div className="absolute -bottom-6 -right-6 w-16 h-16 bg-blue-500 opacity-20 rounded-full blur-3xl animate-pulse-slow pointer-events-none"></div>
    </div>

  </div>
</section>

<style jsx>{`
  @keyframes pulse-slow {
    0%, 100% { transform: scale(1); opacity: 0.2; }
    50% { transform: scale(1.1); opacity: 0.4; }
  }
  .animate-pulse-slow {
    animation: pulse-slow 6s ease-in-out infinite;
  }
`}</style>

    </div>
  );
};

export default Home;
