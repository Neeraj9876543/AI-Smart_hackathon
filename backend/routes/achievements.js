const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Achievement = require('../models/Achievement');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for achievement file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/achievements');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg', 
    'image/jpg', 
    'image/png', 
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, PDF, and Word files are allowed.'), false);
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: fileFilter
});

// Upload achievement with optional file
router.post('/upload', auth, upload.single('attachment'), async (req, res) => {
  try {
    const { title, type, description, academicYear, semester, date } = req.body;
    
    if (!title || !type || !description || !academicYear || !semester || !date) {
      return res.status(400).json({ message: 'All required fields must be provided' });
    }

    const achievementData = {
      studentId: req.user.userId,
      title,
      type,
      description,
      academicYear,
      semester,
      date: new Date(date),
    };

    // Add file information if a file was uploaded
    if (req.file) {
      achievementData.hasAttachment = true;
      achievementData.fileName = req.file.filename;
      achievementData.originalName = req.file.originalname;
      achievementData.fileUrl = `/uploads/achievements/${req.file.filename}`;
      achievementData.fileSize = req.file.size;
      achievementData.mimeType = req.file.mimetype;
    }

    const achievement = new Achievement(achievementData);
    await achievement.save();

    res.status(201).json({
      message: 'Achievement uploaded successfully',
      achievement: {
        id: achievement._id,
        title: achievement.title,
        type: achievement.type,
        description: achievement.description,
        academicYear: achievement.academicYear,
        semester: achievement.semester,
        date: achievement.date,
        hasAttachment: achievement.hasAttachment,
        fileName: achievement.fileName,
        originalName: achievement.originalName,
        fileUrl: achievement.fileUrl,
        status: achievement.status,
        uploadedDate: achievement.uploadedDate,
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// Get student achievements (for authenticated student)
router.get('/student', auth, async (req, res) => {
  try {
    const studentId = req.user.userId;
    
    const achievements = await Achievement.find({ studentId })
      .sort({ uploadedDate: -1 });
    
    res.json(achievements);
  } catch (error) {
    console.error('Get student achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student achievements
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Students can only view their own achievements
    if (req.user.role === 'student' && req.user.userId !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const achievements = await Achievement.find({ studentId })
      .populate('studentId', 'name email studentDetails.regNo')
      .select('title type description academicYear semester date hasAttachment fileName originalName fileUrl status uploadedDate verifiedDate rejectionReason')
      .sort({ uploadedDate: -1 });

    res.json(achievements);
  } catch (error) {
    console.error('Get achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all achievements for admin
router.get('/all', auth, async (req, res) => {
  try {
    console.log('Fetching all achievements...');
    if (req.user.role !== 'admin') {
      console.log('Access denied - not admin');
      return res.status(403).json({ message: 'Access denied' });
    }

    const achievements = await Achievement.find({})
      .populate('studentId', 'name email studentDetails.regNo')
      .select('title type description academicYear semester date hasAttachment fileName originalName fileUrl uploadedDate studentId status')
      .sort({ uploadedDate: -1 });

    console.log('Found all achievements:', achievements.length);
    res.json(achievements);
  } catch (error) {
    console.error('Get all achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pending achievements for admin
router.get('/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const achievements = await Achievement.find({ status: 'Pending' })
      .populate('studentId', 'name email studentDetails.regNo')
      .select('title type description academicYear semester date hasAttachment fileName originalName fileUrl uploadedDate studentId')
      .sort({ uploadedDate: -1 });

    res.json(achievements);
  } catch (error) {
    console.error('Get pending achievements error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify achievement
router.put('/:achievementId/verify', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, rejectionReason } = req.body;
    
    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const achievement = await Achievement.findByIdAndUpdate(
      req.params.achievementId,
      {
        status: status,
        verifiedDate: new Date(),
        verifiedBy: req.user.userId,
        rejectionReason: status === 'Rejected' ? rejectionReason : null,
      },
      { new: true }
    ).populate('studentId', 'name email');

    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    res.json({
      message: `Achievement ${status.toLowerCase()} successfully`,
      achievement
    });
  } catch (error) {
    console.error('Verify achievement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve achievement files
router.get('/file/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/achievements', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('File serve error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get achievement count for a student
router.get('/student/:studentId/count', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const count = await Achievement.countDocuments({ studentId });
    res.json(count);
    
  } catch (error) {
    console.error('Error fetching achievement count:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete achievement
router.delete('/:achievementId', auth, async (req, res) => {
  try {
    const achievement = await Achievement.findById(req.params.achievementId);
    
    if (!achievement) {
      return res.status(404).json({ message: 'Achievement not found' });
    }

    // Check if the achievement belongs to the logged-in user
    if (achievement.studentId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own achievements' });
    }

    // Delete the file from uploads directory if it exists
    if (achievement.hasAttachment && achievement.fileName) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(__dirname, '..', 'uploads', achievement.fileName);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }

    // Delete the achievement from database
    await Achievement.findByIdAndDelete(req.params.achievementId);

    res.json({ message: 'Achievement deleted successfully' });
  } catch (error) {
    console.error('Delete achievement error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
