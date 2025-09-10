import React, { useEffect, useState, Fragment } from "react";
import { Dialog, Transition } from "@headlessui/react";
import toast from "react-hot-toast";
import ExportPDF from "./ExportPDF";
import HealthSummary from "./HealthSummary";
const API = import.meta.env.VITE_API;

const SymptomHistory = ({ userPhone }) => {
  const [reports, setReports] = useState([]);
  const [selectedReport, setSelectedReport] = useState(null);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState(null);

  // Fetch reports
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/get-reports`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: userPhone }),
      });
      const data = await res.json();
      setReports(data.reports || []);
    } catch (err) {
      toast.error("Failed to fetch reports.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [userPhone]);

  const closeModal = () => setIsOpen(false);
  const openModal = (report) => {
    setSelectedReport(report);
    setIsOpen(true);
  };

  const openDeleteModal = (report) => {
    setReportToDelete(report);
    setDeleteModalOpen(true);
  };

  const closeDeleteModal = () => {
    setReportToDelete(null);
    setDeleteModalOpen(false);
  };

  // Delete report
  const deleteReport = async () => {
    if (!reportToDelete) return;

    setLoading(true);
    try {
      const res = await fetch(`${API}/delete-report/${reportToDelete._id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Report deleted successfully");
        setReports(reports.filter((rep) => rep._id !== reportToDelete._id));
        closeDeleteModal();
      } else {
        toast.error("Failed to delete report.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting report.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4 bg-gradient-to-b from-gray-900 to-gray-800 rounded-xl shadow-xl text-gray-200">
      <h2 className="text-xl font-bold mb-4">🧾 Symptom Checker History</h2>

      {/* Loading indicator */}
      {loading && (
        <div className="mb-2 text-sm text-gray-400">Loading...</div>
      )}

      <div className="overflow-auto max-h-[400px] border border-gray-700 rounded-xl shadow-xl">
        <table className="min-w-full text-left border-collapse">
          <thead className="bg-gray-800 sticky top-0 z-10">
            <tr>
              <th className="p-2 border border-gray-700">Date</th>
              <th className="p-2 border border-gray-700">Main Symptoms</th>
              <th className="p-2 border border-gray-700">AI Suggestion</th>
              <th className="p-2 border border-gray-700">Tests</th>
              <th className="p-2 border border-gray-700">Urgency</th>
              <th className="p-2 border border-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r) => (
              <tr key={r._id} className="hover:bg-gray-700 transition-colors">
                <td className="p-2 border border-gray-700">{new Date(r.date).toLocaleString()}</td>
                <td className="p-2 border border-gray-700">{r.symptoms}</td>
                <td className="p-2 border border-gray-700">{r.ai_suggestion}</td>
                <td className="p-2 border border-gray-700">{r.suggested_tests?.join(", ") || "-"}</td>
                <td className="p-2 border border-gray-700">{r.urgency}</td>
                <td className="p-2 border border-gray-700 space-x-2">
                  <div className="flex flex-col sm:flex-row flex-wrap gap-2">
                    <button
                      className="cursor-pointer bg-blue-500 hover:bg-blue-600 active:scale-95 transition-all px-3 py-1 text-white rounded-xl shadow"
                      onClick={() => openModal(r)}
                    >
                      View Report
                    </button>
                    <button
                      className="cursor-pointer bg-green-500 hover:bg-green-600 active:scale-95 transition-all px-3 py-1 text-white rounded-xl shadow"
                      onClick={() => ExportPDF(r)}
                    >
                      Export PDF
                    </button>
                    <button
                      className="cursor-pointer bg-red-500 hover:bg-red-600 active:scale-95 transition-all px-3 py-1 text-white rounded-xl shadow"
                      onClick={() => openDeleteModal(r)}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal for Report */}
      <Transition appear show={isOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left shadow-xl transition-all text-gray-200">
                <Dialog.Title className="text-lg font-bold mb-4">🩺 Full Symptom Report</Dialog.Title>
                <div className="space-y-2 text-sm max-h-96 overflow-y-auto">
                  {selectedReport?.full_conversation?.map((msg, index) => (
                    <div
                      key={index}
                      className={`p-2 rounded-xl ${msg.role === "user" ? "bg-blue-800" : "bg-gray-800"}`}
                    >
                      <strong>{msg.role === "user" ? "You" : "Assistant"}:</strong> {msg.message}
                    </div>
                  ))}
                </div>
                <div className="mt-4 text-right">
                  <button
                    onClick={closeModal}
                    className="cursor-pointer bg-gray-600 hover:bg-gray-700 text-white px-4 py-2 rounded-xl shadow"
                  >
                    Close
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

      {/* Delete Confirm Modal */}
      <Transition appear show={deleteModalOpen} as={Fragment}>
        <Dialog as="div" className="relative z-10" onClose={closeDeleteModal}>
          <Transition.Child
            as={Fragment}
            enter="ease-out duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="ease-in duration-200"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-black/50" />
          </Transition.Child>

          <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
              <Dialog.Panel className="w-full max-w-md transform overflow-hidden rounded-2xl bg-gray-900 p-6 text-left shadow-xl transition-all text-gray-200">
                <Dialog.Title className="text-lg font-bold mb-4">Confirm Delete</Dialog.Title>
                <p>Are you sure you want to delete this report? This action cannot be undone.</p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    onClick={closeDeleteModal}
                    className=" cursor-pointer px-4 py-2 bg-gray-600 hover:bg-gray-700 rounded-xl text-white shadow"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={deleteReport}
                    className={`cursor-pointer px-4 py-2 bg-red-500 hover:bg-red-600 rounded-xl text-white shadow ${
                      loading ? "opa city-50 cursor-not-allowed" : ""
                    }`}
                    disabled={loading}
                  >
                    {loading ? "Deleting..." : "Delete"}
                  </button>
                </div>
              </Dialog.Panel>
            </div>
          </div>
        </Dialog>
      </Transition>

      <HealthSummary reports={reports} />
    </div>
  );
};

export default SymptomHistory;
