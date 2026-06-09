const Course = require("./course.model");
const CourseAttempt = require("./courseAttempt.model");
const Staff = require("../user/staff.model");

const normalizeAnswer = (value) => {
  if (typeof value === "boolean") return value;
  if (typeof value === "number") return value;
  if (value === null || value === undefined) return "";
  return String(value).trim().toLowerCase();
};

const generateAttemptId = () => {
  return `ATT-${Date.now()}-${Math.floor(Math.random() * 100000)}`;
};

const getAllCourses = async (filters = {}) => {
  const query = {};

  query.status = filters.status || "ACTIVE";

  if (filters.category) query.category = new RegExp(filters.category, "i");
  if (filters.level) query.level = filters.level;
  if (filters.role) query.audienceRoles = String(filters.role).toUpperCase();
  if (filters.department) query.applicableDepartments = new RegExp(filters.department, "i");

  if (filters.search) {
    query.$or = [
      { title: new RegExp(filters.search, "i") },
      { courseCode: new RegExp(filters.search, "i") },
      { courseId: new RegExp(filters.search, "i") },
      { category: new RegExp(filters.search, "i") },
    ];
  }

  return await Course.find(query)
    .sort({ courseCode: 1 })
    .select("-questions.correctAnswer")
    .lean();
};

const getCourseByIdentifier = async (courseIdentifier) => {
  const course = await Course.findOne({
    $or: [{ courseId: courseIdentifier }, { courseCode: courseIdentifier }],
  }).lean();

  if (!course) {
    const error = new Error("Course not found");
    error.statusCode = 404;
    throw error;
  }

  return course;
};

const getCourseWithQuestions = async (courseIdentifier) => {
  const course = await getCourseByIdentifier(courseIdentifier);

  const safeQuestions = course.questions.map(({ correctAnswer, ...rest }) => rest);

  return {
    ...course,
    questions: safeQuestions.sort((a, b) => a.sequence - b.sequence),
  };
};

const createCourse = async (payload) => {
  const {
    courseId,
    courseCode,
    title,
    category,
    level = "Basic",
    durationMinutes = 0,
    audienceRoles = ["STAFF"],
    applicableDepartments = [],
    courseText,
    questions = [],
    scoring,
    attemptRules,
    status = "ACTIVE",
  } = payload;

  if (!courseId || !courseCode || !title || !courseText) {
    const error = new Error("courseId, courseCode, title and courseText are required");
    error.statusCode = 400;
    throw error;
  }

  const existing = await Course.findOne({ $or: [{ courseId }, { courseCode }] });
  if (existing) {
    const error = new Error("Course already exists");
    error.statusCode = 409;
    throw error;
  }

  const normalizedQuestions = questions.map((q, index) => ({
    questionId: q.questionId || `${courseId}-Q${String(index + 1).padStart(2, "0")}`,
    courseId,
    courseCode,
    sequence: q.sequence || index + 1,
    type: q.type,
    question: q.question,
    options: q.options || [],
    correctAnswer: q.correctAnswer,
    sampleAnswer: q.sampleAnswer || "",
    keywords: q.keywords || [],
    points: q.points || 1,
    explanation: q.explanation || "",
  }));

  const totalPoints = normalizedQuestions.reduce((sum, q) => sum + Number(q.points || 0), 0);
  const passingScore = scoring?.passingScore || Math.ceil(totalPoints * 0.7);

  return await Course.create({
    courseId,
    courseCode,
    title,
    category,
    level,
    durationMinutes,
    audienceRoles,
    applicableDepartments,
    courseText,
    questions: normalizedQuestions,
    questionIds: normalizedQuestions.map((q) => q.questionId),
    questionCount: normalizedQuestions.length,
    totalPoints,
    passingScore,
    scoring: {
      totalPoints,
      passingScore,
      scoreType: scoring?.scoreType || "AUTO_WITH_MANAGER_REVIEW_FOR_DESCRIPTIVE",
      scoreCalculation:
        scoring?.scoreCalculation ||
        "score = sum(points for correct MCQ/TRUE_FALSE answers) + manager-reviewed descriptive points",
    },
    attemptRules: {
      maxAttempts: attemptRules?.maxAttempts || 3,
      allowRetakeAfterFail: attemptRules?.allowRetakeAfterFail ?? true,
      showCorrectAnswersAfterPass: attemptRules?.showCorrectAnswersAfterPass ?? true,
      managerReviewRequiredForDescriptive: attemptRules?.managerReviewRequiredForDescriptive ?? true,
      questionRandomization: attemptRules?.questionRandomization ?? false,
    },
    status,
  });
};

