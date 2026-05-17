const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');

const authMiddleware = require('../middleware/auth');
const scheduler = require('../services/scheduler');
const runner = require('../services/runner');

const User = require('../models/User');
const Application = require('../models/Application');
const AutomationConfig = require('../models/AutomationConfig');
const AutomationTemplate = require('../models/AutomationTemplate');
const BotError = require('../models/BotError');
const Blog = require('../models/Blog');
const Resource = require('../models/Resource');

// ─── Middleware ────────────────────────────────────────────────────────────────
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') return next();
  res.status(403).json({ error: 'Access denied. Admins only.' });
};

router.use(authMiddleware);
router.use(isAdmin);

// ─── STATS ─────────────────────────────────────────────────────────────────────
// GET /api/admin/stats
router.get('/stats', async (req, res) => {
  try {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      totalApps,
      appsToday,
      recentUsers,
      platformBreakdown,
      successToday,
      failuresToday
    ] = await Promise.all([
      User.countDocuments(),
      AutomationConfig.countDocuments({ active: true }),
      Application.countDocuments(),
      Application.countDocuments({ appliedAt: { $gte: todayStart } }),
      User.find().sort({ createdAt: -1 }).limit(7).select('name email role createdAt').lean(),
      Application.aggregate([
        { $group: { _id: '$platform', count: { $sum: 1 } } }
      ]),
      Application.countDocuments({ status: 'success', appliedAt: { $gte: todayStart } }),
      Application.find({
        status: 'failed',
        appliedAt: { $gte: todayStart }
      })
        .populate('userId', 'email')
        .sort({ appliedAt: -1 })
        .limit(10)
        .lean()
    ]);

    const successTotal = await Application.countDocuments({ status: 'success' });
    const globalSuccessRate = totalApps > 0 ? Math.round((successTotal / totalApps) * 100) : 0;

    res.json({
      totalUsers,
      activeUsers,
      totalApps,
      appsToday,
      globalSuccessRate,
      emailsSentToday: successToday, // Proxy metric
      recentUsers,
      platformBreakdown,
      failuresToday
    });
  } catch (err) {
    console.error('Admin stats error:', err);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

// ─── USERS LIST ────────────────────────────────────────────────────────────────
// GET /api/admin/users?search=&page=1&limit=20
router.get('/users', async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const search = req.query.search || '';

    const query = {};
    if (search) {
      const regex = new RegExp(search, 'i');
      query.$or = [{ name: regex }, { email: regex }];
    }

    const [users, total] = await Promise.all([
      User.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).select('-passwordHash -naukriPasswordHash').lean(),
      User.countDocuments(query)
    ]);

    // Attach appCount + botActive for each user
    const userIds = users.map(u => u._id);
    const [appCounts, configs] = await Promise.all([
      Application.aggregate([
        { $match: { userId: { $in: userIds } } },
        { $group: { _id: '$userId', count: { $sum: 1 } } }
      ]),
      AutomationConfig.find({ userId: { $in: userIds } }).select('userId active').lean()
    ]);

    const appCountMap = Object.fromEntries(appCounts.map(a => [a._id.toString(), a.count]));
    const configMap = Object.fromEntries(configs.map(c => [c.userId.toString(), c.active]));

    const enriched = users.map(u => ({
      ...u,
      appCount: appCountMap[u._id.toString()] || 0,
      botActive: configMap[u._id.toString()] || false
    }));

    res.json({ users: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    console.error('Admin users error:', err);
    res.status(500).json({ error: 'Server error fetching users' });
  }
});

// ─── USER DETAIL ───────────────────────────────────────────────────────────────
// GET /api/admin/users/:id
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-passwordHash -naukriPasswordHash').lean();
    if (!user) return res.status(404).json({ error: 'User not found' });

    const [recentApps, config] = await Promise.all([
      Application.find({ userId: user._id }).sort({ appliedAt: -1 }).limit(5).lean(),
      AutomationConfig.findOne({ userId: user._id }).lean()
    ]);

    res.json({ user, recentApps, config });
  } catch (err) {
    console.error('Admin user detail error:', err);
    res.status(500).json({ error: 'Server error fetching user detail' });
  }
});

// ─── USER UPDATE ───────────────────────────────────────────────────────────────
// PATCH /api/admin/users/:id
router.patch('/users/:id', async (req, res) => {
  try {
    const { role, suspended } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (role !== undefined) user.role = role;
    if (suspended !== undefined) user.suspended = suspended;
    await user.save();

    const updated = user.toObject();
    delete updated.passwordHash;
    delete updated.naukriPasswordHash;
    res.json(updated);
  } catch (err) {
    console.error('Admin user update error:', err);
    res.status(500).json({ error: 'Server error updating user' });
  }
});

// ─── USER DELETE ───────────────────────────────────────────────────────────────
// DELETE /api/admin/users/:id
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Delete resume file if exists
    if (user.resumeUrl) {
      const filePath = path.join(__dirname, '..', user.resumeUrl);
      if (fs.existsSync(filePath)) {
        try { fs.unlinkSync(filePath); } catch (_) {}
      }
    }

    await Promise.all([
      Application.deleteMany({ userId: user._id }),
      AutomationConfig.deleteMany({ userId: user._id }),
      BotError.deleteMany({ userId: user._id }),
      User.findByIdAndDelete(user._id)
    ]);

    res.json({ message: 'User and all associated data deleted' });
  } catch (err) {
    console.error('Admin user delete error:', err);
    res.status(500).json({ error: 'Server error deleting user' });
  }
});

