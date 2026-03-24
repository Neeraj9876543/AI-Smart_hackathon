const express = require('express');
const Grade = require('../models/Grade');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const User = require('../models/User');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// Get grades for a specific assignment (instructor/admin only)
router.get('/assignment/:assignmentId', verifyToken, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.assignmentId).populate('course');
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user is instructor of this course or admin
    const isInstructor = assignment.course.instructor.toString() === req.user.userId;
    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these grades' });
    }

    const grades = await Grade.find({ assignment: req.params.assignmentId })
      .populate('student', 'name email')
      .populate('gradedBy', 'name email')
      .sort({ 'student.name': 1 });

    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's grades for a course
router.get('/student/:studentId/course/:courseId', verifyToken, async (req, res) => {
  try {
    const { studentId, courseId } = req.params;

    // Only allow students to view their own grades (unless admin)
    if (req.user.userId !== studentId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these grades' });
    }

    // Check if student is enrolled in the course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isEnrolled = course.students.includes(studentId);
    if (!isEnrolled && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Student not enrolled in this course' });
    }

    const grades = await Grade.find({ student: studentId, course: courseId })
      .populate('assignment', 'title type maxPoints dueDate')
      .populate('gradedBy', 'name email')
      .sort({ 'assignment.dueDate': 1 });

    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get all grades for a student
router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    // Only allow students to view their own grades (unless admin)
    if (req.user.userId !== req.params.studentId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these grades' });
    }

    const grades = await Grade.find({ student: req.params.studentId })
      .populate('assignment', 'title type maxPoints dueDate')
      .populate('course', 'name code')
      .populate('gradedBy', 'name email')
      .sort({ 'course.name': 1, 'assignment.dueDate': 1 });

    res.json(grades);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create or update a grade (instructor/admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { student, assignment, score, feedback, isLate, submissionDate } = req.body;

    // Verify assignment exists and get course info
    const assignmentDoc = await Assignment.findById(assignment).populate('course');
    if (!assignmentDoc) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user is instructor of this course or admin
    const isInstructor = assignmentDoc.course.instructor.toString() === req.user.userId;
    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to grade this assignment' });
    }

    // Verify student is enrolled in the course
    const course = await Course.findById(assignmentDoc.course._id);
    const isEnrolled = course.students.includes(student);
    if (!isEnrolled) {
      return res.status(400).json({ message: 'Student not enrolled in this course' });
    }

    // Check if grade already exists
    let grade = await Grade.findOne({ student, assignment });

    if (grade) {
      // Update existing grade
      grade.score = score;
      grade.feedback = feedback || grade.feedback;
      grade.gradedBy = req.user.userId;
      grade.gradedAt = new Date();
      grade.isLate = isLate !== undefined ? isLate : grade.isLate;
      grade.submissionDate = submissionDate || grade.submissionDate;
    } else {
      // Create new grade
      grade = new Grade({
        student,
        assignment,
        course: assignmentDoc.course._id,
        score,
        maxPoints: assignmentDoc.maxPoints,
        feedback: feedback || '',
        gradedBy: req.user.userId,
        isLate: isLate || false,
        submissionDate: submissionDate || new Date()
      });
    }

    await grade.save();
    await grade.populate([
      { path: 'student', select: 'name email' },
      { path: 'assignment', select: 'title maxPoints' },
      { path: 'gradedBy', select: 'name email' }
    ]);

    res.status(201).json(grade);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update a grade (instructor/admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id).populate('assignment');
    
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    // Check if user is instructor of this course or admin
    const assignment = await Assignment.findById(grade.assignment._id).populate('course');
    const isInstructor = assignment.course.instructor.toString() === req.user.userId;
    
    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this grade' });
    }

    const { score, feedback, isLate, submissionDate } = req.body;

    if (score !== undefined) grade.score = score;
    if (feedback !== undefined) grade.feedback = feedback;
    if (isLate !== undefined) grade.isLate = isLate;
    if (submissionDate !== undefined) grade.submissionDate = submissionDate;
    
    grade.gradedBy = req.user.userId;
    grade.gradedAt = new Date();

    await grade.save();
    await grade.populate([
      { path: 'student', select: 'name email' },
      { path: 'assignment', select: 'title maxPoints' },
      { path: 'gradedBy', select: 'name email' }
    ]);

    res.json(grade);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete a grade (instructor/admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const grade = await Grade.findById(req.params.id).populate('assignment');
    
    if (!grade) {
      return res.status(404).json({ message: 'Grade not found' });
    }

    // Check if user is instructor of this course or admin
    const assignment = await Assignment.findById(grade.assignment._id).populate('course');
    const isInstructor = assignment.course.instructor.toString() === req.user.userId;
    
    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this grade' });
    }

    await Grade.findByIdAndDelete(req.params.id);
    res.json({ message: 'Grade deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get course statistics (instructor/admin only)
router.get('/stats/course/:courseId', verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.courseId);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is instructor of this course or admin
    const isInstructor = course.instructor.toString() === req.user.userId;
    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view course statistics' });
    }

    const grades = await Grade.find({ course: req.params.courseId })
      .populate('student', 'name email')
      .populate('assignment', 'title type maxPoints');

    // Calculate statistics
    const totalGrades = grades.length;
    const avgScore = totalGrades > 0 ? grades.reduce((sum, grade) => sum + grade.percentage, 0) / totalGrades : 0;
    
    const assignmentStats = {};
    grades.forEach(grade => {
      const assignmentId = grade.assignment._id.toString();
      if (!assignmentStats[assignmentId]) {
        assignmentStats[assignmentId] = {
          assignment: grade.assignment,
          grades: [],
          average: 0,
          count: 0
        };
      }
      assignmentStats[assignmentId].grades.push(grade);
      assignmentStats[assignmentId].count++;
    });

    // Calculate averages for each assignment
    Object.keys(assignmentStats).forEach(key => {
      const stats = assignmentStats[key];
      stats.average = stats.grades.reduce((sum, grade) => sum + grade.percentage, 0) / stats.count;
    });

    res.json({
      totalGrades,
      averageScore: avgScore,
      assignmentStats: Object.values(assignmentStats)
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
