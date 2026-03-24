const express = require('express');
const Course = require('../models/Course');
const User = require('../models/User');
const Enrollment = require('../models/Enrollment');
const router = express.Router();
const verifyToken = require('../middleware/auth');

// Get all courses (with optional filtering)
router.get('/', verifyToken, async (req, res) => {
  try {
    const { semester, year, instructor } = req.query;
    let filter = { isActive: true };
    
    if (semester) filter.semester = semester;
    if (year) filter.year = parseInt(year);
    if (instructor) filter.instructor = instructor;
    
    const courses = await Course.find(filter)
      .populate('instructor', 'name email')
      .populate('students', 'name email')
      .sort({ createdAt: -1 });
    
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get course by ID
router.get('/:id', verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id)
      .populate('instructor', 'name email')
      .populate('students', 'name email');
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }
    
    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Create new course (admin/instructor only)
router.post('/', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create courses' });
    }

    const { name, code, description, instructor, credits, semester, year } = req.body;

    // Check if course code already exists
    const existingCourse = await Course.findOne({ code });
    if (existingCourse) {
      return res.status(400).json({ message: 'Course code already exists' });
    }

    // Verify instructor exists
    const instructorUser = await User.findById(instructor);
    if (!instructorUser) {
      return res.status(400).json({ message: 'Instructor not found' });
    }

    const course = new Course({
      name,
      code,
      description,
      instructor,
      credits,
      semester,
      year
    });

    await course.save();
    await course.populate('instructor', 'name email');

    res.status(201).json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update course (admin/instructor only)
router.put('/:id', verifyToken, async (req, res) => {
  try {
    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if user is admin or instructor of this course
    if (req.user.role !== 'admin' && course.instructor.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Not authorized to update this course' });
    }

    const { name, description, credits, semester, year, isActive } = req.body;

    if (name) course.name = name;
    if (description) course.description = description;
    if (credits) course.credits = credits;
    if (semester) course.semester = semester;
    if (year) course.year = year;
    if (isActive !== undefined) course.isActive = isActive;

    await course.save();
    await course.populate('instructor', 'name email');

    res.json(course);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete course (admin only)
router.delete('/:id', verifyToken, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete courses' });
    }

    const course = await Course.findById(req.params.id);
    
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check for existing enrollments
    const enrollments = await Enrollment.find({ course: req.params.id, status: 'active' });
    if (enrollments.length > 0) {
      return res.status(400).json({ message: 'Cannot delete course with active enrollments' });
    }

    await Course.findByIdAndDelete(req.params.id);
    res.json({ message: 'Course deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Enroll student in course
router.post('/:id/enroll', verifyToken, async (req, res) => {
  try {
    const { studentId } = req.body;
    
    // Check if course exists
    const course = await Course.findById(req.params.id);
    if (!course) {
      return res.status(404).json({ message: 'Course not found' });
    }

    // Check if student exists
    const student = await User.findById(studentId);
    if (!student || student.role !== 'student') {
      return res.status(400).json({ message: 'Student not found' });
    }

    // Check if already enrolled
    const existingEnrollment = await Enrollment.findOne({
      student: studentId,
      course: req.params.id
    });

    if (existingEnrollment) {
      return res.status(400).json({ message: 'Student already enrolled' });
    }

    // Create enrollment
    const enrollment = new Enrollment({
      student: studentId,
      course: req.params.id
    });

    await enrollment.save();

    // Add student to course
    course.students.push(studentId);
    await course.save();

    res.status(201).json({ message: 'Student enrolled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get student's courses
router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    const enrollments = await Enrollment.find({ 
      student: req.params.studentId, 
      status: 'active' 
    }).populate('course');

    const courses = enrollments.map(enrollment => enrollment.course);
    res.json(courses);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
