import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { Listbox } from "@headlessui/react";
import { Check, ChevronDown } from "lucide-react";

const API = import.meta.env.VITE_API;

const genders = ["Male", "Female", "Other"];
const ages = Array.from({ length: 100 }, (_, i) => (i + 5).toString()); 

const ProfileSection = () => {
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false); 
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
    setLoading(true);

    localStorage.setItem("user_name", profile.name);
    localStorage.setItem("phone", profile.phone);
    localStorage.setItem("userEmail", profile.email);
    localStorage.setItem("userGender", profile.gender);
    localStorage.setItem("userAge", profile.age.toString());
    localStorage.setItem("userAddress", profile.address);

    const payload = new FormData();
    Object.keys(profile).forEach((key) => payload.append(key, profile[key]));

    fetch(`${API}/ask`, {
      method: "POST",
      body: payload,
    })
      .then((res) => res.json())
      .then((data) => {
        console.log("Saved to backend:", data);
        toast.success("Profile updated successfully!");
        navigate("/home");
      })
      .catch((err) => {
        console.error("Profile save failed:", err);
        toast.error("Failed to save profile");
      })
      .finally(() => setLoading(false));
  };

  return (
    <div className="text-gray-200 font-sans">
      <section className="py-6 text-center">
        <h1 className="text-3xl font-bold mb-2">
          Your <span className="text-[#f43f5e]">Profile</span>
        </h1>
        <p className="text-gray-400 text-sm">
          View and update your personal details securely.
        </p>
      </section>

      <div className="max-w-xl mx-auto bg-[#0f172a] border border-gray-700 rounded-xl shadow-md p-4 space-y-4">
        <div className="space-y-3">
          {Object.keys(profile).map((field) => (
            <div key={field}>
              <label className="block text-xs font-medium text-gray-400 capitalize mb-1">
                {field}
              </label>

              {editing ? (
                field === "gender" ? (
                  <Listbox
                    value={profile.gender}
                    onChange={(val) => setProfile({ ...profile, gender: val })}
                  >
                    <div className="relative">
                      <Listbox.Button className="w-full px-2 py-1.5 border border-gray-600 bg-[#1e293b] text-gray-200 rounded-md text-left text-sm flex justify-between items-center focus:ring-[#f43f5e] focus:border-[#f43f5e]">
                        {profile.gender || "Select Gender"}
                        <ChevronDown className="w-4 h-4" />
                      </Listbox.Button>
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#1e293b] border border-gray-600 text-sm shadow-lg">
                        {genders.map((g) => (
                          <Listbox.Option
                            key={g}
                            value={g}
                            className={({ active }) =>
                              `cursor-pointer px-2 py-1 ${
                                active ? "bg-[#f43f5e] text-white" : "text-gray-200"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <div className="flex justify-between items-center">
                                {g}
                                {selected && <Check className="w-4 h-4 text-green-400" />}
                              </div>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                ) : field === "age" ? (
                  <Listbox
                    value={profile.age}
                    onChange={(val) => setProfile({ ...profile, age: val })}
                  >
                    <div className="relative">
                      <Listbox.Button className="w-full px-2 py-1.5 border border-gray-600 bg-[#1e293b] text-gray-200 rounded-md text-left text-sm flex justify-between items-center focus:ring-[#f43f5e] focus:border-[#f43f5e]">
                        {profile.age || "Select Age"}
                        <ChevronDown className="w-4 h-4" />
                      </Listbox.Button>
                      <Listbox.Options className="absolute z-10 mt-1 max-h-60 w-full overflow-auto rounded-md bg-[#1e293b] border border-gray-600 text-sm shadow-lg">
                        {ages.map((a) => (
                          <Listbox.Option
                            key={a}
                            value={a}
                            className={({ active }) =>
                              `cursor-pointer px-2 py-1 ${
                                active ? "bg-[#f43f5e] text-white" : "text-gray-200"
                              }`
                            }
                          >
                            {({ selected }) => (
                              <div className="flex justify-between items-center">
                                {a}
                                {selected && <Check className="w-4 h-4 text-green-400" />}
                              </div>
                            )}
                          </Listbox.Option>
                        ))}
                      </Listbox.Options>
                    </div>
                  </Listbox>
                ) : (
                  <input
                    type="text"
                    name={field}
                    value={profile[field]}
                    onChange={handleChange}
                    className="w-full px-2 py-1.5 border border-gray-600 bg-[#1e293b] text-gray-200 rounded-md shadow-sm text-sm focus:ring-[#f43f5e] focus:border-[#f43f5e] outline-none"
                  />
                )
              ) : (
                <p className="bg-[#1e293b] px-2 py-1.5 rounded-md text-gray-300 border border-gray-700 text-sm">
                  {profile[field] || "Not provided"}
                </p>
              )}
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-2 pt-3">
          {editing ? (
            <>
              <button
                disabled={loading}
                className={`cursor-pointer px-4 py-2 rounded-md text-sm transition shadow ${
                  loading
                    ? "bg-green-400/50 text-white cursor-not-allowed"
                    : "bg-green-600 hover:bg-green-700 text-white"
                }`}
                onClick={saveChanges}
              >
                {loading ? "Saving..." : "Save"}
              </button>
              <button
                disabled={loading}
                className="cursor-pointer bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-md text-sm transition shadow disabled:opacity-50 disabled:cursor-not-allowed"
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
