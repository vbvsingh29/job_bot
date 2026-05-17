const mongoose = require('mongoose');

const schema = new mongoose.Schema({
  name:             { type: String, required: true },
  platform:         { type: String, enum: ['linkedin', 'naukri'], required: true },
  description:      { type: String },
  keywords:         { type: [String], default: [] },
  defaultLocation:  { type: String, default: '' },
  suggestedMaxJobs: { type: Number, default: 15, min: 1, max: 50 },
  public:           { type: Boolean, default: false },
}, { timestamps: true });

module.exports = mongoose.model('AutomationTemplate', schema);
