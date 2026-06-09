const managerService = require("../services/manager.service");

const getAllManagers = async (req, res) => {
  try {
    const managers = await managerService.getAllManagers();
    return res.status(200).json({ success: true, count: managers.length, data: managers });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch managers" });
  }
};

const getManagerByEmployeeCode = async (req, res) => {
  try {
    const manager = await managerService.getManagerByEmployeeCode(req.params.employeeCode);
    return res.status(200).json({ success: true, data: manager });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch manager" });
  }
};

const getManagerByStoreCode = async (req, res) => {
  try {
    const manager = await managerService.getManagerByStoreCode(req.params.storeCode);
    return res.status(200).json({ success: true, data: manager });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch store manager" });
  }
};

const getManagerForStore = async (req, res) => {
  try {
    const manager = await managerService.getManagerForStore(req.params.storeIdentifier);
    return res.status(200).json({ success: true, data: manager });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch manager for store", store: error.store });
  }
};

const createManager = async (req, res) => {
  try {
    const manager = await managerService.createManager(req.body);
    return res.status(201).json({ success: true, message: "Manager created and mapped with store successfully", data: manager });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to create manager" });
  }
};

const assignManagerToStore = async (req, res) => {
  try {
    const { storeCode } = req.params;
    const { employeeCode } = req.body;

    if (!employeeCode) {
      return res.status(400).json({ success: false, message: "employeeCode is required" });
    }

    const result = await managerService.assignManagerToStore(storeCode, employeeCode);
    return res.status(200).json({ success: true, message: "Manager assigned to store successfully", data: result });
  } catch (error) {
    return res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to assign manager to store" });
  }
};

module.exports = {
  getAllManagers,
  getManagerByEmployeeCode,
  getManagerByStoreCode,
  getManagerForStore,
  createManager,
  assignManagerToStore,
};
