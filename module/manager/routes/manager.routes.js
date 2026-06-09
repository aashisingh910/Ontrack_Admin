const express = require("express");
const managerController = require("../controllers/manager.controller");

const router = express.Router();

router.get("/managers", managerController.getAllManagers);
router.get("/managers/employee/:employeeCode", managerController.getManagerByEmployeeCode);
router.get("/managers/store/:storeCode", managerController.getManagerByStoreCode);
router.get("/stores/:storeIdentifier/manager", managerController.getManagerForStore);
router.post("/managers", managerController.createManager);
router.put("/stores/:storeCode/assign-manager", managerController.assignManagerToStore);

module.exports = router;