// ─── BLOG (ALL — including drafts) ────────────────────────────────────────────
// GET /api/admin/blog
router.get('/blog', async (req, res) => {
  try {
    const posts = await Blog.find().sort({ createdAt: -1 }).lean();
    res.json(posts);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching blog posts' });
  }
});

// ─── BOT ERRORS ────────────────────────────────────────────────────────────────
// GET /api/admin/errors?hours=24
router.get('/errors', async (req, res) => {
  try {
    const hours = parseInt(req.query.hours) || 24;
    const since = new Date(Date.now() - hours * 60 * 60 * 1000);

    const errors = await BotError.find({ createdAt: { $gte: since } })
      .populate('userId', 'email')
      .sort({ createdAt: -1 })
      .lean();

    // Group by errorType
    const grouped = {};
    for (const err of errors) {
      const key = err.errorType;
      if (!grouped[key]) grouped[key] = { errorType: key, platform: err.platform, count: 0, occurrences: [] };
      grouped[key].count++;
      grouped[key].occurrences.push({
        userEmail: err.userId?.email || 'unknown',
        platform: err.platform,
        message: err.message,
        jobTitle: err.jobTitle,
        createdAt: err.createdAt
      });
    }

    res.json(Object.values(grouped));
  } catch (err) {
    console.error('Admin errors fetch error:', err);
    res.status(500).json({ error: 'Server error fetching errors' });
  }
});

// ─── SCHEDULER STATUS ─────────────────────────────────────────────────────────
// GET /api/admin/scheduler/status
router.get('/scheduler/status', (req, res) => {
  try {
    const status = scheduler.getStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching scheduler status' });
  }
});

// ─── AUTOMATION TEMPLATES ─────────────────────────────────────────────────────
// GET /api/admin/templates
router.get('/templates', async (req, res) => {
  try {
    const templates = await AutomationTemplate.find().sort({ createdAt: -1 }).lean();
    res.json(templates);
  } catch (err) {
    res.status(500).json({ error: 'Server error fetching templates' });
  }
});

// POST /api/admin/templates
router.post('/templates', async (req, res) => {
  try {
    const { name, platform, description, keywords, defaultLocation, suggestedMaxJobs, public: isPublic } = req.body;
    if (!name || !platform) return res.status(400).json({ error: 'Name and platform are required' });

    const template = new AutomationTemplate({
      name, platform, description,
      keywords: keywords || [],
      defaultLocation: defaultLocation || '',
      suggestedMaxJobs: suggestedMaxJobs || 15,
      public: isPublic || false
    });
    await template.save();
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ error: 'Server error creating template' });
  }
});

// PUT /api/admin/templates/:id
router.put('/templates/:id', async (req, res) => {
  try {
    const { name, platform, description, keywords, defaultLocation, suggestedMaxJobs, public: isPublic } = req.body;
    const template = await AutomationTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });

    if (name !== undefined) template.name = name;
    if (platform !== undefined) template.platform = platform;
    if (description !== undefined) template.description = description;
    if (keywords !== undefined) template.keywords = keywords;
    if (defaultLocation !== undefined) template.defaultLocation = defaultLocation;
    if (suggestedMaxJobs !== undefined) template.suggestedMaxJobs = suggestedMaxJobs;
    if (isPublic !== undefined) template.public = isPublic;

    await template.save();
    res.json(template);
  } catch (err) {
    res.status(500).json({ error: 'Server error updating template' });
  }
});

// DELETE /api/admin/templates/:id
router.delete('/templates/:id', async (req, res) => {
  try {
    const template = await AutomationTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ error: 'Template not found' });
    await template.deleteOne();
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error deleting template' });
  }
});

// ─── PLATFORM TEST ─────────────────────────────────────────────────────────────
// POST /api/admin/test-platform
router.post('/test-platform', async (req, res) => {
  const { platform } = req.body;
  if (!platform || !['linkedin', 'naukri'].includes(platform)) {
    return res.status(400).json({ error: 'Invalid platform. Must be linkedin or naukri.' });
  }

  // Return a simulated test result — actual headless browser test would time out in HTTP context
  // In production this would be a background job with websocket status push
  const hasLinkedInCreds = !!(process.env.LINKEDIN_EMAIL && process.env.LINKEDIN_PASS);
  const hasNaukriCreds = !!(process.env.NAUKRI_TEST_EMAIL && process.env.NAUKRI_TEST_PASS);

  if (platform === 'linkedin') {
    return res.json({
      success: hasLinkedInCreds,
      message: hasLinkedInCreds
        ? 'LinkedIn test credentials found in .env — connection ready'
        : 'LinkedIn credentials not configured (LINKEDIN_EMAIL / LINKEDIN_PASS missing from .env)'
    });
  }

  return res.json({
    success: hasNaukriCreds,
    message: hasNaukriCreds
      ? 'Naukri test credentials found in .env — connection ready'
      : 'Naukri credentials not configured (NAUKRI_TEST_EMAIL / NAUKRI_TEST_PASS missing from .env)'
  });
});

module.exports = router;
