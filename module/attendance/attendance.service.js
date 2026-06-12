const Attendance = require("./attendance.model");
const Staff = require("../user/staff.model");
const Manager = require("../manager/models/manager.model");

const toDateRange = (date) => {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);
  return { start, end };
};

const monthRange = (month) => {
  const [year, m] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, m - 1, 1));
  const end = new Date(Date.UTC(year, m, 0, 23, 59, 59, 999));
  return { start, end };
};

const getDayName = (date) =>
  date.toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });

const buildAttendanceId = (employeeCode, date) =>
  `ATT-${employeeCode}-${date}`;

const normalizeStatus = (status) =>
  String(status || "").trim().toUpperCase();

const calculateStatus = ({ checkInTime, checkOutTime, weeklyOff, dayName }) => {
  if (weeklyOff && weeklyOff === dayName) {
    return { status: "WEEKLY_OFF", lateMinutes: 0, earlyCheckoutMinutes: 0, dayScore: null };
  }

  if (!checkInTime) {
    return { status: "ABSENT", lateMinutes: 0, earlyCheckoutMinutes: 0, dayScore: 0 };
  }

  const shiftStart = new Date(checkInTime);
  shiftStart.setUTCHours(10, 0, 0, 0);

  const shiftEnd = new Date(checkInTime);
  shiftEnd.setUTCHours(22, 0, 0, 0);

  let lateMinutes = 0;
  let earlyCheckoutMinutes = 0;
  let status = "PRESENT";
  let dayScore = 100;

  if (checkInTime > shiftStart) {
    lateMinutes = Math.floor((checkInTime - shiftStart) / 60000);
  }

  if (checkOutTime && checkOutTime < shiftEnd) {
    earlyCheckoutMinutes = Math.floor((shiftEnd - checkOutTime) / 60000);
  }

  if (earlyCheckoutMinutes >= 240) {
    status = "HALF_DAY";
    dayScore = 50;
  } else if (lateMinutes > 10) {
    status = "LATE";
    dayScore = 85;
  }

  return { status, lateMinutes, earlyCheckoutMinutes, dayScore };
};

const getPersonByEmployeeCode = async (employeeCode) => {
  let person = await Staff.findOne({ employeeCode: String(employeeCode) }).lean();
  if (person) return { ...person, employeeName: person.name, role: "STAFF" };

  person = await Manager.findOne({ employeeCode: String(employeeCode) }).lean();
  if (person) return { ...person, employeeName: person.name, role: "MANAGER" };

  return null;
};

const getAttendanceList = async (filters = {}, user = null) => {
  const query = {};

  if (user?.role === "MANAGER") {
    query.storeCode = user.storeCode;
  } else if (filters.storeCode) {
    query.storeCode = String(filters.storeCode);
  }

  if (filters.employeeCode) query.employeeCode = String(filters.employeeCode);
  if (filters.role) query.role = String(filters.role).toUpperCase();
  if (filters.status) query.status = String(filters.status).toUpperCase();
  if (filters.managerId) query.managerId = String(filters.managerId);

  if (filters.date) {
    const { start, end } = toDateRange(filters.date);
    query.attendanceDate = { $gte: start, $lte: end };
  }

  if (filters.month) {
    const { start, end } = monthRange(filters.month);
    query.attendanceDate = { $gte: start, $lte: end };
  }

  if (filters.search) {
    query.$or = [
      { employeeName: new RegExp(filters.search, "i") },
      { employeeCode: new RegExp(filters.search, "i") },
      { storeName: new RegExp(filters.search, "i") },
      { storeCode: new RegExp(filters.search, "i") },
      { managerName: new RegExp(filters.search, "i") },
      { department: new RegExp(filters.search, "i") },
    ];
  }

  return await Attendance.find(query)
    .sort({ attendanceDate: -1, storeCode: 1, employeeName: 1 })
    .lean();
};

const getAttendanceById = async (attendanceId) => {
  const attendance = await Attendance.findOne({ attendanceId }).lean();
  if (!attendance) {
    const error = new Error("Attendance not found");
    error.statusCode = 404;
    throw error;
  }
  return attendance;
};

