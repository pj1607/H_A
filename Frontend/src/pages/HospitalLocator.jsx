import React, { useState, useRef, useEffect  } from "react";
import toast from "react-hot-toast";
import { MapPin, Activity, PhoneCall, Compass } from "lucide-react";
const API = import.meta.env.VITE_API;


const HospitalLocator = () => {
  const [location, setLocation] = useState(null);
  const [places, setPlaces] = useState([]);
  const [loading, setLoading] = useState(false);
  const [selectedPlace, setSelectedPlace] = useState(null);

   const mapRef = useRef(null);

         useEffect(() => {
    if (selectedPlace && mapRef.current) {
      mapRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [selectedPlace]);

  const fetchLocationAndPlaces = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser.");
      return;
    }


    setLoading(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        setLocation({ lat, lng });

        try {
          const res = await fetch(
             `${API}/nearby-places`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({ lat, lng, tag: "hospital" }),
            }
          );
          const data = await res.json();
          setPlaces(data.places || []);
        } catch (err) {
          toast.error("Failed to fetch nearby hospitals.");
        }
        setLoading(false);
      },
      () => {
        toast.error("Location access denied or unavailable.");
        setLoading(false);
      }
    );
  };

  const extractCoords = (text) => {
    const match = text.match(/query=([-0-9.]+),([-0-9.]+)/);
    if (match) return { lat: parseFloat(match[1]), lng: parseFloat(match[2]) };
    return null;
  };

  return (
    <div className=" text-gray-200 font-sans">
      {/* Page Header */}
      <section className="py-10 px-6 flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Find <span className="text-[#f43f5e]">Nearby Hospitals</span>
          </h1>
          <p className="text-gray-400 max-w-xl">
            Get hospitals closest to your current location in just one click.
          </p>
        </div>

        {/* Fetch Button aligned right */}
        <div className="mt-6 md:mt-0">
          <button
            onClick={fetchLocationAndPlaces}
            disabled={loading}
            className={`px-6 py-2 rounded-lg font-semibold shadow-md transition transform hover:scale-[1.02] active:scale-95 ${
              loading
                ? "bg-gray-600 cursor-not-allowed"
                : "bg-[#f43f5e] hover:bg-[#be123c] text-white"
            }`}
          >
            {loading ? "Fetching nearby hospitals..." : "Find Nearby Hospitals"}
          </button>
        </div>
      </section>

      {/* Main Container */}
      <div className="flex flex-col md:flex-row gap-8 px-6 max-w-7xl mx-auto pb-12">
        {/* Left Side */}
        <div className="md:w-1/2 space-y-6">
          {/* Emergency Card (Always Visible) */}
          <div className="bg-[#1e293b] border border-red-500/30 p-6 rounded-2xl shadow-md text-center">
            <h2 className="text-xl font-bold text-red-400 flex items-center justify-center gap-2 mb-2">
              <Activity className="w-5 h-5" /> Emergency?
            </h2>
            <p className="text-gray-400 mb-4">
              If this is a medical emergency, call immediately.
            </p>
            <a href="tel:112">
              <button className="bg-red-600 hover:bg-red-700 px-6 py-2 rounded-lg text-white font-semibold shadow transition">
                <PhoneCall className="w-4 h-4 inline mr-2" />
                Call Emergency
              </button>
            </a>
          </div>

          {/* Location Info */}
          {location && (
            <div className="bg-[#0f172a] border border-gray-700 p-3 rounded-lg text-sm text-gray-400 text-center">
              <MapPin className="inline w-4 h-4 mr-2 text-[#f43f5e]" />
              Your Location: {location.lat.toFixed(4)}, {location.lng.toFixed(4)}
            </div>
          )}

          {/* Hospital List */}
          {places.length > 0 && (
            <div className="bg-[#0f172a] border border-gray-700 rounded-2xl shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4 text-[#f43f5e]">
                Nearby Hospitals
              </h2>
              <ul className="space-y-4">
                {places.map((place, idx) => {
                  const parts = place.split("\n");
                  const name = parts[0];
                  const coords = extractCoords(place);

                  return (
                    <li
                      key={idx}
                      className="bg-[#1e293b] hover:bg-[#334155] p-4 rounded-xl transition border border-gray-700"
                    >
                      <p className="font-semibold text-gray-100">{name}</p>
                      {coords && (
                        <div className="flex gap-4 mt-2 text-sm">
                          <button
                            onClick={() => setSelectedPlace(coords)}
                            className="flex items-center gap-1 text-blue-400 hover:text-blue-300"
                          >
                            <Compass className="w-4 h-4" /> View on Map
                          </button>
                          <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${coords.lat},${coords.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-green-400 hover:text-green-300"
                          >
                            <MapPin className="w-4 h-4" /> Get Directions
                          </a>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          )}

          {/* No Results */}
          {!loading && places.length === 0 && location && (
            <p className="text-center text-red-400">
              No nearby hospitals found.
            </p>
          )}
        </div>

        {/* Right Side: Map */}
        <div  ref={mapRef}  className="md:w-1/2">
          <div className="bg-[#0f172a] border border-gray-700 rounded-2xl shadow-md h-[500px] flex items-center justify-center overflow-hidden">
            {selectedPlace ? (
              <iframe
                title="Hospital Directions"
                src={`https://www.google.com/maps?q=${selectedPlace.lat},${selectedPlace.lng}&z=16&output=embed`}
                width="100%"
                height="100%"
                className="rounded-2xl"
                allowFullScreen
              ></iframe>
            ) : (
              <p className="text-gray-500">Select a hospital to preview on map</p>
            )}
          </div>
        </div>
      </div>

   
    </div>
  );
};

export default HospitalLocator;