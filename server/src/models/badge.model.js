const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  icon: { type: String },
  criteria: { type: String },
}, { timestamps: true });

module.exports = mongoose.model('Badge', badgeSchema); 