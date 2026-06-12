const router = require("express").Router();
const attendanceController = require("./attendance.controller");
const auth = require("../../middleware/auth");

// Punch
router.post("/check-in", auth, attendanceController.checkIn);
router.post("/check-out", auth, attendanceController.checkOut);

// Manual mark
router.post("/mark", auth, attendanceController.markAttendance);

// Correction and approval
router.post("/correction/request", auth, attendanceController.requestCorrection);
router.patch("/correction/approve", auth, attendanceController.approveCorrection);
router.patch("/approval", auth, attendanceController.approveAttendance);

// Summaries
router.get("/summary/daily", auth, attendanceController.getDailySummary);
router.get("/summary/monthly", auth, attendanceController.getMonthlySummary);

// List and detail
router.get("/", auth, attendanceController.getAttendanceList);
router.get("/my/:employeeCode", auth, attendanceController.getMyAttendance);
router.get("/store/:storeCode", auth, attendanceController.getStoreAttendance);
router.get("/:attendanceId", auth, attendanceController.getAttendanceById);

module.exports = router;
