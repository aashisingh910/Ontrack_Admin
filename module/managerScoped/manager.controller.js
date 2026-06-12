const service = require("./manager.service");

const send = (res, data, message = "Success") =>
  res.status(200).json({ success: true, message, data });

const fail = (res, error, fallback) =>
  res.status(error.statusCode || 500).json({
    success: false,
    message: error.message || fallback,
  });

exports.getDashboard = async (req, res) => {
  try {
    send(res, await service.getDashboard(req.user, req.query));
  } catch (e) {
    fail(res, e, "Failed to load manager dashboard");
  }
};

exports.getStaff = async (req, res) => {
  try {
    send(res, await service.getStaff(req.user, req.query));
  } catch (e) {
    fail(res, e, "Failed to load staff");
  }
};

exports.getAttendance = async (req, res) => {
  try {
    send(res, await service.getAttendance(req.user, req.query));
  } catch (e) {
    fail(res, e, "Failed to load attendance");
  }
};

exports.getTargets = async (req, res) => {
  try {
    send(res, await service.getTargets(req.user, req.query));
  } catch (e) {
    fail(res, e, "Failed to load targets");
  }
};

exports.getCourses = async (req, res) => {
  try {
    send(res, await service.getCourses());
  } catch (e) {
    fail(res, e, "Failed to load courses");
  }
};

exports.getNotices = async (req, res) => {
  try {
    send(res, await service.getNotices(req.user));
  } catch (e) {
    fail(res, e, "Failed to load notices");
  }
};

exports.getIncentives = async (req, res) => {
  try {
    send(res, await service.getIncentives(req.user, req.query));
  } catch (e) {
    fail(res, e, "Failed to load incentives");
  }
};

exports.getStaffTargets = async (req, res) => {
  try {
    send(res, await service.getStaffTargets(req.user, req.query));
  } catch (e) {
    fail(res, e, "Failed to load staff targets");
  }
};

exports.assignStaffTarget = async (req, res) => {
  try {
    const data = await service.assignStaffTarget(req.user, req.body);
    res.status(201).json({ success: true, message: "Staff target assigned successfully", data });
  } catch (e) {
    fail(res, e, "Failed to assign staff target");
  }
};

exports.updateStaffTarget = async (req, res) => {
  try {
    send(res, await service.updateStaffTarget(req.user, req.params.targetId, req.body), "Staff target updated successfully");
  } catch (e) {
    fail(res, e, "Failed to update staff target");
  }
};

exports.approveIncentive = async (req, res) => {
  try {
    send(res, await service.approveIncentive(req.user, req.params.incentiveId, req.body.remarks), "Incentive approved by manager");
  } catch (e) {
    fail(res, e, "Failed to approve incentive");
  }
};

exports.rejectIncentive = async (req, res) => {
  try {
    send(res, await service.rejectIncentive(req.user, req.params.incentiveId, req.body.remarks), "Incentive rejected by manager");
  } catch (e) {
    fail(res, e, "Failed to reject incentive");
  }
};

exports.sendIncentiveToAdmin = async (req, res) => {
  try {
    send(res, await service.sendIncentiveToAdmin(req.user, req.params.incentiveId, req.body.remarks), "Incentive sent to admin");
  } catch (e) {
    fail(res, e, "Failed to send incentive to admin");
  }
};
