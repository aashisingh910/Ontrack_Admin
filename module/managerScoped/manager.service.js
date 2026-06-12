const mongoose = require("mongoose");
const Store = require("../store/store.model");
const Staff = require("../user/staff.model");
const Attendance = require("../attendance/attendance.model");
const StoreMonthlyTarget = require("../targets/storeMonthlyTarget.model");
const StoreDailyTarget = require("../targets/storeDailyTarget.model");
const StaffTarget = require("../targets/staffTarget.model");
const Course = require("../courses/course.model");
const Notice = require("../notices/notice.model");
const Incentive = require("../incentives/incentive.model");

// ----------------------------------------------------------------------
// Helpers
// ----------------------------------------------------------------------

const dateRange = (date) => ({
  start: new Date(`${date}T00:00:00.000Z`),
  end: new Date(`${date}T23:59:59.999Z`),
});

const monthDateRange = (month) => {
  const [year, m] = month.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, m - 1, 1)),
    end: new Date(Date.UTC(year, m, 0, 23, 59, 59, 999)),
  };
};

const requireManagerStore = (user) => {
  const role = String(user?.role || "").toUpperCase();
  if (role !== "MANAGER") {
    const error = new Error("Manager access required");
    error.statusCode = 403;
    throw error;
  }
  if (!user.storeCode) {
    const error = new Error("Manager storeCode missing in token");
    error.statusCode = 400;
    throw error;
  }
  return user.storeCode;
};

const buildAttendanceSummary = (records) => {
  const present = records.filter((r) => r.status === "PRESENT").length;
  const late = records.filter((r) => r.status === "LATE").length;
  const halfDay = records.filter((r) => r.status === "HALF_DAY").length;
  const absent = records.filter((r) => r.status === "ABSENT").length;
  const leave = records.filter((r) => r.status === "LEAVE").length;
  const weeklyOff = records.filter((r) => r.status === "WEEKLY_OFF").length;
  const totalScheduled = records.filter((r) => r.status !== "WEEKLY_OFF").length;
  const attendancePercent =
    totalScheduled > 0
      ? Math.round(((present + late + halfDay) / totalScheduled) * 100)
      : 0;
  return {
    present,
    late,
    halfDay,
    absent,
    leave,
    weeklyOff,
    totalRecords: records.length,
    totalScheduled,
    attendancePercent,
  };
};

const getIncentiveSummary = async (storeCode, incentiveMonth) => {
  const result = await Incentive.aggregate([
    { $match: { status: "ACTIVE", incentiveMonth, "store.storeCode": storeCode } },
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
        storeIncentivePool: { $max: "$targetReference.storeIncentivePool" },
        activeStaffCount: { $sum: 1 },
        eligibleStaffCount: {
          $sum: { $cond: [{ $gt: ["$calculation.payableIncentive", 0] }, 1, 0] },
        },
        totalGrossIncentive: { $sum: "$calculation.grossIncentive" },
        totalDeductionAmount: { $sum: "$calculation.deductionAmount" },
        totalPayableIncentive: { $sum: "$calculation.payableIncentive" },
        pendingManagerReview: {
          $sum: {
            $cond: [{ $eq: ["$approval.status", "PENDING_MANAGER_REVIEW"] }, 1, 0],
          },
        },
        approvedByManager: {
          $sum: {
            $cond: [{ $eq: ["$approval.status", "APPROVED_BY_MANAGER"] }, 1, 0],
          },
        },
        notEligibleCount: {
          $sum: { $cond: [{ $eq: ["$approval.status", "NOT_ELIGIBLE"] }, 1, 0] },
        },
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
    { $project: { _id: 0 } },
  ]);
  return result[0] || null;
};

// ----------------------------------------------------------------------
// Exported service functions
// ----------------------------------------------------------------------

