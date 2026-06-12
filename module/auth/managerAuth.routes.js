const router = require("express").Router();
const managerAuthController = require("./managerAuth.controller");
const auth = require("../../middleware/auth");
const Manager = require("../manager/models/manager.model");

// Logged-in user check
router.get("/me", auth, managerAuthController.getMe);

// Manager login without password
router.post("/manager/login", managerAuthController.loginManagerWithoutPassword);

// Debug: list all active managers — remove after verifying MongoDB connection
router.get("/manager/debug/list", async (req, res) => {
  try {
    const managers = await Manager.find({ role: "MANAGER", status: "ACTIVE" })
      .select("employeeCode name email contactNumber role storeCode storeName status city region")
      .sort({ storeCode: 1 })
      .lean();
    res.status(200).json({ success: true, count: managers.length, data: managers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to fetch manager list" });
  }
});

// Debug: show test login bodies for all active managers
router.get("/manager/debug/test-logins", async (req, res) => {
  try {
    const managers = await Manager.find({ role: "MANAGER", status: "ACTIVE" })
      .select("employeeCode name email contactNumber storeCode storeName city region")
      .sort({ storeCode: 1 })
      .lean();

    const data = managers.map((m) => ({
      canLogin:
        Boolean(m.employeeCode) &&
        Boolean(m.email) &&
        Boolean(m.contactNumber) &&
        Boolean(m.storeCode),
      name: m.name,
      storeCode: m.storeCode,
      storeName: m.storeName,
      loginByEmail: { identifier: m.email },
      loginByEmployeeCode: { identifier: m.employeeCode },
      loginByMobile: { identifier: m.contactNumber },
    }));

    res.status(200).json({ success: true, count: data.length, data });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message || "Failed to test manager logins" });
  }
});

module.exports = router;
