require("dotenv").config();
require("express-async-errors");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const path = require("path");

// Import routes
const userRoutes = require("./module/user/user.route");
const attendanceRoutes = require("./module/attendance/attendance.routes");
const storeRoutes = require("./module/store/store.routes");
const managerRoutes = require("./module/manager/routes/manager.routes");
const courseRoutes = require("./module/courses/course.routes");
const targetRoutes = require("./module/targets/target.routes");
const dashboardRoutes = require("./module/dashboard/dashboard.routes");
const noticeRoutes = require("./module/notices/notice.routes");
const incentiveRoutes = require("./module/incentives/incentive.routes");
const managerAuthRoutes = require("./module/auth/managerAuth.routes");
const managerDashboardRoutes = require("./module/managerDashboard/managerDashboard.routes");
const managerScopedRoutes = require("./module/managerScoped/manager.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/aashi/users", userRoutes);
app.use("/api/aashi/attendance", attendanceRoutes);
app.use("/api/aashi/stores", storeRoutes);
app.use("/api/aashi", managerRoutes);
app.use("/api/aashi/courses", courseRoutes);
app.use("/api/aashi/targets", targetRoutes);
app.use("/api/aashi/dashboard", dashboardRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));
app.use("/api/aashi/notices", noticeRoutes);
app.use("/api/aashi/incentives", incentiveRoutes);
app.use("/api/aashi/auth", managerAuthRoutes);
// Unified manager-scoped API (token → store resolution, MANAGER role required)
app.use("/api/aashi/manager", managerScopedRoutes);
// Legacy single-endpoint dashboard — kept for backward compat, superseded above
app.use("/api/aashi/manager/dashboard", managerDashboardRoutes);

app.get("/", (req, res) => {
  res.json({ success: true, message: "OnTrack backend running" });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal Server Error",
  });
});

const PORT = process.env.PORT || 5002;
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch((err) => {
    console.error("DB connection error:", err);
    process.exit(1);
  });