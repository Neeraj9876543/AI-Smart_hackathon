const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Document = require('../models/Document');
const auth = require('../middleware/auth');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/documents');
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

// Upload document
router.post('/upload', auth, upload.single('document'), async (req, res) => {
  try {
    const { type } = req.body;
    
    if (!type) {
      return res.status(400).json({ message: 'Document type is required' });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const document = new Document({
      studentId: req.user.userId,
      type: type,
      fileName: req.file.filename,
      originalName: req.file.originalname,
      fileUrl: `/uploads/documents/${req.file.filename}`,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
    });

    await document.save();

    res.status(201).json({
      message: 'Document uploaded successfully',
      document: {
        id: document._id,
        type: document.type,
        fileName: document.fileName,
        originalName: document.originalName,
        fileUrl: document.fileUrl,
        status: document.status,
        uploadedDate: document.uploadedDate,
      }
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ message: 'Server error during upload' });
  }
});

// Get student documents (for authenticated student)
router.get('/student', auth, async (req, res) => {
  try {
    const studentId = req.user.userId;
    
    const documents = await Document.find({ studentId })
      .sort({ uploadedDate: -1 });
    
    res.json(documents);
  } catch (error) {
    console.error('Get student documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get student documents
router.get('/student/:studentId', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Students can only view their own documents
    if (req.user.role === 'student' && req.user.userId !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const documents = await Document.find({ studentId })
      .select('type fileName originalName fileUrl status uploadedDate verifiedDate')
      .sort({ uploadedDate: -1 });

    res.json(documents);
  } catch (error) {
    console.error('Get documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all documents for admin
router.get('/all', auth, async (req, res) => {
  try {
    console.log('Fetching all documents...');
    if (req.user.role !== 'admin') {
      console.log('Access denied - not admin');
      return res.status(403).json({ message: 'Access denied' });
    }

    const documents = await Document.find({})
      .populate('studentId', 'name email studentDetails.regNo')
      .select('type fileName originalName fileUrl uploadedDate studentId status')
      .sort({ uploadedDate: -1 });

    console.log('Found all documents:', documents.length);
    res.json(documents);
  } catch (error) {
    console.error('Get all documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all pending documents for admin
router.get('/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const documents = await Document.find({ status: 'Pending' })
      .populate('studentId', 'name email studentDetails.regNo')
      .select('type fileName originalName fileUrl uploadedDate studentId')
      .sort({ uploadedDate: -1 });

    res.json(documents);
  } catch (error) {
    console.error('Get pending documents error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify document
router.put('/:documentId/verify', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const { status, rejectionReason } = req.body;
    
    if (!['Verified', 'Rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const document = await Document.findByIdAndUpdate(
      req.params.documentId,
      {
        status: status,
        verifiedDate: new Date(),
        verifiedBy: req.user.userId,
        rejectionReason: status === 'Rejected' ? rejectionReason : null,
      },
      { new: true }
    ).populate('studentId', 'name email');

    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    res.json({
      message: `Document ${status.toLowerCase()} successfully`,
      document
    });
  } catch (error) {
    console.error('Verify document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Serve uploaded files
router.get('/file/:filename', async (req, res) => {
  try {
    const filename = req.params.filename;
    const filePath = path.join(__dirname, '../uploads/documents', filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'File not found' });
    }

    res.sendFile(filePath);
  } catch (error) {
    console.error('File serve error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get document count for a student
router.get('/student/:studentId/count', auth, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    const count = await Document.countDocuments({ studentId });
    res.json(count);
    
  } catch (error) {
    console.error('Error fetching document count:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Delete document
router.delete('/:documentId', auth, async (req, res) => {
  try {
    const document = await Document.findById(req.params.documentId);
    
    if (!document) {
      return res.status(404).json({ message: 'Document not found' });
    }

    // Check if the document belongs to the logged-in user
    if (document.studentId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied. You can only delete your own documents' });
    }

    // Delete the file from uploads directory
    const fs = require('fs');
    const path = require('path');
    const filePath = path.join(__dirname, '..', 'uploads', document.fileName);
    
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the document from database
    await Document.findByIdAndDelete(req.params.documentId);

    res.json({ message: 'Document deleted successfully' });
  } catch (error) {
    console.error('Delete document error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
