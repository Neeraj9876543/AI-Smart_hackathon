const { body, validationResult } = require('express-validator');

// Handle validation errors
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array()
    });
  }
  next();
};

// Login validation rules
const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  handleValidationErrors
];

// User validation rules
const validateUser = [
  body('name')
    .trim()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be between 2 and 50 characters'),
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email'),
  body('password')
    .isLength({ min: 6 })
    .withMessage('Password must be at least 6 characters long'),
  body('role')
    .optional()
    .isIn(['student', 'admin'])
    .withMessage('Role must be either student or admin'),
  handleValidationErrors
];

// Course validation rules
const validateCourse = [
  body('name')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Course name must be between 3 and 100 characters'),
  body('code')
    .trim()
    .isLength({ min: 3, max: 10 })
    .matches(/^[A-Z]{2,4}\d{3,4}$/)
    .withMessage('Course code must be in format like CS101 or MATH200'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 500 })
    .withMessage('Description must be between 10 and 500 characters'),
  body('instructor')
    .isMongoId()
    .withMessage('Valid instructor ID is required'),
  body('credits')
    .isInt({ min: 1, max: 6 })
    .withMessage('Credits must be between 1 and 6'),
  body('semester')
    .isIn(['Fall', 'Spring', 'Summer', 'Winter'])
    .withMessage('Semester must be Fall, Spring, Summer, or Winter'),
  body('year')
    .isInt({ min: 2020, max: 2030 })
    .withMessage('Year must be between 2020 and 2030'),
  handleValidationErrors
];

// Assignment validation rules
const validateAssignment = [
  body('title')
    .trim()
    .isLength({ min: 3, max: 100 })
    .withMessage('Assignment title must be between 3 and 100 characters'),
  body('description')
    .trim()
    .isLength({ min: 10, max: 1000 })
    .withMessage('Description must be between 10 and 1000 characters'),
  body('course')
    .isMongoId()
    .withMessage('Valid course ID is required'),
  body('dueDate')
    .isISO8601()
    .toDate()
    .withMessage('Valid due date is required'),
  body('maxPoints')
    .isInt({ min: 1, max: 1000 })
    .withMessage('Max points must be between 1 and 1000'),
  body('type')
    .isIn(['homework', 'quiz', 'exam', 'project', 'participation'])
    .withMessage('Type must be homework, quiz, exam, project, or participation'),
  body('instructions')
    .optional()
    .trim()
    .isLength({ max: 2000 })
    .withMessage('Instructions must not exceed 2000 characters'),
  handleValidationErrors
];

// Grade validation rules
const validateGrade = [
  body('student')
    .isMongoId()
    .withMessage('Valid student ID is required'),
  body('assignment')
    .isMongoId()
    .withMessage('Valid assignment ID is required'),
  body('score')
    .isFloat({ min: 0 })
    .withMessage('Score must be a positive number'),
  body('feedback')
    .optional()
    .trim()
    .isLength({ max: 1000 })
    .withMessage('Feedback must not exceed 1000 characters'),
  body('isLate')
    .optional()
    .isBoolean()
    .withMessage('isLate must be a boolean'),
  body('submissionDate')
    .optional()
    .isISO8601()
    .toDate()
    .withMessage('Valid submission date is required'),
  handleValidationErrors
];

// Enrollment validation rules
const validateEnrollment = [
  body('studentId')
    .isMongoId()
    .withMessage('Valid student ID is required'),
  handleValidationErrors
];

module.exports = {
  validateUser,
  validateLogin,
  validateCourse,
  validateAssignment,
  validateGrade,
  validateEnrollment,
  handleValidationErrors
};
