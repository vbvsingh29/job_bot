const express = require('express');
const router = express.Router();
const AutomationConfig = require('../models/AutomationConfig');
const Application = require('../models/Application');
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

// POST /api/automations/simulate-run
router.post('/simulate-run', async (req, res) => {
  try {
    const config = await AutomationConfig.findOne({ userId: req.user.id });
    const User = require('../models/User');
    const user = await User.findById(req.user.id);
    
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const skills = config && config.skills && config.skills.length > 0 ? config.skills : ['React', 'Node.js'];
    const location = config && config.location ? config.location : 'Remote';
    
    const platforms = ['linkedin', 'naukri'];
    const companies = ['Google', 'Meta', 'Netflix', 'Stripe', 'Amazon', 'Apple', 'Microsoft', 'Uber', 'Airbnb'];
    const statuses = ['success', 'skipped', 'failed'];
    
    const simulatedApps = [];
    const events = [];
    
    events.push({ type: 'info', message: 'Initializing LaunchPad Headless Browser Simulator...' });
    events.push({ type: 'info', message: 'Chrome sandbox enabled: --no-sandbox' });
    events.push({ type: 'info', message: 'User agent set: Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' });

    for (const platform of platforms) {
      const isConnected = platform === 'linkedin' ? user.linkedinConnected : user.naukriConnected;
      const platformName = platform === 'linkedin' ? 'LinkedIn' : 'Naukri';
      
      events.push({ type: 'info', message: `Checking ${platformName} account connection status...` });
      
      if (!isConnected) {
        events.push({ type: 'warn', message: `${platformName} credentials not connected in settings. Running in Demo Sandbox mode.` });
      } else {
        events.push({ type: 'success', message: `${platformName} credentials detected (Linked in UI).` });
      }
      
      events.push({ type: 'success', message: `${platformName} simulator active. Initiating headless session login...` });
      events.push({ type: 'info', message: `Navigating to ${platformName} login portal...` });
      events.push({ type: 'info', message: 'Typing credentials securely from encrypted local store...' });
      events.push({ type: 'success', message: `Authentication successful! Active session established.` });
      
      // Let's generate 2 applications per platform
      for (let i = 0; i < 2; i++) {
        const skill = skills[Math.floor(Math.random() * skills.length)];
        const company = companies[Math.floor(Math.random() * companies.length)];
        const status = statuses[Math.floor(Math.random() * statuses.length)];
        const jobTitle = `${skill} Developer`;
        
        events.push({ type: 'info', message: `Searching jobs for: "${skill}" in "${location}"...` });
        events.push({ type: 'success', message: `Found matching job listing: "${jobTitle}" at ${company}` });
        events.push({ type: 'info', message: 'Analyzing job requirements and matching against resume...' });
        
        let errorMsg = null;
        if (status === 'success') {
          events.push({ type: 'info', message: 'Clicking Easy Apply button...' });
          events.push({ type: 'info', message: 'Answering questionnaire details...' });
          events.push({ type: 'info', message: 'Uploading resume PDF from secure repository...' });
          events.push({ type: 'success', message: `Application submitted successfully for ${jobTitle} @ ${company}!` });
        } else if (status === 'skipped') {
          events.push({ type: 'warn', message: 'Job already applied to or Easy Apply option not available. Skipping.' });
        } else {
          errorMsg = 'Timeout waiting for application confirmation selector.';
          events.push({ type: 'error', message: `Application failed: ${errorMsg}` });
        }
        
        // Save simulated record to database
        const app = await Application.create({
          userId: req.user.id,
          jobTitle,
          company,
          platform,
          status,
          errorMsg,
          url: platform === 'linkedin' 
            ? `https://www.linkedin.com/jobs/view/${Math.floor(Math.random() * 1000000000)}`
            : `https://www.naukri.com/job-listings-${Math.floor(Math.random() * 100000)}`,
          appliedAt: new Date()
        });
        simulatedApps.push(app);
      }
    }
    
    events.push({ type: 'info', message: 'Terminating headless browser session...' });
    events.push({ type: 'success', message: 'LaunchPad Simulator run completed successfully.' });
    
    // Update config last run
    let configObj = await AutomationConfig.findOne({ userId: req.user.id });
    if (!configObj) {
      configObj = new AutomationConfig({
        userId: req.user.id,
        skills,
        location,
        maxJobsPerDay: 15,
        scheduledTime: '09:00',
        active: true
      });
    }
    
    const stats = simulatedApps.reduce((acc, curr) => {
      acc[curr.status]++;
      return acc;
    }, { success: 0, failed: 0, skipped: 0 });
    
    configObj.lastRunAt = new Date();
    configObj.lastRunResult = stats;
    await configObj.save();

    res.json({ success: true, events, applications: simulatedApps });
  } catch (err) {
    console.error('Simulation error:', err);
    res.status(500).json({ error: 'Server error during simulation setup.' });
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
