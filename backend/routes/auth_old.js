const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const googleAuthConfig = require('../config/googleAuth');

// Configure Google OAuth Strategy
passport.use(new GoogleStrategy({
  clientID: googleAuthConfig.google.clientID,
  clientSecret: googleAuthConfig.google.clientSecret,
  callbackURL: googleAuthConfig.google.callbackURL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    // Check if user already exists
    let user = await User.findOne({ email: profile.emails[0].value });
    
    if (user) {
      // User exists, return user
      return done(null, user);
    } else {
      // Create new user for Google sign-in (only students can use Google auth)
      const newUser = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        role: 'student', // Force student role for Google auth
        googleId: profile.id,
        profileImage: profile.photos[0].value,
        isVerified: true // Google accounts are pre-verified
      });
      
      user = await newUser.save();
      return done(null, user);
    }
  } catch (error) {
    return done(error, null);
  }
}));

// Serialize and deserialize user for passport
passport.serializeUser((user, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

// Google OAuth Routes
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  (req, res) => {
    // Generate JWT token
    const token = jwt.sign(
      { id: req.user._id, email: req.user.email, role: req.user.role },
      process.env.JWT_SECRET || 'your-secret-key',
      { expiresIn: '7d' }
    );
    
    // Redirect to frontend with token
    res.redirect(`http://localhost:3000/auth-success?token=${token}&user=${encodeURIComponent(JSON.stringify({
      id: req.user._id,
      name: req.user.name,
      email: req.user.email,
      role: req.user.role,
      profileImage: req.user.profileImage
    }))}));
  }
);

// Register
router.post('/register', async (req, res) => {
  try {
    const { 
      name, 
      email, 
      password, 
      role, 
      studentDetails, 
      facultyDetails,
      profileImage 
    } = req.body;

    // Check if user exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }

    // Create user
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    
    const userData = {
      name,
      email,
      password: hashedPassword,
      role: role || 'student',
      profileImage: profileImage || ''
    };

    if (role === 'student' && studentDetails) {
      userData.studentDetails = studentDetails;
    } else if (role === 'faculty' && facultyDetails) {
      userData.facultyDetails = facultyDetails;
    }

    const user = new User(userData);
    await user.save();

    // Create token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userObj = user.toObject();

    res.status(201).json({
      token,
      user: {
        id: userObj._id,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role,
        studentDetails: userObj.studentDetails,
        facultyDetails: userObj.facultyDetails,
        profileImage: userObj.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    // Create token
    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userObj = user.toObject();

    res.json({
      token,
      user: {
        id: userObj._id,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role,
        studentDetails: userObj.studentDetails,
        facultyDetails: userObj.facultyDetails,
        profileImage: userObj.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get current user
router.get('/me', verifyToken, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    res.json({ user });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update user profile
router.put('/profile', verifyToken, async (req, res) => {
  try {
    const { name, email, profileImage, studentDetails } = req.body;
    
    const user = await User.findById(req.user.userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (name) user.name = name;
    if (email) user.email = email;
    if (profileImage) user.profileImage = profileImage;
    if (studentDetails) {
      // Merge existing with new details robustly
      const existingDetails = user.studentDetails ? (user.studentDetails.toObject ? user.studentDetails.toObject() : user.studentDetails) : {};
      
      user.set('studentDetails', { 
        ...existingDetails, 
        ...studentDetails 
      });
    }

    await user.save();

    const userObj = user.toObject();

    res.json({
      message: 'Profile updated successfully',
      user: {
        id: userObj._id,
        name: userObj.name,
        email: userObj.email,
        role: userObj.role,
        studentDetails: userObj.studentDetails,
        profileImage: userObj.profileImage
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
