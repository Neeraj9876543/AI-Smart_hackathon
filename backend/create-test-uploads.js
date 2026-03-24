const mongoose = require('mongoose');
const User = require('./models/User');
const Document = require('./models/Document');
const Achievement = require('./models/Achievement');

async function createTestUploads() {
  try {
    // Connect to MongoDB
    await mongoose.connect('mongodb://localhost:27017/student-success-hub');
    console.log('Connected to MongoDB');

    // Find the test student
    const testStudent = await User.findOne({ email: 'teststudent@university.edu' });
    if (!testStudent) {
      console.log('Test student not found. Please create the test student first.');
      return;
    }

    console.log('Found test student:', testStudent.name);

    // Create test documents
    const testDocuments = [
      {
        studentId: testStudent._id,
        type: 'Mark Memo (Sem 1-4)',
        status: 'Verified',
        uploadedDate: new Date(),
        fileName: 'markmemo.pdf',
        originalName: 'Semester 1-4 Mark Memo.pdf',
        fileUrl: '/uploads/documents/markmemo.pdf',
        fileSize: 1024000,
        mimeType: 'application/pdf',
        hasAttachment: true
      },
      {
        studentId: testStudent._id,
        type: 'Aadhaar',
        status: 'Verified',
        uploadedDate: new Date(),
        fileName: 'aadhaar.jpg',
        originalName: 'Aadhaar Card.jpg',
        fileUrl: '/uploads/documents/aadhaar.jpg',
        fileSize: 512000,
        mimeType: 'image/jpeg',
        hasAttachment: true
      },
      {
        studentId: testStudent._id,
        type: 'Study Certificate',
        status: 'Pending',
        uploadedDate: new Date(),
        fileName: 'study.pdf',
        originalName: 'Study Certificate.pdf',
        fileUrl: '/uploads/documents/study.pdf',
        fileSize: 256000,
        mimeType: 'application/pdf',
        hasAttachment: true
      }
    ];

    // Create test achievements
    const testAchievements = [
      {
        studentId: testStudent._id,
        title: 'Hackathon Winner',
        type: 'Hackathon',
        description: 'Won first prize in college hackathon',
        status: 'Verified',
        uploadedDate: new Date(),
        date: new Date('2024-03-15'),
        academicYear: '2024-25',
        semester: '6th',
        fileName: 'hackathon_cert.pdf',
        originalName: 'Hackathon Certificate.pdf',
        fileUrl: '/uploads/achievements/hackathon_cert.pdf',
        fileSize: 512000,
        mimeType: 'application/pdf',
        hasAttachment: true
      },
      {
        studentId: testStudent._id,
        title: 'Web Development Internship',
        type: 'Internship',
        description: 'Completed 2-month internship at Tech Company',
        status: 'Verified',
        uploadedDate: new Date(),
        date: new Date('2024-01-20'),
        academicYear: '2024-25',
        semester: '5th',
        fileName: 'internship_cert.pdf',
        originalName: 'Internship Certificate.pdf',
        fileUrl: '/uploads/achievements/internship_cert.pdf',
        fileSize: 768000,
        mimeType: 'application/pdf',
        hasAttachment: true
      },
      {
        studentId: testStudent._id,
        title: 'Paper Presentation',
        type: 'Technical Competition',
        description: 'Presented paper on AI in National Conference',
        status: 'Pending',
        uploadedDate: new Date(),
        date: new Date('2024-02-10'),
        academicYear: '2024-25',
        semester: '6th',
        fileName: 'paper_cert.pdf',
        originalName: 'Paper Presentation Certificate.pdf',
        fileUrl: '/uploads/achievements/paper_cert.pdf',
        fileSize: 640000,
        mimeType: 'application/pdf',
        hasAttachment: true
      }
    ];

    // Clear existing documents and achievements for this student
    await Document.deleteMany({ studentId: testStudent._id });
    await Achievement.deleteMany({ studentId: testStudent._id });

    // Insert test documents
    const savedDocuments = await Document.insertMany(testDocuments);
    console.log(`Created ${savedDocuments.length} test documents`);

    // Insert test achievements
    const savedAchievements = await Achievement.insertMany(testAchievements);
    console.log(`Created ${savedAchievements.length} test achievements`);

    console.log('\nTest uploads created successfully!');
    console.log('Student:', testStudent.name);
    console.log('Documents:', savedDocuments.length);
    console.log('Achievements:', savedAchievements.length);
    console.log('\nDocument Status:');
    savedDocuments.forEach(doc => {
      console.log(`- ${doc.type}: ${doc.status}`);
    });
    console.log('\nAchievement Status:');
    savedAchievements.forEach(ach => {
      console.log(`- ${ach.title}: ${ach.status}`);
    });

  } catch (error) {
    console.error('Error creating test uploads:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createTestUploads();
