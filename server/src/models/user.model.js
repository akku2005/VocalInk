const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    firstName: { type: String, required: true },
    lastName: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    username: { type: String, unique: true, sparse: true, trim: true, lowercase: true }, // Unique username
    displayName: { type: String, trim: true }, // Display name for profile
    role: {
      type: String,
      enum: ['user', 'reader', 'writer', 'admin'],
      default: 'reader',
    },

    // Profile fields
    bio: { type: String, maxlength: 500 },
    dob: { type: Date },
    nationality: { type: String },
    mobile: { type: String }, // e.g., "+91-9876543210"
    occupation: { type: String },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer_not_to_say'],
    },
    address: { type: String },
    location: { type: String }, // e.g., "New York, NY, USA"
    profilePicture: { type: String },
    avatar: { type: String },
    avatarKey: { type: String }, // Cloudinary public ID for avatar
    coverImage: { type: String }, // Background banner image
    coverImageKey: { type: String }, // Cloudinary public ID for cover image

    // Professional info
    company: { type: String },
    jobTitle: { type: String },
    website: { type: String },
    linkedin: { type: String },

    // Social links
    socialLinks: [
      {
        platform: {
          type: String,
          enum: [
            'twitter',
            'github',
            'linkedin',
            'instagram',
            'facebook',
            'youtube',
            'website',
          ],
        },
        url: { type: String },
      },
    ],

    // Gamification & Engagement
    xp: { type: Number, default: 0 },
    level: { type: Number, default: 1 },
    badges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Badge' }],
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

    // Enhanced Engagement metrics
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalBookmarks: { type: Number, default: 0 },
    totalShares: { type: Number, default: 0 },
    totalBlogs: { type: Number, default: 0 },
    totalSeries: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 },
    qualityScore: { type: Number, default: 0, min: 0, max: 100 },

    // Streak tracking
    streaks: {
      login: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastLogin: { type: Date },
      },
      publishing: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastPublish: { type: Date },
      },
      reading: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastRead: { type: Date },
      },
      commenting: {
        current: { type: Number, default: 0 },
        longest: { type: Number, default: 0 },
        lastComment: { type: Date },
      },
    },

    // XP multipliers and bonuses
    xpMultipliers: {
      newUser: { type: Boolean, default: true },
      mentor: { type: Boolean, default: false },
      topContributor: { type: Boolean, default: false },
      betaTester: { type: Boolean, default: false },
      seasonal: { type: Number, default: 1.0 },
    },

    // Daily action tracking
    dailyActions: {
      login: { type: Date },
      blogReads: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      shares: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      follows: { type: Number, default: 0 },
      invites: { type: Number, default: 0 },
    },

    // Level benefits and unlocks
    unlockedFeatures: [{
      feature: { type: String },
      unlockedAt: { type: Date, default: Date.now },
      level: { type: Number },
    }],

    // Gamification preferences
    gamificationSettings: {
      showXP: { type: Boolean, default: true },
      showLevel: { type: Boolean, default: true },
      showBadges: { type: Boolean, default: true },
      showLeaderboard: { type: Boolean, default: true },
      notifications: { type: Boolean, default: true },
    },

    // Verification & Security
    verificationCode: { type: String },
    verificationCodeExpires: { type: Date },
    isVerified: { type: Boolean, default: false },
    resetPasswordToken: { type: String },
    resetPasswordCode: { type: String },
    resetPasswordExpires: { type: Date },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorSecret: { type: String },
    backupCodes: [{ type: String }],
    isDeleted: { type: Boolean, default: false },
    deletedAt: { type: Date },

    // Security & Account protection
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date, default: null },
    lastLoginAt: { type: Date },
    lastActiveAt: { type: Date },
    passwordChangedAt: { type: Date },
    activeSessions: [{
      sessionId: { type: String, required: true },
      device: { type: String },
      browser: { type: String },
      os: { type: String },
      ip: { type: String },
      userAgent: { type: String },
      location: {
        city: { type: String },
        region: { type: String },
        country: { type: String },
        countryCode: { type: String },
        latitude: { type: Number },
        longitude: { type: Number }
      },
      createdAt: { type: Date, default: Date.now },
      lastActivity: { type: Date, default: Date.now },
      isActive: { type: Boolean, default: true }
    }],
    loginHistory: [{
      device: { type: String },
      browser: { type: String },
      os: { type: String },
      location: {
        city: { type: String },
        region: { type: String },
        country: { type: String },
        countryCode: { type: String }
      },
      date: { type: Date, default: Date.now },
      ip: { type: String },
      userAgent: { type: String },
      success: { type: Boolean, default: true }
    }],
    securitySettings: {
      loginNotifications: { type: Boolean, default: true },
      suspiciousActivityAlerts: { type: Boolean, default: true },
      autoLogout: { type: Boolean, default: false }
    },
    // AI preferences
    aiPreferences: {
      preferredVoice: { type: String, default: 'default' },
      autoSummarize: { type: Boolean, default: true },
      speechToText: { type: Boolean, default: false },
      language: { type: String, default: 'en' }, // AI language preference
    },

    // Legacy theme field for backward compatibility
    theme: {
      type: String,
      enum: ['light', 'dark', 'system'],
      default: 'system'
    },

    // AI usage tracking
    aiUsage: {
      ttsGenerated: { type: Number, default: 0 },
      summariesGenerated: { type: Number, default: 0 },
      transcriptionsCreated: { type: Number, default: 0 },
      lastAIFeature: { type: Date }
    },

    // Account visibility
    accountVisibility: {
      type: String,
      enum: ['public', 'private', 'friends'],
      default: 'public',
    },

    // Notification preferences - SINGLE SOURCE OF TRUTH
    notificationSettings: {
      // Basic notification toggles
      emailNotifications: { type: Boolean, default: true },
      pushNotifications: { type: Boolean, default: true },
      marketingEmails: { type: Boolean, default: false },
      soundEnabled: { type: Boolean, default: true },
      desktopNotifications: { type: Boolean, default: true },

      // Detailed notification preferences
      newFollowers: { type: Boolean, default: true },
      newLikes: { type: Boolean, default: true },
      newComments: { type: Boolean, default: true },
      newMentions: { type: Boolean, default: true },
      badgeEarned: { type: Boolean, default: true },
      levelUp: { type: Boolean, default: true },
      seriesUpdates: { type: Boolean, default: true },
      aiGenerations: { type: Boolean, default: false },
      weeklyDigest: { type: Boolean, default: false },
      monthlyReport: { type: Boolean, default: false },

      // Frequency settings
      emailDigestFrequency: {
        type: String,
        enum: ['immediate', 'daily', 'weekly', 'monthly', 'never'],
        default: 'weekly'
      },
      pushNotificationTime: {
        type: String,
        enum: ['immediate', 'hourly', 'daily', 'never'],
        default: 'immediate'
      }
    },
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['public', 'followers', 'private'],
        default: 'public',
      },
      postVisibility: {
        type: String,
        enum: ['public', 'followers', 'private'],
        default: 'public',
      },
      allowSearch: { type: Boolean, default: true },
      showEmail: { type: Boolean, default: false },
      showOnlineStatus: { type: Boolean, default: true },
      allowDirectMessages: { type: Boolean, default: true },
      dataSharing: { type: Boolean, default: false },
      analyticsSharing: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for full name (for backward compatibility and display)
