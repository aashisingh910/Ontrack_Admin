const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);
const User = require("./user.model");
const Staff = require("./staff.model");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs"); // used for compare in login

// Create a new user (staff/manager) – now includes all fields
exports.createUser = async (userData) => {
  // Check if email already exists
  const existing = await User.findOne({ email: userData.email });
  if (existing) throw { status: 400, message: "Email already exists" };

  // staffCode uniqueness check (if provided)
  if (userData.staffCode) {
    const existingCode = await User.findOne({ staffCode: userData.staffCode });
    if (existingCode) throw { status: 400, message: "Staff code already exists" };
  }

  // Create user – password will be hashed automatically by pre('save') hook
  const user = await User.create(userData);
  return { ...user.toObject(), password: undefined };
};

// Login and generate token
exports.login = async (email, password) => {
  const user = await User.findOne({ email }).select("+password");
  if (!user) throw { status: 401, message: "Invalid email or password" };
  
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) throw { status: 401, message: "Invalid email or password" };
  
  const token = jwt.sign(
    { id: user._id, role: user.role, storeCode: user.storeCode },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
  return { token, user: { ...user.toObject(), password: undefined } };
};

// Get all users (filters: role, storeCode)
exports.getAllUsers = async (filters = {}) => {
  return await User.find(filters).select("-password");
};

// Get user by ID
exports.getUserById = async (id) => {
  const mongoose = require("mongoose");
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw { status: 400, message: "Invalid user ID" };
  }
  const user = await User.findById(id).select("-password");
  if (!user) throw { status: 404, message: "User not found" };
  return user;
};

// Get managers list
exports.getManagers = async () => {
  return await User.find({ role: "manager", isActive: true }).select("name email storeCode designation phoneNumber");
};

exports.createStaff = async (payload) => {
  const { employeeCode, name, storeCode } = payload;

  if (!employeeCode || !name || !storeCode) {
    throw { status: 400, message: "employeeCode, name and storeCode are required" };
  }

  const existing = await Staff.findOne({
    $or: [
      { employeeCode: String(employeeCode).trim() },
      ...(payload.email ? [{ email: String(payload.email).trim().toLowerCase() }] : []),
    ],
  });

  if (existing) {
    throw { status: 409, message: "Staff already exists with this employeeCode or email" };
  }

  const staff = await Staff.create({
    ...payload,
    employeeCode: String(employeeCode).trim(),
    name: String(name).trim(),
    storeCode: String(storeCode).trim(),
    role: "STAFF",
  });

  return staff.toObject();
};

exports.getStaff = async (filters = {}) => {
  const query = { status: "ACTIVE" };

  if (filters.storeCode) query.storeCode = String(filters.storeCode);
  if (filters.department) query.department = new RegExp(filters.department, "i");
  if (filters.city) query.city = new RegExp(filters.city, "i");
  if (filters.region) query.region = new RegExp(filters.region, "i");
  if (filters.weeklyOff) query.weeklyOff = filters.weeklyOff;
  if (filters.managerId) query.managerId = String(filters.managerId);

  if (filters.search) {
    query.$or = [
      { name: new RegExp(filters.search, "i") },
      { employeeCode: new RegExp(filters.search, "i") },
      { email: new RegExp(filters.search, "i") },
      { storeName: new RegExp(filters.search, "i") },
      { storeCode: new RegExp(filters.search, "i") },
      { managerName: new RegExp(filters.search, "i") },
    ];
  }

  return await Staff.find(query).sort({ storeCode: 1, department: 1, name: 1 }).lean();
};

exports.getStaffByEmployeeCode = async (employeeCode) => {
  const staff = await Staff.findOne({ employeeCode: String(employeeCode) }).lean();
  if (!staff) throw { status: 404, message: "Staff not found" };
  return staff;
};

exports.getStaffByStore = async (storeCode) => {
  return await Staff.find({ storeCode: String(storeCode), status: "ACTIVE" })
    .sort({ department: 1, name: 1 })
    .lean();
};

exports.getStaffWeeklyOff = async (weeklyOff) => {
  const query = { status: "ACTIVE" };
  if (weeklyOff) {
    query.weeklyOff = weeklyOff;
  } else {
    query.weeklyOff = { $ne: "" };
  }
  return await Staff.find(query).sort({ weeklyOff: 1, storeCode: 1, name: 1 }).lean();
};

// Update user
exports.updateUser = async (id, updates) => {
  // If password is in updates, the pre-save hook will hash it automatically
  const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select("-password");
  if (!user) throw { status: 404, message: "User not found" };
  return user;
};

// Soft delete (deactivate)
exports.deactivateUser = async (id) => {
  const user = await User.findByIdAndUpdate(id, { isActive: false }, { new: true }).select("-password");
  if (!user) throw { status: 404, message: "User not found" };
  return user;
};

// Forgot password (generate reset token and store in DB)
exports.forgotPassword = async (email) => {
  const user = await User.findOne({ email });
  if (!user) throw { status: 404, message: "User not found" };
  
  // Generate a real JWT reset token
  const resetToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
  
  // Store token in user document
  user.token = resetToken;
  await user.save();
  
  // Email content
  const resetLink = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}&email=${encodeURIComponent(email)}`;
  const msg = {
    to: email,
    from: process.env.SENDGRID_FROM_EMAIL || 'punit.singh@praxisretail.in',
    subject: `Password Reset Request`,
    html: `<p>Click <a href="${resetLink}">here</a> to reset your password. This link expires in 1 hour.</p>`,
  };
  
  try {
    await sgMail.send(msg);
    console.log(`Reset email sent to ${email}`);
  } catch (error) {
    console.error("SendGrid error:", error.response?.body || error);
    throw { status: 500, message: "Failed to send reset email" };
  }
};

// Reset password using token
exports.resetPassword = async (token, newPassword, email) => {
  const user = await User.findOne({ email });
  if (!user) throw { status: 404, message: "User not found" };
  if (user.token !== token) throw { status: 400, message: "Invalid or expired token" };
  
  // Update password – pre-save hook will hash it
  user.password = newPassword;
  user.token = null; // clear token
  await user.save();
};