const mongoose = require('mongoose');

const analyticsFetchLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    period: {
      type: String,
      enum: ['7d', '30d', '90d', '1y'],
      default: '30d',
      index: true,
    },
    source: {
      type: String,
      enum: ['live', 'cache'],
      default: 'live',
    },
    durationMs: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: { createdAt: true, updatedAt: false },
  }
);

analyticsFetchLogSchema.index(
  { createdAt: 1 },
  { expireAfterSeconds: 7 * 24 * 60 * 60 }
);

module.exports = mongoose.model('AnalyticsFetchLog', analyticsFetchLogSchema);
