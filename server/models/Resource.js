const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  title:       { type: String, required: true },
  description: { type: String, required: true },
  url:         { type: String, required: true },
  category:    { type: String, enum: ['dsa', 'system-design', 'roadmap', 'youtube', 'other'], required: true },
  tags:        [String],
  badge:       String,
  createdAt:   { type: Date, default: Date.now }
});

module.exports = mongoose.model('Resource', schema);
