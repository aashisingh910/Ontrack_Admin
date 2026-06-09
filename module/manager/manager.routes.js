const express = require("express");
const managerController = require("./manager.controller");

const router = express.Router();

/**
 * Get manager by storeCode or store MongoDB _id
 * GET /api/aashi/stores/:storeIdentifier/manager
 *
 * Example:
 * GET /api/aashi/stores/6095/manager
 * GET /api/aashi/stores/6a22a3ad7e47d0eaea16d2f6/manager
 */
router.get(
  "/stores/:storeIdentifier/manager",
  managerController.getManagerByStore
);

/**
 * Get all managers
 * GET /api/aashi/managers
 */
router.get("/managers", managerController.getAllManagers);

/**
 * Get manager by employeeCode
 * GET /api/aashi/managers/:employeeCode
 *
 * Example:
 * GET /api/aashi/managers/338092
 */
router.get(
  "/managers/:employeeCode",
  managerController.getManagerByEmployeeCode
);

/**
 * Create manager and link to store
 * POST /api/aashi/managers
 */
router.post("/managers", managerController.createManager);

/**
 * Assign existing manager to store
 * PUT /api/aashi/stores/:storeCode/assign-manager
 */
router.put(
  "/stores/:storeCode/assign-manager",
  managerController.assignManagerToStore
);

module.exports = router;