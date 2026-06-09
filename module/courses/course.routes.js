const router = require("express").Router();
const multer = require("multer");
const pdfParse = require("pdf-parse");
const courseController = require("./course.controller");
const auth = require("../../middleware/auth");

const upload = multer({ storage: multer.memoryStorage() });

// Attempt routes first (before /:courseId to avoid param collision)
router.post("/attempts/start", auth, courseController.startCourseAttempt);
router.post("/attempts/submit", auth, courseController.submitCourseAttempt);
router.get("/attempts/staff/:employeeCode", auth, courseController.getAttemptsByStaff);
router.get("/attempts/course/:courseId", auth, courseController.getAttemptsByCourse);
router.get("/attempts/review/pending", auth, courseController.getPendingReviewAttempts);
router.patch("/attempts/:attemptId/review", auth, courseController.reviewDescriptiveAnswers);

// PDF extraction
router.post("/extract-pdf", upload.single("pdf"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: "No file uploaded" });
  }
  try {
    const data = await pdfParse(req.file.buffer);
    res.json({ success: true, text: data.text });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: error.message });
  }
});

// Course routes
router.get("/", courseController.getAllCourses);
router.post("/", courseController.createCourse);
router.post("/:courseId/questions", auth, courseController.addQuestionToCourse);
router.get("/:courseId/progress", auth, courseController.getProgress);
router.get("/:courseId", auth, courseController.getCourse);

module.exports = router;
