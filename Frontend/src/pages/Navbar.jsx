import { Link, useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import { LogOut, Home } from "lucide-react";
import toast from "react-hot-toast";

const Navbar = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState(localStorage.getItem("role") || "user");
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    const handleStorageChange = () => {
      setRole(localStorage.getItem("role") || "user");
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const handleLogout = async () => {
    const role = localStorage.getItem("role");
    try {
      await signOut(auth);
      if (role === "doctor") localStorage.removeItem("doctorContact");
      else localStorage.removeItem("phone");
      localStorage.removeItem("role");
      toast.success("Logged out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Logout failed: " + error.message);
    }
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 bg-gradient-to-r from-[#191024] via-[#1e293b] to-[#0f172a] shadow-lg border-b border-gray-800">
      <div className="max-w-7xl mx-auto flex justify-between items-center py-4 px-6">
        {/* Logo → role based navigation */}
        <div
          className="text-3xl font-bold tracking-wide cursor-pointer"
          onClick={() =>
            navigate(role === "doctor" ? "/doctor-dashboard" : "/home")
          }
        >
          <span className="text-[#f43f5e]">Dr.</span>
          <span className="text-gray-200">Care</span>
        </div>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center space-x-8 font-medium text-gray-300">
          {/* Show Home only for users */}
          {role === "user" && (
            <Link
              to="/home"
              className="flex items-center gap-2 hover:text-[#f43f5e]"
            >
              <Home className="w-5 h-5" /> Home
            </Link>
          )}
          <button
            onClick={() => setShowConfirm(true)}
            className="flex items-center gap-2 bg-[#f43f5e] text-white px-4 py-2 rounded-lg hover:bg-[#be123c] transition transform hover:scale-105 active:scale-95 shadow-md"
          >
            <LogOut className="w-5 h-5" /> Logout
          </button>
        </nav>

        {/* Mobile Icons */}
        <div className="flex md:hidden items-center gap-5 text-gray-300">
          {/* Home only for users */}
          {role === "user" && (
            <Home
              className="w-6 h-6 cursor-pointer hover:text-[#f43f5e]"
              onClick={() => navigate("/home")}
            />
          )}
          <LogOut
            className="w-6 h-6 cursor-pointer hover:text-[#f43f5e]"
            onClick={() => setShowConfirm(true)}
          />
        </div>
      </div>

      {/* Logout Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 flex justify-center items-center bg-black/50 z-50">
          <div className="bg-[#1e293b] p-6 rounded-xl shadow-xl max-w-sm w-full text-center text-gray-200">
            <h2 className="text-lg font-semibold mb-4">Confirm Logout</h2>
            <p className="text-gray-400 mb-6">
              Are you sure you want to logout?
            </p>
            <div className="flex justify-center gap-4">
              <button
                onClick={() => setShowConfirm(false)}
                className="px-4 py-2 rounded-lg border border-gray-500 text-gray-300 hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 rounded-lg bg-[#f43f5e] text-white hover:bg-[#be123c] transition transform hover:scale-105 active:scale-95 shadow-md"
              >
                Logout
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Navbar;
