const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const LinkedInStrategy = require('passport-linkedin-oauth2').Strategy;
const User = require('../models/User');
const authMiddleware = require('../middleware/auth');

// Passport Google Strategy setup
if (process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET) {
  passport.use(new GoogleStrategy({
    clientID: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    callbackURL: '/auth/google/callback'
  }, async (accessToken, refreshToken, profile, done) => {
    try {
      let user = await User.findOne({ email: profile.emails[0].value });
      if (!user) {
        user = new User({
          name: profile.displayName,
          email: profile.emails[0].value,
          passwordHash: '', // No password for OAuth users
          role: 'user'
        });
        await user.save();
      }
      return done(null, user);
    } catch (err) {
      return done(err, null);
    }
  }));
}

// Passport LinkedIn Strategy setup
passport.use(new LinkedInStrategy({
  clientID: process.env.LINKEDIN_CLIENT_ID || 'dummy_id',
  clientSecret: process.env.LINKEDIN_CLIENT_SECRET || 'dummy_secret',
  callbackURL: (process.env.BACKEND_URL || 'http://localhost:5000') + '/auth/linkedin/callback',
  scope: ['r_emailaddress', 'r_liteprofile'],
  state: true,
  passReqToCallback: true
}, async (req, accessToken, refreshToken, profile, done) => {
  try {
    const userId = req.session.userId;
    if (!userId) {
      return done(new Error('Unauthorized connection attempt'), null);
    }
    const user = await User.findById(userId);
    if (!user) {
      return done(new Error('User not found'), null);
    }
    user.linkedinToken = accessToken;
    user.linkedinConnected = true;
    user.linkedinName = profile.displayName || 'LinkedIn Member';
    await user.save();
    return done(null, user);
  } catch (err) {
    return done(err, null);
  }
}));

passport.serializeUser((user, done) => done(null, user.id));
passport.deserializeUser(async (id, done) => {
  try {
    const user = await User.findById(id);
    done(null, user);
  } catch (err) {
    done(err, null);
  }
});

const generateToken = (user) => {
  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: '7d' }
  );
};

// @route   POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    let user = await User.findOne({ email });
    if (user) return res.status(400).json({ message: 'User already exists' });

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    user = new User({ name, email, passwordHash });
    await user.save();

    const token = generateToken(user);
    res.status(201).json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });
    
    if (!user.passwordHash) {
       return res.status(400).json({ message: 'Please login using Google' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    const token = generateToken(user);
    
    // Update lastLoginAt
    user.lastLoginAt = new Date();
    await user.save();

    res.json({ token, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /api/auth/me
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
});

// @route   GET /auth/google
router.get('/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

// @route   GET /auth/google/callback
router.get('/google/callback', 
  passport.authenticate('google', { failureRedirect: '/login', session: true }),
  (req, res) => {
    // Generate JWT and redirect to frontend
    const token = generateToken(req.user);
    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    // Update last login
    req.user.lastLoginAt = new Date();
    req.user.save().then(() => {
       res.redirect(`${clientUrl}/login?token=${token}`);
    });
  }
);

// @route   GET /auth/linkedin
// @desc    Initiate LinkedIn OAuth connection
// @access  Private (Needs token via query param to connect to active user)
router.get('/linkedin', (req, res, next) => {
  const { token } = req.query;
  if (!token) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/profile?error=token_missing`);
  }
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret');
    req.session.userId = decoded.id;
    req.session.save(() => {
      passport.authenticate('linkedin')(req, res, next);
    });
  } catch (err) {
    return res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/profile?error=invalid_token`);
  }
});

// @route   GET /auth/linkedin/callback
// @desc    LinkedIn OAuth Callback
// @access  Public
router.get('/linkedin/callback', (req, res, next) => {
  passport.authenticate('linkedin', {
    failureRedirect: `${process.env.CLIENT_URL || 'http://localhost:5173'}/profile?error=linkedin_failed`,
    session: false
  })(req, res, () => {
    res.redirect(`${process.env.CLIENT_URL || 'http://localhost:5173'}/profile?connected=linkedin`);
  });
});

// @route   POST /api/auth/naukri/connect
// @desc    Connect Naukri credentials encrypted
// @access  Private
router.post('/naukri/connect', authMiddleware, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(password, salt);

    user.naukriToken = email; // Stored email as connection token reference
    user.naukriPasswordHash = hash;
    user.naukriConnected = true;
    await user.save();

    res.json({ success: true, message: 'Naukri credentials connected successfully!' });
  } catch (err) {
    console.error('Naukri connection error:', err);
    res.status(500).json({ message: 'Failed to connect Naukri credentials' });
  }
});

// @route   DELETE /api/auth/linkedin
// @desc    Disconnect LinkedIn connection
// @access  Private
router.delete('/linkedin', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.linkedinToken = null;
    user.linkedinConnected = false;
    user.linkedinName = null;
    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.passwordHash;
    delete updatedUser.naukriPasswordHash;

    res.json(updatedUser);
  } catch (err) {
    console.error('Disconnect LinkedIn error:', err);
    res.status(500).json({ message: 'Failed to disconnect LinkedIn account' });
  }
});

// @route   DELETE /api/auth/naukri
// @desc    Disconnect Naukri connection
// @access  Private
router.delete('/naukri', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    user.naukriToken = null;
    user.naukriPasswordHash = null;
    user.naukriConnected = false;
    await user.save();

    const updatedUser = user.toObject();
    delete updatedUser.passwordHash;
    delete updatedUser.naukriPasswordHash;

    res.json(updatedUser);
  } catch (err) {
    console.error('Disconnect Naukri error:', err);
    res.status(500).json({ message: 'Failed to disconnect Naukri account' });
  }
});

module.exports = router;