const addQuestionToCourse = async (courseIdentifier, payload) => {
  const course = await Course.findOne({
    $or: [{ courseId: courseIdentifier }, { courseCode: courseIdentifier }],
  });

  if (!course) {
    const error = new Error("Course not found");
    error.statusCode = 404;
    throw error;
  }

  if (!payload.type || !payload.question) {
    const error = new Error("type and question are required");
    error.statusCode = 400;
    throw error;
  }

  const sequence = payload.sequence || course.questions.length + 1;
  const questionId =
    payload.questionId || `${course.courseId}-Q${String(sequence).padStart(2, "0")}`;

  if (course.questions.some((q) => q.questionId === questionId)) {
    const error = new Error("Question already exists with this questionId");
    error.statusCode = 409;
    throw error;
  }

  course.questions.push({
    questionId,
    courseId: course.courseId,
    courseCode: course.courseCode,
    sequence,
    type: payload.type,
    question: payload.question,
    options: payload.options || [],
    correctAnswer: payload.correctAnswer,
    sampleAnswer: payload.sampleAnswer || "",
    keywords: payload.keywords || [],
    points: payload.points || 1,
    explanation: payload.explanation || "",
  });

  course.questionIds = course.questions.map((q) => q.questionId);
  course.questionCount = course.questions.length;
  course.totalPoints = course.questions.reduce((sum, q) => sum + Number(q.points || 0), 0);
  course.scoring.totalPoints = course.totalPoints;
  course.passingScore = course.scoring.passingScore || course.passingScore;

  await course.save();
  return course;
};

const startCourseAttempt = async ({ courseId, employeeCode }) => {
  if (!courseId || !employeeCode) {
    const error = new Error("courseId and employeeCode are required");
    error.statusCode = 400;
    throw error;
  }

  const course = await getCourseByIdentifier(courseId);

  const staff = await Staff.findOne({ employeeCode: String(employeeCode) }).lean();
  if (!staff) {
    const error = new Error("Staff not found");
    error.statusCode = 404;
    throw error;
  }

  return await CourseAttempt.create({
    attemptId: generateAttemptId(),
    courseId: course.courseId,
    courseCode: course.courseCode,
    courseTitle: course.title,
    employeeCode: staff.employeeCode,
    staffName: staff.name,
    storeCode: staff.storeCode,
    storeName: staff.storeName,
    managerId: staff.managerId,
    managerName: staff.managerName,
    totalPoints: course.totalPoints || course.scoring?.totalPoints || 0,
    passingScore: course.passingScore || course.scoring?.passingScore || 0,
    status: "STARTED",
    answers: [],
    startedAt: new Date(),
  });
};

