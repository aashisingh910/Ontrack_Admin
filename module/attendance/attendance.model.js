const mongoose = require("mongoose");

const geoPunchSchema = new mongoose.Schema(
  {
    time: { type: Date, default: null },
    latitude: { type: Number, default: null },
    longitude: { type: Number, default: null },
    geofenceStatus: {
      type: String,
      enum: ["INSIDE", "OUTSIDE", "NOT_APPLICABLE"],
      default: "NOT_APPLICABLE",
    },
    source: {
      type: String,
      enum: ["MOBILE_APP", "WEB_ADMIN", "SYSTEM", null],
      default: null,
    },
  },
  { _id: false }
);

const assignedShiftSchema = new mongoose.Schema(
  {
    shiftName: { type: String, default: "General Store Shift" },
    startTime: { type: String, default: "10:00" },
    endTime: { type: String, default: "22:00" },
    requiredMinutes: { type: Number, default: 540 },
  },
  { _id: false }
);

const correctionRequestSchema = new mongoose.Schema(
  {
    isRequested: { type: Boolean, default: false },
    requestType: {
      type: String,
      enum: [
        null,
        "CHECK_IN_CORRECTION",
        "CHECK_OUT_CORRECTION",
        "STATUS_CORRECTION",
        "LATE_REASON",
        "EARLY_CHECKOUT_REASON",
        "ABSENT_CORRECTION",
      ],
      default: null,
    },
    requestedBy: { type: String, default: null },
    requestedAt: { type: Date, default: null },
    reason: { type: String, default: null },
    managerApprovalStatus: {
      type: String,
      enum: [null, "PENDING", "APPROVED", "REJECTED"],
      default: null,
    },
    approvedBy: { type: String, default: null },
    approvedAt: { type: Date, default: null },
  },
  { _id: false }
);

const approvalSchema = new mongoose.Schema(
  {
    managerApprovalRequired: { type: Boolean, default: false },
    managerApprovalStatus: {
      type: String,
      enum: [null, "PENDING", "APPROVED", "REJECTED"],
      default: null,
    },
    approvedBy: { type: String, default: null },
    approvedAt: { type: Date, default: null },
  },
  { _id: false }
);

const attendanceSchema = new mongoose.Schema(
  {
    attendanceId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    employeeCode: { type: String, required: true, index: true, trim: true },
    employeeName: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true },
    contactNumber: { type: String, trim: true },
    role: {
      type: String,
      enum: ["STAFF", "MANAGER"],
      required: true,
      index: true,
    },
    designation: { type: String, trim: true },
    department: { type: String, trim: true },
    storeCode: { type: String, required: true, index: true, trim: true },
    storeName: { type: String, trim: true },
    city: { type: String, trim: true },
    region: { type: String, trim: true },
    managerId: { type: String, trim: true },
    managerName: { type: String, trim: true },
    attendanceDate: { type: Date, required: true, index: true },
    dayName: { type: String, trim: true },
    weeklyOff: { type: String, default: "" },
    status: {
      type: String,
      enum: ["PRESENT", "LATE", "HALF_DAY", "ABSENT", "LEAVE", "WEEKLY_OFF"],
      default: "PRESENT",
      index: true,
    },
    leaveType: { type: String, default: null },
    leaveApprovalStatus: {
      type: String,
      enum: [null, "PENDING", "APPROVED", "REJECTED"],
      default: null,
    },
    reason: { type: String, default: "" },
    assignedShift: {
      type: assignedShiftSchema,
      default: () => ({
        shiftName: "General Store Shift",
        startTime: "10:00",
        endTime: "22:00",
        requiredMinutes: 540,
      }),
    },
    checkIn: {
      type: geoPunchSchema,
      default: () => ({
        time: null,
        latitude: null,
        longitude: null,
        geofenceStatus: "NOT_APPLICABLE",
        source: null,
      }),
    },
    checkOut: {
      type: geoPunchSchema,
      default: () => ({
        time: null,
        latitude: null,
        longitude: null,
        geofenceStatus: "NOT_APPLICABLE",
        source: null,
      }),
    },
    workingMinutes: { type: Number, default: 0 },
    lateMinutes: { type: Number, default: 0 },
    earlyCheckoutMinutes: { type: Number, default: 0 },
    dayScore: { type: Number, default: null },
    correctionRequest: {
      type: correctionRequestSchema,
      default: () => ({
        isRequested: false,
        requestType: null,
        requestedBy: null,
        requestedAt: null,
        reason: null,
        managerApprovalStatus: null,
        approvedBy: null,
        approvedAt: null,
      }),
    },
    approval: {
      type: approvalSchema,
      default: () => ({
        managerApprovalRequired: false,
        managerApprovalStatus: null,
        approvedBy: null,
        approvedAt: null,
      }),
    },
  },
  {
    timestamps: true,
    collection: "attendance",
  }
);

module.exports = mongoose.model("Attendance", attendanceSchema);