const getMyAttendance = async (employeeCode, month) =>
  getAttendanceList({ employeeCode, month });

const getStoreAttendance = async (storeCode, date) =>
  getAttendanceList({ storeCode, date });

const checkIn = async ({
  employeeCode,
  latitude,
  longitude,
  geofenceStatus = "INSIDE",
  source = "MOBILE_APP",
}) => {
  if (!employeeCode) {
    const error = new Error("employeeCode is required");
    error.statusCode = 400;
    throw error;
  }

  const person = await getPersonByEmployeeCode(employeeCode);
  if (!person) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  const now = new Date();
  const dateOnly = now.toISOString().slice(0, 10);
  const dayName = getDayName(now);
  const attendanceId = buildAttendanceId(employeeCode, dateOnly);

  let attendance = await Attendance.findOne({ attendanceId });

  if (attendance && attendance.checkIn?.time) {
    const error = new Error("Already checked in today");
    error.statusCode = 409;
    throw error;
  }

  const statusInfo = calculateStatus({
    checkInTime: now,
    checkOutTime: null,
    weeklyOff: person.weeklyOff,
    dayName,
  });

  if (!attendance) {
    attendance = await Attendance.create({
      attendanceId,
      employeeCode: person.employeeCode,
      employeeName: person.name || person.employeeName,
      email: person.email,
      contactNumber: person.contactNumber,
      role: person.role,
      designation: person.designation,
      department: person.department,
      storeCode: person.storeCode,
      storeName: person.storeName,
      city: person.city,
      region: person.region,
      managerId: person.managerId,
      managerName: person.managerName,
      attendanceDate: new Date(`${dateOnly}T00:00:00.000Z`),
      dayName,
      weeklyOff: person.weeklyOff || "",
      status: statusInfo.status,
      leaveType: null,
      leaveApprovalStatus: null,
      reason: "",
      assignedShift: {
        shiftName: "General Store Shift",
        startTime: "10:00",
        endTime: "22:00",
        requiredMinutes: 540,
      },
      checkIn: { time: now, latitude, longitude, geofenceStatus, source },
      checkOut: { time: null, latitude: null, longitude: null, geofenceStatus: "NOT_APPLICABLE", source: null },
      workingMinutes: 0,
      lateMinutes: statusInfo.lateMinutes,
      earlyCheckoutMinutes: 0,
      dayScore: statusInfo.dayScore,
      approval: {
        managerApprovalRequired: statusInfo.status === "LATE",
        managerApprovalStatus: statusInfo.status === "LATE" ? "PENDING" : null,
        approvedBy: null,
        approvedAt: null,
      },
    });
  } else {
    attendance.checkIn = { time: now, latitude, longitude, geofenceStatus, source };
    attendance.status = statusInfo.status;
    attendance.lateMinutes = statusInfo.lateMinutes;
    attendance.dayScore = statusInfo.dayScore;
    await attendance.save();
  }

  return attendance;
};

const checkOut = async ({
  employeeCode,
  latitude,
  longitude,
  geofenceStatus = "INSIDE",
  source = "MOBILE_APP",
}) => {
  if (!employeeCode) {
    const error = new Error("employeeCode is required");
    error.statusCode = 400;
    throw error;
  }

  const now = new Date();
  const dateOnly = now.toISOString().slice(0, 10);
  const attendanceId = buildAttendanceId(employeeCode, dateOnly);

  const attendance = await Attendance.findOne({ attendanceId });

  if (!attendance || !attendance.checkIn?.time) {
    const error = new Error("Check-in not found for today");
    error.statusCode = 404;
    throw error;
  }

  if (attendance.checkOut?.time) {
    const error = new Error("Already checked out today");
    error.statusCode = 409;
    throw error;
  }

  attendance.checkOut = { time: now, latitude, longitude, geofenceStatus, source };
  attendance.workingMinutes = Math.max(
    0,
    Math.floor((now - new Date(attendance.checkIn.time)) / 60000)
  );

  const statusInfo = calculateStatus({
    checkInTime: new Date(attendance.checkIn.time),
    checkOutTime: now,
    weeklyOff: attendance.weeklyOff,
    dayName: attendance.dayName,
  });

  attendance.status = statusInfo.status;
  attendance.lateMinutes = statusInfo.lateMinutes;
  attendance.earlyCheckoutMinutes = statusInfo.earlyCheckoutMinutes;
  attendance.dayScore = statusInfo.dayScore;
  attendance.approval = {
    managerApprovalRequired: ["LATE", "HALF_DAY"].includes(statusInfo.status),
    managerApprovalStatus: ["LATE", "HALF_DAY"].includes(statusInfo.status) ? "PENDING" : null,
    approvedBy: null,
    approvedAt: null,
  };

  await attendance.save();
  return attendance;
};

