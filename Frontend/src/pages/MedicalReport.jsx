import React, { useState } from "react";
import Tesseract from "tesseract.js";
import toast from "react-hot-toast";
const API = import.meta.env.VITE_API;
const MedicalReport = () => {
  const [image, setImage] = useState(null);
  const [extractedText, setExtractedText] = useState("");
  const [loading, setLoading] = useState(false);
  const phone = localStorage.getItem("phone");

  const handleSingleUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) {
      toast.error("No file selected.");
      return;
    }

    setImage(URL.createObjectURL(file));
    setExtractedText("");
    setLoading(true);

    try {
      const result = await Tesseract.recognize(file, "eng", {
        logger: (m) => console.log(m),
      });
      const ocrText = result.data.text;
      await handleOCRResult(ocrText);
    } catch (err) {
      console.error("OCR error:", err);
      setExtractedText("Failed to read image.");
      toast.error("Failed to extract text from image.");
    } finally {
      setLoading(false);
    }
  };

  const sendOCRTextToBackend = async (text) => {
    try {
      const formData = new FormData();
      formData.append("ocr_text", text);
      formData.append("phone", phone);

      const res = await fetch(
        `${API}/rag-summary`,
        {
          method: "POST",
          body: formData,
        }
      );
      const data = await res.json();
      return data.summary;
    } catch (err) {
      console.error("Backend error:", err);
      toast.error("Failed to summarize report.");
    }
  };

  const handleOCRResult = async (text) => {
    const summary = await sendOCRTextToBackend(text);
    setExtractedText(summary || "No summary available.");
  };

  const generateWhatsAppLink = (summary) => {
    const phoneNumber = ""; // Optional: set default doctor number
    const encodedMessage = encodeURIComponent(summary);
    return `https://wa.me/${phoneNumber}?text=${encodedMessage}`;
  };

  return (
    <div className=" text-gray-200">
      {/* Page Header */}
      <section className="py-10 px-6 flex flex-col md:flex-row items-center justify-between max-w-6xl mx-auto">
        <div className="text-center md:text-left">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">
            Upload <span className="text-[#f43f5e]">Medical Report</span>
          </h1>
          <p className="text-gray-400 max-w-xl">
            Extract and summarize your medical report instantly.
          </p>
        </div>

        {/* Upload Button aligned right */}
        <div className="mt-6 md:mt-0">
          <label
            htmlFor="fileUpload"
            className="flex items-center justify-center gap-2 px-6 py-2 rounded-lg font-semibold cursor-pointer shadow-md transition transform hover:scale-[1.02] active:scale-95 bg-[#f43f5e] hover:bg-[#be123c] text-white"
          >
            Choose Report Image
          </label>
          <input
            id="fileUpload"
            type="file"
            accept="image/*"
            onChange={handleSingleUpload}
            className="hidden"
          />
        </div>
      </section>

      {/* Report Container (only when there’s content) */}
      {(image || loading || extractedText) && (
        <div className="max-w-3xl mx-auto bg-[#0f172a] border border-gray-700 rounded-2xl shadow-md p-6 space-y-6">
          {/* Preview */}
          {image && (
            <div className="flex justify-center">
              <img
                src={image}
                alt="Uploaded"
                className="max-h-80 rounded-xl shadow-md border border-gray-600 object-contain"
              />
            </div>
          )}

          {/* Loading */}
          {loading && (
            <p className="text-center text-gray-400 animate-pulse">
              Extracting text from report...
            </p>
          )}

          {/* Summary */}
          {!loading && extractedText && (
            <div className="bg-[#1e293b] p-6 rounded-xl shadow border border-gray-700 space-y-3">
              <h3 className="text-xl font-semibold text-[#f43f5e]">
                Medical Summary
              </h3>
              <p className="text-sm text-gray-300 whitespace-pre-line leading-relaxed">
                {extractedText}
              </p>
              <p className="text-xs text-gray-500 italic">
                *Consult a doctor if you are unsure.*
              </p>
              <div className="text-right">
                <a
                  href={generateWhatsAppLink(extractedText)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block mt-2 px-4 py-2 text-sm bg-green-600 hover:bg-green-700 text-white rounded-lg transition shadow"
                >
                  Share on WhatsApp
                </a>
              </div>
            </div>
          )}
        </div>
      )}

    </div>
  );
};

export default MedicalReport;