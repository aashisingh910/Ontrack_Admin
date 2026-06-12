const router = require("express").Router();
const userController = require("./user.controller");
const auth = require("../../middleware/auth");

// Public routes
router.post("/register", userController.createUser);
router.post("/login", userController.login);
router.post("/forgot-password", userController.forgotPassword);
router.post("/reset-password", userController.resetPassword);

// Protected routes
router.get("/me", auth, userController.getMe);
router.get("/", auth, userController.getAllUsers);
router.get("/managers", auth, userController.getManagers);

// Staff routes (must be before /:id)
router.post("/staff", userController.createStaff);
router.get("/staff", auth, userController.getStaff);
router.get("/staff/weekly-off/list", auth, userController.getStaffWeeklyOff);
router.get("/staff/store/:storeCode", userController.getStaffByStore);
router.get("/staff/employee/:employeeCode", userController.getStaffByEmployeeCode);

// User by id (must come after all specific routes)
router.get("/:id", userController.getUser);
router.put("/:id", userController.updateUser);
router.patch("/:id/deactivate", userController.deactivateUser);

module.exports = router;
