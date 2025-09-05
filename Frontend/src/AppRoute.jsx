import { Routes, Route, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import Navbar from "./pages/Navbar";
import Home from "./pages/Home";
import LoginPage from "./pages/LoginPage";
import DoctorLogin from "./pages/DoctorLogin";
import SymptomChecker from "./pages/SymptomChecker";
import HospitalLocator from "./pages/HospitalLocator";
import Appointment from "./pages/Appointment";
import UserProfile from "./pages/UserProfile";
import ProfileSection from "./pages/ProfileSection";
import MedicalReport from "./pages/MedicalReport";
import DoctorDashboard from "./pages/DoctorDashboard";
import HomeSideBar from "./pages/HomeSideBar";

function AppRoute() {
  const location = useLocation();
  const hideNavbarPaths = ["/"];
  const shouldShowNavbar = !hideNavbarPaths.includes(location.pathname);

  const [isOpen, setIsOpen] = useState(false); 
  const [isMobile, setIsMobile] = useState(false);

  // Detect mobile for layout
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 800);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

   const role = localStorage.getItem("role");
  return (
    <>
      {shouldShowNavbar && <Navbar />}

      {shouldShowNavbar ? (
        <div className="flex min-h-screen pt-[72px]">
          {/* Sidebar */}
          <HomeSideBar isOpen={isOpen} setIsOpen={setIsOpen} role={role} />

          {/* Main Content */}
          <main
            className={`flex-1 p-6 overflow-auto transition-all duration-300 ${
              !isMobile ? (isOpen ? "ml-64" : "ml-16") : "ml-0"
            }`}
          >
            <Routes>
                  {role === "user" && (
                <>
              <Route path="/home" element={<Home />} />
              <Route path="/symptom-checker" element={<SymptomChecker />} />
              <Route path="/hospital-loc" element={<HospitalLocator />} />
              <Route path="/appointment" element={<Appointment />} />
              <Route path="/userprofile" element={<UserProfile />} />
              <Route path="/profile" element={<ProfileSection />} />
              <Route path="/medicalReport" element={<MedicalReport />} />

                 </>
              )}
              {role === "doctor" && (
                <>
              <Route path="/doctorLogin" element={<DoctorLogin />} />
              <Route path="/doctor-dashboard" element={<DoctorDashboard />} /></>)}
            </Routes>
          </main>
        </div>
      ) : (
        <main className="min-h-screen">
          <Routes>
            <Route path="/" element={<LoginPage />} />
          </Routes>
        </main>
      )}
    </>
  );
}

export default AppRoute;
