const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const User = require('../models/User');
const Application = require('../models/Application');
const AutomationConfig = require('../models/AutomationConfig');
const authMiddleware = require('../middleware/auth');

// Ensure upload directory exists
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    // Save as {userId}-{timestamp}.pdf
    const uniqueSuffix = `${req.user.id}-${Date.now()}`;
    cb(null, `${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

// Multer File Filter Configuration
const fileFilter = (req, file, cb) => {
  // Enforce PDF only
  if (file.mimetype === 'application/pdf') {
    cb(null, true);
  } else {
    cb(new Error('Only PDF files are allowed!'), false);
  }
};

// Configure Multer Instantiation
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
}).single('resume');

// @route   PUT /api/profile
// @desc    Update user profile information
// @access  Private
router.put('/', authMiddleware, async (req, res) => {
  try {
    const { name, phone, location, targetRoles, skills, experience } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Update allowable fields
    if (name !== undefined) user.name = name;
    if (phone !== undefined) user.phone = phone;
    if (location !== undefined) user.location = location;
    if (targetRoles !== undefined) user.targetRoles = targetRoles;
    if (skills !== undefined) user.skills = skills;
    if (experience !== undefined) user.experience = experience === '' ? undefined : experience;

    await user.save();

    // Exclude password hash from response
    const updatedUser = user.toObject();
    delete updatedUser.passwordHash;

    res.json(updatedUser);
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Failed to update profile information' });
  }
});

// @route   POST /api/profile/resume
// @desc    Upload user PDF resume
// @access  Private
router.post('/resume', authMiddleware, (req, res) => {
  upload(req, res, async (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({ message: 'File is too large! Maximum limit is 5MB.' });
      }
      return res.status(400).json({ message: err.message });
    } else if (err) {
      return res.status(400).json({ message: err.message });
    }

    if (!req.file) {
      return res.status(400).json({ message: 'Please select a PDF file to upload.' });
    }

    try {
      const user = await User.findById(req.user.id);
      if (!user) {
        // Clean up the uploaded file if user not found
        if (fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
        return res.status(404).json({ message: 'User not found' });
      }

      // If user had a previous resume, clean it up from disk
      if (user.resumeUrl) {
        // The resumeUrl is e.g. "/uploads/userId-timestamp.pdf"
        const oldFileName = path.basename(user.resumeUrl);
        const oldFilePath = path.join(UPLOAD_DIR, oldFileName);
        if (fs.existsSync(oldFilePath)) {
          try {
            fs.unlinkSync(oldFilePath);
          } catch (unlinkErr) {
            console.error('Failed to unlink old resume:', unlinkErr);
          }
        }
      }

      // Save the relative URL path in DB
      const resumeUrl = `/uploads/${req.file.filename}`;
      user.resumeUrl = resumeUrl;
      await user.save();

      res.json({
        resumeUrl,
        message: 'Resume uploaded successfully!'
      });
    } catch (dbErr) {
      console.error('Database error saving resume path:', dbErr);
      // Clean up uploaded file on DB save failure
      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      res.status(500).json({ message: 'Failed to update resume path in user record' });
    }
  });
});

// @route   PUT /api/profile/preferences
// @desc    Update user automation report preferences
// @access  Private
router.put('/preferences', authMiddleware, async (req, res) => {
  try {
    const { scheduledReportTime, reportEmail } = req.body;

    let config = await AutomationConfig.findOne({ userId: req.user.id });
    if (!config) {
      config = new AutomationConfig({
        userId: req.user.id,
        skills: ['React'], // Satisfy validation fallback
        scheduledReportTime,
        reportEmail
      });
    } else {
      if (scheduledReportTime !== undefined) config.scheduledReportTime = scheduledReportTime;
      if (reportEmail !== undefined) config.reportEmail = reportEmail;
    }

    await config.save();
    res.json(config);
  } catch (err) {
    console.error('Error updating report preferences:', err);
    res.status(500).json({ message: 'Failed to update report preferences' });
  }
});

// @route   DELETE /api/profile
// @desc    Permanently delete account and all associated records
// @access  Private
router.delete('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // 1. Delete physical resume from server if it exists
    if (user.resumeUrl) {
      const fileName = path.basename(user.resumeUrl);
      const filePath = path.join(UPLOAD_DIR, fileName);
      if (fs.existsSync(filePath)) {
        try {
          fs.unlinkSync(filePath);
        } catch (fileErr) {
          console.error('Error unlinking resume on delete:', fileErr);
        }
      }
    }

    // 2. Wipe Applications database records
    await Application.deleteMany({ userId: user._id });

    // 3. Wipe AutomationConfig database records
    await AutomationConfig.deleteMany({ userId: user._id });

    // 4. Wipe User document record
    await User.findByIdAndDelete(user._id);

    res.json({ message: 'Account deleted successfully' });
  } catch (err) {
    console.error('Error deleting account:', err);
    res.status(500).json({ message: 'Failed to permanently delete account' });
  }
});

module.exports = router;
