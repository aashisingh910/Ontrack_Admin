const managerDashboardService = require("./managerDashboard.service");

exports.getManagerDashboard = async (req, res) => {
  try {
    const data = await managerDashboardService.getManagerDashboard({
      manager: req.user,
      targetMonth: req.query.targetMonth,
      attendanceDate: req.query.attendanceDate,
      incentiveMonth: req.query.incentiveMonth,
    });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to load manager dashboard",
    });
  }
};
