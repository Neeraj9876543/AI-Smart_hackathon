const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: function() {
      return !this.googleId; // Password not required for Google OAuth users
    },
  },
  role: {
    type: String,
    enum: ['student', 'faculty', 'admin'],
    default: 'student',
  },
  // Google OAuth fields
  googleId: {
    type: String,
    unique: true,
    sparse: true,
  },
  profileImage: {
    type: String,
    default: '',
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  // Student specific fields
  studentDetails: {
    regNo: String,
    branch: String,
    section: String,
    year: String,
    semester: String,
    academicYear: String,
    admissionCategory: String,
    dob: Date,
    gender: String,
    phone: String,
    address: String,
  },
  // Faculty specific fields
  facultyDetails: {
    employeeId: String,
    department: String,
    designation: String,
    specialization: String,
    phone: String,
    officeLocation: String,
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