const submitCourseAttempt = async ({ courseId, employeeCode, answers }) => {
  if (!courseId || !employeeCode || !Array.isArray(answers)) {
    const error = new Error("courseId, employeeCode and answers array are required");
    error.statusCode = 400;
    throw error;
  }

  const course = await getCourseByIdentifier(courseId);

  const staff = await Staff.findOne({ employeeCode: String(employeeCode) }).lean();
  if (!staff) {
    const error = new Error("Staff not found");
    error.statusCode = 404;
    throw error;
  }

  const answerMap = {};
  answers.forEach((item) => { answerMap[item.questionId] = item.answer; });

  let earnedPoints = 0;
  let totalPoints = 0;
  let needsReview = false;

  const evaluatedAnswers = course.questions
    .sort((a, b) => a.sequence - b.sequence)
    .map((question) => {
      const submittedAnswer = answerMap[question.questionId];
      const points = Number(question.points || 0);
      totalPoints += points;

      let isCorrect = false;
      let earned = 0;
      let isAutoScored = true;
      let needsManagerReview = false;

      if (question.type === "MCQ" || question.type === "TRUE_FALSE") {
        isCorrect = normalizeAnswer(submittedAnswer) === normalizeAnswer(question.correctAnswer);
        earned = isCorrect ? points : 0;
      }

      if (question.type === "DESCRIPTIVE") {
        isCorrect = false;
        earned = 0;
        isAutoScored = false;
        needsManagerReview = true;
        needsReview = true;
      }

      earnedPoints += earned;

      return {
        questionId: question.questionId,
        type: question.type,
        question: question.question,
        submittedAnswer,
        correctAnswer: question.type === "DESCRIPTIVE" ? undefined : question.correctAnswer,
        isCorrect,
        isAutoScored,
        needsManagerReview,
        points,
        earnedPoints: earned,
        explanation: question.explanation || "",
      };
    });

  const passingScore = course.passingScore || course.scoring?.passingScore || 0;
  const percentage = totalPoints > 0 ? Math.round((earnedPoints / totalPoints) * 100) : 0;
  const passed = !needsReview && earnedPoints >= passingScore;

  let status = "FAILED";
  if (needsReview) status = "PENDING_REVIEW";
  else if (passed) status = "PASSED";

  return await CourseAttempt.create({
    attemptId: generateAttemptId(),
    courseId: course.courseId,
    courseCode: course.courseCode,
    courseTitle: course.title,
    employeeCode: staff.employeeCode,
    staffName: staff.name,
    storeCode: staff.storeCode,
    storeName: staff.storeName,
    managerId: staff.managerId,
    managerName: staff.managerName,
    answers: evaluatedAnswers,
    totalPoints,
    earnedPoints,
    percentage,
    passingScore,
    passed,
    status,
    startedAt: new Date(),
    submittedAt: new Date(),
  });
};

const getAttemptsByStaff = async (employeeCode) => {
  return await CourseAttempt.find({ employeeCode: String(employeeCode) })
    .sort({ createdAt: -1 })
    .lean();
};

const getAttemptsByCourse = async (courseIdentifier) => {
  const course = await getCourseByIdentifier(courseIdentifier);
  return await CourseAttempt.find({ courseId: course.courseId })
    .sort({ createdAt: -1 })
    .lean();
};

const getPendingReviewAttempts = async (managerId) => {
  const query = { status: "PENDING_REVIEW" };
  if (managerId) query.managerId = String(managerId);
  return await CourseAttempt.find(query).sort({ createdAt: -1 }).lean();
};

const reviewDescriptiveAnswers = async ({ attemptId, reviewedBy, reviews }) => {
  const attempt = await CourseAttempt.findOne({ attemptId });

  if (!attempt) {
    const error = new Error("Attempt not found");
    error.statusCode = 404;
    throw error;
  }

  if (!Array.isArray(reviews)) {
    const error = new Error("reviews array is required");
    error.statusCode = 400;
    throw error;
  }

  let earnedPoints = 0;

  attempt.answers = attempt.answers.map((answer) => {
    const review = reviews.find((r) => r.questionId === answer.questionId);
    if (review && answer.type === "DESCRIPTIVE") {
      answer.earnedPoints = Number(review.earnedPoints || 0);
      answer.isCorrect = answer.earnedPoints > 0;
      answer.needsManagerReview = false;
      answer.isAutoScored = false;
    }
    earnedPoints += Number(answer.earnedPoints || 0);
    return answer;
  });

  attempt.earnedPoints = earnedPoints;
  attempt.percentage =
    attempt.totalPoints > 0 ? Math.round((earnedPoints / attempt.totalPoints) * 100) : 0;
  attempt.passed = earnedPoints >= attempt.passingScore;
  attempt.status = attempt.passed ? "PASSED" : "FAILED";
  attempt.reviewedAt = new Date();
  attempt.reviewedBy = reviewedBy || "MANAGER";

  await attempt.save();
  return attempt;
};

module.exports = {
  getAllCourses,
  getCourseByIdentifier,
  getCourseWithQuestions,
  createCourse,
  addQuestionToCourse,
  startCourseAttempt,
  submitCourseAttempt,
  getAttemptsByStaff,
  getAttemptsByCourse,
  getPendingReviewAttempts,
  reviewDescriptiveAnswers,
};
