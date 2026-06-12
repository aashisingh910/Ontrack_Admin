const router = require("express").Router();
const multer = require("multer");
const path = require("path");
const noticeController = require("./notice.controller");
const auth = require("../../middleware/auth");

const logoStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/notices/logos"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `logo-${req.params.noticeId}-${Date.now()}${ext}`);
  },
});

const signatureStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/notices/signatures"),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `signature-${req.params.noticeId}-${Date.now()}${ext}`);
  },
});

const imageFileFilter = (req, file, cb) => {
  const allowed = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
  if (!allowed.includes(file.mimetype)) {
    return cb(new Error("Only image files are allowed"), false);
  }
  cb(null, true);
};

const uploadLogo = multer({ storage: logoStorage, fileFilter: imageFileFilter, limits: { fileSize: 2 * 1024 * 1024 } });
const uploadSignature = multer({ storage: signatureStorage, fileFilter: imageFileFilter, limits: { fileSize: 2 * 1024 * 1024 } });

// CRUD
router.get("/", noticeController.getAllNotices);
router.post("/", noticeController.createNotice);
router.get("/:noticeId", auth, noticeController.getNoticeById);
router.put("/:noticeId", auth, noticeController.updateNotice);

// Publish / archive
router.patch("/:noticeId/publish", auth, noticeController.publishNotice);
router.patch("/:noticeId/archive", auth, noticeController.archiveNotice);

// File uploads
router.post("/:noticeId/logo", auth, uploadLogo.single("logo"), noticeController.uploadLogo);
router.post("/:noticeId/signature", auth, uploadSignature.single("signature"), noticeController.uploadSignature);

// Acknowledgement
router.post("/:noticeId/acknowledge", auth, noticeController.acknowledgeNotice);
router.patch("/:noticeId/target-count", auth, noticeController.updateTargetCount);

// Print data
router.get("/:noticeId/print", auth, noticeController.getNoticePrintData);

module.exports = router;
