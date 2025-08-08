const mongoose = require('mongoose');

const abuseReportSchema = new mongoose.Schema(
  {
    // Core identification
    reportId: {
      type: String,
      unique: true,
      index: true
    },
    
    // Reporter information
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    
    // Target information
    targetType: {
      type: String,
      enum: ['user', 'blog', 'comment', 'series', 'badge', 'system'],
      required: true,
      index: true
    },
    targetId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true
    },
    targetUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      index: true
    },
    
    // Report details
    category: {
      type: String,
      enum: [
        'spam',
        'harassment',
        'hate_speech',
        'violence',
        'sexual_content',
        'misinformation',
        'copyright',
        'impersonation',
        'fake_news',
        'bullying',
        'threats',
        'inappropriate_content',
        'scam',
        'other'
      ],
      required: true,
      index: true
    },
    
    subcategory: {
      type: String,
      enum: [
        // Spam subcategories
        'commercial_spam',
        'repetitive_content',
        'bot_activity',
        
        // Harassment subcategories
        'personal_harassment',
        'sexual_harassment',
        'cyberbullying',
        'stalking',
        
        // Hate speech subcategories
        'racial_hate',
        'religious_hate',
        'gender_hate',
        'ethnic_hate',
        'sexual_orientation_hate',
        
        // Violence subcategories
        'physical_threats',
        'verbal_threats',
        'violent_content',
        
        // Sexual content subcategories
        'explicit_content',
        'inappropriate_sexual',
        'sexual_exploitation',
        
        // Misinformation subcategories
        'fake_news',
        'conspiracy_theories',
        'medical_misinformation',
        'political_misinformation',
        
        // Copyright subcategories
        'plagiarism',
        'copyright_infringement',
        'trademark_violation',
        
        // Impersonation subcategories
        'fake_account',
        'impersonation',
        'identity_theft',
        
        // Other subcategories
        'inappropriate_language',
        'offensive_content',
        'disturbing_content',
        'other'
      ],
      required: true
    },
    
    // Report content
    title: { type: String, required: true },
    description: { type: String, required: true },
    evidence: [{
      type: {
        type: String,
        enum: ['text', 'image', 'link', 'screenshot', 'other']
      },
      content: { type: String },
      url: { type: String },
      filename: { type: String },
      uploadedAt: { type: Date, default: Date.now }
    }],
    
    // Severity and priority
    severity: {
      type: String,
      enum: ['low', 'medium', 'high', 'critical'],
      default: 'medium',
      index: true
    },
    priority: {
      type: String,
      enum: ['low', 'normal', 'high', 'urgent'],
      default: 'normal',
      index: true
    },
    
    // Status and workflow
    status: {
      type: String,
      enum: ['pending', 'under_review', 'investigating', 'resolved', 'dismissed', 'escalated'],
      default: 'pending',
      index: true
    },
    
    // Review information
    reviewedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    reviewedAt: { type: Date },
    reviewNotes: { type: String },
    
    // Resolution information
    resolution: {
      type: String,
      enum: ['warning_issued', 'content_removed', 'user_suspended', 'user_banned', 'no_action', 'false_report'],
      index: true
    },
    resolutionNotes: { type: String },
    resolvedAt: { type: Date },
    
    // Appeal information
    appealStatus: {
      type: String,
      enum: ['none', 'pending', 'approved', 'rejected'],
      default: 'none'
    },
    appealNotes: { type: String },
    appealedAt: { type: Date },
    
    // Fraud detection
    fraudCheck: {
      score: { type: Number, min: 0, max: 1, default: 0 },
      flags: [{ type: String }],
      riskLevel: {
        type: String,
        enum: ['low', 'medium', 'high', 'critical'],
        default: 'low'
      },
      automatedDecision: { type: Boolean, default: true },
      manualReviewRequired: { type: Boolean, default: false }
    },
    
    // Security and tracking
    security: {
      ipAddress: { type: String },
      userAgent: { type: String },
      deviceFingerprint: { type: String },
      location: {
        country: { type: String },
        region: { type: String },
        city: { type: String }
      }
    },
    
    // Analytics and metrics
    analytics: {
      viewCount: { type: Number, default: 0 },
      responseTime: { type: Number }, // in hours
      escalationCount: { type: Number, default: 0 },
      relatedReports: [{ type: mongoose.Schema.Types.ObjectId, ref: 'AbuseReport' }]
    },
    
    // Metadata
    tags: [{ type: String }],
    metadata: { type: mongoose.Schema.Types.Mixed },
    
    // Timestamps
    createdAt: { type: Date, default: Date.now, index: true },
    updatedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date } // For automatic cleanup
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
abuseReportSchema.index({ reporterId: 1, createdAt: -1 });
abuseReportSchema.index({ targetType: 1, targetId: 1 });
abuseReportSchema.index({ status: 1, priority: 1 });
abuseReportSchema.index({ category: 1, severity: 1 });
abuseReportSchema.index({ 'fraudCheck.riskLevel': 1 });
abuseReportSchema.index({ createdAt: 1 }, { expireAfterSeconds: 7776000 }); // 90 days TTL