const getStaff = async (user, filters = {}) => {
  const storeCode = requireManagerStore(user);
  const month = filters.month || new Date().toISOString().slice(0, 7);
  const { start, end } = monthDateRange(month);

  const staff = await Staff.find({ storeCode, status: "ACTIVE" })
    .sort({ name: 1 })
    .lean();

  const employeeCodes = staff.map((s) => s.employeeCode);

  const [attendanceRecords, incentives] = await Promise.all([
    Attendance.find({
      storeCode,
      employeeCode: { $in: employeeCodes },
      attendanceDate: { $gte: start, $lte: end },
    }).lean(),
    Incentive.find({
      status: "ACTIVE",
      incentiveMonth: month,
      "store.storeCode": storeCode,
      "employee.employeeCode": { $in: employeeCodes },
    }).lean(),
  ]);

  const enrichedStaff = staff.map((member) => {
    const memberAttendance = attendanceRecords.filter(
      (a) => a.employeeCode === member.employeeCode
    );
    const scheduledDays = memberAttendance.filter(
      (a) => a.status !== "WEEKLY_OFF"
    ).length;
    const presentLikeDays = memberAttendance.filter((a) =>
      ["PRESENT", "LATE", "HALF_DAY"].includes(a.status)
    ).length;
    const attendanceRate =
      scheduledDays > 0
        ? Math.round((presentLikeDays / scheduledDays) * 100)
        : 0;

    const incentiveRecord = incentives.find(
      (i) => i.employee?.employeeCode === member.employeeCode
    );
    const payableIncentive = incentiveRecord?.calculation?.payableIncentive || 0;
    const achieved = incentiveRecord?.targetReference?.achievedSales || 0;
    const monthlyTarget = incentiveRecord?.targetReference?.assignedMonthlyTarget || 0;

    return {
      id: String(member._id),
      employeeCode: member.employeeCode,
      name: member.name,
      email: member.email,
      contactNumber: member.contactNumber,
      role: member.role,
      designation: member.designation,
      department: member.department,
      storeCode: member.storeCode,
      storeName: member.storeName,
      city: member.city,
      region: member.region,
      status: member.status,
      managerId: member.managerId,
      managerName: member.managerName,
      managerEmail: member.managerEmail,
      managerContactNumber: member.managerContactNumber,
      assignedStore: member.assignedStore,
      weeklyOff: member.weeklyOff || "",
      monthlyTarget,
      achieved,
      attendanceRate,
      coursesCompleted: member.coursesCompleted || 0,
      payableIncentive,
      incentiveStatus: incentiveRecord?.approval?.status || "NOT_CALCULATED",
      badges: member.badges || [],
    };
  });

  return {
    manager: {
      employeeCode: user.employeeCode,
      name: user.name,
      email: user.email,
      storeCode: user.storeCode,
      storeName: user.storeName,
      city: user.city,
      region: user.region,
    },
    store: {
      storeCode: user.storeCode,
      storeName: user.storeName,
      city: user.city,
      region: user.region,
    },
    count: enrichedStaff.length,
    staff: enrichedStaff,
  };
};

const getAttendance = async (user, filters = {}) => {
  const storeCode = requireManagerStore(user);
  const date = filters.date || new Date().toISOString().slice(0, 10);
  const { start, end } = dateRange(date);

  return await Attendance.find({
    storeCode,
    attendanceDate: { $gte: start, $lte: end },
  })
    .sort({ employeeName: 1 })
    .lean();
};

const getTargets = async (user, filters = {}) => {
  const storeCode = requireManagerStore(user);
  const targetMonth = filters.targetMonth || new Date().toISOString().slice(0, 7);
  const selectedDate = filters.date || new Date().toISOString().slice(0, 10);
  const { start: dayStart, end: dayEnd } = dateRange(selectedDate);
  const { start: monthStart, end: monthEnd } = monthDateRange(targetMonth);

  const [monthly, dailyForDate, allDailyForMonth] = await Promise.all([
    StoreMonthlyTarget.findOne({ storeCode, targetMonth }).lean(),

    StoreDailyTarget.findOne({
      storeCode,
      targetDate: { $gte: dayStart, $lte: dayEnd },
    }).lean(),

    StoreDailyTarget.find({
      storeCode,
      targetDate: { $gte: monthStart, $lte: monthEnd },
    })
      .sort({ targetDate: 1 })
      .lean(),
  ]);

  return {
    targetMonth,
    monthly,
    daily: dailyForDate,
    dailyTargets: allDailyForMonth,
  };
};

const getCourses = async () => {
  return await Course.find({
    status: "ACTIVE",
    $or: [
      { audienceRoles: { $in: ["STAFF", "MANAGER"] } },
      { audienceRoles: { $exists: false } },
    ],
  })
    .select("-questions.correctAnswer")
    .sort({ createdAt: -1 })
    .lean();
};

const getNotices = async (user) => {
  const storeCode = requireManagerStore(user);

  return await Notice.find({
    status: "PUBLISHED",
    visibility: "ACTIVE",
    $or: [
      { "target.storeScope": "All Stores" },
      { "target.storeCodes": storeCode },
      { "target.targetAudience": "MANAGER" },
      { "target.targetAudience": "STAFF" },
    ],
  })
    .sort({ noticeDate: -1 })
    .lean();
};

