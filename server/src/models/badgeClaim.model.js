const mongoose = require('mongoose');
const crypto = require('crypto');

const badgeClaimSchema = new mongoose.Schema(
  {
    // Core identification
    claimId: {
      type: String,
      required: true
    },
    
    // Badge and user references
    badgeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Badge',
      required: true
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    
    // Claim status and lifecycle
    status: {
      type: String,
      enum: ['pending', 'approved', 'rejected', 'cancelled', 'under_review'],
      default: 'pending'
    },
    
    // Claim details
    claimedAt: { type: Date, default: Date.now },
    processedAt: { type: Date },
    reviewedAt: { type: Date },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    // Eligibility verification
    eligibilityCheck: {
      passed: { type: Boolean, default: false },
      checkedAt: { type: Date },
      requirements: { type: mongoose.Schema.Types.Mixed },
      evaluationResult: { type: mongoose.Schema.Types.Mixed },
      confidence: { type: Number, min: 0, max: 1, default: 0 }
    },
    
    // Fraud prevention
    fraudCheck: {
      score: { type: Number, min: 0, max: 1, default: 0 },
      flags: [{ type: String }],
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
      },
      automatedDecision: { type: Boolean, default: true },
      reviewerNotes: { type: String }
    },
    
    // Security and verification
    security: {
      ipAddress: { type: String },
      userAgent: { type: String },
      deviceFingerprint: { type: String },
      location: {
        country: { type: String },
        region: { type: String },
        city: { type: String },
        coordinates: {
          latitude: { type: Number },
          longitude: { type: Number }
        }
      },
      sessionId: { type: String },
      requestHash: { type: String },
      signature: { type: String }
    },
    
    // Rate limiting and cooldown
    rateLimit: {
      attemptsInWindow: { type: Number, default: 1 },
      windowStart: { type: Date },
      windowEnd: { type: Date },
      cooldownExpires: { type: Date }
    },
    
    // Rewards and benefits
    rewards: {
      xpAwarded: { type: Number, default: 0 },
      featuresUnlocked: [{ type: String }],
      privilegesGranted: [{ type: String }],
      appliedAt: { type: Date }
    },
    
    // Audit trail
    auditTrail: [{
      action: { type: String, required: true },
      timestamp: { type: Date, default: Date.now },
      performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      details: { type: mongoose.Schema.Types.Mixed },
      ipAddress: { type: String },
      userAgent: { type: String }
    }],
    
    // Appeal and dispute resolution
    appeal: {
      isAppealed: { type: Boolean, default: false },
      appealedAt: { type: Date },
      appealReason: { type: String },
      appealStatus: {
        type: String,
        enum: ['pending', 'approved', 'rejected'],
        default: 'pending'
      },
      appealReviewedAt: { type: Date },
      appealReviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      appealNotes: { type: String }
    },
    
    // Metadata and tracking
    metadata: { type: mongoose.Schema.Types.Mixed },
    tags: [{ type: String }],
    
    // Timestamps
    createdAt: { type: Date, default: Date.now },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance and querying
badgeClaimSchema.index({ claimId: 1 }, { unique: true });
badgeClaimSchema.index({ badgeId: 1, userId: 1 });
badgeClaimSchema.index({ status: 1, createdAt: -1 });
badgeClaimSchema.index({ userId: 1, status: 1 });
badgeClaimSchema.index({ 'fraudCheck.riskLevel': 1, status: 1 });
badgeClaimSchema.index({ 'security.ipAddress': 1, createdAt: -1 });
badgeClaimSchema.index({ 'rateLimit.cooldownExpires': 1 });

// Virtual for claim duration
badgeClaimSchema.virtual('processingTime').get(function() {
  if (this.processedAt && this.claimedAt) {
    return this.processedAt - this.claimedAt;
  }
  return null;
});

// Virtual for is active
badgeClaimSchema.virtual('isActive').get(function() {
  return ['pending', 'under_review'].includes(this.status);
});

// Pre-save middleware
badgeClaimSchema.pre('save', function(next) {
  // Generate claim ID if not present
  if (!this.claimId) {
    this.claimId = this.generateClaimId();
  }
  
  // Update timestamps
  this.updatedAt = new Date();
  
  next();
});

// Instance methods
badgeClaimSchema.methods.generateClaimId = function() {
  const timestamp = Date.now().toString(36);
  const random = Math.random().toString(36).substr(2, 5);
  return `claim_${timestamp}_${random}`;
};

badgeClaimSchema.methods.addAuditEntry = function(action, performedBy, details = {}, requestInfo = {}) {
  this.auditTrail.push({
    action,
    performedBy,
    details,
    ipAddress: requestInfo.ipAddress,
    userAgent: requestInfo.userAgent
  });
};

badgeClaimSchema.methods.updateStatus = function(newStatus, performedBy, reason = '', requestInfo = {}) {
  const oldStatus = this.status;
  this.status = newStatus;
  
  // Update relevant timestamps
  if (newStatus === 'approved' || newStatus === 'rejected') {
    this.processedAt = new Date();
    this.reviewedAt = new Date();
    this.reviewedBy = performedBy;
  }
  
  // Add audit entry
  this.addAuditEntry(
    `status_changed_${newStatus}`,
    performedBy,
    { oldStatus, newStatus, reason },
    requestInfo
  );
};

badgeClaimSchema.methods.applyRewards = function() {
  if (this.status === 'approved' && !this.rewards.appliedAt) {
    this.rewards.appliedAt = new Date();
    this.addAuditEntry('rewards_applied', null, {
      xpAwarded: this.rewards.xpAwarded,
      featuresUnlocked: this.rewards.featuresUnlocked,
      privilegesGranted: this.rewards.privilegesGranted
    });
  }
};

badgeClaimSchema.methods.checkRateLimit = function() {
  const now = new Date();
  const windowSize = 24 * 60 * 60 * 1000; // 24 hours
  
  // Initialize window if not set
  if (!this.rateLimit.windowStart) {
    this.rateLimit.windowStart = now;
    this.rateLimit.windowEnd = new Date(now.getTime() + windowSize);
  }
  
  // Check if we're still in the same window
  if (now <= this.rateLimit.windowEnd) {
    this.rateLimit.attemptsInWindow += 1;
  } else {
    // Start new window
    this.rateLimit.windowStart = now;
    this.rateLimit.windowEnd = new Date(now.getTime() + windowSize);
    this.rateLimit.attemptsInWindow = 1;
  }
  
  return this.rateLimit.attemptsInWindow;
};

badgeClaimSchema.methods.generateSignature = function() {
  const data = `${this.badgeId}-${this.userId}-${this.claimedAt.getTime()}`;
  const secret = process.env.BADGE_SECRET || 'default-secret';
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
};

// Static methods
badgeClaimSchema.statics.createClaim = async function(badgeId, userId, requestInfo = {}) {
  const claim = new this({
    badgeId,
    userId,
    security: {
      ipAddress: requestInfo.ipAddress,
      userAgent: requestInfo.userAgent,
      deviceFingerprint: requestInfo.deviceFingerprint,
      location: requestInfo.location,
      sessionId: requestInfo.sessionId
    }
  });
  
  // Generate signature
  claim.security.signature = claim.generateSignature();
  
  // Add initial audit entry
  claim.addAuditEntry('claim_created', userId, {}, requestInfo);
  
  return claim;
};

badgeClaimSchema.statics.getUserClaims = function(userId, options = {}) {
  const query = { userId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  if (options.badgeId) {
    query.badgeId = options.badgeId;
  }
  
  return this.find(query)
    .populate('badgeId', 'name description icon rarity category')
    .sort({ createdAt: -1 })
    .limit(options.limit || 50)
    .skip(options.skip || 0);
};

badgeClaimSchema.statics.getPendingClaims = function(options = {}) {
  const query = { status: { $in: ['pending', 'under_review'] } };
  
  if (options.riskLevel) {
    query['fraudCheck.riskLevel'] = options.riskLevel;
  }
  
  return this.find(query)
    .populate('badgeId', 'name description icon rarity category')
    .populate('userId', 'name email avatar')
    .sort({ createdAt: 1 })
    .limit(options.limit || 50);
};

badgeClaimSchema.statics.getClaimsByBadge = function(badgeId, options = {}) {
  const query = { badgeId };
  
  if (options.status) {
    query.status = options.status;
  }
  
  return this.find(query)
    .populate('userId', 'name email avatar')
    .sort({ createdAt: -1 })
    .limit(options.limit || 100);
};

badgeClaimSchema.statics.getFraudulentClaims = function(options = {}) {
  const query = {
    'fraudCheck.riskLevel': { $in: ['high', 'critical'] },
    status: { $ne: 'rejected' }
  };
  
  return this.find(query)
    .populate('badgeId', 'name description icon rarity category')
    .populate('userId', 'name email avatar')
    .sort({ 'fraudCheck.score': -1 })
    .limit(options.limit || 50);
};

badgeClaimSchema.statics.getClaimsAnalytics = async function(timeframe = '30d') {
  const now = new Date();
  let startDate;
  
  switch (timeframe) {
    case '7d':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case '30d':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case '90d':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  const analytics = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: startDate }
      }
    },
    {
      $group: {
        _id: {
          status: '$status',
          riskLevel: '$fraudCheck.riskLevel'
        },
        count: { $sum: 1 },
        avgProcessingTime: { $avg: { $subtract: ['$processedAt', '$claimedAt'] } }
      }
    }
  ]);
  
  return analytics;
};

// Export the model
module.exports = mongoose.model('BadgeClaim', badgeClaimSchema); 