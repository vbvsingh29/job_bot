const express = require('express');
const router = express.Router();
const { Parser } = require('json2csv');
const Application = require('../models/Application');
const authMiddleware = require('../middleware/auth');

// Apply auth middleware to all routes in this file
router.use(authMiddleware);

// GET /api/applications - Fetch all applications with filtering and pagination
router.get('/', async (req, res) => {
  try {
    const { platform, status, from, to, search, page = 1 } = req.query;
    const limit = 20;
    const skip = (page - 1) * limit;

    const filter = { userId: req.user.id };
    if (platform) filter.platform = platform;
    if (status) filter.status = status;
    
    if (from || to) {
      filter.appliedAt = {};
      if (from) filter.appliedAt.$gte = new Date(from);
      if (to) filter.appliedAt.$lte = new Date(to);
    }

    if (search) {
      filter.$or = [
        { jobTitle: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const applications = await Application.find(filter)
      .sort({ appliedAt: -1 })
      .skip(skip)
      .limit(limit);

    const totalItems = await Application.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    res.json({
      applications,
      totalPages,
      currentPage: parseInt(page),
      totalItems
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching applications' });
  }
});

// GET /api/applications/export - Export applications as CSV
router.get('/export', async (req, res) => {
  try {
    const { platform, status, from, to, search } = req.query;
    const filter = { userId: req.user.id };
    
    if (platform) filter.platform = platform;
    if (status) filter.status = status;
    
    if (from || to) {
      filter.appliedAt = {};
      if (from) filter.appliedAt.$gte = new Date(from);
      if (to) filter.appliedAt.$lte = new Date(to);
    }

    if (search) {
      filter.$or = [
        { jobTitle: { $regex: search, $options: 'i' } },
        { company: { $regex: search, $options: 'i' } }
      ];
    }

    const applications = await Application.find(filter).sort({ appliedAt: -1 });
    
    const fields = ['jobTitle', 'company', 'platform', 'status', 'url', 'errorMsg', 'appliedAt'];
    const json2csvParser = new Parser({ fields });
    const csv = json2csvParser.parse(applications);

    res.header('Content-Type', 'text/csv');
    res.attachment('applications_export.csv');
    res.send(csv);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error exporting applications' });
  }
});

module.exports = router;
