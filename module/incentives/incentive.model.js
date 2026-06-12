const mongoose = require("mongoose");

const calculationPeriodSchema = new mongoose.Schema(
  {
    month: String,
    startDate: Date,
    endDate: Date,
  },
  { _id: false }
);

const employeeSchema = new mongoose.Schema(
  {
    employeeCode: {
      type: String,
      required: true,
      index: true,
    },
    employeeName: String,
    role: {
      type: String,
      default: "STAFF",
    },
    designation: String,
    department: String,
    weeklyOff: String,
  },
  { _id: false }
);

const storeSchema = new mongoose.Schema(
  {
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
  },
  { _id: false }
);

const targetReferenceSchema = new mongoose.Schema(
  {
    targetId: String,
    targetType: {
      type: String,
      default: "STORE_MONTHLY",
    },
    assignedMonthlyTarget: {
      type: Number,
      default: 0,
    },
    achievedSales: {
      type: Number,
      default: 0,
    },
    achievementPercent: {
      type: Number,
      default: 0,
    },
    storeIncentiveRatePercent: {
      type: Number,
      default: 10,
    },
    storeIncentivePool: {
      type: Number,
      default: 0,
    },
    staffCountInStore: {
      type: Number,
      default: 0,
    },
    baseStaffShare: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const performanceInputsSchema = new mongoose.Schema(
  {
    attendancePercent: {
      type: Number,
      default: 0,
    },
    minimumAttendanceRequired: {
      type: Number,
      default: 85,
    },
    minimumTargetAchievementRequired: {
      type: Number,
      default: 75,
    },
    targetEligibilityStatus: {
      type: String,
      enum: [
        "ELIGIBLE_HIGH_PERFORMANCE",
        "ELIGIBLE",
        "PARTIAL_ELIGIBLE",
        "NOT_ELIGIBLE",
      ],
      default: "NOT_ELIGIBLE",
    },
  },
  { _id: false }
);

const calculationSchema = new mongoose.Schema(
  {
    logic: String,
    eligibilityMultiplier: {
      type: Number,
      default: 0,
    },
    grossIncentive: {
      type: Number,
      default: 0,
    },
    deductionAmount: {
      type: Number,
      default: 0,
    },
    payableIncentive: {
      type: Number,
      default: 0,
    },
    currency: {
      type: String,
      default: "INR",
    },
  },
  { _id: false }
);

const approvalSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: [
        "PENDING_MANAGER_REVIEW",
        "APPROVED_BY_MANAGER",
        "REJECTED_BY_MANAGER",
        "SENT_TO_ADMIN",
        "APPROVED_BY_ADMIN",
        "REJECTED_BY_ADMIN",
        "NOT_ELIGIBLE",
      ],
      default: "PENDING_MANAGER_REVIEW",
      index: true,
    },
    approvedBy: String,
    approvedAt: Date,
    remarks: String,
    sentToAdminBy: String,
    sentToAdminByName: String,
    sentToAdminAt: Date,
    adminApprovedBy: String,
    adminApprovedAt: Date,
    adminRemarks: String,
  },
  { _id: false }
);

const payoutSchema = new mongoose.Schema(
  {
    payoutStatus: {
      type: String,
      enum: ["PENDING", "PROCESSING", "PAID", "FAILED", "ON_HOLD"],
      default: "PENDING",
      index: true,
    },
    payoutDate: Date,
    transactionReference: String,
    paidAmount: {
      type: Number,
      default: 0,
    },
  },
  { _id: false }
);

const incentiveSchema = new mongoose.Schema(
  {
    incentiveId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    incentiveType: {
      type: String,
      default: "STAFF_STORE_TARGET_INCENTIVE",
      index: true,
    },
    incentiveMonth: {
      type: String,
      required: true,
      index: true,
    },
    calculationPeriod: calculationPeriodSchema,
    employee: employeeSchema,
    store: storeSchema,
    targetReference: targetReferenceSchema,
    performanceInputs: performanceInputsSchema,
    calculation: calculationSchema,
    approval: approvalSchema,
    payout: payoutSchema,
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE", "CANCELLED"],
      default: "ACTIVE",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "incentives",
  }
);

module.exports = mongoose.model("Incentive", incentiveSchema);