const getIncentives = async (user, filters = {}) => {
  const storeCode = requireManagerStore(user);
  const incentiveMonth = filters.incentiveMonth || new Date().toISOString().slice(0, 7);

  const [records, summary] = await Promise.all([
    Incentive.find({
      status: "ACTIVE",
      incentiveMonth,
      "store.storeCode": storeCode,
    })
      .sort({ "employee.employeeName": 1 })
      .lean(),

    getIncentiveSummary(storeCode, incentiveMonth),
  ]);

  return { incentiveMonth, summary, records };
};

const getDashboard = async (user, filters = {}) => {
  const storeCode = requireManagerStore(user);
  const attendanceDate = filters.attendanceDate || new Date().toISOString().slice(0, 10);
  const targetMonth = filters.targetMonth || new Date().toISOString().slice(0, 7);
  const incentiveMonth = filters.incentiveMonth || targetMonth;

  const { start, end } = dateRange(attendanceDate);

  const [store, staff, todayAttendance, monthlyTarget, dailyTarget, courses, notices, incentives, incentiveSummary] =
    await Promise.all([
      Store.findOne({ storeCode }).lean(),
      Staff.find({ storeCode, status: "ACTIVE" }).lean(),
      Attendance.find({ storeCode, attendanceDate: { $gte: start, $lte: end } })
        .sort({ employeeName: 1 })
        .lean(),
      StoreMonthlyTarget.findOne({ storeCode, targetMonth }).lean(),
      StoreDailyTarget.findOne({ storeCode, targetDate: { $gte: start, $lte: end } }).lean(),
      Course.find({ status: "ACTIVE", audienceRoles: { $in: ["STAFF", "MANAGER"] } })
        .select("-questions.correctAnswer")
        .lean(),
      Notice.find({
        status: "PUBLISHED",
        visibility: "ACTIVE",
        $or: [
          { "target.storeScope": "All Stores" },
          { "target.storeCodes": storeCode },
          { "target.targetAudience": "MANAGER" },
          { "target.targetAudience": "STAFF" },
        ],
      })
        .sort({ noticeDate: -1 })
        .limit(10)
        .lean(),
      Incentive.find({ incentiveMonth, "store.storeCode": storeCode, status: "ACTIVE" })
        .sort({ "employee.employeeName": 1 })
        .lean(),
      getIncentiveSummary(storeCode, incentiveMonth),
    ]);

  const attSummary = buildAttendanceSummary(todayAttendance);
  const monthlyAssigned = monthlyTarget?.adminAssignment?.assignedMonthlyTarget || 0;
  const monthlyAchieved = monthlyTarget?.progress?.actualSales || 0;
  const dailyAssigned = dailyTarget?.assignedDailyTarget || 0;
  const dailyAchieved = dailyTarget?.progress?.actualSales || 0;

  return {
    manager: {
      employeeCode: user.employeeCode,
      name: user.name,
      email: user.email,
      contactNumber: user.contactNumber,
      role: user.role,
      storeCode: user.storeCode,
      storeName: user.storeName,
      city: user.city,
      region: user.region,
    },
    store: store
      ? {
          id: String(store._id),
          storeCode: store.storeCode,
          storeName: store.storeName,
          city: store.city,
          state: store.state,
          region: store.region,
          zone: store.zone,
          address: store.address,
          openingTime: store.openingTime,
          closingTime: store.closingTime,
          status: store.status,
          geofenceRadiusMeters: store.geofenceRadiusMeters,
        }
      : null,
    kpis: {
      staffCount: staff.length,
      presentToday: attSummary.present,
      lateToday: attSummary.late,
      halfDayToday: attSummary.halfDay,
      absentToday: attSummary.absent,
      leaveToday: attSummary.leave,
      weeklyOffToday: attSummary.weeklyOff,
      attendancePercent: attSummary.attendancePercent,
      monthlyTarget: monthlyAssigned,
      monthlyAchieved,
      monthlyAchievementPercent:
        monthlyAssigned > 0 ? Math.round((monthlyAchieved / monthlyAssigned) * 100) : 0,
      dailyTarget: dailyAssigned,
      dailyAchieved,
      dailyAchievementPercent:
        dailyAssigned > 0 ? Math.round((dailyAchieved / dailyAssigned) * 100) : 0,
      activeCourses: courses.length,
      activeNotices: notices.length,
      incentivePool: incentiveSummary?.storeIncentivePool || 0,
      totalPayableIncentive: incentiveSummary?.totalPayableIncentive || 0,
      pendingIncentiveReviews: incentiveSummary?.pendingManagerReview || 0,
    },
    staff: staff.map((m) => ({
      id: String(m._id),
      employeeCode: m.employeeCode,
      name: m.name,
      email: m.email,
      contactNumber: m.contactNumber,
      designation: m.designation,
      department: m.department,
      weeklyOff: m.weeklyOff,
      storeCode: m.storeCode,
      storeName: m.storeName,
      managerId: m.managerId,
      managerName: m.managerName,
    })),
    attendance: {
      date: attendanceDate,
      summary: attSummary,
      records: todayAttendance,
    },
    targets: {
      targetMonth,
      monthly: monthlyTarget,
      daily: dailyTarget,
    },
    incentives: {
      incentiveMonth,
      summary: incentiveSummary,
      records: incentives,
    },
    courses,
    notices,
  };
};

