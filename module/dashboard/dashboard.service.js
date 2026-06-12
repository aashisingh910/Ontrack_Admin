const Store = require("../store/store.model");
const Manager = require("../manager/models/manager.model");
const Staff = require("../user/staff.model");
const Course = require("../courses/course.model");
const Attendance = require("../attendance/attendance.model");
const StoreMonthlyTarget = require("../targets/storeMonthlyTarget.model");

const monthRange = (month) => {
  const [year, m] = month.split("-").map(Number);
  return {
    start: new Date(Date.UTC(year, m - 1, 1)),
    end: new Date(Date.UTC(year, m, 0, 23, 59, 59, 999)),
  };
};

const todayDateRange = () => {
  const now = new Date();
  const date = now.toISOString().slice(0, 10);
  return {
    start: new Date(`${date}T00:00:00.000Z`),
    end: new Date(`${date}T23:59:59.999Z`),
    date,
  };
};

const getDashboardData = async ({ targetMonth, attendanceMonth, attendanceDate }) => {
  const finalTargetMonth = targetMonth || "2026-07";
  const finalAttendanceMonth = attendanceMonth || "2026-06";

  const [stores, managers, staff, monthlyTargets, courses, attendanceRecords] =
    await Promise.all([
      Store.find({ status: "ACTIVE" }).lean(),
      Manager.find({ role: "MANAGER", status: "ACTIVE" }).lean(),
      Staff.find({ status: "ACTIVE" }).lean(),
      StoreMonthlyTarget.find({ targetMonth: finalTargetMonth }).lean(),
      Course.find({ status: "ACTIVE" }).select("-questions.correctAnswer").lean(),
      getAttendanceForDashboard({ attendanceMonth: finalAttendanceMonth, attendanceDate }),
    ]);

  const attendanceSummary = calculateAttendanceSummary(attendanceRecords);
  const monthlyTargetSummary = calculateTargetSummary(monthlyTargets);
  const storeProgress = buildStoreProgress({ stores, managers, staff, monthlyTargets, attendanceRecords });
  const topStaff = buildTopStaff({ staff, attendanceRecords });
  const staffByStore = buildStaffByStore({ stores, staff, managers });
  const learningSnapshot = buildLearningSnapshot({ courses });

  const kpis = {
    totalStores: stores.length,
    totalManagers: managers.length,
    totalStaff: staff.length,
    avgAttendance: attendanceSummary.avgAttendance,
    totalMonthlyTarget: monthlyTargetSummary.totalTarget,
    totalAchieved: monthlyTargetSummary.totalAchieved,
    targetAchievementPercent: monthlyTargetSummary.achievementPercent,
    activeCourses: courses.length,
  };

  return {
    kpis,

    stores: stores.map((store) => {
      const target = monthlyTargets.find((t) => t.storeCode === store.storeCode);
      return {
        id: String(store._id),
        storeCode: store.storeCode,
        name: store.storeName,
        storeName: store.storeName,
        city: store.city,
        state: store.state,
        region: store.region,
        zone: store.zone,
        managerId: store.managerId || null,
        managerName: store.managerName || null,
        monthlyTarget: target?.adminAssignment?.assignedMonthlyTarget || 0,
        achieved: target?.progress?.actualSales || 0,
      };
    }),

    managers: managers.map((manager) => ({
      id: String(manager._id),
      employeeCode: manager.employeeCode,
      name: manager.name,
      email: manager.email,
      contactNumber: manager.contactNumber,
      storeCode: manager.storeCode,
      storeName: manager.storeName,
      city: manager.city,
      region: manager.region,
    })),

    staff: staff.map((member) => {
      const staffAttendance = attendanceRecords.filter(
        (a) => a.employeeCode === member.employeeCode
      );
      const attendanceRate = calculateEmployeeAttendanceRate(staffAttendance);
      return {
        id: String(member._id),
        employeeCode: member.employeeCode,
        name: member.name,
        email: member.email,
        role: member.role,
        designation: member.designation,
        department: member.department,
        storeCode: member.storeCode,
        storeName: member.storeName,
        managerId: member.managerId,
        managerName: member.managerName,
        weeklyOff: member.weeklyOff || "",
        achieved: 0,
        attendanceRate,
        coursesCompleted: 0,
        badges: [],
      };
    }),

    monthlyTargets: monthlyTargets.map((target) => ({
      id: String(target._id),
      targetId: target.targetId,
      storeCode: target.storeCode,
      storeName: target.storeName,
      city: target.city,
      region: target.region,
      month: target.targetMonth,
      target: target.adminAssignment?.assignedMonthlyTarget || 0,
      achieved: target.progress?.actualSales || 0,
      remainingTarget: target.progress?.remainingTarget || 0,
      achievementPercent: target.progress?.achievementPercent || 0,
      status: target.status,
    })),

    courses: courses.map((course) => ({
      id: String(course._id),
      courseId: course.courseId,
      courseCode: course.courseCode,
      title: course.title,
      category: course.category,
      level: course.level,
      questionCount: course.questionCount || course.questions?.length || 0,
      completedBy: [],
    })),

    attendance: attendanceRecords,
    attendanceSummary,
    targetSummary: monthlyTargetSummary,
    storeProgress,
    topStaff,
    staffByStore,
    learningSnapshot,
  };
};

