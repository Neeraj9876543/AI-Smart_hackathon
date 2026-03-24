const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const User = require('../models/User');
const router = express.Router();
const verifyToken = require('../middleware/auth');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const googleAuthConfig = require('../config/googleAuth');

passport.use(new GoogleStrategy({
  clientID: googleAuthConfig.google.clientID,
  clientSecret: googleAuthConfig.google.clientSecret,
  callbackURL: googleAuthConfig.google.callbackURL,
}, async (accessToken, refreshToken, profile, done) => {
  try {
    let user = await User.findOne({ email: profile.emails[0].value });
    if (user) {
      // Update existing user with latest Google profile information
      user.name = profile.displayName;
      user.profileImage = profile.photos[0].value;
      user.googleId = profile.id;
      user.isVerified = true;
      await user.save();
      console.log('Updated existing Google user:', user.email);
      return done(null, user);
    } else {
      const newUser = new User({
        name: profile.displayName,
        email: profile.emails[0].value,
        role: 'student',
        googleId: profile.id,
        profileImage: profile.photos[0].value,
        isVerified: true
      });
      user = await newUser.save();
      console.log('Created new Google user:', user.email);
      return done(null, user);
    }
  } catch (error) {
    console.error('Google OAuth error:', error);
    return done(error, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

router.get('/google/callback', 
  (req, res, next) => {
    console.log('=== Google OAuth Callback Debug ===');
    console.log('Query params:', req.query);
    console.log('Client ID being used:', googleAuthConfig.google.clientID);
    console.log('Client Secret from env:', process.env.GOOGLE_CLIENT_SECRET ? 'LOADED' : 'NOT LOADED');
    console.log('Client Secret length:', process.env.GOOGLE_CLIENT_SECRET ? process.env.GOOGLE_CLIENT_SECRET.length : 0);
    console.log('Callback URL:', googleAuthConfig.google.callbackURL);
    
    passport.authenticate('google', { failureRedirect: '/login' }, (err, user, info) => {
      if (err) {
        console.error('Passport authentication error:', err);
        console.error('Error details:', JSON.stringify(err, null, 2));
        return res.redirect('http://localhost:3000/login?error=auth_failed');
      }
      if (!user) {
        console.error('No user returned from Google OAuth');
        console.error('Info:', info);
        return res.redirect('http://localhost:3000/login?error=no_user');
      }
      
      console.log('Google OAuth successful for user:', user.email);
      
      // Generate JWT token
      const token = jwt.sign(
        { userId: user._id, email: user.email, role: user.role },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '7d' }
      );
      
      // Redirect to frontend with token
      res.redirect(`http://localhost:3000/auth-success?token=${token}&user=${encodeURIComponent(JSON.stringify({
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        profileImage: user.profileImage,
        studentDetails: user.studentDetails,
        facultyDetails: user.facultyDetails,
        isVerified: user.isVerified,
        googleId: user.googleId
      }))}`);
    })(req, res, next);
  }
);

router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: 'User already exists' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const user = new User({ name, email, password: hashedPassword, role: role || 'student' });
    await user.save();
    const token = jwt.sign({ userId: user._id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: '24h' });
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

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

// Get current user (verify token)
router.get('/verify', verifyToken, async (req, res) => {
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
