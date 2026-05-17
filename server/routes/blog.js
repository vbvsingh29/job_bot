const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');
const authMiddleware = require('../middleware/auth');

// Admin validation middleware
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    res.status(403).json({ error: 'Access denied. Admins only.' });
  }
};

// GET /api/blog (Public)
router.get('/', async (req, res) => {
  try {
    const query = {};
    
    // Public guests can ONLY view published posts
    if (req.query.published === 'true' || !req.user || req.user.role !== 'admin') {
      query.published = true;
    }

    const limit = parseInt(req.query.limit) || 20;

    const posts = await Blog.find(query)
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(posts);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching blog posts' });
  }
});

// GET /api/blog/:slug (Public)
router.get('/:slug', async (req, res) => {
  try {
    const post = await Blog.findOne({ slug: req.params.slug });
    if (!post) {
      return res.status(404).json({ error: 'Article not found' });
    }

    // Public guests can NOT view unpublished posts
    if (!post.published && (!req.user || req.user.role !== 'admin')) {
      return res.status(404).json({ error: 'Article not found' });
    }

    res.json(post);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error fetching article' });
  }
});

// POST /api/blog (Admin Only)
router.post('/', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { title, slug, content, category, author, published, readTime } = req.body;
    if (!title || !content || !category) {
      return res.status(400).json({ error: 'Please provide all required fields' });
    }

    // Auto-generate slug from title if not provided
    const finalSlug = slug || title.toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');

    // Estimate read time if not provided (assume 200 words per minute)
    const finalReadTime = readTime || Math.max(1, Math.ceil(content.split(/\s+/).length / 200));

    const post = new Blog({
      title,
      slug: finalSlug,
      content,
      category,
      author: author || 'LaunchPad Team',
      published: published !== undefined ? published : true,
      readTime: finalReadTime
    });

    await post.save();
    res.status(201).json(post);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Slug must be unique' });
    }
    res.status(500).json({ error: 'Server error creating article' });
  }
});

// PUT /api/blog/:id (Admin Only)
router.put('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const { title, slug, content, category, author, published, readTime } = req.body;
    const post = await Blog.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Article not found' });
    }

    if (title) post.title = title;
    if (slug) post.slug = slug;
    if (content) {
      post.content = content;
      post.readTime = readTime || Math.max(1, Math.ceil(content.split(/\s+/).length / 200));
    } else if (readTime) {
      post.readTime = readTime;
    }
    
    if (category) post.category = category;
    if (author) post.author = author;
    if (published !== undefined) post.published = published;

    await post.save();
    res.json(post);
  } catch (err) {
    console.error(err);
    if (err.code === 11000) {
      return res.status(400).json({ error: 'Slug must be unique' });
    }
    res.status(500).json({ error: 'Server error updating article' });
  }
});

// DELETE /api/blog/:id (Admin Only)
router.delete('/:id', authMiddleware, isAdmin, async (req, res) => {
  try {
    const post = await Blog.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ error: 'Article not found' });
    }

    await post.deleteOne();
    res.json({ message: 'Article deleted successfully' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error deleting article' });
  }
});

module.exports = router;
