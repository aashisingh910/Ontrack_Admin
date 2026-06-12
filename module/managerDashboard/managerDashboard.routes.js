const router = require("express").Router();
const auth = require("../../middleware/auth");
const requireRole = require("../../middleware/role");
const managerDashboardController = require("./managerDashboard.controller");

router.get("/", auth, requireRole("MANAGER"), managerDashboardController.getManagerDashboard);

module.exports = router;
