const incentiveService = require("./incentive.service");

exports.getIncentives = async (req, res) => {
  try {
    const incentives = await incentiveService.getIncentives(req.query, req.user);
    res.status(200).json({ success: true, count: incentives.length, data: incentives });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch incentives" });
  }
};

exports.getIncentiveById = async (req, res) => {
  try {
    const incentive = await incentiveService.getIncentiveById(req.params.incentiveId, req.user);
    res.status(200).json({ success: true, data: incentive });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch incentive" });
  }
};

exports.createIncentive = async (req, res) => {
  try {
    const incentive = await incentiveService.createIncentive(req.body);
    res.status(201).json({ success: true, message: "Incentive created successfully", data: incentive });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ success: false, message: "Duplicate incentiveId", duplicateValue: error.keyValue });
    }
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to create incentive" });
  }
};

exports.managerApproveIncentive = async (req, res) => {
  try {
    const incentive = await incentiveService.managerApproveIncentive({
      incentiveId: req.params.incentiveId,
      user: req.user,
      status: req.body.status,
      remarks: req.body.remarks,
    });
    res.status(200).json({ success: true, message: "Manager incentive approval updated", data: incentive });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to approve incentive" });
  }
};

exports.adminApproveIncentive = async (req, res) => {
  try {
    const incentive = await incentiveService.adminApproveIncentive({
      incentiveId: req.params.incentiveId,
      user: req.user,
      status: req.body.status,
      remarks: req.body.remarks,
    });
    res.status(200).json({ success: true, message: "Admin incentive approval updated", data: incentive });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to approve incentive" });
  }
};

exports.markIncentivePaid = async (req, res) => {
  try {
    const incentive = await incentiveService.markIncentivePaid({
      incentiveId: req.params.incentiveId,
      transactionReference: req.body.transactionReference,
      paidAmount: req.body.paidAmount,
      payoutDate: req.body.payoutDate,
    });
    res.status(200).json({ success: true, message: "Incentive marked as paid", data: incentive });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to mark incentive as paid" });
  }
};

exports.getMyIncentives = async (req, res) => {
  try {
    const incentives = await incentiveService.getMyIncentives(req.params.employeeCode, req.query);
    res.status(200).json({ success: true, count: incentives.length, data: incentives });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch my incentives" });
  }
};

exports.getStoreIncentiveSummary = async (req, res) => {
  try {
    const summary = await incentiveService.getStoreIncentiveSummary(req.query, req.user);
    res.status(200).json({ success: true, count: summary.length, data: summary });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch incentive summary" });
  }
};