userSchema.virtual('name').get(function () {
  if (this.displayName) return this.displayName;
  if (this.firstName && this.lastName) return `${this.firstName} ${this.lastName}`;
  if (this.firstName) return this.firstName;
  if (this.username) return this.username;
  return 'Anonymous';
});

// Virtual for follower count
userSchema.virtual('followerCount').get(function () {
  return this.followers ? this.followers.length : 0;
});

// Virtual for following count
userSchema.virtual('followingCount').get(function () {
  return this.following ? this.following.length : 0;
});

// Virtual for badge count
userSchema.virtual('badgeCount').get(function () {
  return this.badges ? this.badges.length : 0;
});

// Virtual for level based on XP
userSchema.virtual('calculatedLevel').get(function () {
  return Math.floor(this.xp / 100) + 1;
});

// Pre-save middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();

  // Hash password
  this.password = await bcrypt.hash(this.password, 10);

  // Update level based on XP using enhanced calculation
  if (this.isModified('xp')) {
    this.level = this.calculateLevel(this.xp);

    // Check for new feature unlocks
    await this.checkFeatureUnlocks();
  }

  // Update last active
  this.lastActiveAt = new Date();

  // Reset daily actions if it's a new day
  await this.resetDailyActionsIfNeeded();

  next();
});