const getAttendanceForDashboard = async ({ attendanceMonth, attendanceDate }) => {
  const query = {};

  if (attendanceDate) {
    query.attendanceDate = {
      $gte: new Date(`${attendanceDate}T00:00:00.000Z`),
      $lte: new Date(`${attendanceDate}T23:59:59.999Z`),
    };
  } else if (attendanceMonth) {
    const { start, end } = monthRange(attendanceMonth);
    query.attendanceDate = { $gte: start, $lte: end };
  } else {
    const { start, end } = todayDateRange();
    query.attendanceDate = { $gte: start, $lte: end };
  }

  return await Attendance.find(query).lean();
};

const calculateAttendanceSummary = (attendanceRecords) => {
  const total = attendanceRecords.length;
  const present = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const late = attendanceRecords.filter((a) => a.status === "LATE").length;
  const halfDay = attendanceRecords.filter((a) => a.status === "HALF_DAY").length;
  const absent = attendanceRecords.filter((a) => a.status === "ABSENT").length;
  const leave = attendanceRecords.filter((a) => a.status === "LEAVE").length;
  const weeklyOff = attendanceRecords.filter((a) => a.status === "WEEKLY_OFF").length;
  const scheduled = attendanceRecords.filter((a) => a.status !== "WEEKLY_OFF").length;
  const avgAttendance =
    scheduled > 0 ? Math.round(((present + late + halfDay) / scheduled) * 100) : 0;

  return { totalRecords: total, present, late, halfDay, absent, leave, weeklyOff, totalScheduled: scheduled, avgAttendance };
};

const calculateTargetSummary = (monthlyTargets) => {
  const totalTarget = monthlyTargets.reduce(
    (sum, t) => sum + Number(t.adminAssignment?.assignedMonthlyTarget || 0),
    0
  );
  const totalAchieved = monthlyTargets.reduce(
    (sum, t) => sum + Number(t.progress?.actualSales || 0),
    0
  );
  const achievementPercent =
    totalTarget > 0 ? Math.round((totalAchieved / totalTarget) * 100) : 0;

  return {
    totalTarget,
    totalAchieved,
    remainingTarget: Math.max(totalTarget - totalAchieved, 0),
    achievementPercent,
  };
};

const calculateEmployeeAttendanceRate = (records) => {
  const scheduled = records.filter((r) => r.status !== "WEEKLY_OFF").length;
  if (scheduled === 0) return 0;
  const presentLike = records.filter((r) =>
    ["PRESENT", "LATE", "HALF_DAY"].includes(r.status)
  ).length;
  return Math.round((presentLike / scheduled) * 100);
};

const buildStoreProgress = ({ stores, managers, staff, monthlyTargets, attendanceRecords }) => {
  return stores.map((store) => {
    const target = monthlyTargets.find((t) => t.storeCode === store.storeCode);
    const manager = managers.find((m) => m.storeCode === store.storeCode);
    const storeStaff = staff.filter((s) => s.storeCode === store.storeCode);
    const storeAttendance = attendanceRecords.filter((a) => a.storeCode === store.storeCode);
    const assignedTarget = target?.adminAssignment?.assignedMonthlyTarget || 0;
    const achieved = target?.progress?.actualSales || 0;
    const pct =
      assignedTarget > 0
        ? Math.min(100, Math.round((achieved / assignedTarget) * 100))
        : 0;

    return {
      id: String(store._id),
      storeCode: store.storeCode,
      name: store.storeName,
      storeName: store.storeName,
      city: store.city,
      region: store.region,
      managerName: manager?.name || store.managerName || "—",
      staffCount: storeStaff.length,
      achieved,
      target: assignedTarget,
      pct,
      attendanceRate: calculateAttendanceSummary(storeAttendance).avgAttendance,
    };
  });
};

const buildTopStaff = ({ staff, attendanceRecords }) => {
  return staff
    .map((member) => {
      const records = attendanceRecords.filter(
        (r) => r.employeeCode === member.employeeCode
      );
      const attendanceRate = calculateEmployeeAttendanceRate(records);
      const attendanceScore = records.reduce((sum, r) => sum + Number(r.dayScore || 0), 0);

      return {
        id: String(member._id),
        employeeCode: member.employeeCode,
        name: member.name,
        storeCode: member.storeCode,
        storeName: member.storeName,
        managerName: member.managerName,
        achieved: attendanceScore,
        attendanceRate,
        incentive: Math.round(attendanceScore * 10),
        coursesCompleted: 0,
        badges: [],
      };
    })
    .sort((a, b) => b.achieved - a.achieved)
    .slice(0, 5);
};

const buildStaffByStore = ({ stores, staff, managers }) => {
  return stores.map((store) => ({
    storeCode: store.storeCode,
    name: store.storeName,
    storeName: store.storeName,
    city: store.city,
    staffCount: staff.filter((s) => s.storeCode === store.storeCode).length,
    managerName:
      managers.find((m) => m.storeCode === store.storeCode)?.name ||
      store.managerName ||
      "—",
  }));
};

const buildLearningSnapshot = ({ courses }) => ({
  activeCourses: courses.length,
  totalQuestions: courses.reduce(
    (sum, c) => sum + Number(c.questionCount || c.questions?.length || 0),
    0
  ),
  completions: 0,
  badgesIssued: 0,
});

module.exports = { getDashboardData };
