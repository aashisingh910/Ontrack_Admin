const Incentive = require("./incentive.model");

const getIncentives = async (filters = {}, user = null) => {
  const query = { status: "ACTIVE" };

  if (filters.incentiveMonth) query.incentiveMonth = filters.incentiveMonth;

  if (user?.role === "MANAGER") {
    query["store.storeCode"] = user.storeCode;
  } else if (filters.storeCode) {
    query["store.storeCode"] = String(filters.storeCode);
  }

  if (filters.employeeCode) query["employee.employeeCode"] = String(filters.employeeCode);
  if (filters.approvalStatus) query["approval.status"] = filters.approvalStatus;
  if (filters.payoutStatus) query["payout.payoutStatus"] = filters.payoutStatus;

  if (filters.search) {
    query.$or = [
      { "employee.employeeName": new RegExp(filters.search, "i") },
      { "employee.employeeCode": new RegExp(filters.search, "i") },
      { "store.storeName": new RegExp(filters.search, "i") },
      { "store.managerName": new RegExp(filters.search, "i") },
    ];
  }

  return await Incentive.find(query)
    .sort({ incentiveMonth: -1, "store.storeCode": 1, "employee.employeeName": 1 })
    .lean();
};

const getIncentiveById = async (incentiveId, user = null) => {
  const query = { incentiveId };
  if (user?.role === "MANAGER") query["store.storeCode"] = user.storeCode;

  const incentive = await Incentive.findOne(query).lean();
  if (!incentive) {
    const error = new Error("Incentive not found or access denied");
    error.statusCode = 404;
    throw error;
  }
  return incentive;
};

const createIncentive = async (payload) => {
  const existing = await Incentive.findOne({ incentiveId: payload.incentiveId });
  if (existing) {
    const error = new Error("Incentive already exists");
    error.statusCode = 409;
    throw error;
  }
  return await Incentive.create(payload);
};

const managerApproveIncentive = async ({ incentiveId, user, status, remarks }) => {
  const incentive = await Incentive.findOne({
    incentiveId,
    "store.storeCode": user.storeCode,
  });
  if (!incentive) {
    const error = new Error("Incentive not found or access denied");
    error.statusCode = 404;
    throw error;
  }
  if (!["APPROVED_BY_MANAGER", "REJECTED_BY_MANAGER"].includes(status)) {
    const error = new Error("Invalid manager approval status");
    error.statusCode = 400;
    throw error;
  }
  incentive.approval.status = status;
  incentive.approval.approvedBy = user.employeeCode || user.name;
  incentive.approval.approvedAt = new Date();
  incentive.approval.remarks = remarks || "";
  await incentive.save();
  return incentive;
};

const adminApproveIncentive = async ({ incentiveId, user, status, remarks }) => {
  const incentive = await Incentive.findOne({ incentiveId });
  if (!incentive) {
    const error = new Error("Incentive not found");
    error.statusCode = 404;
    throw error;
  }
  if (!["APPROVED_BY_ADMIN", "REJECTED_BY_ADMIN"].includes(status)) {
    const error = new Error("Invalid admin approval status");
    error.statusCode = 400;
    throw error;
  }
  incentive.approval.status = status;
  incentive.approval.approvedBy = user.employeeCode || user.name || "ADMIN";
  incentive.approval.approvedAt = new Date();
  incentive.approval.remarks = remarks || "";
  await incentive.save();
  return incentive;
};

const markIncentivePaid = async ({ incentiveId, transactionReference, paidAmount, payoutDate }) => {
  const incentive = await Incentive.findOne({ incentiveId });
  if (!incentive) {
    const error = new Error("Incentive not found");
    error.statusCode = 404;
    throw error;
  }
  incentive.payout.payoutStatus = "PAID";
  incentive.payout.transactionReference = transactionReference || "";
  incentive.payout.payoutDate = payoutDate ? new Date(payoutDate) : new Date();
  incentive.payout.paidAmount = paidAmount ?? incentive.calculation.payableIncentive ?? 0;
  await incentive.save();
  return incentive;
};

