const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  jobTitle:  String,
  company:   String,
  platform:  { type: String, enum: ['linkedin', 'naukri'] },
  status:    { type: String, enum: ['success', 'failed', 'skipped'] },
  url:       String,
  errorMsg:  String,
  appliedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Application', schema);
