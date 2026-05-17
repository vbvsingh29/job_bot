const express = require('express');
const router = express.Router();
const AutomationConfig = require('../models/AutomationConfig');
const authMiddleware = require('../middleware/auth');
const runner = require('../services/runner');
const emailService = require('../services/emailService');

// Admin middleware for send-report
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admins only.' });
  }
};

router.use(authMiddleware);

// GET /api/automations/config
router.get('/config', async (req, res) => {
  try {
    const config = await AutomationConfig.findOne({ userId: req.user.id });
    res.json(config || null);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching config' });
  }
});

// POST /api/automations/config
router.post('/config', async (req, res) => {
  try {
    const { skills, location, maxJobsPerDay, scheduledTime, active } = req.body;

    if (!skills || !Array.isArray(skills) || skills.length === 0) {
      return res.status(400).json({ error: 'Skills array cannot be empty' });
    }

    if (maxJobsPerDay < 1 || maxJobsPerDay > 50) {
      return res.status(400).json({ error: 'maxJobsPerDay must be between 1 and 50' });
    }

    let config = await AutomationConfig.findOne({ userId: req.user.id });

    if (config) {
      config.skills = skills;
      config.location = location;
      config.maxJobsPerDay = maxJobsPerDay;
      config.scheduledTime = scheduledTime;
      config.active = active;
      await config.save();
    } else {
      config = new AutomationConfig({
        userId: req.user.id,
        skills,
        location,
        maxJobsPerDay,
        scheduledTime,
        active
      });
      await config.save();
    }

    res.json(config);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error saving config' });
  }
});

// POST /api/automations/run
router.post('/run', async (req, res) => {
  try {
    const config = await AutomationConfig.findOne({ userId: req.user.id });
    if (!config) {
      return res.status(400).json({ error: 'No automation config set up yet' });
    }

    // Fire and forget - do not await
    runner.runForUser(req.user.id).catch(err => {
      console.error(`Runner failed for user ${req.user.id}:`, err);
    });

    res.status(202).json({ message: 'Automation run accepted and started in the background.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error starting automation' });
  }
});

// POST /api/automations/send-report (Admin only)
router.post('/send-report', isAdmin, (req, res) => {
  try {
    emailService.sendDailyReportsToAllUsers().catch(err => {
      console.error('Manual send-report failed:', err);
    });
    res.status(202).json({ message: 'Daily reports are being generated and sent in the background.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error sending reports' });
  }
});

// POST /api/automations/run-all (Admin only)
router.post('/run-all', isAdmin, (req, res) => {
  try {
    runner.runForAllUsers().catch(err => {
      console.error('Admin run-all failed:', err);
    });
    res.status(202).json({ message: 'Global automation run accepted and started for all active users.' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error starting global automation run' });
  }
});

module.exports = router;
