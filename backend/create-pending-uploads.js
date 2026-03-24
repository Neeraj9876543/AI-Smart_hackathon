const mongoose = require('mongoose');
const User = require('./models/User');
const Document = require('./models/Document');
const Achievement = require('./models/Achievement');

async function createPendingUploads() {
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

    // Create pending documents
    const pendingDocuments = [
      {
        studentId: testStudent._id,
        type: '10th Memo',
        status: 'Pending',
        uploadedDate: new Date(),
        fileName: 'tenth_memo.pdf',
        originalName: '10th Class Memo.pdf',
        fileUrl: '/uploads/documents/tenth_memo.pdf',
        fileSize: 800000,
        mimeType: 'application/pdf',
        hasAttachment: true
      },
      {
        studentId: testStudent._id,
        type: 'Inter Memo',
        status: 'Pending',
        uploadedDate: new Date(),
        fileName: 'inter_memo.pdf',
        originalName: 'Intermediate Memo.pdf',
        fileUrl: '/uploads/documents/inter_memo.pdf',
        fileSize: 900000,
        mimeType: 'application/pdf',
        hasAttachment: true
      },
      {
        studentId: testStudent._id,
        type: 'Income Certificate',
        status: 'Pending',
        uploadedDate: new Date(),
        fileName: 'income_cert.pdf',
        originalName: 'Income Certificate.pdf',
        fileUrl: '/uploads/documents/income_cert.pdf',
        fileSize: 400000,
        mimeType: 'application/pdf',
        hasAttachment: true
      }
    ];

    // Create pending achievements
    const pendingAchievements = [
      {
        studentId: testStudent._id,
        title: 'Coding Competition Winner',
        type: 'Technical Competition',
        description: 'Won 2nd prize in state-level coding competition',
        status: 'Pending',
        uploadedDate: new Date(),
        date: new Date('2024-03-20'),
        academicYear: '2024-25',
        semester: '6th',
        fileName: 'coding_cert.pdf',
        originalName: 'Coding Competition Certificate.pdf',
        fileUrl: '/uploads/achievements/coding_cert.pdf',
        fileSize: 600000,
        mimeType: 'application/pdf',
        hasAttachment: true
      },
      {
        studentId: testStudent._id,
        title: 'Workshop on Machine Learning',
        type: 'Workshop',
        description: 'Attended 3-day workshop on Machine Learning and AI',
        status: 'Pending',
        uploadedDate: new Date(),
        date: new Date('2024-02-15'),
        academicYear: '2024-25',
        semester: '6th',
        fileName: 'ml_workshop.pdf',
        originalName: 'ML Workshop Certificate.pdf',
        fileUrl: '/uploads/achievements/ml_workshop.pdf',
        fileSize: 450000,
        mimeType: 'application/pdf',
        hasAttachment: true
      },
      {
        studentId: testStudent._id,
        title: 'Sports Meet Champion',
        type: 'Sports',
        description: 'Won first prize in 100m sprint and relay race',
        status: 'Pending',
        uploadedDate: new Date(),
        date: new Date('2024-01-25'),
        academicYear: '2024-25',
        semester: '5th',
        fileName: 'sports_cert.pdf',
        originalName: 'Sports Meet Certificate.pdf',
        fileUrl: '/uploads/achievements/sports_cert.pdf',
        fileSize: 350000,
        mimeType: 'application/pdf',
        hasAttachment: true
      }
    ];

    // Insert pending documents
    const savedDocuments = await Document.insertMany(pendingDocuments);
    console.log(`Created ${savedDocuments.length} pending documents`);

    // Insert pending achievements
    const savedAchievements = await Achievement.insertMany(pendingAchievements);
    console.log(`Created ${savedAchievements.length} pending achievements`);

    console.log('\nPending uploads created successfully!');
    console.log('Student:', testStudent.name);
    console.log('Pending Documents:', savedDocuments.length);
    console.log('Pending Achievements:', savedAchievements.length);
    console.log('\nThese will now appear in the Admin Verification page.');

  } catch (error) {
    console.error('Error creating pending uploads:', error);
  } finally {
    await mongoose.disconnect();
  }
}

createPendingUploads();
