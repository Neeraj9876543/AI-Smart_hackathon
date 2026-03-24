const mongoose = require('mongoose');

const achievementSchema = new mongoose.Schema({
  studentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  title: {
    type: String,
    required: true,
  },
  type: {
    type: String,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  academicYear: {
    type: String,
    required: true,
  },
  semester: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    required: true,
  },
  // File attachment fields
  hasAttachment: {
    type: Boolean,
    default: false,
  },
  fileName: {
    type: String,
  },
  originalName: {
    type: String,
  },
  fileUrl: {
    type: String,
  },
  fileSize: {
    type: Number,
  },
  mimeType: {
    type: String,
  },
  status: {
    type: String,
    enum: ['Pending', 'Verified', 'Rejected'],
    default: 'Pending',
  },
  uploadedDate: {
    type: Date,
    default: Date.now,
  },
  verifiedDate: {
    type: Date,
  },
  verifiedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
  },
  rejectionReason: {
    type: String,
  },
});

module.exports = mongoose.model('Achievement', achievementSchema);
