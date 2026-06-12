const courseService = require("./course.service");
const CourseProgress = require("./courseProgress.model");

exports.getAllCourses = async (req, res) => {
  try {
    const courses = await courseService.getAllCourses(req.query);
    res.status(200).json({ success: true, count: courses.length, data: courses });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch courses" });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const course = await courseService.getCourseWithQuestions(req.params.courseId);
    res.status(200).json({ success: true, data: course });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch course" });
  }
};

exports.createCourse = async (req, res) => {
  try {
    const course = await courseService.createCourse(req.body);
    res.status(201).json({ success: true, message: "Course created successfully", data: course });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to create course" });
  }
};

exports.addQuestionToCourse = async (req, res) => {
  try {
    const course = await courseService.addQuestionToCourse(req.params.courseId, req.body);
    res.status(201).json({ success: true, message: "Question added successfully", data: course });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to add question" });
  }
};

exports.startCourseAttempt = async (req, res) => {
  try {
    const attempt = await courseService.startCourseAttempt(req.body);
    res.status(201).json({ success: true, message: "Course attempt started", data: attempt });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to start course attempt" });
  }
};

exports.submitCourseAttempt = async (req, res) => {
  try {
    const attempt = await courseService.submitCourseAttempt(req.body);
    res.status(201).json({ success: true, message: "Course submitted successfully", data: attempt });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to submit course" });
  }
};

exports.getAttemptsByStaff = async (req, res) => {
  try {
    const attempts = await courseService.getAttemptsByStaff(req.params.employeeCode);
    res.status(200).json({ success: true, count: attempts.length, data: attempts });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch staff attempts" });
  }
};

exports.getAttemptsByCourse = async (req, res) => {
  try {
    const attempts = await courseService.getAttemptsByCourse(req.params.courseId);
    res.status(200).json({ success: true, count: attempts.length, data: attempts });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch course attempts" });
  }
};

exports.getPendingReviewAttempts = async (req, res) => {
  try {
    const attempts = await courseService.getPendingReviewAttempts(req.query.managerId);
    res.status(200).json({ success: true, count: attempts.length, data: attempts });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to fetch pending review attempts" });
  }
};

exports.getProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user.id;
    const progress = await CourseProgress.findOne({ userId, courseId }).lean();
    if (!progress) {
      return res.json({ success: true, data: { answers: {}, submitted: false, autoPoints: 0, totalPoints: 0, passed: false, pendingDescriptive: false, attempts: 0 } });
    }
    res.json({ success: true, data: progress });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.submitCourseByCourseId = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { answers = [] } = req.body;
    const userId = req.user?.id;

    const Course = require("./course.model");
    const course = await Course.findOne({ courseId }).lean();
    if (!course) {
      return res.status(404).json({ success: false, message: "Course not found" });
    }

    // Convert answers array to map for quick lookup
    const answerMap = {};
    for (const a of answers) {
      answerMap[a.questionId] = a.answer;
    }

    let autoPoints = 0;
    let totalPoints = 0;
    let pendingDescriptive = false;

    for (const q of course.questions || []) {
      totalPoints += Number(q.points) || 1;
      if (q.type === "DESCRIPTIVE") {
        pendingDescriptive = true;
      } else {
        const given = answerMap[q.questionId];
        if (given !== undefined && String(given) === String(q.correctAnswer)) {
          autoPoints += Number(q.points) || 1;
        }
      }
    }

    const passingScore = course.passingScore || Math.ceil(totalPoints * 0.7);
    const passed = autoPoints >= passingScore;

    // Persist progress
    if (userId) {
      await CourseProgress.findOneAndUpdate(
        { userId, courseId },
        {
          $set: {
            answers: answerMap,
            submitted: true,
            autoPoints,
            totalPoints,
            passed,
            pendingDescriptive,
          },
          $inc: { attempts: 1 },
        },
        { upsert: true, new: true }
      );
    }

    res.status(201).json({ success: true, autoPoints, totalPoints, passed, pendingDescriptive });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to submit course" });
  }
};

exports.reviewDescriptiveAnswers = async (req, res) => {
  try {
    const attempt = await courseService.reviewDescriptiveAnswers({
      attemptId: req.params.attemptId,
      reviewedBy: req.body.reviewedBy,
      reviews: req.body.reviews,
    });
    res.status(200).json({ success: true, message: "Descriptive answers reviewed successfully", data: attempt });
  } catch (error) {
    res.status(error.statusCode || 500).json({ success: false, message: error.message || "Failed to review answers" });
  }
};
