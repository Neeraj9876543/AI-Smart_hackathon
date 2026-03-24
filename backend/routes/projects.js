const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Project = require('../models/Project');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = 'uploads/projects';
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|zip|rar/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, documents, and archives are allowed.'));
    }
  }
});

// Get all projects for a student
router.get('/student', auth, async (req, res) => {
  try {
    const studentId = req.user.userId;
    const projects = await Project.find({ studentId })
      .sort({ createdAt: -1 });
    
    res.json(projects);
  } catch (error) {
    console.error('Get student projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get all projects for admin (with pagination and filtering)
router.get('/admin', auth, async (req, res) => {
  try {
    const { page = 1, limit = 10, status, category, verified } = req.query;
    const skip = (page - 1) * limit;

    // Build filter
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (verified !== undefined) filter.isVerified = verified === 'true';

    const projects = await Project.find(filter)
      .populate('studentId', 'name email studentDetails.regNo studentDetails.branch')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(limit));

    const total = await Project.countDocuments(filter);

    res.json({
      projects,
      pagination: {
        current: parseInt(page),
        total: Math.ceil(total / limit),
        count: total
      }
    });
  } catch (error) {
    console.error('Get admin projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get single project by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('studentId', 'name email studentDetails.regNo studentDetails.branch');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns the project or is admin
    if (req.user.role !== 'admin' && project.studentId._id.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create new project
router.post('/', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const {
      title,
      description,
      technologies,
      projectUrl,
      githubUrl,
      startDate,
      endDate,
      status,
      category
    } = req.body;

    // Parse technologies if sent as string
    const parsedTechnologies = typeof technologies === 'string' 
      ? technologies.split(',').map(tech => tech.trim()).filter(tech => tech)
      : technologies;

    // Process attachments
    const attachments = [];
    if (req.files) {
      req.files.forEach(file => {
        attachments.push({
          originalName: file.originalname,
          filename: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          fileUrl: `/uploads/projects/${file.filename}`
        });
      });
    }

    const project = new Project({
      studentId: req.user.userId,
      title,
      description,
      technologies: parsedTechnologies,
      projectUrl,
      githubUrl,
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : undefined,
      status,
      category,
      attachments
    });

    await project.save();
    res.status(201).json(project);
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update project
router.put('/:id', auth, upload.array('attachments', 5), async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns the project
    if (project.studentId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const {
      title,
      description,
      technologies,
      projectUrl,
      githubUrl,
      startDate,
      endDate,
      status,
      category
    } = req.body;

    // Update fields
    if (title) project.title = title;
    if (description) project.description = description;
    if (technologies) {
      project.technologies = typeof technologies === 'string' 
        ? technologies.split(',').map(tech => tech.trim()).filter(tech => tech)
        : technologies;
    }
    if (projectUrl !== undefined) project.projectUrl = projectUrl;
    if (githubUrl !== undefined) project.githubUrl = githubUrl;
    if (startDate) project.startDate = new Date(startDate);
    if (endDate !== undefined) project.endDate = endDate ? new Date(endDate) : undefined;
    if (status) project.status = status;
    if (category) project.category = category;

    // Add new attachments if any
    if (req.files && req.files.length > 0) {
      req.files.forEach(file => {
        project.attachments.push({
          originalName: file.originalname,
          filename: file.filename,
          mimeType: file.mimetype,
          size: file.size,
          fileUrl: `/uploads/projects/${file.filename}`
        });
      });
    }

    project.updatedAt = new Date();
    await project.save();

    res.json(project);
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Delete project
router.delete('/:id', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns the project or is admin
    if (req.user.role !== 'admin' && project.studentId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Delete attachment files
    project.attachments.forEach(attachment => {
      const filePath = path.join(__dirname, '..', attachment.fileUrl);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    });

    await Project.findByIdAndDelete(req.params.id);
    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Verify project (admin only)
router.patch('/:id/verify', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    project.isVerified = !project.isVerified;
    project.verifiedBy = req.user.userId;
    project.verifiedAt = new Date();

    await project.save();
    res.json(project);
  } catch (error) {
    console.error('Verify project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Toggle project selection for resume
router.patch('/:id/select-for-resume', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns the project
    if (project.studentId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    project.isSelectedForResume = !project.isSelectedForResume;
    await project.save();

    res.json(project);
  } catch (error) {
    console.error('Toggle resume selection error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get projects selected for resume
router.get('/student/resume-selected', auth, async (req, res) => {
  try {
    const studentId = req.user.userId;
    const projects = await Project.find({ 
      studentId, 
      isSelectedForResume: true 
    }).sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    console.error('Get resume selected projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete attachment
router.delete('/:id/attachments/:attachmentId', auth, async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check if user owns the project
    if (project.studentId.toString() !== req.user.userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const attachment = project.attachments.id(req.params.attachmentId);
    if (!attachment) {
      return res.status(404).json({ message: 'Attachment not found' });
    }

    // Delete file
    const filePath = path.join(__dirname, '..', attachment.fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Remove attachment from project
    project.attachments.pull(req.params.attachmentId);
    await project.save();

    res.json({ message: 'Attachment deleted successfully' });
  } catch (error) {
    console.error('Delete attachment error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;
