const _pdfParse = require("pdf-parse");
// pdf-parse may export the function directly or nest it under .default
const pdfParse = typeof _pdfParse === "function" ? _pdfParse : _pdfParse.default;
const multer = require("multer");

exports.uploadPDF = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB
}).single("pdf");

exports.extractTextFromPDF = async (buffer) => {
  if (typeof pdfParse !== "function") {
    throw new Error("pdf-parse module did not export a callable function — try reinstalling it");
  }
  const data = await pdfParse(buffer);
  return data.text;
};
