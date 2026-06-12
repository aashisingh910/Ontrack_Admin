const targetService = require("./target.service");

exports.createMonthlyTarget = async (req, res) => {
  try {
    const result = await targetService.createMonthlyTarget(req.body);

    res.status(201).json({
      success: true,
      message: "Monthly target assigned and daily targets created successfully",
      data: result,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to create monthly target",
    });
  }
};

exports.getMonthlyTargets = async (req, res) => {
  try {
    const targets = await targetService.getMonthlyTargets(req.query, req.user);

    res.status(200).json({
      success: true,
      count: targets.length,
      data: targets,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch monthly targets",
    });
  }
};

exports.getDailyTargets = async (req, res) => {
  try {
    const targets = await targetService.getDailyTargets(req.query, req.user);

    res.status(200).json({
      success: true,
      count: targets.length,
      data: targets,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch daily targets",
    });
  }
};

exports.getMonthlyTargetByStore = async (req, res) => {
  try {
    const { storeCode, targetMonth } = req.params;

    const target = await targetService.getMonthlyTargetByStore(
      storeCode,
      targetMonth
    );

    res.status(200).json({
      success: true,
      data: target,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch monthly target",
    });
  }
};

exports.getDailyTargetByStoreDate = async (req, res) => {
  try {
    const { storeCode, date } = req.params;

    const target = await targetService.getDailyTargetByStoreDate(
      storeCode,
      date
    );

    res.status(200).json({
      success: true,
      data: target,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to fetch daily target",
    });
  }
};

exports.updateDailyActualSales = async (req, res) => {
  try {
    const { storeCode, date, actualSales } = req.body;

    const target = await targetService.updateDailyActualSales({
      storeCode,
      date,
      actualSales,
    });

    res.status(200).json({
      success: true,
      message: "Daily actual sales updated successfully",
      data: target,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to update daily sales",
    });
  }
};

exports.updateMonthlyTarget = async (req, res) => {
  try {
    const target = await targetService.updateMonthlyTarget(req.params.targetId, req.body);
    res.status(200).json({ success: true, message: "Monthly target updated", data: target });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to update monthly target" });
  }
};

exports.updateDailyTarget = async (req, res) => {
  try {
    const target = await targetService.updateDailyTarget(req.params.dailyTargetId, req.body);
    res.status(200).json({ success: true, message: "Daily target updated", data: target });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to update daily target" });
  }
};

exports.predictNextMonthTarget = async (req, res) => {
  try {
    const prediction = await targetService.predictNextMonthTarget(req.body);

    res.status(200).json({
      success: true,
      data: prediction,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({
      success: false,
      message: error.message || "Failed to predict target",
    });
  }
};