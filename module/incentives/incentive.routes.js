const router = require("express").Router();
const incentiveController = require("./incentive.controller");
const auth = require("../../middleware/auth");
const requireRole = require("../../middleware/role");

// List incentives. Admin sees all; Manager sees only own store (service uses req.user.storeCode).
router.get("/", auth, incentiveController.getIncentives);

// Dynamic store summary from incentives collection only.
router.get("/summary/store", auth, incentiveController.getStoreIncentiveSummary);

// Staff/self incentives.
router.get("/my/:employeeCode", auth, incentiveController.getMyIncentives);

// Create incentive — admin/system use.
router.post("/", auth, incentiveController.createIncentive);

// Detail with manager store restriction.
router.get("/:incentiveId", auth, incentiveController.getIncentiveById);

// Manager can approve only own store incentive.
router.patch("/:incentiveId/manager-approve", auth, requireRole("MANAGER"), incentiveController.managerApproveIncentive);
// Alias used by the manager UI (POST /:id/approve → same logic)
router.post("/:incentiveId/approve", auth, requireRole("MANAGER"), incentiveController.managerApproveIncentive);

// Admin approval.
router.patch("/:incentiveId/admin-approve", auth, requireRole("ADMIN"), incentiveController.adminApproveIncentive);

// Admin/finance marks payout paid.
router.patch("/:incentiveId/mark-paid", auth, requireRole("ADMIN"), incentiveController.markIncentivePaid);

module.exports = router;
