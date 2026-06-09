const mongoose = require("mongoose");
const Store = require("./store.model");
const Manager = require("./manager.model");

const formatManagerResponse = (manager) => {
  if (!manager) return null;

  return {
    _id: manager._id,
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
    createdAt: manager.createdAt,
    updatedAt: manager.updatedAt,

    managerId: manager.managerId || manager.employeeCode,
    managerName: manager.managerName || manager.name,
    managerEmail: manager.managerEmail || manager.email,
    managerContactNumber:
      manager.managerContactNumber || manager.contactNumber,

    assignedStore: manager.assignedStore || {
      storeCode: manager.storeCode,
      storeName: manager.storeName,
      city: manager.city,
      region: manager.region,
    },

    reportingManager: manager.reportingManager || null,
  };
};

const findStoreByIdentifier = async (storeIdentifier) => {
  let store = null;

  if (mongoose.Types.ObjectId.isValid(storeIdentifier)) {
    store = await Store.findById(storeIdentifier).lean();
  }

  if (!store) {
    store = await Store.findOne({
      storeCode: storeIdentifier,
    }).lean();
  }

  return store;
};

const getManagerByStore = async (storeIdentifier) => {
  const store = await findStoreByIdentifier(storeIdentifier);

  if (!store) {
    const error = new Error("Store not found");
    error.statusCode = 404;
    throw error;
  }

  let manager = null;

  if (store.managerId) {
    const managerQuery = [
      { employeeCode: store.managerId },
      { managerId: store.managerId },
    ];

    if (mongoose.Types.ObjectId.isValid(store.managerId)) {
      managerQuery.push({ _id: store.managerId });
    }

    manager = await Manager.findOne({
      $or: managerQuery,
      role: "MANAGER",
    }).lean();
  }

  if (!manager) {
    manager = await Manager.findOne({
      storeCode: store.storeCode,
      role: "MANAGER",
    }).lean();
  }

  if (!manager && store.managerName) {
    manager = {
      _id: null,
      employeeCode: store.managerId || "",
      name: store.managerName,
      email: store.managerEmail,
      contactNumber: store.managerContactNumber,
      role: "MANAGER",
      designation: "Store Manager",
      department: "OPERATIONS",
      storeCode: store.storeCode,
      storeName: store.storeName,
      city: store.city,
      region: store.region,
      status: "ACTIVE",
      createdAt: store.createdAt,
      updatedAt: store.updatedAt,
      managerId: store.managerId || "",
      managerName: store.managerName,
      managerEmail: store.managerEmail,
      managerContactNumber: store.managerContactNumber,
      assignedStore: {
        storeCode: store.storeCode,
        storeName: store.storeName,
        city: store.city,
        region: store.region,
      },
      reportingManager: null,
    };
  }

  if (!manager) {
    const error = new Error("Manager not assigned to this store");
    error.statusCode = 404;
    error.store = {
      _id: store._id,
      storeCode: store.storeCode,
      storeName: store.storeName,
    };
    throw error;
  }

  return formatManagerResponse(manager);
};

const getAllManagers = async () => {
  const managers = await Manager.find({ role: "MANAGER" })
    .sort({ storeCode: 1 })
    .lean();

  return managers.map(formatManagerResponse);
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

  return formatManagerResponse(manager);
};

const createManager = async (payload) => {
  const {
    employeeCode,
    name,
    email,
    contactNumber,
    storeCode,
    storeName,
    city,
    region,
    designation = "Store Manager",
    department = "OPERATIONS",
    status = "ACTIVE",
  } = payload;

  if (!employeeCode || !name || !email || !storeCode) {
    const error = new Error(
      "employeeCode, name, email and storeCode are required"
    );
    error.statusCode = 400;
    throw error;
  }

  const store = await Store.findOne({ storeCode });

  if (!store) {
    const error = new Error("Store not found for given storeCode");
    error.statusCode = 404;
    throw error;
  }

  const manager = await Manager.create({
    employeeCode,
    name,
    email,
    contactNumber,
    role: "MANAGER",
    designation,
    department,
    storeCode,
    storeName: storeName || store.storeName,
    city: city || store.city,
    region: region || store.region,
    status,

    managerId: employeeCode,
    managerName: name,
    managerEmail: email,
    managerContactNumber: contactNumber,

    assignedStore: {
      storeCode,
      storeName: storeName || store.storeName,
      city: city || store.city,
      region: region || store.region,
    },

    reportingManager: null,
  });

  store.managerId = employeeCode;
  store.managerName = name;
  store.managerEmail = email;
  store.managerContactNumber = contactNumber;
  store.manager = {
    name,
    email,
    contactNumber,
  };

  await store.save();

  return formatManagerResponse(manager);
};

const assignManagerToStore = async (storeCode, employeeCode) => {
  if (!employeeCode) {
    const error = new Error("employeeCode is required");
    error.statusCode = 400;
    throw error;
  }

  const store = await Store.findOne({ storeCode });

  if (!store) {
    const error = new Error("Store not found");
    error.statusCode = 404;
    throw error;
  }

  const manager = await Manager.findOne({
    employeeCode,
    role: "MANAGER",
  });

  if (!manager) {
    const error = new Error("Manager not found");
    error.statusCode = 404;
    throw error;
  }

  manager.storeCode = store.storeCode;
  manager.storeName = store.storeName;
  manager.city = store.city;
  manager.region = store.region;

  manager.managerId = manager.employeeCode;
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

  return {
    store,
    manager: formatManagerResponse(manager),
  };
};

module.exports = {
  formatManagerResponse,
  getManagerByStore,
  getAllManagers,
  getManagerByEmployeeCode,
  createManager,
  assignManagerToStore,
};