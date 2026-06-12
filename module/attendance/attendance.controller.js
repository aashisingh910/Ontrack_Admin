const attendanceService = require("./attendance.service");

exports.getAttendanceList = async (req, res) => {
  try {
    const attendance = await attendanceService.getAttendanceList(req.query, req.user);
    res.status(200).json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch attendance" });
  }
};

exports.getAttendanceById = async (req, res) => {
  try {
    const attendance = await attendanceService.getAttendanceById(req.params.attendanceId);
    res.status(200).json({ success: true, data: attendance });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch attendance" });
  }
};

exports.getMyAttendance = async (req, res) => {
  try {
    const { employeeCode } = req.params;
    const { month } = req.query;
    const attendance = await attendanceService.getMyAttendance(employeeCode, month);
    res.status(200).json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch my attendance" });
  }
};

exports.getStoreAttendance = async (req, res) => {
  try {
    const { storeCode } = req.params;
    const { date } = req.query;
    const attendance = await attendanceService.getStoreAttendance(storeCode, date);
    res.status(200).json({ success: true, count: attendance.length, data: attendance });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch store attendance" });
  }
};

exports.checkIn = async (req, res) => {
  try {
    const attendance = await attendanceService.checkIn(req.body);
    res.status(201).json({ success: true, message: "Check-in successful", data: attendance });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Check-in failed" });
  }
};

exports.checkOut = async (req, res) => {
  try {
    const attendance = await attendanceService.checkOut(req.body);
    res.status(200).json({ success: true, message: "Check-out successful", data: attendance });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Check-out failed" });
  }
};

exports.markAttendance = async (req, res) => {
  try {
    const attendance = await attendanceService.markAttendance(req.body);
    res.status(201).json({ success: true, message: "Attendance marked successfully", data: attendance });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to mark attendance" });
  }
};

exports.requestCorrection = async (req, res) => {
  try {
    const attendance = await attendanceService.requestCorrection(req.body);
    res.status(200).json({ success: true, message: "Correction request submitted", data: attendance });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to submit correction request" });
  }
};

exports.approveCorrection = async (req, res) => {
  try {
    const attendance = await attendanceService.approveCorrection(req.body);
    res.status(200).json({ success: true, message: "Correction request updated", data: attendance });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to approve correction" });
  }
};

exports.approveAttendance = async (req, res) => {
  try {
    const attendance = await attendanceService.approveAttendance(req.body);
    res.status(200).json({ success: true, message: "Attendance approval updated", data: attendance });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to update approval" });
  }
};

exports.getDailySummary = async (req, res) => {
  try {
    const summary = await attendanceService.getDailySummary(req.query);
    res.status(200).json({ success: true, count: summary.length, data: summary });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch daily summary" });
  }
};

exports.getMonthlySummary = async (req, res) => {
  try {
    const summary = await attendanceService.getMonthlySummary(req.query);
    res.status(200).json({ success: true, count: summary.length, data: summary });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch monthly summary" });
  }
};
