const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
require('dotenv').config();

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-success-hub');
    console.log('MongoDB connected for seeding...');

    // Demo Student
    const studentUser = await User.findOne({ email: 'student@demo.com' });
    if (!studentUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const newStudent = new User({
        name: 'Demo Student',
        email: 'student@demo.com',
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
          dob: new Date('2003-05-15'),
          gender: 'Male',
          phone: '9876543210',
          address: 'Hyderabad, Telangana'
        }
      });
      await newStudent.save();
      console.log('Demo student created');
    } else {
      console.log('Demo student already exists');
    }

    // Demo Admin
    const adminUser = await User.findOne({ email: 'admin@demo.com' });
    if (!adminUser) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash('password123', salt);
      
      const newAdmin = new User({
        name: 'Demo Admin',
        email: 'admin@demo.com',
        password: hashedPassword,
        role: 'admin'
      });
      await newAdmin.save();
      console.log('Demo admin created');
    } else {
      console.log('Demo admin already exists');
    }

    console.log('Seeding completed. Exiting...');
    process.exit(0);

  } catch (err) {
    console.error('Error seeding database:', err);
    process.exit(1);
  }
};

seedDatabase();
