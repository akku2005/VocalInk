const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    role: {
      type: String,
      enum: ['reader', 'writer', 'admin'],
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

    // Engagement metrics
    totalLikes: { type: Number, default: 0 },
    totalComments: { type: Number, default: 0 },
    totalBookmarks: { type: Number, default: 0 },
    engagementScore: { type: Number, default: 0 },

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

  // Update level based on XP
  if (this.isModified('xp')) {
    this.level = Math.floor(this.xp / 100) + 1;
  }

  // Update last active
  this.lastActiveAt = new Date();

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
  this.level = Math.floor(this.xp / 100) + 1;
  await this.save();

  // Log XP gain
  console.log(
    `User ${this.email} gained ${amount} XP for: ${reason}. Total XP: ${this.xp}`
  );

  return this.xp;
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

module.exports = mongoose.model('User', userSchema);
