const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    // ── Identification ─────────────────────────────────────────────
    staffCode: { type: String, unique: true, sparse: true },
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    phoneNumber: { type: String, required: true }, // make required for forms

    // ── Authentication ─────────────────────────────────────────────
    password: { type: String, required: true, select: false },

    // ── Role & Organisation ────────────────────────────────────────
    role: { type: String, enum: ["staff", "manager", "admin"], default: "staff" },
    storeCode: { type: String, required: true }, // now required for manager/staff
    department: { type: String },                // e.g., "OPERATIONS"
    designation: { type: String },               // "Store Manager" for managers
    jobTitle: { type: String },                  // for staff
    monthlyTarget: { type: Number, default: 0 }, // for staff

    // ── Location (inherited from store or manually set) ────────────
    zone: { type: String },
    city: { type: String },
    state: { type: String },

    // ── Status & Tokens ────────────────────────────────────────────
    isActive: { type: Boolean, default: true },
    token: { type: String }, // password reset token
  },
  { timestamps: true }
);

// ── Password Hashing Middleware ───────────────────────────────────
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Optional: method to compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model("ontrack_user", userSchema);