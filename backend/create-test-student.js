const mongoose = require('mongoose');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function createTestStudent() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/student-success-hub');
    console.log('Connected to MongoDB');

    // Check if student already exists
    const existingStudent = await User.findOne({ email: 'teststudent@university.edu' });
    if (existingStudent) {
      console.log('Test student already exists');
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash('password123', 10);

    // Create test student
    const testStudent = new User({
      name: 'Test Student',
      email: 'teststudent@university.edu',
      password: hashedPassword,
      role: 'student',
      studentDetails: {
        regNo: '21A91A0501',
        branch: 'CSE',
        section: 'A',
        year: '3rd',
        semester: '6th',
        academicYear: '2024-25',
        admissionCategory: 'EAMCET',
        dob: '2003-05-15',
        gender: 'Male',
        phone: '9876543210',
        address: 'Hyderabad, Telangana'
      }
    });

    await testStudent.save();
    console.log('Test student created successfully!');
    console.log('Email: teststudent@university.edu');
    console.log('Password: password123');
    console.log('Reg No: 21A91A0501');

  } catch (error) {
    console.error('Error creating test student:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestStudent();
