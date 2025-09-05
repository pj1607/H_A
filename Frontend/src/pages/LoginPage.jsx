import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { setDoc, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
} from "firebase/auth";
import toast from "react-hot-toast";

const LoginPage = () => {
  const [isLogin, setIsLogin] = useState(false);
  const [loading, setLoading] = useState(false); // Loader state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "user",
  });

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { name, email, phone, password, role } = formData;

    if (!email || !password || !role) {
      toast.warn("Please fill all fields.");
      return;
    }

    setLoading(true); // Start loader
    try {
      if (isLogin) {
        const userCred = await signInWithEmailAndPassword(auth, email, password);
        toast.success("Login successful!");
        const userDoc = await getDoc(doc(db, "user", userCred.user.uid));
        const userData = userDoc.data();
        const userRole = userData?.role || "user";

        if (userRole === "doctor") {
          localStorage.setItem("role", "doctor");
          localStorage.setItem("doctorContact", userData.phone);
          navigate("/doctorLogin");
        } else {
          localStorage.setItem("role", "user");
          localStorage.setItem("phone", userData.phone);
          localStorage.setItem("user_name", userData.name);
          navigate("/profile");
        }
      } else {
        const userCred = await createUserWithEmailAndPassword(auth, email, password);
        await setDoc(doc(db, "user", userCred.user.uid), {
          name,
          email,
          phone,
          role,
          uid: userCred.user.uid,
        });
        toast.success("Signup successful!");
          localStorage.setItem("user_name", name);
          localStorage.setItem("phone", phone);
          localStorage.setItem("role", role);
        localStorage.setItem("uid", userCred.user.uid);

        if (role === "doctor") {
            localStorage.setItem("user_name", name);
          localStorage.setItem("role", "doctor");
          localStorage.setItem("doctorContact", phone);
          navigate("/doctorLogin");
        } else {
          localStorage.setItem("role", "user");
          localStorage.setItem("phone", phone);
          localStorage.setItem("user_name", name);
          navigate("/profile");
        }
      }
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        toast.error("Email already exists. Please login instead.");
      } else if (error.code === "auth/wrong-password") {
        toast.error("Incorrect password. Please try again.");
      } else if (error.code === "auth/user-not-found") {
        toast.error("No account found with this email.");
      } else {
        toast.error(error.message || "Something went wrong.");
      }
    } finally {
      setLoading(false); // Stop loader
    }
  };

  function HeartBackgroundSVG({ className }) {
    return (
      <svg
        className={className}
        viewBox="0 0 1200 800"
        xmlns="http://www.w3.org/2000/svg"
        role="img"
        aria-labelledby="title desc"
      >
        <title id="title">Healthy Lifestyle Illustration</title>
        <desc id="desc">
          A big heart with an ECG line and three people: one meditating, one
          cheering, and one holding a clock, plus decorative veggies.
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

        <g filter="url(#soft)" opacity="0.19">
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

        {/* Small health props */}
        <g transform="translate(170,720)" opacity="0.19" >
          <circle cx="0" cy="0" r="36" fill="#ef4444" />
          <circle cx="34" cy="-2" r="30" fill="#dc2626" />
          <rect x="8" y="-64" width="8" height="20" rx="4" fill="#14532d" />
          <path d="M8,-64 C-6,-76 -18,-60 0,-48" fill="#16a34a" />
        </g>
        <g transform="translate(320,745)" opacity="0.19">
          <path d="M0,0 L18,-80 L-18,-80 Z" fill="#f97316" />
          <path d="M0,-80 C-10,-98 10,-98 0,-80" fill="#16a34a" />
        </g>
      </svg>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-900 text-gray-100 relative">
      {/* Left Intro Section */}
      <div className="relative w-full md:w-1/2 flex flex-col justify-center px-6 md:px-16 py-12 overflow-hidden 
                bg-gradient-to-b from-[#191024] via-[#1e293b] to-[#0f172a]">
        <div className="absolute inset-0 
                  bg-[linear-gradient(to_right,#1e293b_1px,transparent_1px)] 
                  bg-[size:30px_30px] sm:bg-[size:40px_40px] 
                  opacity-80"></div>

        <h1 className="text-4xl sm:text-5xl font-bold mb-4 relative z-10">
          <span className="text-[#f43f5e]">Dr.</span>
          <span className="text-[#e0e0e0] ml-2">Care</span>
        </h1>

        <h2 className="text-xl sm:text-2xl font-semibold text-gray-200 mb-6 relative z-10">
          All-In-One Healthcare Platform
        </h2>
        <p className="text-base sm:text-lg text-gray-400 leading-relaxed relative z-10">
          Book appointments, consult AI, manage reports, search hospitals, and more <br /> All in one place.
        </p>
      </div>

      {/* Right Form Section */}
      <div className="w-full md:w-1/2 relative flex flex-col justify-center p-8 md:p-16 ">
        <HeartBackgroundSVG className="absolute inset-0 w-full h-full object-contain opacity-100 pointer-events-none" />
        <div className="relative z-10">
          <h2 className="text-3xl font-bold text-white mb-6">
            {isLogin ? "Welcome Back" : "Create an Account"}
          </h2>
          <form className="space-y-4" onSubmit={handleSubmit}>
            {!isLogin && (
              <>
                <div className="flex gap-4 mt-3">
                  {["doctor", "user"].map((roleOption) => (
                    <span
                      key={roleOption}
                      onClick={() =>
                        setFormData({ ...formData, role: roleOption })
                      }
                      className={`cursor-pointer px-4 py-1.5 rounded-full text-sm font-medium transition
                        ${
                          formData.role === roleOption
                            ? "bg-[#f43f5e] text-white"
                            : "text-gray-300 border border-gray-500 hover:text-[#f43f5e]"
                        }`}
                    >
                      {roleOption.charAt(0).toUpperCase() + roleOption.slice(1)}
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Full Name"
                  className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white
             focus:outline-none focus:ring-2 focus:ring-[#f43f5e]
             hover:border-[#f43f5e] hover:ring-1 hover:ring-[#f43f5e]  transition duration-100 ease-in-out"
                />
                <input
                  type="tel"
                  required
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Phone Number"
                  className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white
             focus:outline-none focus:ring-2 focus:ring-[#f43f5e]
             hover:border-[#f43f5e] hover:ring-1 hover:ring-[#f43f5e]  transition duration-100 ease-in-out"
                />
              </>
            )}
            <input
              type="email"
              required
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Email"
              className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white
             focus:outline-none focus:ring-2 focus:ring-[#f43f5e]
             hover:border-[#f43f5e] hover:ring-1 hover:ring-[#f43f5e]  transition duration-100 ease-in-out"
            />
            <input
              type="password"
              required
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Password"
              className="w-full px-4 py-2 rounded-lg border border-gray-600 bg-gray-700 text-white
             focus:outline-none focus:ring-2 focus:ring-[#f43f5e]
             hover:border-[#f43f5e] hover:ring-1 hover:ring-[#f43f5e]  transition duration-100 ease-in-out"
            />
            <button
              type="submit"
              disabled={loading}
              className={`cursor-pointer w-full bg-[#f43f5e] text-white font-bold py-2 rounded-lg hover:bg-[#be123c] transition transform hover:scale-105 active:scale-95 shadow-md flex justify-center items-center gap-2 ${
                loading ? "opacity-70 cursor-not-allowed" : ""
              }`}
            >
              {loading && (
                <svg
                  className="animate-spin h-5 w-5 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"
                  ></path>
                </svg>
              )}
              {isLogin ? "Login" : "Signup"}
            </button>
          </form>

          <p className="text-center mt-4 text-gray-300">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="cursor-pointer text-[#f43f5e] font-semibold hover:underline  transition duration-100 ease-in-out"
            >
              {isLogin ? "Signup" : "Login"}
            </button>
          </p>
        </div>
      </div>

    </div>
  );
};

export default LoginPage;
