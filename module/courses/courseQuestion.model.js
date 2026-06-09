const mongoose = require("mongoose");

const courseQuestionSchema = new mongoose.Schema(
  {
    courseId: { type: String, required: true, trim: true, index: true },
    courseCode: { type: String, required: true, trim: true, index: true },
    courseTitle: { type: String, trim: true },
    questionId: { type: String, required: true, unique: true, trim: true, index: true },
    sequence: { type: Number, default: 1 },
    type: { type: String, enum: ["MCQ", "TRUE_FALSE", "DESCRIPTIVE"], required: true },
    question: { type: String, required: true, trim: true },
    options: [{ type: mongoose.Schema.Types.Mixed }],
    correctAnswer: { type: mongoose.Schema.Types.Mixed },
    sampleAnswer: { type: String, trim: true },
    keywords: [{ type: String, trim: true }],
    points: { type: Number, default: 1 },
    explanation: { type: String, trim: true },
    status: { type: String, enum: ["ACTIVE", "INACTIVE"], default: "ACTIVE" },
  },
  { timestamps: true, collection: "course_questions" }
);

module.exports = mongoose.model("CourseQuestion", courseQuestionSchema);
