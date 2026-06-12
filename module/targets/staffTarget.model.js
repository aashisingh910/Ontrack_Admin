const mongoose = require("mongoose");

const staffTargetSchema = new mongoose.Schema(
  {
    targetId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    targetType: {
      type: String,
      default: "STAFF_MONTHLY",
      enum: ["STAFF_MONTHLY", "STAFF_DAILY"],
      index: true,
    },
    targetMonth: {
      type: String,
      required: true,
      index: true,
    },
    targetDate: {
      type: Date,
      default: null,
    },
    employeeCode: {
      type: String,
      required: true,
      index: true,
    },
    employeeName: {
      type: String,
      required: true,
    },
    designation: String,
    department: String,
    storeCode: {
      type: String,
      required: true,
      index: true,
    },
    storeName: String,
    city: String,
    region: String,
    managerId: String,
    managerName: String,
    managerEmail: String,
    assignedTarget: {
      type: Number,
      required: true,
      default: 0,
    },
    categoryBreakup: {
      furnitureTarget: { type: Number, default: 0 },
      homewareTarget: { type: Number, default: 0 },
      decorTarget: { type: Number, default: 0 },
      servicesTarget: { type: Number, default: 0 },
    },
    progress: {
      actualSales: { type: Number, default: 0 },
      achievementPercent: { type: Number, default: 0 },
      remainingTarget: { type: Number, default: 0 },
    },
    assignment: {
      assignedBy: String,
      assignedByName: String,
      assignedAt: { type: Date, default: Date.now },
      remarks: String,
    },
    status: {
      type: String,
      enum: ["ASSIGNED", "IN_PROGRESS", "ACHIEVED", "MISSED", "CANCELLED"],
      default: "ASSIGNED",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "staff_targets",
  }
);

module.exports = mongoose.model("StaffTarget", staffTargetSchema);
