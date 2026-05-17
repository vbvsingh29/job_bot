const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  skills: { type: [String], default: [] },
  location: { type: String, default: '' },
  maxJobsPerDay: { type: Number, default: 15, min: 1, max: 50 },
  scheduledTime: { type: String, default: '09:00' },
  scheduledReportTime: { type: String, default: '21:00' },
  reportEmail: { type: String },
  active: { type: Boolean, default: false },
  lastRunAt: { type: Date },
  lastRunResult: {
    success: { type: Number, default: 0 },
    failed: { type: Number, default: 0 },
    skipped: { type: Number, default: 0 }
  }
}, { timestamps: true });

module.exports = mongoose.model('AutomationConfig', schema);
