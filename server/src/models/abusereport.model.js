const mongoose = require('mongoose');

const abuseReportSchema = new mongoose.Schema(
  {
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    targetId: { type: String, required: true }, // Can be a comment, blog, etc.
    type: { type: String, required: true }, // e.g., 'comment', 'blog'
    reason: { type: String },
  },
  { timestamps: true }
);

module.exports = mongoose.model('AbuseReport', abuseReportSchema);
