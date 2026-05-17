const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  platform:  { type: String, enum: ['linkedin', 'naukri'], required: true },
  errorType: { type: String, required: true }, // e.g. 'captcha_detected', 'timeout_error', 'login_failed'
  message:   { type: String },
  jobTitle:  { type: String },
  createdAt: { type: Date, default: Date.now }
});

// TTL index — auto-delete error logs after 30 days
schema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 30 });

module.exports = mongoose.model('BotError', schema);
