const router = require("express").Router();
const storeController = require("./store.controller");
const auth = require("../../middleware/auth"); // optional

// CRUD
router.post("/", storeController.createStore);
router.get("/", storeController.getAllStores);
router.get("/code/:storeCode", auth, storeController.getStoreByCode);
router.get("/:id", auth, storeController.getStoreById);
router.put("/:id", auth, storeController.updateStore);
router.patch("/:id/deactivate", storeController.deactivateStore);
router.patch("/:id/activate", auth, storeController.activateStore);
router.delete("/:id", auth, storeController.deleteStore);

// Manager assignment
router.post("/assign-manager", auth, storeController.assignManagerToStore);
router.delete("/:storeId/manager", auth, storeController.removeManagerFromStore);
router.get("/manager/:managerId/stores", auth, storeController.getStoresByManager);
router.get("/:storeId/manager", auth, storeController.getStoreManager);

module.exports = router;