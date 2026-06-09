const pdfService = require("./pdf.service");

exports.uploadPDF = pdfService.uploadPDF;

exports.extractPDFText = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    const text = await pdfService.extractTextFromPDF(req.file.buffer);
    res.json({ success: true, text });
  } catch (err) {
    console.error("PDF extraction error:", err);
    res.status(500).json({ success: false, message: err.message || "Failed to parse PDF" });
  }
};
