const mongoose = require("mongoose");

const courseProgressSchema = new mongoose.Schema(
  {
    userId: { type: String, required: true, index: true },
    courseId: { type: String, required: true, index: true },
    answers: { type: Object, default: {} },
    submitted: { type: Boolean, default: false },
    autoPoints: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    pendingDescriptive: { type: Boolean, default: false },
    attempts: { type: Number, default: 0 },
  },
  { timestamps: true, collection: "course_progress" }
);

courseProgressSchema.index({ userId: 1, courseId: 1 }, { unique: true });

module.exports = mongoose.model("CourseProgress", courseProgressSchema);
