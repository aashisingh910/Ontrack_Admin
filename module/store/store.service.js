const Store = require('./store.model');
const User = require('../user/user.model');

// Create store
exports.createStore = async (storeData) => {
  const existing = await Store.findOne({ storeCode: storeData.storeCode });
  if (existing) throw { status: 400, message: 'Store code already exists' };
  const store = await Store.create(storeData);
  return store;
};

// Get all stores (with filters)
exports.getAllStores = async (filters = {}) => {
  const query = {};
  if (filters.status) query.status = filters.status;
  if (filters.city) query.city = filters.city;
  if (filters.state) query.state = filters.state;
  if (filters.region) query.region = filters.region;
  if (filters.zone) query.zone = filters.zone;
  return await Store.find(query).populate('managerId', 'name email');
};

// Get store by ID
exports.getStoreById = async (id) => {
  const store = await Store.findById(id).populate('managerId', 'name email');
  if (!store) throw { status: 404, message: 'Store not found' };
  return store;
};

// Get store by storeCode
exports.getStoreByCode = async (storeCode) => {
  const store = await Store.findOne({ storeCode }).populate('managerId', 'name email');
  if (!store) throw { status: 404, message: 'Store not found' };
  return store;
};

// Update store
exports.updateStore = async (id, updates) => {
  const store = await Store.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
  if (!store) throw { status: 404, message: 'Store not found' };
  return store;
};

// Deactivate store
exports.deactivateStore = async (id) => {
  const store = await Store.findByIdAndUpdate(id, { status: 'INACTIVE' }, { new: true });
  if (!store) throw { status: 404, message: 'Store not found' };
  return store;
};

// Activate store
exports.activateStore = async (id) => {
  const store = await Store.findByIdAndUpdate(id, { status: 'ACTIVE' }, { new: true });
  if (!store) throw { status: 404, message: 'Store not found' };
  return store;
};

// Delete store permanently
exports.deleteStore = async (id) => {
  const store = await Store.findByIdAndDelete(id);
  if (!store) throw { status: 404, message: 'Store not found' };
  return store;
};

// Assign manager to store
exports.assignManagerToStore = async (storeId, managerId) => {
  const manager = await User.findById(managerId);
  if (!manager) throw { status: 404, message: 'Manager not found' };
  if (manager.role !== 'manager') throw { status: 400, message: 'User is not a manager' };
  const store = await Store.findByIdAndUpdate(storeId, { managerId }, { new: true }).populate('managerId', 'name email');
  if (!store) throw { status: 404, message: 'Store not found' };
  return store;
};

// Remove manager from store
exports.removeManagerFromStore = async (storeId) => {
  const store = await Store.findByIdAndUpdate(storeId, { managerId: null }, { new: true });
  if (!store) throw { status: 404, message: 'Store not found' };
  return store;
};

// Get stores by manager ID
exports.getStoresByManager = async (managerId) => {
  return await Store.find({ managerId, status: 'ACTIVE' }).populate('managerId', 'name email');
};

// Get manager of a store
exports.getStoreManager = async (storeId) => {
  const store = await Store.findById(storeId).populate('managerId', 'name email phoneNumber');
  if (!store) throw { status: 404, message: 'Store not found' };
  return store.managerId;
};