const express = require('express');
const router = express.Router();
const Application = require('../models/Application');
const authMiddleware = require('../middleware/auth');

router.use(authMiddleware);

// GET /api/stats - Fetch aggregated stats for the user
router.get('/', async (req, res) => {
  try {
    const userId = req.user.id;

    // Total counts
    const total = await Application.countDocuments({ userId });
    const success = await Application.countDocuments({ userId, status: 'success' });
    
    // Time-based counts
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await Application.countDocuments({ userId, appliedAt: { $gte: today } });

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    weekAgo.setHours(0, 0, 0, 0);
    const weekCount = await Application.countDocuments({ userId, appliedAt: { $gte: weekAgo } });

    // Success rate
    const successRate = total > 0 ? ((success / total) * 100).toFixed(1) : 0;

const mongoose = require('mongoose');
    // By platform breakdown
    const byPlatformRaw = await Application.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId) } },
      { $group: {
          _id: { platform: "$platform", status: "$status" },
          count: { $sum: 1 }
        }
      }
    ]);

    // Format byPlatform
    const byPlatform = {
      linkedin: { success: 0, failed: 0, skipped: 0, total: 0 },
      naukri: { success: 0, failed: 0, skipped: 0, total: 0 }
    };

    byPlatformRaw.forEach(item => {
      const p = item._id.platform;
      const s = item._id.status;
      if (byPlatform[p]) {
        byPlatform[p][s] = item.count;
        byPlatform[p].total += item.count;
      }
    });

    res.json({ 
      total, 
      success, 
      today: todayCount,
      week: weekCount,
      successRate: parseFloat(successRate),
      byPlatform
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching stats' });
  }
});

module.exports = router;
