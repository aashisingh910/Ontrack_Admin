const managerService = require("./manager.service");

const getManagerByStore = async (req, res) => {
  try {
    const { storeIdentifier } = req.params;

    const manager = await managerService.getManagerByStore(storeIdentifier);

    return res.status(200).json({
      success: true,
      data: manager,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch store manager",
      store: error.store,
    });
  }
};

const getAllManagers = async (req, res) => {
  try {
    const managers = await managerService.getAllManagers();

    return res.status(200).json({
      success: true,
      count: managers.length,
      data: managers,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch managers",
    });
  }
};

const getManagerByEmployeeCode = async (req, res) => {
  try {
    const { employeeCode } = req.params;

    const manager = await managerService.getManagerByEmployeeCode(employeeCode);

    return res.status(200).json({
      success: true,
      data: manager,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch manager",
    });
  }
};

const createManager = async (req, res) => {
  try {
    const manager = await managerService.createManager(req.body);

    return res.status(201).json({
      success: true,
      message: "Manager created and linked with store successfully",
      data: manager,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({
        success: false,
        message: "Duplicate manager or email already exists",
      });
    }

    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create manager",
    });
  }
};

const assignManagerToStore = async (req, res) => {
  try {
    const { storeCode } = req.params;
    const { employeeCode } = req.body;

    const result = await managerService.assignManagerToStore(
      storeCode,
      employeeCode
    );

    return res.status(200).json({
      success: true,
      message: "Manager assigned to store successfully",
      data: result,
    });
  } catch (error) {
    return res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to assign manager",
    });
  }
};

module.exports = {
  getManagerByStore,
  getAllManagers,
  getManagerByEmployeeCode,
  createManager,
  assignManagerToStore,
};