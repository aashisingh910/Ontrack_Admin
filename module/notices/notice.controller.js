const noticeService = require("./notice.service");

exports.getAllNotices = async (req, res) => {
  try {
    const notices = await noticeService.getAllNotices(req.query);
    res.status(200).json({ success: true, count: notices.length, data: notices });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch notices" });
  }
};

exports.getNoticeById = async (req, res) => {
  try {
    const notice = await noticeService.getNoticeById(req.params.noticeId);
    res.status(200).json({ success: true, data: notice });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch notice" });
  }
};

exports.createNotice = async (req, res) => {
  try {
    const notice = await noticeService.createNotice(req.body);
    res.status(201).json({ success: true, message: "Notice created successfully", data: notice });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to create notice" });
  }
};

exports.updateNotice = async (req, res) => {
  try {
    const notice = await noticeService.updateNotice(req.params.noticeId, req.body);
    res.status(200).json({ success: true, message: "Notice updated successfully", data: notice });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to update notice" });
  }
};

exports.publishNotice = async (req, res) => {
  try {
    const notice = await noticeService.publishNotice(req.params.noticeId);
    res.status(200).json({ success: true, message: "Notice published successfully", data: notice });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to publish notice" });
  }
};

exports.archiveNotice = async (req, res) => {
  try {
    const notice = await noticeService.archiveNotice(req.params.noticeId);
    res.status(200).json({ success: true, message: "Notice archived successfully", data: notice });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to archive notice" });
  }
};

exports.uploadLogo = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Logo file is required" });
    }
    const notice = await noticeService.uploadLogo({ noticeId: req.params.noticeId, file: req.file, req });
    res.status(200).json({ success: true, message: "Logo uploaded successfully", data: notice });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to upload logo" });
  }
};

exports.uploadSignature = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "Signature file is required" });
    }
    const notice = await noticeService.uploadSignature({ noticeId: req.params.noticeId, file: req.file, req });
    res.status(200).json({ success: true, message: "Signature uploaded successfully", data: notice });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to upload signature" });
  }
};

exports.acknowledgeNotice = async (req, res) => {
  try {
    const notice = await noticeService.acknowledgeNotice({
      noticeId: req.params.noticeId,
      employeeCode: req.body.employeeCode,
      employeeName: req.body.employeeName,
      role: req.body.role,
      storeCode: req.body.storeCode,
      storeName: req.body.storeName,
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
    });
    res.status(200).json({ success: true, message: "Notice acknowledged successfully", data: notice });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to acknowledge notice" });
  }
};

exports.updateTargetCount = async (req, res) => {
  try {
    const notice = await noticeService.updateTargetCount({
      noticeId: req.params.noticeId,
      totalTargeted: req.body.totalTargeted,
    });
    res.status(200).json({ success: true, message: "Notice target count updated successfully", data: notice });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to update target count" });
  }
};

exports.getNoticePrintData = async (req, res) => {
  try {
    const data = await noticeService.getNoticePrintData(req.params.noticeId);
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch print data" });
  }
};