const getMyIncentives = async (employeeCode, filters = {}) => {
  const query = { status: "ACTIVE", "employee.employeeCode": String(employeeCode) };
  if (filters.incentiveMonth) query.incentiveMonth = filters.incentiveMonth;
  return await Incentive.find(query).sort({ incentiveMonth: -1 }).lean();
};

const getStoreIncentiveSummary = async (filters = {}, user = null) => {
  const match = { status: "ACTIVE" };

  if (filters.incentiveMonth) match.incentiveMonth = filters.incentiveMonth;

  if (user?.role === "MANAGER") {
    match["store.storeCode"] = user.storeCode;
  } else if (filters.storeCode) {
    match["store.storeCode"] = String(filters.storeCode);
  }

  if (filters.region) match["store.region"] = new RegExp(filters.region, "i");

  return await Incentive.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          incentiveMonth: "$incentiveMonth",
          storeCode: "$store.storeCode",
          storeName: "$store.storeName",
          city: "$store.city",
          region: "$store.region",
          managerName: "$store.managerName",
        },
        assignedMonthlyTarget: { $max: "$targetReference.assignedMonthlyTarget" },
        achievedSales: { $max: "$targetReference.achievedSales" },
        achievementPercent: { $max: "$targetReference.achievementPercent" },
        incentiveRatePercent: { $max: "$targetReference.storeIncentiveRatePercent" },
        storeIncentivePool: { $max: "$targetReference.storeIncentivePool" },
        activeStaffCount: { $sum: 1 },
        eligibleStaffCount: { $sum: { $cond: [{ $gt: ["$calculation.payableIncentive", 0] }, 1, 0] } },
        totalGrossIncentive: { $sum: "$calculation.grossIncentive" },
        totalDeductionAmount: { $sum: "$calculation.deductionAmount" },
        totalPayableIncentive: { $sum: "$calculation.payableIncentive" },
        pendingManagerReview: { $sum: { $cond: [{ $eq: ["$approval.status", "PENDING_MANAGER_REVIEW"] }, 1, 0] } },
        approvedByManager: { $sum: { $cond: [{ $eq: ["$approval.status", "APPROVED_BY_MANAGER"] }, 1, 0] } },
        rejectedByManager: { $sum: { $cond: [{ $eq: ["$approval.status", "REJECTED_BY_MANAGER"] }, 1, 0] } },
        paidCount: { $sum: { $cond: [{ $eq: ["$payout.payoutStatus", "PAID"] }, 1, 0] } },
        pendingPayoutCount: { $sum: { $cond: [{ $eq: ["$payout.payoutStatus", "PENDING"] }, 1, 0] } },
      },
    },
    {
      $addFields: {
        incentiveMonth: "$_id.incentiveMonth",
        storeCode: "$_id.storeCode",
        storeName: "$_id.storeName",
        city: "$_id.city",
        region: "$_id.region",
        managerName: "$_id.managerName",
        remainingUnpaidFromPool: { $subtract: ["$storeIncentivePool", "$totalPayableIncentive"] },
      },
    },
    {
      $project: {
        _id: 0,
        summaryId: { $concat: ["INC-SUMMARY-", "$incentiveMonth", "-", "$storeCode"] },
        incentiveMonth: 1,
        storeCode: 1,
        storeName: 1,
        city: 1,
        region: 1,
        managerName: 1,
        assignedMonthlyTarget: 1,
        achievedSales: 1,
        achievementPercent: 1,
        incentiveRatePercent: 1,
        storeIncentivePool: 1,
        activeStaffCount: 1,
        eligibleStaffCount: 1,
        totalGrossIncentive: 1,
        totalDeductionAmount: 1,
        totalPayableIncentive: 1,
        remainingUnpaidFromPool: 1,
        pendingManagerReview: 1,
        approvedByManager: 1,
        rejectedByManager: 1,
        paidCount: 1,
        pendingPayoutCount: 1,
      },
    },
    { $sort: { incentiveMonth: -1, storeCode: 1 } },
  ]);
};

module.exports = {
  getIncentives,
  getIncentiveById,
  createIncentive,
  managerApproveIncentive,
  adminApproveIncentive,
  markIncentivePaid,
  getMyIncentives,
  getStoreIncentiveSummary,
};
