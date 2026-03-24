const express = require('express');
const Assignment = require('../models/Assignment');
const Course = require('../models/Course');
const User = require('../models/User');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// Get all assignments for a course
router.get('/course/:courseId', verifyToken, async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // Check if user has access to this course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isEnrolled = course.students.includes(req.user.userId);
    const isInstructor = course.instructor.toString() === req.user.userId;
    
    if (!isEnrolled && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view assignments for this course' });
    }

    const assignments = await Assignment.find({ course: courseId })
      .populate('instructor', 'name email')
      .sort({ dueDate: 1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get assignment by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id)
      .populate('course', 'name code instructor')
      .populate('instructor', 'name email');

    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user has access to this assignment
    const isEnrolled = assignment.course.students.includes(req.user.userId);
    const isInstructor = assignment.course.instructor.toString() === req.user.userId;
    
    if (!isEnrolled && !isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view this assignment' });
    }

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new assignment (instructor/admin only)
router.post('/', verifyToken, async (req, res) => {
  try {
    const { title, description, course, dueDate, maxPoints, type, instructions } = req.body;

    // Check if course exists and user is instructor
    const courseDoc = await Course.findById(course);
    if (!courseDoc) {
      return res.status(404).json({ message: 'Course not found' });
    }

    const isInstructor = courseDoc.instructor.toString() === req.user.userId;
    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only instructors can create assignments' });
    }

    const assignment = new Assignment({
      title,
      description,
      course,
      instructor: req.user.userId,
      dueDate,
      maxPoints,
      type,
      instructions
    });

    await assignment.save();
    await assignment.populate('instructor', 'name email');

    res.status(201).json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update assignment (instructor/admin only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user is instructor of this course or admin
    const course = await Course.findById(assignment.course);
    const isInstructor = course.instructor.toString() === req.user.userId;
    
    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to update this assignment' });
    }

    const { title, description, dueDate, maxPoints, type, instructions, isPublished } = req.body;

    if (title) assignment.title = title;
    if (description) assignment.description = description;
    if (dueDate) assignment.dueDate = dueDate;
    if (maxPoints) assignment.maxPoints = maxPoints;
    if (type) assignment.type = type;
    if (instructions !== undefined) assignment.instructions = instructions;
    if (isPublished !== undefined) assignment.isPublished = isPublished;

    await assignment.save();
    await assignment.populate('instructor', 'name email');

    res.json(assignment);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete assignment (instructor/admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user is instructor of this course or admin
    const course = await Course.findById(assignment.course);
    const isInstructor = course.instructor.toString() === req.user.userId;
    
    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to delete this assignment' });
    }

    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Assignment deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's assignments
router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    // Only allow users to view their own assignments (unless admin)
    if (req.user.userId !== req.params.studentId && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to view these assignments' });
    }

    // Get courses the student is enrolled in
    const Course = require('../models/Course');
    const Enrollment = require('../models/Enrollment');
    
    const enrollments = await Enrollment.find({ 
      student: req.params.studentId, 
      status: 'active' 
    }).populate('course');

    const courseIds = enrollments.map(e => e.course._id);

    // Get assignments for those courses
    const assignments = await Assignment.find({ 
      course: { $in: courseIds },
      isPublished: true 
    })
      .populate('course', 'name code')
      .populate('instructor', 'name email')
      .sort({ dueDate: 1 });

    res.json(assignments);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Publish/unpublish assignment
router.patch('/:id/publish', verifyToken, async (req, res) => {
  try {
    const assignment = await Assignment.findById(req.params.id);
    
    if (!assignment) {
      return res.status(404).json({ message: 'Assignment not found' });
    }

    // Check if user is instructor of this course or admin
    const course = await Course.findById(assignment.course);
    const isInstructor = course.instructor.toString() === req.user.userId;
    
    if (!isInstructor && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Not authorized to publish this assignment' });
    }

    assignment.isPublished = !assignment.isPublished;
    await assignment.save();

    res.json({ 
      message: `Assignment ${assignment.isPublished ? 'published' : 'unpublished'} successfully`,
      isPublished: assignment.isPublished
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