const markAttendance = async (payload) => {
  const {
    employeeCode,
    date,
    status,
    reason = "",
    leaveType = null,
    leaveApprovalStatus = null,
  } = payload;

  if (!employeeCode || !date || !status) {
    const error = new Error("employeeCode, date and status are required");
    error.statusCode = 400;
    throw error;
  }

  const person = await getPersonByEmployeeCode(employeeCode);
  if (!person) {
    const error = new Error("Employee not found");
    error.statusCode = 404;
    throw error;
  }

  const finalStatus = normalizeStatus(status);
  const attendanceId = buildAttendanceId(employeeCode, date);
  const attendanceDate = new Date(`${date}T00:00:00.000Z`);
  const dayName = getDayName(attendanceDate);

  const doc = await Attendance.findOneAndUpdate(
    { attendanceId },
    {
      $set: {
        attendanceId,
        employeeCode: person.employeeCode,
        employeeName: person.name || person.employeeName,
        email: person.email,
        contactNumber: person.contactNumber,
        role: person.role,
        designation: person.designation,
        department: person.department,
        storeCode: person.storeCode,
        storeName: person.storeName,
        city: person.city,
        region: person.region,
        managerId: person.managerId,
        managerName: person.managerName,
        attendanceDate,
        dayName,
        weeklyOff: person.weeklyOff || "",
        status: finalStatus,
        reason,
        leaveType,
        leaveApprovalStatus,
        checkIn: { time: null, latitude: null, longitude: null, geofenceStatus: "NOT_APPLICABLE", source: null },
        checkOut: { time: null, latitude: null, longitude: null, geofenceStatus: "NOT_APPLICABLE", source: null },
        workingMinutes: 0,
        lateMinutes: 0,
        earlyCheckoutMinutes: 0,
        dayScore:
          finalStatus === "ABSENT" ? 0
          : finalStatus === "WEEKLY_OFF" || finalStatus === "LEAVE" ? null
          : 100,
        approval: {
          managerApprovalRequired: finalStatus === "LEAVE",
          managerApprovalStatus: finalStatus === "LEAVE" ? "PENDING" : null,
          approvedBy: null,
          approvedAt: null,
        },
      },
    },
    { new: true, upsert: true, runValidators: true }
  );

  return doc;
};

const requestCorrection = async ({ attendanceId, requestType, requestedBy, reason }) => {
  const attendance = await Attendance.findOne({ attendanceId });
  if (!attendance) {
    const error = new Error("Attendance not found");
    error.statusCode = 404;
    throw error;
  }

  attendance.correctionRequest = {
    isRequested: true,
    requestType,
    requestedBy,
    requestedAt: new Date(),
    reason,
    managerApprovalStatus: "PENDING",
    approvedBy: null,
    approvedAt: null,
  };

  await attendance.save();
  return attendance;
};

