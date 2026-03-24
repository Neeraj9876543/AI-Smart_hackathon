const mongoose = require('mongoose');

const projectSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  technologies: [{
    type: String,
    trim: true,
  }],
  projectUrl: {
    type: String,
    trim: true,
  },
  githubUrl: {
    type: String,
    trim: true,
  },
  startDate: {
    type: Date,
    required: true,
  },
  endDate: {
    type: Date,
  },
  status: {
    type: String,
    enum: ['planning', 'in-progress', 'completed', 'on-hold'],
    default: 'in-progress',
  },
  category: {
    type: String,
    enum: ['academic', 'personal', 'opensource', 'commercial', 'research'],
    default: 'personal',
  },
  attachments: [{
    originalName: String,
    filename: String,
    mimeType: String,
    size: Number,
    fileUrl: String,
    uploadedAt: {
      type: Date,
      default: Date.now,
    }
  }],
  isVerified: {
    type: Boolean,
    default: false,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: {
    type: Date,
  },
  isSelectedForResume: {
    type: Boolean,
    default: false,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  updatedAt: {
    type: Date,
    default: Date.now,
  },
});

projectSchema.index({ studentId: 1, createdAt: -1 });
projectSchema.index({ isVerified: 1 });
projectSchema.index({ isSelectedForResume: 1 });

module.exports = mongoose.model('Project', projectSchema);
