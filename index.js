require("dotenv").config();
require("express-async-errors");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Import routes
const userRoutes = require("./module/user/user.route");
//const attendanceRoutes = require("./module/attendance/attendance.route");
const storeRoutes = require("./module/store/store.routes");
const managerRoutes = require("./module/manager/routes/manager.routes");
const courseRoutes = require("./module/courses/course.routes");
const targetRoutes = require("./module/targets/target.routes");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use("/api/aashi/users", userRoutes);
//app.use("/api/attendance", attendanceRoutes);
app.use("/api/aashi/stores", storeRoutes);
app.use("/api/aashi", managerRoutes);
app.use("/api/aashi/courses", courseRoutes);
app.use("/api/aashi/targets", targetRoutes);

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