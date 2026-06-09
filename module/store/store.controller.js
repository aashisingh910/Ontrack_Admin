const storeService = require('./store.service');

const handleError = (res, error) => {
  const status = error.status || 500;
  const message = error.message || 'Internal server error';
  return res.status(status).json({ success: false, message });
};

// CRUD
exports.createStore = async (req, res) => {
  try {
    const store = await storeService.createStore(req.body);
    res.status(201).json({ success: true, data: store });
  } catch (err) { handleError(res, err); }
};

exports.getAllStores = async (req, res) => {
  try {
    const filters = req.query;
    const stores = await storeService.getAllStores(filters);
    res.json({ success: true, data: stores });
  } catch (err) { handleError(res, err); }
};

exports.getStoreById = async (req, res) => {
  try {
    const store = await storeService.getStoreById(req.params.id);
    res.json({ success: true, data: store });
  } catch (err) { handleError(res, err); }
};

exports.getStoreByCode = async (req, res) => {
  try {
    const store = await storeService.getStoreByCode(req.params.storeCode);
    res.json({ success: true, data: store });
  } catch (err) { handleError(res, err); }
};

exports.updateStore = async (req, res) => {
  try {
    const store = await storeService.updateStore(req.params.id, req.body);
    res.json({ success: true, data: store });
  } catch (err) { handleError(res, err); }
};

exports.deactivateStore = async (req, res) => {
  try {
    const store = await storeService.deactivateStore(req.params.id);
    res.json({ success: true, data: store });
  } catch (err) { handleError(res, err); }
};

exports.activateStore = async (req, res) => {
  try {
    const store = await storeService.activateStore(req.params.id);
    res.json({ success: true, data: store });
  } catch (err) { handleError(res, err); }
};

exports.deleteStore = async (req, res) => {
  try {
    const store = await storeService.deleteStore(req.params.id);
    res.json({ success: true, message: 'Store deleted' });
  } catch (err) { handleError(res, err); }
};

// Manager assignment
exports.assignManagerToStore = async (req, res) => {
  try {
    const { storeId, managerId } = req.body;
    const store = await storeService.assignManagerToStore(storeId, managerId);
    res.json({ success: true, data: store });
  } catch (err) { handleError(res, err); }
};

exports.removeManagerFromStore = async (req, res) => {
  try {
    const { storeId } = req.params;
    const store = await storeService.removeManagerFromStore(storeId);
    res.json({ success: true, data: store });
  } catch (err) { handleError(res, err); }
};

exports.getStoresByManager = async (req, res) => {
  try {
    const { managerId } = req.params;
    const stores = await storeService.getStoresByManager(managerId);
    res.json({ success: true, data: stores });
  } catch (err) { handleError(res, err); }
};

exports.getStoreManager = async (req, res) => {
  try {
    const { storeId } = req.params;
    const manager = await storeService.getStoreManager(storeId);
    res.json({ success: true, data: manager });
  } catch (err) { handleError(res, err); }
};