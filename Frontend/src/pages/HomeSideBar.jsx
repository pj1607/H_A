import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  Stethoscope,
  Hospital,
  ClipboardPlus,
  BadgeCheck,
  User,
  Menu,
  X,
  ChevronRight,
  GalleryHorizontalEnd,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

const userLinks = [
  { name: "Symptom Checker", icon: <Stethoscope />, path: "/symptom-checker" },
  { name: "Hospitals", icon: <Hospital />, path: "/hospital-loc" },
  { name: "Appointments", icon: <BadgeCheck />, path: "/appointment" },
  { name: "Medical Report", icon: <ClipboardPlus />, path: "/medicalReport" },
  { name: "Profile", icon: <User />, path: "/profile" },
  { name: "Dashboard", icon: <GalleryHorizontalEnd />, path: "/userprofile" },
];

const doctorLinks = [
  { name: "Doctor Login", icon: <User />, path: "/doctorLogin" },
  { name: "Doctor Dashboard", icon: <GalleryHorizontalEnd />, path: "/doctor-dashboard" },
];

const HomeSideBar = ({ isOpen, setIsOpen, topOffset = 72,role }) => {
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { pathname } = useLocation();

  const links = role === "doctor" ? doctorLinks : userLinks;

  // Detect mobile
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 800);
      if (window.innerWidth >= 800) setIsMobileOpen(false);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <>
      {/* Mobile Toggle Button */}
      {isMobile && (
        <button
          onClick={() => setIsMobileOpen(!isMobileOpen)}
          className="fixed top-120 left-1 z-50 p-3  hover:bg-[#bababa] transition-colors"
        >
          <motion.div
            animate={{ rotate: isMobileOpen ? 180 : 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
          >
            <ChevronRight size={20} />
          </motion.div>
        </button>
      )}

      {/* Sidebar */}
      <motion.div
        initial={false}
        animate={{
          x: isMobile && !isMobileOpen ? "-100%" : 0,
          width: isMobile ? "4rem" : isOpen ? "16rem" : "4rem",
        }}
        transition={{ duration: 0.25, ease: "easeInOut" }}
        className="fixed bg-[#1e293b] text-gray-200 flex flex-col z-40 shadow-2xl border-r border-gray-700/40"
        style={{
          top: topOffset,
          height: isMobile ? "100vh" : `calc(100vh - ${topOffset}px)`,
        }}
      >
        {/* Desktop Toggle */}
        {!isMobile && (
          <div className="flex justify-end p-4">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded hover:bg-gray-700 hover:text-white transition-colors duration-200"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        )}

        {/* Links */}
        <nav className="flex-1 overflow-y-auto mt-4 custom-scrollbar px-2">
          {links.map((link) => {
            const isActive = pathname === link.path;
            return (
              <Link
                key={link.name}
                to={link.path}
                className={`relative group flex items-center gap-4 p-3 my-1 rounded-xl transition-all duration-200
                  ${
                    isActive
                      ? "bg-gradient-to-r from-[#f43f5e]/30 to-transparent text-[#f43f5e] shadow-md"
                      : "hover:bg-gray-700/40"
                  }`}
              >
                {/* Icon */}
                <motion.span
                  whileHover={{ scale: 1.15 }}
                  className={`text-xl ${
                    isActive ? "text-[#f43f5e]" : "text-gray-300 group-hover:text-white"
                  }`}
                >
                  {link.icon}
                </motion.span>

                {/* Animated Text */}
                <AnimatePresence>
                  {!isMobile && isOpen && (
                    <motion.span
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      transition={{ duration: 0.2 }}
                      className="font-medium whitespace-nowrap"
                    >
                      {link.name}
                    </motion.span>
                  )}
                </AnimatePresence>

                {/* Active Bar */}
                {isActive && (
                  <motion.div
                    layoutId="activeBar"
                    className="absolute left-0 top-0 bottom-0 w-1 rounded-r bg-[#f43f5e]"
                  />
                )}
              </Link>
            );
          })}
        </nav>
      </motion.div>

      {/* Mobile overlay */}
      <AnimatePresence>
        {isMobile && isMobileOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/40 z-30"
            onClick={() => setIsMobileOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Custom scrollbar styles */}
      <style>
        {`
          .custom-scrollbar::-webkit-scrollbar {
            width: 6px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb {
            background: #f43f5e80;
            border-radius: 9999px;
          }
          .custom-scrollbar::-webkit-scrollbar-thumb:hover {
            background: #f43f5e;
          }
        `}
      </style>
    </>
  );
};

export default HomeSideBar;