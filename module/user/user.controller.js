const userService = require("./user.service");

exports.createUser = async (req, res) => {
  const user = await userService.createUser(req.body);
  res.status(201).json({ success: true, data: user });
};

exports.login = async (req, res) => {
  const { email, password } = req.body;
  const result = await userService.login(email, password);
  res.status(200).json({ success: true, data: result });
};

exports.getAllUsers = async (req, res) => {
  const { role, storeCode } = req.query;
  const filters = {};
  if (role) filters.role = role;
  if (storeCode) filters.storeCode = storeCode;
  const users = await userService.getAllUsers(filters);
  res.status(200).json({ success: true, count: users.length, data: users });
};

exports.getMe = async (req, res) => {
  try {
    const user = await userService.getUserById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, data: { name: user.name, email: user.email, fullName: user.name, role: user.role, storeCode: user.storeCode } });
  } catch (err) {
    res.status(err.status || 500).json({ success: false, message: err.message });
  }
};

exports.getUser = async (req, res) => {
  const user = await userService.getUserById(req.params.id);
  res.status(200).json({ success: true, data: user });
};

exports.getManagers = async (req, res) => {
  const managers = await userService.getManagers();
  res.status(200).json({ success: true, data: managers });
};

exports.createStaff = async (req, res) => {
  const staff = await userService.createStaff(req.body);
  res.status(201).json({ success: true, message: "Staff created successfully", data: staff });
};

exports.getStaff = async (req, res) => {
  const { storeCode, department, city, region, weeklyOff, managerId, search } = req.query;
  const filters = { storeCode, department, city, region, weeklyOff, managerId, search };
  const staff = await userService.getStaff(filters);
  res.status(200).json({ success: true, count: staff.length, data: staff });
};

exports.getStaffByEmployeeCode = async (req, res) => {
  const staff = await userService.getStaffByEmployeeCode(req.params.employeeCode);
  res.status(200).json({ success: true, data: staff });
};

exports.getStaffByStore = async (req, res) => {
  const staff = await userService.getStaffByStore(req.params.storeCode);
  res.status(200).json({ success: true, count: staff.length, data: staff });
};

exports.getStaffWeeklyOff = async (req, res) => {
  const staff = await userService.getStaffWeeklyOff(req.query.day);
  res.status(200).json({ success: true, count: staff.length, data: staff });
};

exports.updateUser = async (req, res) => {
  const user = await userService.updateUser(req.params.id, req.body);
  res.status(200).json({ success: true, data: user });
};

exports.deactivateUser = async (req, res) => {
  const user = await userService.deactivateUser(req.params.id);
  res.status(200).json({ success: true, data: user });
};

exports.forgotPassword = async (req, res) => {
  const { email } = req.body;
  await userService.forgotPassword(email);
  res.status(200).json({ success: true, message: "Password reset link sent" });
}

exports.resetPassword = async (req, res) => {
  const { token, newPassword, email } = req.body;
  await userService.resetPassword(token, newPassword, email);
  res.status(200).json({ success: true, message: "Password reset successful" });
};