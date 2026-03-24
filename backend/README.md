# Student Success Hub Backend

A comprehensive backend API for managing student courses, assignments, and grades.

## Features

- **Authentication**: JWT-based authentication with user roles (student, admin)
- **Course Management**: Create, read, update, and delete courses
- **Assignment Management**: Manage assignments with different types and due dates
- **Grade Management**: Comprehensive grading system with feedback
- **Enrollment System**: Student course enrollment tracking
- **Input Validation**: Robust validation using express-validator
- **Error Handling**: Centralized error handling middleware

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login user
- `GET /api/auth/verify` - Verify token and get user info

### Courses
- `GET /api/courses` - Get all courses (with optional filtering)
- `GET /api/courses/:id` - Get course by ID
- `POST /api/courses` - Create new course (admin only)
- `PUT /api/courses/:id` - Update course (admin/instructor only)
- `DELETE /api/courses/:id` - Delete course (admin only)
- `POST /api/courses/:id/enroll` - Enroll student in course
- `GET /api/courses/student/:studentId` - Get student's courses

### Assignments
- `GET /api/assignments/course/:courseId` - Get assignments for a course
- `GET /api/assignments/:id` - Get assignment by ID
- `POST /api/assignments` - Create new assignment (instructor only)
- `PUT /api/assignments/:id` - Update assignment (instructor only)
- `DELETE /api/assignments/:id` - Delete assignment (instructor only)
- `GET /api/assignments/student/:studentId` - Get student's assignments
- `PATCH /api/assignments/:id/publish` - Publish/unpublish assignment

### Grades
- `GET /api/grades/assignment/:assignmentId` - Get grades for assignment (instructor only)
- `GET /api/grades/student/:studentId/course/:courseId` - Get student's grades for course
- `GET /api/grades/student/:studentId` - Get all grades for student
- `POST /api/grades` - Create/update grade (instructor only)
- `PUT /api/grades/:id` - Update grade (instructor only)
- `DELETE /api/grades/:id` - Delete grade (instructor only)
- `GET /api/grades/stats/course/:courseId` - Get course statistics (instructor only)

### Health Check
- `GET /api/health` - Health check endpoint

## Data Models

### User
- `name`: String (required)
- `email`: String (required, unique)
- `password`: String (required, hashed)
- `role`: String (student, admin)
- `createdAt`: Date

### Course
- `name`: String (required)
- `code`: String (required, unique)
- `description`: String (required)
- `instructor`: ObjectId (ref: User)
- `students`: [ObjectId] (ref: User)
- `credits`: Number (1-6)
- `semester`: String (Fall, Spring, Summer, Winter)
- `year`: Number
- `isActive`: Boolean

### Assignment
- `title`: String (required)
- `description`: String (required)
- `course`: ObjectId (ref: Course)
- `instructor`: ObjectId (ref: User)
- `dueDate`: Date (required)
- `maxPoints`: Number (required)
- `type`: String (homework, quiz, exam, project, participation)
- `instructions`: String
- `isPublished`: Boolean

### Grade
- `student`: ObjectId (ref: User)
- `assignment`: ObjectId (ref: Assignment)
- `course`: ObjectId (ref: Course)
- `score`: Number
- `maxPoints`: Number
- `percentage`: Number (calculated)
- `feedback`: String
- `gradedBy`: ObjectId (ref: User)
- `gradedAt`: Date
- `isLate`: Boolean
- `submissionDate`: Date

### Enrollment
- `student`: ObjectId (ref: User)
- `course`: ObjectId (ref: Course)
- `enrolledAt`: Date
- `status`: String (active, dropped, completed)
- `finalGrade`: Number
- `gradeLetter`: String

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up environment variables in `.env`:
```
PORT=5000
JWT_SECRET=your_jwt_secret_key_here_change_this_in_production
MONGODB_URI=mongodb://localhost:27017/student-success-hub
```

3. Start the server:
```bash
npm start
```

For development with auto-reload:
```bash
npm run dev
```

## Authentication

All protected endpoints require a JWT token in the Authorization header:
```
Authorization: Bearer <token>
```

## Error Handling

The API uses standardized error responses:
```json
{
  "success": false,
  "message": "Error description",
  "errors": [] // Validation errors if applicable
}
```

## Validation

Input validation is performed using express-validator with the following rules:
- User registration: name (2-50 chars), email (valid format), password (6+ chars)
- Course creation: name (3-100 chars), code (format like CS101), description (10-500 chars)
- Assignment creation: title (3-100 chars), description (10-1000 chars), dueDate (ISO format)
- Grade creation: score (positive number), feedback (max 1000 chars)

## Security Features

- Password hashing with bcryptjs
- JWT token authentication
- Role-based access control
- Input validation and sanitization
- CORS configuration
- Error handling without exposing sensitive information
