const router = require("express").Router();
const dashboardController = require("./dashboard.controller");
const auth = require("../../middleware/auth");

router.get("/admin", dashboardController.getAdminDashboard);

module.exports = router;
