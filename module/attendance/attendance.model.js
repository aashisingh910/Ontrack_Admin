const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    storeCode: { type: String, required: true },
    date: { type: String, required: true },          // "YYYY-MM-DD"
    checkIn: { type: Date },
    checkOut: { type: Date },
    status: {
      type: String,
      enum: ["present", "absent", "half-day", "weekly-off", "on-leave"],
      default: "present",
    },
    notes: { type: String },
  },
  { timestamps: true }
);

// Ensure one attendance record per user per day
attendanceSchema.index({ user: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("Attendances", attendanceSchema);