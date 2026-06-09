const StoreMonthlyTarget = require("./storeMonthlyTarget.model");
const StoreDailyTarget = require("./storeDailyTarget.model");

const roundToNearest = (value, nearest = 5000) => {
  return Math.round(value / nearest) * nearest;
};

const getMonthDateRange = (targetMonth) => {
  const [year, month] = targetMonth.split("-").map(Number);

  const start = new Date(Date.UTC(year, month - 1, 1));
  const end = new Date(Date.UTC(year, month, 0));

  return {
    start,
    end,
    daysInMonth: end.getUTCDate(),
  };
};

const getDayName = (date) => {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    timeZone: "UTC",
  });
};

const getDayWeight = (date) => {
  const day = date.getUTCDay();

  // JS: 0 Sunday, 1 Monday, 2 Tuesday...
  if (day === 0) return 1.25;
  if (day === 5) return 1.1;
  if (day === 6) return 1.3;
  if (day === 1 || day === 2) return 0.85;
  if (day === 3) return 0.9;
  if (day === 4) return 0.95;

  return 1;
};

const getTargetStatus = (achievementPercent) => {
  if (achievementPercent >= 100) return "ACHIEVED";
  if (achievementPercent > 0) return "IN_PROGRESS";
  return "ASSIGNED";
};

const calculateCategoryBreakup = (targetValue) => {
  return {
    furnitureTarget: roundToNearest(targetValue * 0.58, 1000),
    homewareTarget: roundToNearest(targetValue * 0.22, 1000),
    decorTarget: roundToNearest(targetValue * 0.1, 1000),
    servicesTarget: roundToNearest(targetValue * 0.1, 1000),
  };
};

const calculatePrediction = ({
  previousActualSales,
  growthPercent = 10,
  seasonalityFactor = 1,
  festivalFactor = 1,
  adminAdjustmentPercent = 0,
}) => {
  const predictedTarget =
    previousActualSales *
    (1 + growthPercent / 100) *
    seasonalityFactor *
    festivalFactor;

  const assignedMonthlyTarget =
    predictedTarget * (1 + adminAdjustmentPercent / 100);

  return {
    predictedTarget: roundToNearest(predictedTarget, 50000),
    assignedMonthlyTarget: roundToNearest(assignedMonthlyTarget, 50000),
  };
};

const buildDailyTargetsFromMonthly = async (monthlyTarget) => {
  const assignedMonthlyTarget =
    monthlyTarget.adminAssignment.assignedMonthlyTarget;

  const { start, daysInMonth } = getMonthDateRange(monthlyTarget.targetMonth);

  const days = [];

  for (let i = 0; i < daysInMonth; i++) {
    const d = new Date(start);
    d.setUTCDate(start.getUTCDate() + i);
    days.push(d);
  }

  const totalWeight = days.reduce((sum, d) => sum + getDayWeight(d), 0);

  let runningTotal = 0;
  const dailyDocs = [];

  for (let i = 0; i < days.length; i++) {
    const targetDate = days[i];
    const dayWeight = getDayWeight(targetDate);

    let assignedDailyTarget;

    if (i < days.length - 1) {
      assignedDailyTarget = roundToNearest(
        (assignedMonthlyTarget * dayWeight) / totalWeight,
        5000
      );
      runningTotal += assignedDailyTarget;
    } else {
      assignedDailyTarget = assignedMonthlyTarget - runningTotal;
    }

    const dateOnly = targetDate.toISOString().slice(0, 10);

    dailyDocs.push({
      dailyTargetId: `DAILY-TARGET-${monthlyTarget.storeCode}-${dateOnly}`,
      monthlyTargetId: monthlyTarget.targetId,
      targetType: "STORE_DAILY",
      targetDate,
      dayName: getDayName(targetDate),
      targetMonth: monthlyTarget.targetMonth,

      storeCode: monthlyTarget.storeCode,
      storeName: monthlyTarget.storeName,
      city: monthlyTarget.city,
      region: monthlyTarget.region,
      managerName: monthlyTarget.managerName,

      currency: monthlyTarget.currency || "INR",
      assignedDailyTarget,

      categoryBreakup: calculateCategoryBreakup(assignedDailyTarget),

      weighting: {
        strategy: "weekday_weighted_split_from_monthly_target",
        dayWeight,
      },

      progress: {
        actualSales: 0,
        achievementPercent: 0,
        remainingTarget: assignedDailyTarget,
      },

      status: "ASSIGNED",
    });
  }

  await StoreDailyTarget.deleteMany({
    monthlyTargetId: monthlyTarget.targetId,
  });

  return await StoreDailyTarget.insertMany(dailyDocs);
};

