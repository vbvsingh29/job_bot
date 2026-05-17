const express = require('express');
const router = express.Router();
const Resource = require('../models/Resource');
const authMiddleware = require('../middleware/auth');

// Admin validation middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admins only.' });
  }
};

// GET /api/resources (Public)
router.get('/', async (req, res) => {
  try {
    const query = {};
    
    // Clean and apply category filter (if not "all")
    if (req.query.category && req.query.category.toLowerCase() !== 'all') {
      // Normalize parameter to model format
      let cat = req.query.category.toLowerCase();
      if (cat === 'system design') cat = 'system-design';
      query.category = cat;
    }
    
    // Case-insensitive search on title, description, and tags
    if (req.query.search) {
      const searchRegex = new RegExp(req.query.search, 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { tags: { $in: [searchRegex] } }
      ];
    }

    const resources = await Resource.find(query).sort({ createdAt: -1 });
    res.json(resources);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching resources' });
  }
});

// POST /api/resources (Admin Only)
router.post('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { title, description, url, category, tags, badge } = req.body;
    if (!title || !description || !url || !category) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    const resource = new Resource({
      title,
      description,
      url,
      category: category.toLowerCase(),
      tags: tags || [],
      badge
    });

    await resource.save();
    res.status(201).json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error creating resource' });
  }
});

// PUT /api/resources/:id (Admin Only)
router.put('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { title, description, url, category, tags, badge } = req.body;
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    if (title) resource.title = title;
    if (description) resource.description = description;
    if (url) resource.url = url;
    if (category) resource.category = category.toLowerCase();
    if (tags) resource.tags = tags;
    if (badge !== undefined) resource.badge = badge;

    await resource.save();
    res.json(resource);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error updating resource' });
  }
});

// DELETE /api/resources/:id (Admin Only)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const resource = await Resource.findById(req.params.id);
    if (!resource) {
      return res.status(404).json({ error: 'Resource not found' });
    }

    await resource.deleteOne();
    res.json({ message: 'Resource deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting resource' });
  }
});

module.exports = router;
