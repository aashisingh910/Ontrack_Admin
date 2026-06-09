const mongoose = require("mongoose");
const Manager = require("../models/manager.model");
const Store = require("../models/store.model");

const normalizeMongoValue = (value) => {
  if (!value) return value;
  if (typeof value === "object" && value.$oid) return value.$oid;
  if (typeof value === "object" && value.$date) return value.$date;
  return value;
};

const formatManager = (manager) => {
  if (!manager) return null;

  return {
    _id: normalizeMongoValue(manager._id),
    employeeCode: manager.employeeCode,
    name: manager.name,
    email: manager.email,
    contactNumber: manager.contactNumber,
    role: manager.role || "MANAGER",
    designation: manager.designation || "Store Manager",
    department: manager.department || "OPERATIONS",
    storeCode: manager.storeCode,
    storeName: manager.storeName,
    city: manager.city,
    region: manager.region,
    status: manager.status || "ACTIVE",
    createdAt: normalizeMongoValue(manager.createdAt),
    updatedAt: normalizeMongoValue(manager.updatedAt),
    managerId: manager.managerId || manager.employeeCode,
    managerName: manager.managerName || manager.name,
    managerEmail: manager.managerEmail || manager.email,
    managerContactNumber: manager.managerContactNumber || manager.contactNumber,
    assignedStore: manager.assignedStore || {
      storeCode: manager.storeCode,
      storeName: manager.storeName,
      city: manager.city,
      region: manager.region,
    },
    reportingManager: manager.reportingManager || null,
  };
};

const getAllManagers = async () => {
  const managers = await Manager.find({ role: "MANAGER" })
    .sort({ storeCode: 1, name: 1 })
    .lean();
  return managers.map(formatManager);
};

const getManagerByEmployeeCode = async (employeeCode) => {
  const manager = await Manager.findOne({
    role: "MANAGER",
    $or: [{ employeeCode }, { managerId: employeeCode }],
  }).lean();

  if (!manager) {
    const error = new Error("Manager not found");
    error.statusCode = 404;
    throw error;
  }

  return formatManager(manager);
};

const getManagerByStoreCode = async (storeCode) => {
  const manager = await Manager.findOne({
    role: "MANAGER",
    storeCode: String(storeCode),
  }).lean();

  if (!manager) {
    const error = new Error("Manager not found for this store");
    error.statusCode = 404;
    throw error;
  }

  return formatManager(manager);
};

const getManagerForStore = async (storeIdentifier) => {
  let store = null;

  if (mongoose.Types.ObjectId.isValid(storeIdentifier)) {
    store = await Store.findById(storeIdentifier).lean();
  }

  if (!store) {
    store = await Store.findOne({ storeCode: String(storeIdentifier) }).lean();
  }

  if (!store) {
    const error = new Error("Store not found");
    error.statusCode = 404;
    throw error;
  }

  let manager = null;

  if (store.managerId) {
    manager = await Manager.findOne({
      role: "MANAGER",
      $or: [
        { employeeCode: String(store.managerId) },
        { managerId: String(store.managerId) },
      ],
    }).lean();
  }

  if (!manager) {
    manager = await Manager.findOne({
      role: "MANAGER",
      storeCode: String(store.storeCode),
    }).lean();
  }

  if (!manager) {
    const error = new Error("Manager not mapped with this store");
    error.statusCode = 404;
    error.store = {
      _id: normalizeMongoValue(store._id),
      storeCode: store.storeCode,
      storeName: store.storeName,
      managerId: store.managerId,
    };
    throw error;
  }

  return formatManager(manager);
};

const createManager = async (payload) => {
  const {
    employeeCode,
    name,
    email,
    contactNumber,
    storeCode,
    designation = "Store Manager",
    department = "OPERATIONS",
    status = "ACTIVE",
  } = payload;

  if (!employeeCode || !name || !email || !storeCode) {
    const error = new Error("employeeCode, name, email and storeCode are required");
    error.statusCode = 400;
    throw error;
  }

  const store = await Store.findOne({ storeCode: String(storeCode).trim() });

  if (!store) {
    const error = new Error("Store not found for given storeCode");
    error.statusCode = 404;
    throw error;
  }

  const existingManager = await Manager.findOne({
    $or: [
      { employeeCode: String(employeeCode).trim() },
      { email: String(email).trim().toLowerCase() },
    ],
  });

  if (existingManager) {
    const error = new Error("Manager already exists with this employeeCode or email");
    error.statusCode = 409;
    throw error;
  }

  const manager = await Manager.create({
    employeeCode: String(employeeCode).trim(),
    name: String(name).trim(),
    email: String(email).trim().toLowerCase(),
    contactNumber: String(contactNumber || "").trim(),
    role: "MANAGER",
    designation,
    department,
    storeCode: store.storeCode,
    storeName: store.storeName,
    city: store.city,
    region: store.region,
    status,
    managerId: String(employeeCode).trim(),
    managerName: String(name).trim(),
    managerEmail: String(email).trim().toLowerCase(),
    managerContactNumber: String(contactNumber || "").trim(),
    assignedStore: {
      storeCode: store.storeCode,
      storeName: store.storeName,
      city: store.city,
      region: store.region,
    },
    reportingManager: null,
  });

  store.managerId = manager.employeeCode;
  store.managerName = manager.name;
  store.managerEmail = manager.email;
  store.managerContactNumber = manager.contactNumber;
  store.manager = {
    name: manager.name,
    email: manager.email,
    contactNumber: manager.contactNumber,
  };

  await store.save();

  return formatManager(manager.toObject());
};

const updateStoreManagerFields = async (storeCode, manager) => {
  const updatedStore = await Store.findOneAndUpdate(
    { storeCode: String(storeCode) },
    {
      $set: {
        managerId: manager.employeeCode,
        managerName: manager.name,
        managerEmail: manager.email,
        managerContactNumber: manager.contactNumber,
        manager: {
          name: manager.name,
          email: manager.email,
          contactNumber: manager.contactNumber,
        },
      },
    },
    { new: true }
  ).lean();

  if (!updatedStore) {
    const error = new Error("Store not found while updating manager fields");
    error.statusCode = 404;
    throw error;
  }

  return updatedStore;
};

const assignManagerToStore = async (storeCode, employeeCode) => {
  const store = await Store.findOne({ storeCode: String(storeCode) }).lean();

  if (!store) {
    const error = new Error("Store not found");
    error.statusCode = 404;
    throw error;
  }

  const manager = await Manager.findOneAndUpdate(
    { role: "MANAGER", employeeCode: String(employeeCode) },
    {
      $set: {
        storeCode: store.storeCode,
        storeName: store.storeName,
        city: store.city,
        region: store.region,
        managerId: String(employeeCode),
      },
    },
    { new: true }
  );

  if (!manager) {
    const error = new Error("Manager not found");
    error.statusCode = 404;
    throw error;
  }

  manager.managerName = manager.name;
  manager.managerEmail = manager.email;
  manager.managerContactNumber = manager.contactNumber;
  manager.assignedStore = {
    storeCode: store.storeCode,
    storeName: store.storeName,
    city: store.city,
    region: store.region,
  };

  await manager.save();

  const updatedStore = await updateStoreManagerFields(store.storeCode, manager);

  return {
    store: updatedStore,
    manager: formatManager(manager.toObject()),
  };
};

module.exports = {
  getAllManagers,
  getManagerByEmployeeCode,
  getManagerByStoreCode,
  getManagerForStore,
  createManager,
  assignManagerToStore,
};
