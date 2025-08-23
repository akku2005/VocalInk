const mongoose = require('mongoose');

const xpTransactionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    action: {
      type: String,
      required: true,
      enum: [
        // Content Creation
        'create_blog_draft',
        'publish_blog',
        'update_blog',
        'create_series',
        'add_to_series',
        'upload_media',
        
        // Content Consumption
        'complete_blog_read',
        'bookmark_blog',
        'share_blog_external',
        'subscribe_author',
        'join_series',
        
        // Social Interaction
        'write_comment',
        'reply_comment',
        'receive_comment_like',
        'receive_blog_like',
        'start_discussion',
        
        // Platform Engagement
        'daily_login',
        'complete_profile',
        'upload_profile_picture',
        'connect_social_media',
        'invite_friend',
        
        // Badge & Achievement
        'earn_badge',
        'level_up',
        'streak_bonus',
        'quality_bonus',
        
        // Admin Actions
        'admin_grant',
        'admin_deduct',
        'penalty',
        'appeal_grant'
      ],
    },
    baseAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    multiplier: {
      type: Number,
      default: 1.0,
      min: 0.1,
      max: 10.0,
    },
    bonuses: [{
      type: {
        type: String,
        enum: ['streak', 'quality', 'new_user', 'mentor', 'top_contributor', 'beta_tester', 'seasonal'],
      },
      amount: Number,
      description: String,
    }],
    reason: {
      type: String,
      required: true,
    },
    metadata: {
      // Content-related metadata
      blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
      commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
      seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
      badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
      
      // Quality and validation metadata
      qualityScore: { type: Number, min: 0, max: 100 },
      readingTime: { type: Number }, // in seconds
      scrollPercentage: { type: Number, min: 0, max: 100 },
      engagementMetrics: {
        likes: Number,
        comments: Number,
        shares: Number,
        bookmarks: Number,
      },
      
      // Fraud detection metadata
      ipAddress: String,
      userAgent: String,
      deviceFingerprint: String,
      sessionId: String,
      
      // Streak information
      currentStreak: Number,
      streakType: {
        type: String,
        enum: ['login', 'publishing', 'reading', 'commenting'],
      },
      
      // Time-based metadata
      timeOfDay: Number, // 0-23 hour
      dayOfWeek: Number, // 0-6 (Sunday-Saturday)
      isWeekend: Boolean,
      
      // Additional context
      category: String,
      tags: [String],
      language: String,
      platform: {
        type: String,
        enum: ['web', 'mobile', 'api', 'system'],
        default: 'web',
      },
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'flagged', 'under_review'],
      default: 'approved',
    },
    flags: [{
      type: {
        type: String,
        enum: ['velocity', 'pattern', 'quality', 'manual', 'automated'],
      },
      reason: String,
      severity: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low',
      },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      reviewedAt: Date,
      resolved: { type: Boolean, default: false },
    }],
    previousXP: {
      type: Number,
      required: true,
    },
    newXP: {
      type: Number,
      required: true,
    },
    previousLevel: {
      type: Number,
      required: true,
    },
    newLevel: {
      type: Number,
      required: true,
    },
    processedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for performance and querying
xpTransactionSchema.index({ userId: 1, createdAt: -1 });
xpTransactionSchema.index({ action: 1, createdAt: -1 });
xpTransactionSchema.index({ status: 1, createdAt: -1 });
xpTransactionSchema.index({ 'metadata.blogId': 1 });
xpTransactionSchema.index({ 'metadata.badgeId': 1 });
xpTransactionSchema.index({ 'flags.type': 1, 'flags.severity': 1 });

// Virtual for transaction duration (if needed for analysis)
xpTransactionSchema.virtual('processingTime').get(function () {
  return this.processedAt - this.createdAt;
});

// Virtual for level up detection
xpTransactionSchema.virtual('isLevelUp').get(function () {
  return this.newLevel > this.previousLevel;
});

// Virtual for total bonuses
xpTransactionSchema.virtual('totalBonuses').get(function () {
  return this.bonuses.reduce((sum, bonus) => sum + (bonus.amount || 0), 0);
});

// Static methods
xpTransactionSchema.statics.getUserTransactionHistory = function (userId, options = {}) {
  const { limit = 50, page = 1, action, status, startDate, endDate } = options;
  
  let query = { userId };
  
  if (action) query.action = action;
  if (status) query.status = status;
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) query.createdAt.$gte = new Date(startDate);
    if (endDate) query.createdAt.$lte = new Date(endDate);
  }
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('metadata.badgeId', 'name icon color')
    .populate('metadata.blogId', 'title')
    .exec();
};

xpTransactionSchema.statics.getUserStats = async function (userId, timeframe = 'all') {
  const now = new Date();
  let startDate = null;
  
  switch (timeframe) {
    case 'today':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case 'week':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1);
      break;
  }
  
  const query = { userId, status: 'approved' };
  if (startDate) query.createdAt = { $gte: startDate };
  
  const transactions = await this.find(query);
  
  const stats = {
    totalXP: 0,
    totalTransactions: transactions.length,
    byAction: {},
    byCategory: {},
    averagePerDay: 0,
    highestSingleGain: 0,
    levelUps: 0,
  };
  
  transactions.forEach(tx => {
    stats.totalXP += tx.finalAmount;
    stats.byAction[tx.action] = (stats.byAction[tx.action] || 0) + tx.finalAmount;
    if (tx.isLevelUp) stats.levelUps++;
    if (tx.finalAmount > stats.highestSingleGain) {
      stats.highestSingleGain = tx.finalAmount;
    }
  });
  
  // Calculate average per day
  if (startDate) {
    const daysDiff = Math.ceil((now - startDate) / (1000 * 60 * 60 * 24));
    stats.averagePerDay = daysDiff > 0 ? stats.totalXP / daysDiff : 0;
  }
  
  return stats;
};

xpTransactionSchema.statics.getFlaggedTransactions = function (options = {}) {
  const { severity, reviewed, limit = 50, page = 1 } = options;
  
  let query = { 'flags.0': { $exists: true } };
  
  if (severity) query['flags.severity'] = severity;
  if (reviewed !== undefined) query['flags.resolved'] = reviewed;
  
  return this.find(query)
    .sort({ createdAt: -1 })
    .limit(limit * 1)
    .skip((page - 1) * limit)
    .populate('userId', 'name email')
    .exec();
};

// Instance methods
xpTransactionSchema.methods.flag = function (flagType, reason, severity = 'low') {
  this.flags.push({
    type: flagType,
    reason,
    severity,
  });
  
  if (severity === 'high' || severity === 'critical') {
    this.status = 'under_review';
  }
  
  return this.save();
};

xpTransactionSchema.methods.resolveFlag = function (flagIndex, resolvedBy, resolution = '') {
  if (this.flags[flagIndex]) {
    this.flags[flagIndex].resolved = true;
    this.flags[flagIndex].reviewedBy = resolvedBy;
    this.flags[flagIndex].reviewedAt = new Date();
    
    // Check if all flags are resolved
    const allResolved = this.flags.every(flag => flag.resolved);
    if (allResolved && this.status === 'under_review') {
      this.status = 'approved';
    }
  }
  
  return this.save();
};

module.exports = mongoose.model('XPTransaction', xpTransactionSchema); 