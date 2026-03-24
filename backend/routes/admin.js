const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Achievement = require('../models/Achievement');
const Document = require('../models/Document');
const verifyToken = require('../middleware/auth');

// Test route to debug admin routes
router.get('/test', (req, res) => {
  console.log('Admin test route hit!');
  res.json({ message: 'Admin routes are working!' });
});

// Simple stats route without authentication for testing
router.get('/stats-simple', async (req, res) => {
  try {
    console.log('Simple stats route hit!');
    
    // Get real database counts
    let totalStudents = 0;
    let totalAchievements = 0;
    let verifiedDocuments = 0;
    let pendingDocuments = 0;
    
    try {
      totalStudents = await User.countDocuments({ role: 'student' });
    } catch (err) {
      console.error('Error counting students:', err);
    }
    
    try {
      totalAchievements = await Achievement.countDocuments({});
    } catch (err) {
      console.error('Error counting achievements:', err);
    }
    
    try {
      verifiedDocuments = await Document.countDocuments({ status: 'Verified' });
      pendingDocuments = await Document.countDocuments({ status: 'Pending' });
    } catch (err) {
      console.error('Error counting documents:', err);
    }
    
    // Get achievements by category
    const achievementsByCategory = {};
    try {
      const categoryData = await Achievement.aggregate([
        { $group: { _id: '$type', count: { $sum: 1 } } },
        { $sort: { count: -1 } }
      ]);
      categoryData.forEach(item => {
        achievementsByCategory[item._id] = item.count;
      });
    } catch (err) {
      console.error('Error getting achievements by category:', err);
    }
    
    // Get achievements by department
    const achievementsByDepartment = {};
    try {
      const deptData = await Achievement.aggregate([
        {
          $lookup: {
            from: 'users',
            localField: 'studentId',
            foreignField: '_id',
            as: 'student'
          }
        },
        { $unwind: '$student' },
        { $match: { 'student.studentDetails.branch': { $exists: true, $ne: null } } },
        {
          $group: {
            _id: '$student.studentDetails.branch',
            count: { $sum: 1 }
          }
        },
        { $sort: { count: -1 } }
      ]);
      deptData.forEach(item => {
        achievementsByDepartment[item._id] = item.count;
      });
    } catch (err) {
      console.error('Error getting achievements by department:', err);
    }
    
    // Get recent student activity
    const recentActivity = [];
    try {
      const recentDocs = await Document.find({})
        .populate('studentId', 'name studentDetails.regNo studentDetails.branch')
        .select('type uploadedDate status')
        .sort({ uploadedDate: -1 })
        .limit(5);
      
      const recentAchs = await Achievement.find({})
        .populate('studentId', 'name studentDetails.regNo studentDetails.branch')
        .select('title type uploadedDate status')
        .sort({ uploadedDate: -1 })
        .limit(5);
      
      const activity = [
        ...recentDocs.map(doc => ({
          type: 'document',
          studentName: doc.studentId?.name || 'Unknown Student',
          studentRegNo: doc.studentId?.studentDetails?.regNo || 'N/A',
          studentBranch: doc.studentId?.studentDetails?.branch || 'N/A',
          achievementTitle: doc.type,
          achievementType: 'Document',
          status: doc.status,
          date: doc.uploadedDate
        })),
        ...recentAchs.map(ach => ({
          type: 'achievement',
          studentName: ach.studentId?.name || 'Unknown Student',
          studentRegNo: ach.studentId?.studentDetails?.regNo || 'N/A',
          studentBranch: ach.studentId?.studentDetails?.branch || 'N/A',
          achievementTitle: ach.title,
          achievementType: ach.type,
          status: ach.status,
          date: ach.uploadedDate
        }))
      ].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10);
      
      recentActivity.push(...activity.map(item => ({
        studentName: item.studentName,
        studentRegNo: item.studentRegNo,
        studentBranch: item.studentBranch,
        achievementTitle: item.achievementTitle,
        achievementType: item.achievementType,
        status: item.status,
        date: new Date(item.date).toLocaleDateString()
      })));
    } catch (err) {
      console.error('Error getting recent activity:', err);
    }
    
    const stats = {
      totalStudents,
      totalAchievements,
      verifiedDocuments,
      pendingDocuments,
      achievementsByCategory,
      achievementsByDepartment,
      recentActivity
    };
    
    console.log('Returning stats with charts and activity');
    res.json(stats);
  } catch (error) {
    console.error('Error in simple stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get analytics data for charts
router.get('/analytics', async (req, res) => {
  try {
    console.log('Fetching analytics data...');
    
    // Get all achievements with student data
    const achievements = await Achievement.find({})
      .populate('studentId', 'name studentDetails.branch studentDetails.regNo')
      .select('title type academicYear date studentId')
      .sort({ date: -1 });
    
    // Get all students
    const students = await User.find({ role: 'student' })
      .select('name studentDetails.branch studentDetails.regNo');
    
    // Achievement Types Distribution
    const achievementTypes = {};
    achievements.forEach(ach => {
      achievementTypes[ach.type] = (achievementTypes[ach.type] || 0) + 1;
    });
    
    // Year-wise Achievements
    const yearWiseAchievements = {};
    achievements.forEach(ach => {
      const year = ach.academicYear || 'Unknown';
      yearWiseAchievements[year] = (yearWiseAchievements[year] || 0) + 1;
    });
    
    // Department-wise Achievements
    const deptWiseAchievements = {};
    achievements.forEach(ach => {
      if (ach.studentId && ach.studentId.studentDetails && ach.studentId.studentDetails.branch) {
        const dept = ach.studentId.studentDetails.branch;
        deptWiseAchievements[dept] = (deptWiseAchievements[dept] || 0) + 1;
      }
    });
    
    // Students with Achievements
    const studentsWithAchievementsSet = new Set();
    achievements.forEach(ach => {
      if (ach.studentId) {
        studentsWithAchievementsSet.add(ach.studentId._id.toString());
      }
    });
    
    const studentsWithAchievements = students.filter(student => 
      studentsWithAchievementsSet.has(student._id.toString())
    ).map(student => ({
      id: student._id,
      name: student.name,
      regNo: student.studentDetails?.regNo || 'N/A',
      branch: student.studentDetails?.branch || 'N/A',
      achievementCount: achievements.filter(ach => 
        ach.studentId && ach.studentId._id.toString() === student._id.toString()
      ).length
    })).sort((a, b) => b.achievementCount - a.achievementCount);
    
    const analyticsData = {
      achievementTypes,
      yearWiseAchievements,
      deptWiseAchievements,
      studentsWithAchievements,
      totalAchievements: achievements.length,
      totalStudents: students.length,
      studentsWithAchievementsCount: studentsWithAchievements.length
    };
    
    console.log('Analytics data prepared successfully');
    res.json(analyticsData);
    
  } catch (error) {
    console.error('Error fetching analytics data:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get admin dashboard statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    // Get total students count
    const totalStudents = await User.countDocuments({ role: 'student' });

    // Get total achievements count
    const totalAchievements = await Achievement.countDocuments();

    // Get verified and pending documents count
    const verifiedDocuments = await Document.countDocuments({ status: 'Verified' });
    const pendingDocuments = await Document.countDocuments({ status: 'Pending' });

    // Get achievements by category
    const achievementsByCategory = await Achievement.aggregate([
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get achievements by department (branch)
    const achievementsByDepartment = await Achievement.aggregate([
      {
        $lookup: {
          from: 'users',
          localField: 'studentId',
          foreignField: '_id',
          as: 'student'
        }
      },
      {
        $unwind: '$student'
      },
      {
        $group: {
          _id: '$student.studentDetails.branch',
          count: { $sum: 1 }
        }
      }
    ]);

    // Get recent student activity (last 10 achievements with student info)
    const recentActivity = await Achievement.find()
      .populate('studentId', 'name studentDetails.regNo studentDetails.branch')
      .sort({ uploadedDate: -1 })
      .limit(10);

    res.json({
      totalStudents,
      totalAchievements,
      verifiedDocuments,
      pendingDocuments,
      achievementsByCategory: achievementsByCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      achievementsByDepartment: achievementsByDepartment.reduce((acc, item) => {
        acc[item._id || 'Unknown'] = item.count;
        return acc;
      }, {}),
      recentActivity: recentActivity.map(activity => ({
        studentName: activity.studentId.name,
        studentRegNo: activity.studentId.studentDetails?.regNo || 'N/A',
        studentBranch: activity.studentId.studentDetails?.branch || 'N/A',
        achievementTitle: activity.title,
        achievementType: activity.type,
        status: activity.status,
        uploadedDate: activity.uploadedDate
      }))
    });

  } catch (error) {
    console.error('Error fetching admin stats:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get admin dashboard statistics
router.get('/stats', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    console.log('Fetching admin stats...');

    // Test basic database connection with simple count
    let totalStudents = 0;
    let totalAchievements = 0;
    let verifiedDocuments = 0;
    let pendingDocuments = 0;

    try {
      totalStudents = await User.countDocuments({ role: 'student' });
      console.log('Total students:', totalStudents);
    } catch (err) {
      console.error('Error counting students:', err);
    }

    try {
      totalAchievements = await Achievement.countDocuments({});
      console.log('Total achievements:', totalAchievements);
    } catch (err) {
      console.error('Error counting achievements:', err);
    }

    try {
      verifiedDocuments = await Document.countDocuments({ status: 'Verified' });
      pendingDocuments = await Document.countDocuments({ status: 'Pending' });
      console.log('Documents - Verified:', verifiedDocuments, 'Pending:', pendingDocuments);
    } catch (err) {
      console.error('Error counting documents:', err);
    }

    // Return basic stats
    const stats = {
      totalStudents,
      totalAchievements,
      verifiedDocuments,
      pendingDocuments,
      achievementsByCategory: {},
      achievementsByDepartment: {},
      recentActivity: []
    };

    console.log('Final stats:', stats);
    res.json(stats);

  } catch (error) {
    console.error('Error in admin stats route:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get all students list
router.get('/students', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const students = await User.find({ role: 'student' })
      .select('name email studentDetails')
      .sort({ name: 1 });

    res.json(students);

  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Debug route to list all students
router.get('/debug/students', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const students = await User.find({ role: 'student' })
      .select('name email studentDetails')
      .sort({ name: 1 });

    console.log('All students:', students.map(s => ({ 
      name: s.name, 
      email: s.email, 
      regNo: s.studentDetails?.regNo, 
      branch: s.studentDetails?.branch,
      hasStudentDetails: !!s.studentDetails 
    })));

    res.json({
      total: students.length,
      students: students.map(s => ({ 
        id: s._id,
        name: s.name, 
        email: s.email, 
        regNo: s.studentDetails?.regNo || 'N/A', 
        branch: s.studentDetails?.branch || 'N/A',
        year: s.studentDetails?.year || 'N/A',
        hasStudentDetails: !!s.studentDetails 
      }))
    });

  } catch (error) {
    console.error('Error fetching debug students:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Search students by name or registration number
router.get('/search', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({ message: 'Search query is required' });
    }

    // Search students by name or registration number
    const students = await User.find({ 
      role: 'student',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { 'studentDetails.regNo': { $regex: query, $options: 'i' } }
      ]
    })
    .select('name email studentDetails')
    .sort({ name: 1 });

    // Get document and achievement counts for each student
    const studentsWithCounts = await Promise.all(
      students.map(async (student) => {
        const [docCount, achCount] = await Promise.all([
          Document.countDocuments({ studentId: student._id }),
          Achievement.countDocuments({ studentId: student._id })
        ]);

        return {
          id: student._id,
          name: student.name,
          email: student.email,
          regNo: student.studentDetails?.regNo || 'N/A',
          branch: student.studentDetails?.branch || 'N/A',
          year: student.studentDetails?.year || 'N/A',
          section: student.studentDetails?.section || 'N/A',
          documentCount: docCount,
          achievementCount: achCount
        };
      })
    );

    res.json(studentsWithCounts);

  } catch (error) {
    console.error('Error searching students:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Get student details with documents and achievements
router.get('/student/:studentId', verifyToken, async (req, res) => {
  try {
    // Check if user is admin
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admin only.' });
    }

    const { studentId } = req.params;

    // Get student details
    const student = await User.findOne({ 
      _id: studentId, 
      role: 'student' 
    })
    .select('name email studentDetails');

    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }

    // Get student's documents and achievements
    const [documents, achievements] = await Promise.all([
      Document.find({ studentId }).sort({ uploadedDate: -1 }),
      Achievement.find({ studentId }).sort({ uploadedDate: -1 })
    ]);

    res.json({
      student: {
        id: student._id,
        name: student.name,
        email: student.email,
        regNo: student.studentDetails?.regNo || 'N/A',
        branch: student.studentDetails?.branch || 'N/A',
        year: student.studentDetails?.year || 'N/A',
        section: student.studentDetails?.section || 'N/A',
        semester: student.studentDetails?.semester || 'N/A',
        academicYear: student.studentDetails?.academicYear || 'N/A',
        phone: student.studentDetails?.phone || 'N/A'
      },
      documents: documents.map(doc => ({
        id: doc._id,
        type: doc.type,
        status: doc.status,
        uploadedDate: doc.uploadedDate,
        fileName: doc.fileName,
        originalName: doc.originalName,
        hasAttachment: doc.hasAttachment,
        rejectionReason: doc.rejectionReason
      })),
      achievements: achievements.map(ach => ({
        id: ach._id,
        title: ach.title,
        type: ach.type,
        description: ach.description,
        status: ach.status,
        uploadedDate: ach.uploadedDate,
        date: ach.date,
        academicYear: ach.academicYear,
        semester: ach.semester,
        fileName: ach.fileName,
        originalName: ach.originalName,
        hasAttachment: ach.hasAttachment,
        rejectionReason: ach.rejectionReason
      }))
    });

  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

module.exports = router;
