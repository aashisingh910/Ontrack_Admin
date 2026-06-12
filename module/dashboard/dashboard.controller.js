const dashboardService = require("./dashboard.service");

exports.getAdminDashboard = async (req, res) => {
  try {
    const data = await dashboardService.getDashboardData(req.query);
    res.status(200).json({ success: true, data });
  } catch (error) {
    console.error("Dashboard error:", error);
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to load dashboard",
    });
  }
};
