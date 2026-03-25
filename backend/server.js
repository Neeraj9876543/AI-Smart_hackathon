// Load environment variables first
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const passport = require('passport');
const authRoutes = require('./routes/auth');
const documentRoutes = require('./routes/documents');
const achievementRoutes = require('./routes/achievements');
const adminRoutes = require('./routes/admin');
const resumeRoutes = require('./routes/resume');
const projectRoutes = require('./routes/projects');
const errorHandler = require('./middleware/errorHandler');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize passport
app.use(passport.initialize());

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from uploads directory
app.use('/uploads', express.static('uploads'));

// Connect to MongoDB with better error handling and timeout
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/student-success-hub', {
  serverSelectionTimeoutMS: 5000, // 5 seconds timeout
  socketTimeoutMS: 45000, // 45 seconds timeout
  bufferMaxEntries: 0, // Disable mongoose buffering
  bufferCommands: false, // Disable mongoose buffering
})
.then(() => console.log('MongoDB connected'))
.catch(err => {
  console.log('MongoDB connection error:', err);
  console.log('Please check your MONGODB_URI environment variable');
  process.exit(1); // Exit if cannot connect to database
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);
app.use('/api/achievements', achievementRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/projects', projectRoutes);

// Error handling middleware
app.use(errorHandler);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
