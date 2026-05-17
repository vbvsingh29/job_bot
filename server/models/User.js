const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  passwordHash: { type: String }, // Optional for Google OAuth users
  phone: { type: String },
  resumeUrl: { type: String },
  skills: { type: [String], default: [] },
  targetRoles: { type: [String], default: [] },
  location: { type: String },
  linkedinToken: { type: String },
  linkedinName: { type: String },
  naukriToken: { type: String },
  naukriPasswordHash: { type: String },
  linkedinConnected: { type: Boolean, default: false },
  naukriConnected: { type: Boolean, default: false },
  experience: { type: String, enum: ['0-1', '1-3', '3-5', '5-10', '10+'] },
  role: { type: String, enum: ['user', 'admin'], default: 'user' },
  maxJobsPerDay: { type: Number, default: 20 },
  emailReportTime: { type: String, default: '21:00' },
  suspended: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
  lastLoginAt: { type: Date }
});

module.exports = mongoose.model('User', schema);
