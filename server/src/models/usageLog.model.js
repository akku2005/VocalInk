const mongoose = require('mongoose');

const usageLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['summary', 'audio', 'ai_blog_generation'],
      required: true,
      index: true,
    },
    createdAt: {
      type: Date,
      default: () => new Date(),
    },
  },
  {
    timestamps: false,
  }
);

// Automatically purge history shortly after it falls outside the rolling window
usageLogSchema.index({ createdAt: 1 }, { expireAfterSeconds: 26 * 60 * 60 });

module.exports = mongoose.model('UsageLog', usageLogSchema);
