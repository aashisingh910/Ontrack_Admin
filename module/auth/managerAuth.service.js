const jwt = require("jsonwebtoken");
const Manager = require("../manager/models/manager.model");

const normalizeIdentifier = (identifier) => String(identifier || "").trim();

const loginManagerWithoutPassword = async ({ identifier }) => {
  const value = normalizeIdentifier(identifier);

  if (!value) {
    const error = new Error("Email, mobile number, or employee code is required");
    error.statusCode = 400;
    throw error;
  }

  const manager = await Manager.findOne({
    role: "MANAGER",
    status: "ACTIVE",
    $or: [
      { email: value.toLowerCase() },
      { contactNumber: value },
      { employeeCode: value },
      { managerId: value },
      { managerEmail: value.toLowerCase() },
      { managerContactNumber: value },
    ],
  }).lean();

  if (!manager) {
    const error = new Error("Manager not found or inactive");
    error.statusCode = 404;
    throw error;
  }

  if (!manager.storeCode) {
    const error = new Error("Manager is not mapped with any store");
    error.statusCode = 400;
    throw error;
  }

  const tokenPayload = {
    id: String(manager._id),
    employeeCode: manager.employeeCode,
    name: manager.name,
    email: manager.email,
    contactNumber: manager.contactNumber,
    role: "MANAGER",
    storeCode: manager.storeCode,
    storeName: manager.storeName,
    city: manager.city,
    region: manager.region,
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: "30d",
  });

  return {
    token,
    expiresIn: "30d",
    user: {
      id: String(manager._id),
      employeeCode: manager.employeeCode,
      name: manager.name,
      email: manager.email,
      contactNumber: manager.contactNumber,
      role: "MANAGER",
      designation: manager.designation,
      department: manager.department,
      storeCode: manager.storeCode,
      storeName: manager.storeName,
      city: manager.city,
      region: manager.region,
      managerId: manager.managerId,
      managerName: manager.managerName || manager.name,
      managerEmail: manager.managerEmail || manager.email,
      managerContactNumber: manager.managerContactNumber || manager.contactNumber,
      assignedStore: manager.assignedStore || {
        storeCode: manager.storeCode,
        storeName: manager.storeName,
        city: manager.city,
        region: manager.region,
      },
    },
  };
};

module.exports = {
  loginManagerWithoutPassword,
};