// Instance methods
userSchema.methods.generateVerificationCode = function () {
  // Generate a 6-digit random code
  const code = Math.floor(100000 + Math.random() * 900000).toString();
  this.verificationCode = code;
  this.verificationCodeExpires = Date.now() + 10 * 60 * 1000; // 10 minutes
  return code;
};

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.addXP = async function (amount, reason) {
  this.xp += amount;
  this.level = this.calculateLevel(this.xp);
  await this.save();

  // Log XP gain
  console.log(
    `User ${this.email} gained ${amount} XP for: ${reason}. Total XP: ${this.xp}`
  );

  return this.xp;
};

userSchema.methods.calculateLevel = function (xp) {
  if (xp < 100) return 1;
  if (xp < 500) return Math.floor(xp / 100) + 1;
  if (xp < 2500) return Math.floor(Math.sqrt(xp / 50)) + 1;
  return Math.floor(Math.sqrt(xp / 75)) + 1;
};

userSchema.methods.updateStreak = async function (streakType, action = 'increment') {
  const streak = this.streaks[streakType];
  const now = new Date();

  if (!streak) return;

  if (action === 'increment') {
    // Check if this is a consecutive day
    const lastAction = streak.lastLogin || streak.lastPublish || streak.lastRead || streak.lastComment;
    const daysSinceLastAction = lastAction ? Math.floor((now - lastAction) / (1000 * 60 * 60 * 24)) : 1;

    if (daysSinceLastAction === 1) {
      // Consecutive day
      streak.current += 1;
      if (streak.current > streak.longest) {
        streak.longest = streak.current;
      }
    } else if (daysSinceLastAction > 1) {
      // Break in streak
      streak.current = 1;
    } else {
      // Same day, don't increment
      return;
    }

    // Update last action date
    switch (streakType) {
      case 'login':
        streak.lastLogin = now;
        break;
      case 'publishing':
        streak.lastPublish = now;
        break;
      case 'reading':
        streak.lastRead = now;
        break;
      case 'commenting':
        streak.lastComment = now;
        break;
    }
  } else if (action === 'reset') {
    streak.current = 0;
  }

  await this.save();
};

userSchema.methods.incrementDailyAction = async function (actionType) {
  if (!this.dailyActions[actionType]) {
    this.dailyActions[actionType] = 0;
  }
  this.dailyActions[actionType] += 1;
  await this.save();
};

userSchema.methods.resetDailyActionsIfNeeded = async function () {
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  // Check if we need to reset daily actions
  if (!this.dailyActions.login || this.dailyActions.login < today) {
    this.dailyActions = {
      login: now,
      blogReads: 0,
      comments: 0,
      shares: 0,
      bookmarks: 0,
      follows: 0,
      invites: 0,
    };
  }
};

userSchema.methods.checkFeatureUnlocks = async function () {
  const featureUnlocks = {
    5: ['private_messaging'],
    10: ['blog_monetization', 'advanced_analytics'],
    15: ['advanced_analytics'],
    25: ['collaboration_features'],
    50: ['mentorship_program'],
    75: ['beta_features'],
    100: ['vip_status'],
  };

  const currentLevel = this.level;
  const unlockedFeatures = this.unlockedFeatures.map(uf => uf.feature);

  for (const [level, features] of Object.entries(featureUnlocks)) {
    if (currentLevel >= parseInt(level)) {
      for (const feature of features) {
        if (!unlockedFeatures.includes(feature)) {
          this.unlockedFeatures.push({
            feature,
            unlockedAt: new Date(),
            level: parseInt(level),
          });
        }
      }
    }
  }
};

userSchema.methods.hasFeatureUnlocked = function (feature) {
  return this.unlockedFeatures.some(uf => uf.feature === feature);
};

userSchema.methods.getCurrentStreak = function (streakType) {
  return this.streaks[streakType]?.current || 0;
};

userSchema.methods.getLongestStreak = function (streakType) {
  return this.streaks[streakType]?.longest || 0;
};

userSchema.methods.updateQualityScore = async function (newScore) {
  // Calculate weighted average quality score
  const totalBlogs = this.totalBlogs || 1;
  this.qualityScore = Math.round(((this.qualityScore * (totalBlogs - 1)) + newScore) / totalBlogs);
  await this.save();
};

