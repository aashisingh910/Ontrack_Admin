const mongoose = require("mongoose");

const categoryBreakupSchema = new mongoose.Schema(
  {
    furnitureTarget: { type: Number, default: 0 },
    homewareTarget: { type: Number, default: 0 },
    decorTarget: { type: Number, default: 0 },
    servicesTarget: { type: Number, default: 0 },
  },
  { _id: false }
);

const weightingSchema = new mongoose.Schema(
  {
    strategy: {
      type: String,
      default: "weekday_weighted_split_from_monthly_target",
    },
    dayWeight: {
      type: Number,
      default: 1,
    },
  },
  { _id: false }
);

const progressSchema = new mongoose.Schema(
  {
    actualSales: { type: Number, default: 0 },
    achievementPercent: { type: Number, default: 0 },
    remainingTarget: { type: Number, default: 0 },
  },
  { _id: false }
);

const storeDailyTargetSchema = new mongoose.Schema(
  {
    dailyTargetId: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },

    monthlyTargetId: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },

    targetType: {
      type: String,
      default: "STORE_DAILY",
      enum: ["STORE_DAILY"],
    },

    targetDate: {
      type: Date,
      required: true,
      index: true,
    },

    dayName: {
      type: String,
      trim: true,
    },

    targetMonth: {
      type: String,
      required: true,
      index: true,
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

    assignedDailyTarget: {
      type: Number,
      required: true,
    },

    categoryBreakup: categoryBreakupSchema,
    weighting: weightingSchema,
    progress: progressSchema,

    status: {
      type: String,
      enum: ["ASSIGNED", "IN_PROGRESS", "ACHIEVED", "MISSED", "CLOSED"],
      default: "ASSIGNED",
      index: true,
    },
  },
  {
    timestamps: true,
    collection: "store_daily_targets",
  }
);

module.exports = mongoose.model("StoreDailyTarget", storeDailyTargetSchema);