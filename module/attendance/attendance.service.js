const Attendance = require("./attendance.model");
const moment = require("moment"); // you can use native Date but moment is easier for date formatting

// Mark check-in
exports.markCheckIn = async (userId, storeCode) => {
  const today = moment().format("YYYY-MM-DD");
  let record = await Attendance.findOne({ user: userId, date: today });

  if (record) {
    if (record.checkIn) throw { status: 400, message: "Already checked in today" };
    record.checkIn = new Date();
    record.status = "present";
    return await record.save();
  }

  record = await Attendance.create({
    user: userId,
    storeCode,
    date: today,
    checkIn: new Date(),
    status: "present",
  });
  return record;
};

// Mark check-out
exports.markCheckOut = async (userId) => {
  const today = moment().format("YYYY-MM-DD");
  const record = await Attendance.findOne({ user: userId, date: today });
  if (!record) throw { status: 404, message: "No check-in found for today" };
  if (record.checkOut) throw { status: 400, message: "Already checked out" };

  record.checkOut = new Date();
  return await record.save();
};

// Bulk mark attendance for a date (admin)
exports.bulkMark = async (date, attendanceList) => {
  // attendanceList: [{ userId, storeCode, status, checkIn, checkOut }]
  const operations = attendanceList.map((item) => ({
    updateOne: {
      filter: { user: item.userId, date },
      update: {
        $set: {
          storeCode: item.storeCode,
          status: item.status,
          checkIn: item.checkIn || null,
          checkOut: item.checkOut || null,
        },
      },
      upsert: true,
    },
  }));
  const result = await Attendance.bulkWrite(operations);
  return result;
};

// Get today's attendance summary for a store or all stores
exports.getTodayAttendance = async (storeCode) => {
  const today = moment().format("YYYY-MM-DD");
  const filter = { date: today };
  if (storeCode) filter.storeCode = storeCode;

  const records = await Attendance.find(filter)
    .populate("user", "name role jobTitle department storeCode")
    .lean();

  const summary = {
    date: today,
    total: records.length,
    present: records.filter((r) => r.status === "present" && r.checkIn).length,
    absent: records.filter((r) => r.status === "absent").length,
    weeklyOff: records.filter((r) => r.status === "weekly-off").length,
    onLeave: records.filter((r) => r.status === "on-leave").length,
  };
  return { summary, records };
};

// Get attendance history for a user (date range)
exports.getUserAttendance = async (userId, startDate, endDate) => {
  const filter = { user: userId };
  if (startDate && endDate) {
    filter.date = { $gte: startDate, $lte: endDate };
  }
  return await Attendance.find(filter).sort({ date: -1 });
};

// Get attendance trends (e.g., last 7 days) for dashboard
exports.getTrend = async (storeCode, days = 7) => {
  const start = moment().subtract(days - 1, "days").format("YYYY-MM-DD");
  const end = moment().format("YYYY-MM-DD");
  const filter = { date: { $gte: start, $lte: end } };
  if (storeCode) filter.storeCode = storeCode;

  const records = await Attendance.find(filter).lean();
  const trend = [];
  for (let d = moment(start); d.isSameOrBefore(end); d.add(1, "day")) {
    const day = d.format("YYYY-MM-DD");
    const dayRecords = records.filter((r) => r.date === day);
    trend.push({
      date: day,
      present: dayRecords.filter((r) => r.status === "present" && r.checkIn).length,
      absent: dayRecords.filter((r) => r.status === "absent").length,
      leave: dayRecords.filter((r) => r.status === "on-leave").length,
      weeklyOff: dayRecords.filter((r) => r.status === "weekly-off").length,
    });
  }
  return trend;
};