const getStaffTargets = async (user, filters = {}) => {
  const storeCode = requireManagerStore(user);

  const query = { storeCode };
  if (filters.month)        query.targetMonth = filters.month;
  if (filters.employeeCode) query.employeeCode = filters.employeeCode;
  if (filters.status)       query.status = filters.status;
  if (filters.targetType)   query.targetType = filters.targetType;
  if (filters.date) {
    const { start, end } = dateRange(filters.date);
    query.targetDate = { $gte: start, $lte: end };
  }

  const sort =
    filters.targetType === "STAFF_DAILY"
      ? { targetDate: -1, employeeName: 1 }
      : { targetMonth: -1, employeeName: 1 };

  return await StaffTarget.find(query).sort(sort).lean();
};

const assignStaffTarget = async (user, payload) => {
  const storeCode = requireManagerStore(user);
  const {
    employeeCode,
    targetType = "STAFF_MONTHLY",
    targetMonth,
    targetDate,
    assignedTarget,
    categoryBreakup = {},
    remarks = "",
  } = payload;

  const mkErr = (msg, code) => { const e = new Error(msg); e.statusCode = code; return e; };

  if (!employeeCode || !assignedTarget) throw mkErr("employeeCode and assignedTarget are required", 400);
  if (targetType === "STAFF_MONTHLY" && !targetMonth) throw mkErr("targetMonth is required for monthly targets", 400);
  if (targetType === "STAFF_DAILY"   && !targetDate)  throw mkErr("targetDate is required for daily targets", 400);

  const staff = await Staff.findOne({ employeeCode, storeCode, status: "ACTIVE" }).lean();
  if (!staff) throw mkErr("Staff not found in your store", 404);

  const resolvedMonth = targetType === "STAFF_DAILY" ? targetDate.slice(0, 7) : targetMonth;

  const targetId =
    targetType === "STAFF_DAILY"
      ? `STAFF-TARGET-DAILY-${targetDate}-${storeCode}-${employeeCode}`
      : `STAFF-TARGET-MONTHLY-${resolvedMonth}-${storeCode}-${employeeCode}`;

  const existing = await StaffTarget.findOne({ targetId });
  if (existing) {
    throw mkErr(
      targetType === "STAFF_DAILY"
        ? "Daily target already assigned for this staff and date"
        : "Monthly target already assigned for this staff and month",
      409
    );
  }

  const assignedAmount = Number(assignedTarget);

  return await StaffTarget.create({
    targetId,
    targetType,
    targetMonth: resolvedMonth,
    targetDate: targetType === "STAFF_DAILY" ? new Date(`${targetDate}T00:00:00.000Z`) : null,
    employeeCode: staff.employeeCode,
    employeeName: staff.name,
    designation: staff.designation,
    department: staff.department,
    storeCode: staff.storeCode,
    storeName: staff.storeName,
    city: staff.city,
    region: staff.region,
    managerId: user.employeeCode,
    managerName: user.name,
    managerEmail: user.email,
    assignedTarget: assignedAmount,
    categoryBreakup: {
      furnitureTarget: Number(categoryBreakup.furnitureTarget || 0),
      homewareTarget: Number(categoryBreakup.homewareTarget || 0),
      decorTarget: Number(categoryBreakup.decorTarget || 0),
      servicesTarget: Number(categoryBreakup.servicesTarget || 0),
    },
    progress: {
      actualSales: 0,
      achievementPercent: 0,
      remainingTarget: assignedAmount,
    },
    assignment: {
      assignedBy: user.employeeCode,
      assignedByName: user.name,
      assignedAt: new Date(),
      remarks,
    },
    status: "ASSIGNED",
  });
};