const createMonthlyTarget = async (payload) => {
  const {
    targetMonth,
    storeCode,
    storeName,
    city,
    region,
    managerName,
    previousMonth,
    growthPercent = 10,
    seasonalityFactor = 1,
    festivalFactor = 1,
    adminAdjustmentPercent = 0,
    assignedBy = "ADMIN",
    remarks = "",
  } = payload;

  if (!targetMonth || !storeCode || !storeName) {
    const error = new Error("targetMonth, storeCode and storeName are required");
    error.statusCode = 400;
    throw error;
  }

  const existing = await StoreMonthlyTarget.findOne({
    targetMonth,
    storeCode,
  });

  if (existing) {
    const error = new Error("Target already assigned for this store and month");
    error.statusCode = 409;
    throw error;
  }

  const { start, end, daysInMonth } = getMonthDateRange(targetMonth);

  const previousActualSales = Number(previousMonth?.actualSales || 0);
  const previousAssignedTarget = Number(previousMonth?.assignedTarget || 0);

  const previousAchievementPercent =
    previousAssignedTarget > 0
      ? Number(((previousActualSales / previousAssignedTarget) * 100).toFixed(2))
      : 0;

  const prediction = calculatePrediction({
    previousActualSales,
    growthPercent,
    seasonalityFactor,
    festivalFactor,
    adminAdjustmentPercent,
  });

  const targetId = `STORE-TARGET-${targetMonth}-${storeCode}`;

  const monthlyTarget = await StoreMonthlyTarget.create({
    targetId,
    targetType: "STORE_MONTHLY",
    targetMonth,
    monthStartDate: start,
    monthEndDate: end,

    storeCode,
    storeName,
    city,
    region,
    managerName,
    currency: "INR",

    previousMonth: {
      month: previousMonth?.month || "",
      assignedTarget: previousAssignedTarget,
      actualSales: previousActualSales,
      achievementPercent: previousAchievementPercent,
    },

    predictionLogic: {
      method: "previous_month_actual_plus_growth",
      baseValue: previousActualSales,
      growthPercent,
      seasonalityFactor,
      festivalFactor,
      predictedTarget: prediction.predictedTarget,
    },

    adminAssignment: {
      assignedBy,
      assignedAt: new Date(),
      adminAdjustmentPercent,
      assignedMonthlyTarget: prediction.assignedMonthlyTarget,
      remarks,
    },

    categoryBreakup: calculateCategoryBreakup(prediction.assignedMonthlyTarget),

    dailyDistribution: {
      strategy: "weighted_by_weekday",
      weekdayWeight: 0.85,
      fridayWeight: 1.1,
      saturdayWeight: 1.3,
      sundayWeight: 1.25,
    },

    progress: {
      actualSales: 0,
      achievementPercent: 0,
      remainingTarget: prediction.assignedMonthlyTarget,
      daysElapsed: 0,
      daysRemaining: daysInMonth,
    },

    status: "ASSIGNED",
  });

  const dailyTargets = await buildDailyTargetsFromMonthly(monthlyTarget);

  return {
    monthlyTarget,
    dailyTargetsCreated: dailyTargets.length,
  };
};

const getMonthlyTargets = async (filters = {}) => {
  const query = {};

  if (filters.targetMonth) query.targetMonth = filters.targetMonth;
  if (filters.storeCode) query.storeCode = filters.storeCode;
  if (filters.region) query.region = new RegExp(filters.region, "i");
  if (filters.status) query.status = filters.status;

  return await StoreMonthlyTarget.find(query)
    .sort({ targetMonth: -1, storeCode: 1 })
    .lean();
};

const getDailyTargets = async (filters = {}) => {
  const query = {};

  if (filters.targetMonth) query.targetMonth = filters.targetMonth;
  if (filters.storeCode) query.storeCode = filters.storeCode;
  if (filters.status) query.status = filters.status;

  if (filters.date) {
    const start = new Date(`${filters.date}T00:00:00.000Z`);
    const end = new Date(`${filters.date}T23:59:59.999Z`);

    query.targetDate = {
      $gte: start,
      $lte: end,
    };
  }

  return await StoreDailyTarget.find(query)
    .sort({ targetDate: 1, storeCode: 1 })
    .lean();
};

const getMonthlyTargetByStore = async (storeCode, targetMonth) => {
  const target = await StoreMonthlyTarget.findOne({
    storeCode,
    targetMonth,
  }).lean();

  if (!target) {
    const error = new Error("Monthly target not found");
    error.statusCode = 404;
    throw error;
  }

  return target;
};

