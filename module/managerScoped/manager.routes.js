const router = require("express").Router();
const auth = require("../../middleware/auth");
const requireRole = require("../../middleware/role");
const ctrl = require("./manager.controller");

// All routes require a valid MANAGER token
router.use(auth);
router.use(requireRole("MANAGER"));

router.get("/dashboard",   ctrl.getDashboard);
router.get("/staff",       ctrl.getStaff);
router.get("/attendance",  ctrl.getAttendance);
router.get("/targets",     ctrl.getTargets);
router.get("/courses",     ctrl.getCourses);
router.get("/notices",     ctrl.getNotices);
router.get("/incentives",  ctrl.getIncentives);

router.get("/staff-targets",              ctrl.getStaffTargets);
router.post("/staff-targets",             ctrl.assignStaffTarget);
router.put("/staff-targets/:targetId",    ctrl.updateStaffTarget);

router.patch("/incentives/:incentiveId/approve",       ctrl.approveIncentive);
router.patch("/incentives/:incentiveId/reject",        ctrl.rejectIncentive);
router.patch("/incentives/:incentiveId/send-to-admin", ctrl.sendIncentiveToAdmin);

module.exports = router;
