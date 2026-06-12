const router = require("express").Router();
const targetController = require("./target.controller");
const auth = require("../../middleware/auth");

// Remove auth temporarily for Postman testing if needed.

// Admin assign monthly target and auto-create daily targets
router.post("/monthly", targetController.createMonthlyTarget);

// List targets — manager-scoped via req.user.storeCode in service
router.get("/monthly", auth, targetController.getMonthlyTargets);
router.get("/daily", auth, targetController.getDailyTargets);

// Get target by store
router.get(
  "/monthly/:storeCode/:targetMonth",
  auth,
  targetController.getMonthlyTargetByStore
);

router.get(
  "/daily/:storeCode/:date",
  auth,
  targetController.getDailyTargetByStoreDate
);

// Update assigned targets (used by admin UI)
router.put("/monthly/:targetId", auth, targetController.updateMonthlyTarget);
router.put("/daily/:dailyTargetId", auth, targetController.updateDailyTarget);

// Update daily actual sales and auto-update monthly progress
router.patch(
  "/daily/update-sales",
  auth,
  targetController.updateDailyActualSales
);

// Predict next month
router.post("/predict-next-month", auth, targetController.predictNextMonthTarget);

module.exports = router;