const approveCorrection = async ({ attendanceId, approvedBy, status, correctedStatus }) => {
  const attendance = await Attendance.findOne({ attendanceId });
  if (!attendance) {
    const error = new Error("Attendance not found");
    error.statusCode = 404;
    throw error;
  }

  attendance.correctionRequest.managerApprovalStatus = status;
  attendance.correctionRequest.approvedBy = approvedBy;
  attendance.correctionRequest.approvedAt = new Date();

  if (status === "APPROVED" && correctedStatus) {
    const finalStatus = normalizeStatus(correctedStatus);
    attendance.status = finalStatus;
    if (finalStatus === "PRESENT") attendance.dayScore = 100;
    if (finalStatus === "LATE") attendance.dayScore = 85;
    if (finalStatus === "HALF_DAY") attendance.dayScore = 50;
    if (finalStatus === "ABSENT") attendance.dayScore = 0;
    if (finalStatus === "LEAVE" || finalStatus === "WEEKLY_OFF") attendance.dayScore = null;
  }

  await attendance.save();
  return attendance;
};

const approveAttendance = async ({ attendanceId, approvedBy, status }) => {
  const attendance = await Attendance.findOne({ attendanceId });
  if (!attendance) {
    const error = new Error("Attendance not found");
    error.statusCode = 404;
    throw error;
  }

  attendance.approval.managerApprovalStatus = status;
  attendance.approval.approvedBy = approvedBy;
  attendance.approval.approvedAt = new Date();

  await attendance.save();
  return attendance;
};

const buildSummaryMatchQuery = (filters = {}) => {
  const match = {};

  if (filters.storeCode) match.storeCode = String(filters.storeCode);
  if (filters.employeeCode) match.employeeCode = String(filters.employeeCode);
  if (filters.role) match.role = String(filters.role).toUpperCase();
  if (filters.region) match.region = new RegExp(filters.region, "i");
  if (filters.city) match.city = new RegExp(filters.city, "i");

  if (filters.date) {
    const { start, end } = toDateRange(filters.date);
    match.attendanceDate = { $gte: start, $lte: end };
  }

  if (filters.month) {
    const { start, end } = monthRange(filters.month);
    match.attendanceDate = { $gte: start, $lte: end };
  }

  return match;
};

const getDailySummary = async (filters = {}) => {
  const match = buildSummaryMatchQuery(filters);

  return await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          storeCode: "$storeCode",
          storeName: "$storeName",
          city: "$city",
          region: "$region",
          attendanceDate: "$attendanceDate",
        },
        present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ["$status", "LATE"] }, 1, 0] } },
        halfDay: { $sum: { $cond: [{ $eq: ["$status", "HALF_DAY"] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } },
        leave: { $sum: { $cond: [{ $eq: ["$status", "LEAVE"] }, 1, 0] } },
        weeklyOff: { $sum: { $cond: [{ $eq: ["$status", "WEEKLY_OFF"] }, 1, 0] } },
        totalRecords: { $sum: 1 },
        totalScheduled: { $sum: { $cond: [{ $ne: ["$status", "WEEKLY_OFF"] }, 1, 0] } },
        totalWorkingMinutes: { $sum: { $ifNull: ["$workingMinutes", 0] } },
        totalLateMinutes: { $sum: { $ifNull: ["$lateMinutes", 0] } },
        totalEarlyCheckoutMinutes: { $sum: { $ifNull: ["$earlyCheckoutMinutes", 0] } },
        averageDayScore: { $avg: "$dayScore" },
      },
    },
    {
      $addFields: {
        attendanceDate: "$_id.attendanceDate",
        storeCode: "$_id.storeCode",
        storeName: "$_id.storeName",
        city: "$_id.city",
        region: "$_id.region",
        attendancePercent: {
          $cond: [
            { $gt: ["$totalScheduled", 0] },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: [{ $add: ["$present", "$late", "$halfDay"] }, "$totalScheduled"] },
                    100,
                  ],
                },
                2,
              ],
            },
            0,
          ],
        },
        absenteeismPercent: {
          $cond: [
            { $gt: ["$totalScheduled", 0] },
            { $round: [{ $multiply: [{ $divide: ["$absent", "$totalScheduled"] }, 100] }, 2] },
            0,
          ],
        },
        latePercent: {
          $cond: [
            { $gt: ["$totalScheduled", 0] },
            { $round: [{ $multiply: [{ $divide: ["$late", "$totalScheduled"] }, 100] }, 2] },
            0,
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
        summaryId: {
          $concat: [
            "ATT-SUMMARY-",
            "$storeCode",
            "-",
            { $dateToString: { format: "%Y-%m-%d", date: "$attendanceDate", timezone: "UTC" } },
          ],
        },
        storeCode: 1,
        storeName: 1,
        city: 1,
        region: 1,
        attendanceDate: 1,
        present: 1,
        late: 1,
        halfDay: 1,
        absent: 1,
        leave: 1,
        weeklyOff: 1,
        totalRecords: 1,
        totalScheduled: 1,
        totalWorkingMinutes: 1,
        totalLateMinutes: 1,
        totalEarlyCheckoutMinutes: 1,
        averageDayScore: { $round: ["$averageDayScore", 2] },
        attendancePercent: 1,
        absenteeismPercent: 1,
        latePercent: 1,
      },
    },
    { $sort: { attendanceDate: -1, storeCode: 1 } },
  ]);
};

