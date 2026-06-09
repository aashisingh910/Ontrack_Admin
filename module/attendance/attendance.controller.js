const attendanceService = require("./attendance.service");

exports.checkIn = async (req, res) => {
  const { storeCode } = req.body;
  const userId = req.user.id; // from auth middleware
  const record = await attendanceService.markCheckIn(userId, storeCode);
  res.status(200).json({ success: true, data: record });
};

exports.checkOut = async (req, res) => {
  const userId = req.user.id;
  const record = await attendanceService.markCheckOut(userId);
  res.status(200).json({ success: true, data: record });
};

exports.bulkMark = async (req, res) => {
  const { date, attendanceList } = req.body;
  const result = await attendanceService.bulkMark(date, attendanceList);
  res.status(200).json({ success: true, result });
};

exports.getToday = async (req, res) => {
  const { storeCode } = req.query;
  const data = await attendanceService.getTodayAttendance(storeCode);
  res.status(200).json({ success: true, data });
};

exports.getUserHistory = async (req, res) => {
  const { userId } = req.params;
  const { startDate, endDate } = req.query;
  const records = await attendanceService.getUserAttendance(userId, startDate, endDate);
  res.status(200).json({ success: true, count: records.length, data: records });
};

exports.getTrend = async (req, res) => {
  const { storeCode, days } = req.query;
  const trend = await attendanceService.getTrend(storeCode, days ? parseInt(days) : 7);
  res.status(200).json({ success: true, data: trend });
};