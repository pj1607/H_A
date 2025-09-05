import jsPDF from "jspdf";
import "jspdf-autotable";

const ExportPDF = (report) => {
  const doc = new jsPDF();

  // Title
  doc.setFontSize(18);
  doc.text("Symptom Report", 14, 20);

  // Report details
  doc.setFontSize(12);
  const details = [
    `Date: ${new Date(report.date).toLocaleString()}`,
    `User: ${report.user_id}`,
    `Symptoms: ${report.symptoms}`,
    `AI Suggestion: ${report.ai_suggestion}`,
    `Suggested Tests: ${report.suggested_tests?.join(", ") || "-"}`,
    `Urgency: ${report.urgency}`,
  ];

  details.forEach((line, index) => {
    doc.text(line, 14, 30 + index * 8);
  });

  // Conversation table
  doc.autoTable({
    startY: 80,
    head: [["Role", "Message"]],
    body: report.full_conversation.map((msg) => [msg.role, msg.message]),
    styles: { fontSize: 10, cellPadding: 3 },
    headStyles: { fillColor: [59, 130, 246] }, // matching blue
    theme: "grid",
  });

  // Save PDF
  const dateStr = new Date(report.date).toISOString().split("T")[0];
  doc.save(`Symptom_Report_${dateStr}.pdf`);
};

export default ExportPDF;