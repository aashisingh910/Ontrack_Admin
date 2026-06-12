const applyStoreScope = (req, query = {}) => {
  if (req.user?.role === "MANAGER") {
    query.storeCode = req.user.storeCode;
  }
  return query;
};

module.exports = applyStoreScope;
