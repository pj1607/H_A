import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
const API = import.meta.env.VITE_API;
const ProfileSection = () => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [profile, setProfile] = useState({
    name: "",
    email: "",
    phone: "",
    age: "",
    gender: "",
    address: "",
  });

  useEffect(() => {
    const storedProfile = {
      name: localStorage.getItem("user_name") || "",
      email: localStorage.getItem("userEmail") || "",
      phone: localStorage.getItem("phone") || "",
      age: localStorage.getItem("userAge") || "",
      gender: localStorage.getItem("userGender") || "",
      address: localStorage.getItem("userAddress") || "",
    };
    setProfile(storedProfile);
  }, []);

  const handleChange = (e) => {
    setProfile({ ...profile, [e.target.name]: e.target.value });
  };

  const saveChanges = () => {
    setEditing(false);

    // Save to local storage
    localStorage.setItem("user_name", profile.name);
    localStorage.setItem("phone", profile.phone);
    localStorage.setItem("userEmail", profile.email);
    localStorage.setItem("userGender", profile.gender);
    localStorage.setItem("userAge", profile.age.toString());
    localStorage.setItem("userAddress", profile.address);

    toast.success("Profile saved!");

    // Save to backend
    const payload = new FormData();
    payload.append("name", profile.name);
    payload.append("email", profile.email);
    payload.append("phone", profile.phone);
    payload.append("age", profile.age);
    payload.append("gender", profile.gender);
    payload.append("address", profile.address);

    fetch(`${API}/ask`, {
      method: "POST",
      body: payload,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Saved to backend:", data);
        navigate("/home");
        toast.success("Profile updated successfully!");
      })
      .catch((err) => {
        console.error("Profile save failed:", err);
        toast.error("Failed to save profile");
      });
  };

  return (
    <div className=" text-gray-200 font-sans">
      {/* Page Header */}
      <section className="py-6 text-center">
        <h1 className="text-3xl font-bold mb-2">
          Your <span className="text-[#f43f5e]">Profile</span>
        </h1>
        <p className="text-gray-400 text-sm">
          View and update your personal details securely.
        </p>
      </section>

      <div className="max-w-xl mx-auto bg-[#0f172a] border border-gray-700 rounded-xl shadow-md p-4 space-y-4">
        {/* Profile Fields */}
        <div className="space-y-3">
          {Object.keys(profile).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-400 capitalize mb-1">
                {field}
              </label>
              {editing ? (
                <input
                  type="text"
                  name={field}
                  value={profile[field]}
                  onChange={handleChange}
                  className="w-full px-2 py-1.5 border border-gray-600 bg-[#1e293b] text-gray-200 rounded-md shadow-sm text-sm focus:ring-[#f43f5e] focus:border-[#f43f5e] outline-none"
                />
              ) : (
                <p className="bg-[#1e293b] px-2 py-1.5 rounded-md text-gray-300 border border-gray-700 text-sm">
                  {profile[field] || "Not provided"}
                </p>
              )}
            </div>
          ))}
        </div>

        {/* Buttons */}
        <div className="flex justify-end gap-2 pt-3">
          {editing ? (
            <>
              <button
                className="cursor-pointer bg-green-600 hover:bg-green-700 text-white px-3 py-1.5 rounded-md text-sm transition shadow"
                onClick={saveChanges}
              >
                Save
              </button>
              <button
                className="cursor-pointer bg-gray-600 hover:bg-gray-700 text-white px-3 py-1.5 rounded-md text-sm transition shadow"
                onClick={() => setEditing(false)}
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              className="cursor-pointer bg-[#f43f5e] hover:bg-[#be123c] text-white px-4 py-2 rounded-md text-sm transition shadow"
              onClick={() => setEditing(true)}
            >
              Edit Profile
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileSection;