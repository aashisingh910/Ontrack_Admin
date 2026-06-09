const mongoose = require("mongoose");

const previousMonthSchema = new mongoose.Schema(
  {
    month: String,
    assignedTarget: { type: Number, default: 0 },
    actualSales: { type: Number, default: 0 },
    achievementPercent: { type: Number, default: 0 },
  },
  { _id: false }
);

const predictionLogicSchema = new mongoose.Schema(
  {
    method: {
      type: String,
      default: "previous_month_actual_plus_growth",
    },
    baseValue: { type: Number, default: 0 },
    growthPercent: { type: Number, default: 0 },
    seasonalityFactor: { type: Number, default: 1 },
    festivalFactor: { type: Number, default: 1 },
    predictedTarget: { type: Number, default: 0 },
  },
  { _id: false }
);

const adminAssignmentSchema = new mongoose.Schema(
  {
    assignedBy: {
      type: String,
      default: "ADMIN",
    },
    assignedAt: {
      type: Date,
      default: Date.now,
    },
    adminAdjustmentPercent: {
      type: Number,
      default: 0,
    },
    assignedMonthlyTarget: {
      type: Number,
      required: true,
    },
    remarks: String,
  },
  { _id: false }
);

const categoryBreakupSchema = new mongoose.Schema(
  {
    furnitureTarget: { type: Number, default: 0 },
    homewareTarget: { type: Number, default: 0 },
    decorTarget: { type: Number, default: 0 },
    servicesTarget: { type: Number, default: 0 },
  },
  { _id: false }
);

const dailyDistributionSchema = new mongoose.Schema(
  {
    strategy: {
      type: String,
      default: "weighted_by_weekday",
    },
    weekdayWeight: { type: Number, default: 0.85 },
    fridayWeight: { type: Number, default: 1.1 },
    saturdayWeight: { type: Number, default: 1.3 },
    sundayWeight: { type: Number, default: 1.25 },
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    actualSales: { type: Number, default: 0 },
    achievementPercent: { type: Number, default: 0 },
    remainingTarget: { type: Number, default: 0 },
    daysElapsed: { type: Number, default: 0 },
    daysRemaining: { type: Number, default: 0 },
  },
  { _id: false }
);

const storeMonthlyTargetSchema = new mongoose.Schema(
  {
    targetId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    targetType: {
      type: String,
      default: "STORE_MONTHLY",
      enum: ["STORE_MONTHLY"],
    },

    targetMonth: {
      type: String,
      required: true,
      index: true,
    },

    monthStartDate: {
      type: Date,
      required: true,
    },

    monthEndDate: {
      type: Date,
      required: true,
    },

    storeCode: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    storeName: {
      type: String,
      required: true,
      trim: true,
    },

    city: String,
    region: String,
    managerName: String,

    currency: {
      type: String,
      default: "INR",
    },

    previousMonth: previousMonthSchema,
    predictionLogic: predictionLogicSchema,
    adminAssignment: adminAssignmentSchema,
    categoryBreakup: categoryBreakupSchema,
    dailyDistribution: dailyDistributionSchema,
    progress: progressSchema,

    status: {
      type: String,
      enum: ["DRAFT", "ASSIGNED", "IN_PROGRESS", "ACHIEVED", "MISSED", "CLOSED"],
      default: "ASSIGNED",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "store_monthly_targets",
  }
);

module.exports = mongoose.model("StoreMonthlyTarget", storeMonthlyTargetSchema);