userSchema.methods.updateEngagementScore = async function () {
  // Calculate engagement score based on various metrics
  const engagementFactors = {
    likes: this.totalLikes * 1,
    comments: this.totalComments * 2,
    bookmarks: this.totalBookmarks * 1.5,
    shares: this.totalShares * 2,
    followers: this.followers.length * 3,
    blogs: this.totalBlogs * 5,
  };

  const totalEngagement = Object.values(engagementFactors).reduce((sum, val) => sum + val, 0);
  const daysActive = Math.max(1, Math.floor((Date.now() - this.createdAt) / (1000 * 60 * 60 * 24)));

  this.engagementScore = Math.round(totalEngagement / daysActive);
  await this.save();
};

userSchema.methods.isFollowing = function (userId) {
  return this.following && this.following.includes(userId);
};

userSchema.methods.isFollowedBy = function (userId) {
  return this.followers && this.followers.includes(userId);
};

userSchema.methods.hasBadge = function (badgeId) {
  return this.badges && this.badges.includes(badgeId);
};

// Static methods
userSchema.statics.findByEmail = function (email) {
  return this.findOne({ email: email.toLowerCase() });
};

userSchema.statics.getLeaderboard = function (type = 'xp', limit = 50) {
  let sortField = 'xp';

  switch (type) {
    case 'blogs':
      sortField = 'blogCount';
      break;
    case 'followers':
      sortField = 'followerCount';
      break;
    case 'engagement':
      sortField = 'engagementScore';
      break;
    default:
      sortField = 'xp';
  }

  return this.find()
    .sort({ [sortField]: -1 })
    .limit(limit);
};

// Database indexes for performance
// 'email' already has unique: true on the field
userSchema.index({ role: 1 });
userSchema.index({ xp: -1 });
userSchema.index({ level: -1 });
userSchema.index({ 'streaks.login.current': -1 });
userSchema.index({ 'streaks.publishing.current': -1 });
userSchema.index({ totalBlogs: -1 });
userSchema.index({ totalLikes: -1 });
userSchema.index({ totalComments: -1 });
userSchema.index({ engagementScore: -1 });
userSchema.index({ qualityScore: -1 });
userSchema.index({ createdAt: -1 });
userSchema.index({ lastLoginAt: -1 });
userSchema.index({ isVerified: 1 });
userSchema.index({ isActive: 1 });
userSchema.index({ 'socialLinks.platform': 1 });
userSchema.index({ 'badges': 1 });
userSchema.index({ 'followers': 1 });
userSchema.index({ 'following': 1 });

// Additional performance indexes
userSchema.index({ email: 1, isVerified: 1 }); // Email verification queries
userSchema.index({ username: 1 }, { unique: true, sparse: true }); // Username uniqueness queries
userSchema.index({ 'aiPreferences.language': 1 }); // Language preference filtering
userSchema.index({ 'aiPreferences.preferredVoice': 1 }); // Voice preference filtering
userSchema.index({ 'privacySettings.profileVisibility': 1 }); // Privacy-based queries
userSchema.index({ 'gamificationSettings.showXP': 1 }); // Gamification preference filtering
userSchema.index({ 'gamificationSettings.showBadges': 1 }); // Badge visibility filtering
userSchema.index({ 'gamificationSettings.showLeaderboard': 1 }); // Leaderboard visibility filtering
userSchema.index({ 'dailyActions.login': 1 }); // Daily login tracking
userSchema.index({ 'dailyActions.blogReads': 1 }); // Daily blog reads tracking
userSchema.index({ 'dailyActions.comments': 1 }); // Daily comments tracking
userSchema.index({ 'dailyActions.shares': 1 }); // Daily shares tracking
userSchema.index({ 'dailyActions.bookmarks': 1 }); // Daily bookmarks tracking
userSchema.index({ 'dailyActions.follows': 1 }); // Daily follows tracking
userSchema.index({ 'dailyActions.invites': 1 }); // Daily invites tracking
userSchema.index({ 'unlockedFeatures.feature': 1 }); // Feature unlock queries
userSchema.index({ 'unlockedFeatures.level': 1 }); // Level-based feature queries
userSchema.index({ 'xpMultipliers.newUser': 1 }); // New user multiplier queries
userSchema.index({ 'xpMultipliers.mentor': 1 }); // Mentor multiplier queries
userSchema.index({ 'xpMultipliers.topContributor': 1 }); // Top contributor queries
userSchema.index({ 'xpMultipliers.betaTester': 1 }); // Beta tester queries
userSchema.index({ 'xpMultipliers.seasonal': 1 }); // Seasonal multiplier queries
userSchema.index({ 'aiUsage.ttsGenerated': 1 }); // TTS usage tracking
userSchema.index({ 'aiUsage.summariesGenerated': 1 }); // Summary usage tracking
userSchema.index({ 'aiUsage.transcriptionsCreated': 1 }); // Transcription usage tracking
userSchema.index({ 'aiUsage.lastAIFeature': 1 }); // Last AI feature usage
userSchema.index({ 'streaks.login.lastLogin': 1 }); // Login streak tracking
userSchema.index({ 'streaks.publishing.lastPublish': 1 }); // Publishing streak tracking
userSchema.index({ 'streaks.reading.lastRead': 1 }); // Reading streak tracking
userSchema.index({ 'streaks.commenting.lastComment': 1 }); // Commenting streak tracking
userSchema.index({ 'streaks.login.longest': -1 }); // Longest login streak
userSchema.index({ 'streaks.publishing.longest': -1 }); // Longest publishing streak
userSchema.index({ 'streaks.reading.longest': -1 }); // Longest reading streak
userSchema.index({ 'streaks.commenting.longest': -1 }); // Longest commenting streak

