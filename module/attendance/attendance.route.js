const router = require("express").Router();
const attendanceController = require("./attendance.controller");
const auth = require("../../middleware/auth");

// All routes protected
router.post("/check-in", auth, attendanceController.checkIn);
router.post("/check-out", auth, attendanceController.checkOut);
router.post("/bulk", auth, attendanceController.bulkMark);          // admin only (add role check)

router.get("/today", auth, attendanceController.getToday);
router.get("/trend", auth, attendanceController.getTrend);
router.get("/user/:userId", auth, attendanceController.getUserHistory);

module.exports = router;