const updateStaffTarget = async (user, targetId, updates) => {
  const storeCode = requireManagerStore(user);

  const target = await StaffTarget.findOne({ targetId, storeCode });
  if (!target) {
    const error = new Error("Target not found or access denied");
    error.statusCode = 404;
    throw error;
  }

  if (updates.assignedTarget !== undefined) {
    target.assignedTarget = Number(updates.assignedTarget);
    target.progress.remainingTarget = Math.max(
      Number(updates.assignedTarget) - Number(target.progress.actualSales || 0),
      0
    );
  }
  if (updates.categoryBreakup) {
    target.categoryBreakup = { ...target.categoryBreakup.toObject(), ...updates.categoryBreakup };
  }
  if (updates.remarks !== undefined) {
    target.assignment.remarks = updates.remarks;
  }

  await target.save();
  return target;
};

// Resolve an incentive by custom incentiveId string OR MongoDB _id,
// scoped to the manager's store. Needed because some documents may not
// have the incentiveId field set, so the frontend falls back to _id.
const findIncentiveForManager = (id, storeCode) => {
  const base = { "store.storeCode": storeCode, status: "ACTIVE" };
  const isObjectId = mongoose.Types.ObjectId.isValid(id) && String(new mongoose.Types.ObjectId(id)) === String(id);
  if (isObjectId) {
    return Incentive.findOne({ ...base, $or: [{ _id: id }, { incentiveId: id }] });
  }
  return Incentive.findOne({ ...base, incentiveId: id });
};

const approveIncentive = async (user, incentiveId, remarks = "") => {
  const storeCode = requireManagerStore(user);

  const incentive = await findIncentiveForManager(incentiveId, storeCode);
  if (!incentive) {
    const error = new Error("Incentive not found or access denied");
    error.statusCode = 404;
    throw error;
  }
  if (Number(incentive.calculation?.payableIncentive || 0) <= 0) {
    const error = new Error("Cannot approve incentive with zero payable amount");
    error.statusCode = 400;
    throw error;
  }

  incentive.approval.status = "APPROVED_BY_MANAGER";
  incentive.approval.approvedBy = user.employeeCode;
  incentive.approval.approvedAt = new Date();
  incentive.approval.remarks = remarks || "Approved by store manager after review.";
  await incentive.save();
  return incentive;
};

const rejectIncentive = async (user, incentiveId, remarks = "") => {
  const storeCode = requireManagerStore(user);

  const incentive = await findIncentiveForManager(incentiveId, storeCode);
  if (!incentive) {
    const error = new Error("Incentive not found or access denied");
    error.statusCode = 404;
    throw error;
  }

  incentive.approval.status = "REJECTED_BY_MANAGER";
  incentive.approval.approvedBy = user.employeeCode;
  incentive.approval.approvedAt = new Date();
  incentive.approval.remarks = remarks || "Rejected by store manager.";
  await incentive.save();
  return incentive;
};

const sendIncentiveToAdmin = async (user, incentiveId, remarks = "") => {
  const storeCode = requireManagerStore(user);

  const incentive = await findIncentiveForManager(incentiveId, storeCode);
  if (!incentive) {
    const error = new Error("Incentive not found or access denied");
    error.statusCode = 404;
    throw error;
  }
  if (incentive.approval.status !== "APPROVED_BY_MANAGER") {
    const error = new Error("Only manager-approved incentives can be sent to admin");
    error.statusCode = 400;
    throw error;
  }

  incentive.approval.status = "SENT_TO_ADMIN";
  incentive.approval.sentToAdminBy = user.employeeCode;
  incentive.approval.sentToAdminByName = user.name;
  incentive.approval.sentToAdminAt = new Date();
  incentive.approval.remarks = remarks || "Sent to admin for final incentive approval.";
  await incentive.save();
  return incentive;
};

module.exports = {
  getDashboard,
  getStaff,
  getAttendance,
  getTargets,
  getCourses,
  getNotices,
  getIncentives,
  getStaffTargets,
  assignStaffTarget,
  updateStaffTarget,
  approveIncentive,
  rejectIncentive,
  sendIncentiveToAdmin,
};
