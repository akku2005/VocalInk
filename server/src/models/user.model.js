const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
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
    profilePicture: { type: String },
    avatar: { type: String },

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

    // Security & Account protection
    failedLoginAttempts: { type: Number, default: 0 },
    lockoutUntil: { type: Date, default: null },
    lastLoginAt: { type: Date },
    lastActiveAt: { type: Date },

    // AI preferences
    aiPreferences: {
      preferredVoice: { type: String, default: 'default' },
      autoSummarize: { type: Boolean, default: true },
      speechToText: { type: Boolean, default: false },
      language: { type: String, default: 'en' }
    },
    
    // AI usage tracking
    aiUsage: {
      ttsGenerated: { type: Number, default: 0 },
      summariesGenerated: { type: Number, default: 0 },
      transcriptionsCreated: { type: Number, default: 0 },
      lastAIFeature: { type: Date }
    },
    
    // Preferences
    emailNotifications: { type: Boolean, default: true },
    pushNotifications: { type: Boolean, default: true },
    privacySettings: {
      profileVisibility: {
        type: String,
        enum: ['public', 'followers', 'private'],
        default: 'public',
      },
      showEmail: { type: Boolean, default: false },
      showLastActive: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

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

module.exports = mongoose.model('User', userSchema);
