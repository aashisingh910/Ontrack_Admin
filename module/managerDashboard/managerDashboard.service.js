const Store = require("../store/store.model");
const Staff = require("../user/staff.model");
const Attendance = require("../attendance/attendance.model");
const StoreMonthlyTarget = require("../targets/storeMonthlyTarget.model");
const StoreDailyTarget = require("../targets/storeDailyTarget.model");
const Course = require("../courses/course.model");
const Notice = require("../notices/notice.model");
const Incentive = require("../incentives/incentive.model");

const dateRange = (date) => ({
  start: new Date(`${date}T00:00:00.000Z`),
  end: new Date(`${date}T23:59:59.999Z`),
});

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
  return { present, late, halfDay, absent, leave, weeklyOff, totalRecords: records.length, totalScheduled, attendancePercent };
};

const getStoreIncentiveSummaryForManager = async (storeCode, incentiveMonth) => {
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
        incentiveRatePercent: { $max: "$targetReference.storeIncentiveRatePercent" },
        storeIncentivePool: { $max: "$targetReference.storeIncentivePool" },
        activeStaffCount: { $sum: 1 },
        eligibleStaffCount: { $sum: { $cond: [{ $gt: ["$calculation.payableIncentive", 0] }, 1, 0] } },
        totalGrossIncentive: { $sum: "$calculation.grossIncentive" },
        totalDeductionAmount: { $sum: "$calculation.deductionAmount" },
        totalPayableIncentive: { $sum: "$calculation.payableIncentive" },
        pendingManagerReview: { $sum: { $cond: [{ $eq: ["$approval.status", "PENDING_MANAGER_REVIEW"] }, 1, 0] } },
        approvedByManager: { $sum: { $cond: [{ $eq: ["$approval.status", "APPROVED_BY_MANAGER"] }, 1, 0] } },
        notEligibleCount: { $sum: { $cond: [{ $eq: ["$approval.status", "NOT_ELIGIBLE"] }, 1, 0] } },
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
        notEligibleCount: 1,
      },
    },
  ]);
  return result[0] || null;
};

const getManagerDashboard = async ({ manager, targetMonth, attendanceDate, incentiveMonth }) => {
  const storeCode = manager.storeCode;

  if (!storeCode) {
    const error = new Error("Manager storeCode missing in token");
    error.statusCode = 400;
    throw error;
  }

  const finalTargetMonth = targetMonth || new Date().toISOString().slice(0, 7);
  const finalIncentiveMonth = incentiveMonth || finalTargetMonth;
  const finalAttendanceDate = attendanceDate || new Date().toISOString().slice(0, 10);
  const { start, end } = dateRange(finalAttendanceDate);

  const [
    store,
    staff,
    todayAttendance,
    monthlyTarget,
    dailyTarget,
    courses,
    notices,
    incentives,
    incentiveSummary,
  ] = await Promise.all([
    Store.findOne({ storeCode }).lean(),

    Staff.find({ storeCode, status: "ACTIVE" }).lean(),

    Attendance.find({ storeCode, attendanceDate: { $gte: start, $lte: end } })
      .sort({ employeeName: 1 })
      .lean(),

    StoreMonthlyTarget.findOne({ storeCode, targetMonth: finalTargetMonth }).lean(),

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

    Incentive.find({
      incentiveMonth: finalIncentiveMonth,
      "store.storeCode": storeCode,
      status: "ACTIVE",
    })
      .sort({ "employee.employeeName": 1 })
      .lean(),

    getStoreIncentiveSummaryForManager(storeCode, finalIncentiveMonth),
  ]);

  const attendanceSummary = buildAttendanceSummary(todayAttendance);
  const monthlyAssigned = monthlyTarget?.adminAssignment?.assignedMonthlyTarget || 0;
  const monthlyAchieved = monthlyTarget?.progress?.actualSales || 0;
  const dailyAssigned = dailyTarget?.assignedDailyTarget || 0;
  const dailyAchieved = dailyTarget?.progress?.actualSales || 0;

  return {
    manager: {
      employeeCode: manager.employeeCode,
      name: manager.name,
      email: manager.email,
      contactNumber: manager.contactNumber,
      role: manager.role,
      storeCode: manager.storeCode,
      storeName: manager.storeName,
      city: manager.city,
      region: manager.region,
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
      presentToday: attendanceSummary.present,
      lateToday: attendanceSummary.late,
      halfDayToday: attendanceSummary.halfDay,
      absentToday: attendanceSummary.absent,
      leaveToday: attendanceSummary.leave,
      weeklyOffToday: attendanceSummary.weeklyOff,
      attendancePercent: attendanceSummary.attendancePercent,
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

    staff: staff.map((member) => ({
      id: String(member._id),
      employeeCode: member.employeeCode,
      name: member.name,
      email: member.email,
      contactNumber: member.contactNumber,
      designation: member.designation,
      department: member.department,
      weeklyOff: member.weeklyOff,
      storeCode: member.storeCode,
      storeName: member.storeName,
      managerId: member.managerId,
      managerName: member.managerName,
    })),

    attendance: {
      date: finalAttendanceDate,
      summary: attendanceSummary,
      records: todayAttendance,
    },

    targets: {
      targetMonth: finalTargetMonth,
      monthly: monthlyTarget,
      daily: dailyTarget,
    },

    incentives: {
      incentiveMonth: finalIncentiveMonth,
      summary: incentiveSummary,
      records: incentives,
    },

    courses,
    notices,
  };
};

module.exports = { getManagerDashboard };
