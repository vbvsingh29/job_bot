const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  title:     { type: String, required: true },
  slug:      { type: String, required: true, unique: true },
  content:   { type: String, required: true }, // raw markdown content
  category:  { type: String, required: true },
  author:    { type: String, default: 'LaunchPad Team' },
  published: { type: Boolean, default: true },
  readTime:  { type: Number, required: true }, // estimated minutes to read
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Blog', schema);