const getDailyTargetByStoreDate = async (storeCode, date) => {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);

  const target = await StoreDailyTarget.findOne({
    storeCode,
    targetDate: {
      $gte: start,
      $lte: end,
    },
  }).lean();

  if (!target) {
    const error = new Error("Daily target not found");
    error.statusCode = 404;
    throw error;
  }

  return target;
};

const updateDailyActualSales = async ({ storeCode, date, actualSales }) => {
  const start = new Date(`${date}T00:00:00.000Z`);
  const end = new Date(`${date}T23:59:59.999Z`);

  const dailyTarget = await StoreDailyTarget.findOne({
    storeCode,
    targetDate: {
      $gte: start,
      $lte: end,
    },
  });

  if (!dailyTarget) {
    const error = new Error("Daily target not found");
    error.statusCode = 404;
    throw error;
  }

  const sales = Number(actualSales || 0);
  const achievementPercent =
    dailyTarget.assignedDailyTarget > 0
      ? Number(((sales / dailyTarget.assignedDailyTarget) * 100).toFixed(2))
      : 0;

  dailyTarget.progress.actualSales = sales;
  dailyTarget.progress.achievementPercent = achievementPercent;
  dailyTarget.progress.remainingTarget = Math.max(
    dailyTarget.assignedDailyTarget - sales,
    0
  );
  dailyTarget.status = getTargetStatus(achievementPercent);

  await dailyTarget.save();

  await recalculateMonthlyProgress(dailyTarget.monthlyTargetId);

  return dailyTarget;
};

const recalculateMonthlyProgress = async (monthlyTargetId) => {
  const monthlyTarget = await StoreMonthlyTarget.findOne({
    targetId: monthlyTargetId,
  });

  if (!monthlyTarget) return null;

  const dailyTargets = await StoreDailyTarget.find({
    monthlyTargetId,
  }).lean();

  const actualSales = dailyTargets.reduce(
    (sum, d) => sum + Number(d.progress?.actualSales || 0),
    0
  );

  const assignedMonthlyTarget =
    monthlyTarget.adminAssignment.assignedMonthlyTarget;

  const achievementPercent =
    assignedMonthlyTarget > 0
      ? Number(((actualSales / assignedMonthlyTarget) * 100).toFixed(2))
      : 0;

  const today = new Date();
  const monthStart = monthlyTarget.monthStartDate;
  const monthEnd = monthlyTarget.monthEndDate;

  let daysElapsed = 0;
  let daysRemaining = 0;

  if (today < monthStart) {
    daysElapsed = 0;
    daysRemaining = dailyTargets.length;
  } else if (today > monthEnd) {
    daysElapsed = dailyTargets.length;
    daysRemaining = 0;
  } else {
    daysElapsed = today.getUTCDate();
    daysRemaining = dailyTargets.length - daysElapsed;
  }

  monthlyTarget.progress.actualSales = actualSales;
  monthlyTarget.progress.achievementPercent = achievementPercent;
  monthlyTarget.progress.remainingTarget = Math.max(
    assignedMonthlyTarget - actualSales,
    0
  );
  monthlyTarget.progress.daysElapsed = daysElapsed;
  monthlyTarget.progress.daysRemaining = daysRemaining;
  monthlyTarget.status = getTargetStatus(achievementPercent);

  await monthlyTarget.save();

  return monthlyTarget;
};

const predictNextMonthTarget = async ({ storeCode, nextMonth, growthPercent = 10 }) => {
  const latestTarget = await StoreMonthlyTarget.findOne({
    storeCode,
  })
    .sort({ targetMonth: -1 })
    .lean();

  if (!latestTarget) {
    const error = new Error("No previous target found for prediction");
    error.statusCode = 404;
    throw error;
  }

  const previousActual =
    latestTarget.progress?.actualSales ||
    latestTarget.previousMonth?.actualSales ||
    latestTarget.adminAssignment?.assignedMonthlyTarget ||
    0;

  const prediction = calculatePrediction({
    previousActualSales: previousActual,
    growthPercent,
    seasonalityFactor: 1,
    festivalFactor: 1,
    adminAdjustmentPercent: 0,
  });

  return {
    storeCode,
    storeName: latestTarget.storeName,
    previousMonth: latestTarget.targetMonth,
    nextMonth,
    baseValue: previousActual,
    growthPercent,
    predictedTarget: prediction.predictedTarget,
  };
};

module.exports = {
  createMonthlyTarget,
  buildDailyTargetsFromMonthly,
  getMonthlyTargets,
  getDailyTargets,
  getMonthlyTargetByStore,
  getDailyTargetByStoreDate,
  updateDailyActualSales,
  recalculateMonthlyProgress,
  predictNextMonthTarget,
};