// Compound indexes for complex queries
userSchema.index({
  role: 1,
  isVerified: 1,
  createdAt: -1
}); // Role + verification + date

userSchema.index({
  level: 1,
  engagementScore: -1,
  createdAt: -1
}); // Level + engagement + date

userSchema.index({
  xp: -1,
  level: 1,
  createdAt: -1
}); // XP + level + date

userSchema.index({
  'streaks.login.current': -1,
  'streaks.login.longest': -1
}); // Current + longest login streak

userSchema.index({
  'streaks.publishing.current': -1,
  'streaks.publishing.longest': -1
}); // Current + longest publishing streak

userSchema.index({
  totalBlogs: -1,
  totalLikes: -1,
  engagementScore: -1
}); // Content + engagement metrics

userSchema.index({
  'aiPreferences.language': 1,
  'aiPreferences.autoSummarize': 1
}); // AI preferences combination

userSchema.index({
  'privacySettings.profileVisibility': 1,
  'privacySettings.showEmail': 1
}); // Privacy settings combination

userSchema.index({
  'gamificationSettings.showXP': 1,
  'gamificationSettings.showLevel': 1,
  'gamificationSettings.showBadges': 1
}); // Gamification settings combination

// Partial indexes for better performance
userSchema.index({
  createdAt: -1
}, {
  partialFilterExpression: { isVerified: true }
}); // Only verified users by date

userSchema.index({
  xp: -1
}, {
  partialFilterExpression: { isVerified: true }
}); // Only verified users by XP

userSchema.index({
  engagementScore: -1
}, {
  partialFilterExpression: { isVerified: true }
}); // Only verified users by engagement

userSchema.index({
  totalBlogs: -1
}, {
  partialFilterExpression: { isVerified: true }
}); // Only verified users by blog count

// Sparse indexes for optional fields
userSchema.index({
  'socialLinks.platform': 1
}, {
  sparse: true
}); // Sparse index for social links

userSchema.index({
  'badges': 1
}, {
  sparse: true
}); // Sparse index for badges

userSchema.index({
  'followers': 1
}, {
  sparse: true
}); // Sparse index for followers

userSchema.index({
  'following': 1
}, {
  sparse: true
}); // Sparse index for following

userSchema.index({
  'unlockedFeatures.feature': 1
}, {
  sparse: true
}); // Sparse index for unlocked features

userSchema.index({
  'aiUsage.lastAIFeature': 1
}, {
  sparse: true
}); // Sparse index for AI usage

// Background index creation for production
if (process.env.NODE_ENV === 'production') {
  userSchema.index({
    role: 1,
    isVerified: 1,
    createdAt: -1
  }, {
    background: true
  });

  userSchema.index({
    level: 1,
    engagementScore: -1,
    createdAt: -1
  }, {
    background: true
  });

  userSchema.index({
    xp: -1,
    level: 1,
    createdAt: -1
  }, {
    background: true
  });
}

module.exports = mongoose.model('User', userSchema);
