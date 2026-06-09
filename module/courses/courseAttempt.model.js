const mongoose = require("mongoose");

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true },
    type: { type: String, enum: ["MCQ", "TRUE_FALSE", "DESCRIPTIVE"], required: true },
    question: { type: String },
    submittedAnswer: { type: mongoose.Schema.Types.Mixed },
    correctAnswer: { type: mongoose.Schema.Types.Mixed },
    isCorrect: { type: Boolean, default: false },
    isAutoScored: { type: Boolean, default: true },
    needsManagerReview: { type: Boolean, default: false },
    points: { type: Number, default: 0 },
    earnedPoints: { type: Number, default: 0 },
    explanation: { type: String },
  },
  { _id: false }
);

const courseAttemptSchema = new mongoose.Schema(
  {
    attemptId: { type: String, required: true, unique: true, index: true },
    courseId: { type: String, required: true, index: true },
    courseCode: { type: String, required: true, index: true },
    courseTitle: { type: String },
    employeeCode: { type: String, required: true, trim: true, index: true },
    staffName: { type: String, trim: true },
    storeCode: { type: String, trim: true, index: true },
    storeName: { type: String, trim: true },
    managerId: { type: String, trim: true },
    managerName: { type: String, trim: true },
    answers: [answerSchema],
    totalPoints: { type: Number, default: 0 },
    earnedPoints: { type: Number, default: 0 },
    percentage: { type: Number, default: 0 },
    passingScore: { type: Number, default: 0 },
    passed: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["STARTED", "SUBMITTED", "PASSED", "FAILED", "PENDING_REVIEW"],
      default: "STARTED",
      index: true,
    },
    startedAt: { type: Date, default: Date.now },
    submittedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: String },
  },
  { timestamps: true, collection: "course_attempts" }
);

module.exports = mongoose.model("CourseAttempt", courseAttemptSchema);
