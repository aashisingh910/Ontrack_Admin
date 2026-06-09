const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    questionId: { type: String, required: true, trim: true },
    courseId: { type: String, trim: true },
    courseCode: { type: String, trim: true },
    sequence: { type: Number, default: 1 },
    type: { type: String, enum: ["MCQ", "TRUE_FALSE", "DESCRIPTIVE"], required: true },
    question: { type: String, required: true, trim: true },
    options: [{ type: mongoose.Schema.Types.Mixed }],
    correctAnswer: { type: mongoose.Schema.Types.Mixed },
    sampleAnswer: { type: String, trim: true },
    keywords: [{ type: String, trim: true }],
    points: { type: Number, default: 1 },
    explanation: { type: String, trim: true },
  },
  { timestamps: false }
);

const scoringSchema = new mongoose.Schema(
  {
    totalPoints: { type: Number, default: 0 },
    passingScore: { type: Number, default: 0 },
    scoreType: { type: String, default: "AUTO_WITH_MANAGER_REVIEW_FOR_DESCRIPTIVE" },
    scoreCalculation: { type: String, trim: true },
  },
  { _id: false }
);

const attemptRulesSchema = new mongoose.Schema(
  {
    maxAttempts: { type: Number, default: 3 },
    allowRetakeAfterFail: { type: Boolean, default: true },
    showCorrectAnswersAfterPass: { type: Boolean, default: true },
    managerReviewRequiredForDescriptive: { type: Boolean, default: true },
    questionRandomization: { type: Boolean, default: false },
  },
  { _id: false }
);

const courseSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true, unique: true, trim: true, index: true },
    courseCode: { type: String, required: true, unique: true, trim: true, index: true },
    title: { type: String, required: true, trim: true },
    category: { type: String, trim: true, index: true },
    level: { type: String, enum: ["Basic", "Intermediate", "Advanced"], default: "Basic" },
    durationMinutes: { type: Number, default: 0 },
    audienceRoles: [{ type: String, enum: ["STAFF", "MANAGER", "ADMIN"] }],
    applicableDepartments: [{ type: String, trim: true }],
    courseText: { type: String, required: true },
    questionCount: { type: Number, default: 0 },
    totalPoints: { type: Number, default: 0 },
    passingScore: { type: Number, default: 0 },
    questionIds: [{ type: String, trim: true }],
    questions: [questionSchema],
    scoring: scoringSchema,
    attemptRules: attemptRulesSchema,
    status: { type: String, enum: ["ACTIVE", "INACTIVE", "DRAFT"], default: "ACTIVE", index: true },
  },
  { timestamps: true, collection: "courses" }
);

courseSchema.pre("save", function (next) {
  if (Array.isArray(this.questions)) {
    this.questionCount = this.questions.length;
    this.questionIds = this.questions.map((q) => q.questionId);
    this.totalPoints = this.questions.reduce((sum, q) => sum + Number(q.points || 0), 0);

    if (!this.scoring) this.scoring = {};
    this.scoring.totalPoints = this.totalPoints;

    if (!this.passingScore) {
      this.passingScore = this.scoring.passingScore || Math.ceil(this.totalPoints * 0.7);
    }

    this.scoring.passingScore = this.passingScore;
  }
  next();
});

module.exports = mongoose.model("Course", courseSchema);