// Pre-save middleware
abuseReportSchema.pre('save', function(next) {
  // Generate report ID if not exists
  if (!this.reportId) {
    this.reportId = `AR-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  // Set priority based on severity and category
  if (this.severity === 'critical') {
    this.priority = 'urgent';
  } else if (this.severity === 'high') {
    this.priority = 'high';
  }
  
  // Set expiration date (90 days from creation)
  if (!this.expiresAt) {
    this.expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000);
  }
  
  next();
});

// Virtual for report age
abuseReportSchema.virtual('age').get(function() {
  return Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24));
});

// Virtual for is urgent
abuseReportSchema.virtual('isUrgent').get(function() {
  return this.priority === 'urgent' || this.severity === 'critical';
});

// Instance methods
abuseReportSchema.methods.escalate = function(reason) {
  this.status = 'escalated';
  this.analytics.escalationCount += 1;
  this.reviewNotes = `${this.reviewNotes || ''}\n\nEscalated: ${reason}`;
  return this.save();
};

abuseReportSchema.methods.resolve = function(resolution, notes, resolvedBy) {
  this.status = 'resolved';
  this.resolution = resolution;
  this.resolutionNotes = notes;
  this.resolvedAt = new Date();
  this.reviewedBy = resolvedBy;
  return this.save();
};

abuseReportSchema.methods.dismiss = function(reason, dismissedBy) {
  this.status = 'dismissed';
  this.resolution = 'no_action';
  this.resolutionNotes = reason;
  this.resolvedAt = new Date();
  this.reviewedBy = dismissedBy;
  return this.save();
};

// Static methods
abuseReportSchema.statics.getByStatus = function(status) {
  return this.find({ status }).sort({ createdAt: -1 });
};

abuseReportSchema.statics.getByPriority = function(priority) {
  return this.find({ priority }).sort({ createdAt: -1 });
};

abuseReportSchema.statics.getUrgentReports = function() {
  return this.find({
    $or: [
      { priority: 'urgent' },
      { severity: 'critical' },
      { status: 'pending' }
    ]
  }).sort({ createdAt: 1 });
};

abuseReportSchema.statics.getReportsByTarget = function(targetType, targetId) {
  return this.find({ targetType, targetId }).sort({ createdAt: -1 });
};

abuseReportSchema.statics.getReportsByReporter = function(reporterId) {
  return this.find({ reporterId }).sort({ createdAt: -1 });
};

abuseReportSchema.statics.getAnalytics = async function(timeframe = '30d') {
  const cutoffDate = new Date();
  if (timeframe === '7d') {
    cutoffDate.setDate(cutoffDate.getDate() - 7);
  } else if (timeframe === '30d') {
    cutoffDate.setDate(cutoffDate.getDate() - 30);
  } else if (timeframe === '90d') {
    cutoffDate.setDate(cutoffDate.getDate() - 90);
  }

  const analytics = await this.aggregate([
    {
      $match: {
        createdAt: { $gte: cutoffDate }
      }
    },
    {
      $group: {
        _id: null,
        totalReports: { $sum: 1 },
        pendingReports: {
          $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
        },
        resolvedReports: {
          $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
        },
        urgentReports: {
          $sum: { $cond: [{ $eq: ['$priority', 'urgent'] }, 1, 0] }
        },
        averageResponseTime: { $avg: '$analytics.responseTime' },
        byCategory: {
          $push: {
            category: '$category',
            severity: '$severity',
            status: '$status'
          }
        }
      }
    }
  ]);

  return analytics[0] || {
    totalReports: 0,
    pendingReports: 0,
    resolvedReports: 0,
    urgentReports: 0,
    averageResponseTime: 0,
    byCategory: []
  };
};

module.exports = mongoose.model('AbuseReport', abuseReportSchema);