const getMonthlySummary = async (filters = {}) => {
  const match = buildSummaryMatchQuery(filters);

  return await Attendance.aggregate([
    { $match: match },
    {
      $group: {
        _id: {
          storeCode: "$storeCode",
          storeName: "$storeName",
          city: "$city",
          region: "$region",
          month: {
            $dateToString: { format: "%Y-%m", date: "$attendanceDate", timezone: "UTC" },
          },
        },
        present: { $sum: { $cond: [{ $eq: ["$status", "PRESENT"] }, 1, 0] } },
        late: { $sum: { $cond: [{ $eq: ["$status", "LATE"] }, 1, 0] } },
        halfDay: { $sum: { $cond: [{ $eq: ["$status", "HALF_DAY"] }, 1, 0] } },
        absent: { $sum: { $cond: [{ $eq: ["$status", "ABSENT"] }, 1, 0] } },
        leave: { $sum: { $cond: [{ $eq: ["$status", "LEAVE"] }, 1, 0] } },
        weeklyOff: { $sum: { $cond: [{ $eq: ["$status", "WEEKLY_OFF"] }, 1, 0] } },
        totalRecords: { $sum: 1 },
        totalScheduled: { $sum: { $cond: [{ $ne: ["$status", "WEEKLY_OFF"] }, 1, 0] } },
        totalWorkingMinutes: { $sum: { $ifNull: ["$workingMinutes", 0] } },
        averageDayScore: { $avg: "$dayScore" },
      },
    },
    {
      $addFields: {
        month: "$_id.month",
        storeCode: "$_id.storeCode",
        storeName: "$_id.storeName",
        city: "$_id.city",
        region: "$_id.region",
        attendancePercent: {
          $cond: [
            { $gt: ["$totalScheduled", 0] },
            {
              $round: [
                {
                  $multiply: [
                    { $divide: [{ $add: ["$present", "$late", "$halfDay"] }, "$totalScheduled"] },
                    100,
                  ],
                },
                2,
              ],
            },
            0,
          ],
        },
      },
    },
    {
      $project: {
        _id: 0,
        month: 1,
        storeCode: 1,
        storeName: 1,
        city: 1,
        region: 1,
        present: 1,
        late: 1,
        halfDay: 1,
        absent: 1,
        leave: 1,
        weeklyOff: 1,
        totalRecords: 1,
        totalScheduled: 1,
        totalWorkingMinutes: 1,
        averageDayScore: { $round: ["$averageDayScore", 2] },
        attendancePercent: 1,
      },
    },
    { $sort: { month: -1, storeCode: 1 } },
  ]);
};

module.exports = {
  getAttendanceList,
  getAttendanceById,
  getMyAttendance,
  getStoreAttendance,
  checkIn,
  checkOut,
  markAttendance,
  requestCorrection,
  approveCorrection,
  approveAttendance,
  getDailySummary,
  getMonthlySummary,
};
