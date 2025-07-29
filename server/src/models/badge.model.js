const mongoose = require('mongoose');

const badgeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    icon: { type: String, required: true },
    color: { type: String, default: '#3B82F6' }, // Default blue
    rarity: {
      type: String,
      enum: ['common', 'uncommon', 'rare', 'epic', 'legendary'],
      default: 'common',
    },
    category: {
      type: String,
      enum: ['engagement', 'content', 'social', 'achievement', 'special'],
      default: 'achievement',
    },
    criteria: {
      type: String,
      required: true,
    },
    requirements: {
      xpRequired: { type: Number, default: 0 },
      blogsRequired: { type: Number, default: 0 },
      followersRequired: { type: Number, default: 0 },
      likesRequired: { type: Number, default: 0 },
      commentsRequired: { type: Number, default: 0 },
      daysActiveRequired: { type: Number, default: 0 },
    },
    xpReward: { type: Number, default: 10 },
    isActive: { type: Boolean, default: true },
    isSecret: { type: Boolean, default: false }, // Hidden badges
    createdAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Virtual for total users who have earned this badge
badgeSchema.virtual('earnedCount').get(function () {
  return this.model('User').countDocuments({ badges: this._id });
});

// Static method to get badges by category
badgeSchema.statics.getByCategory = function (category) {
  return this.find({ category, isActive: true }).sort({ rarity: 1, name: 1 });
};

// Static method to get all active badges
badgeSchema.statics.getActive = function () {
  return this.find({ isActive: true }).sort({ rarity: 1, name: 1 });
};

// Static method to check if user qualifies for a badge
badgeSchema.statics.checkUserEligibility = async function (userId) {
  const user = await this.model('User').findById(userId);
  const badges = await this.find({ isActive: true });
  const eligibleBadges = [];

  for (const badge of badges) {
    if (await this.isUserEligibleForBadge(user, badge)) {
      eligibleBadges.push(badge);
    }
  }

  return eligibleBadges;
};

// Static method to check if user is eligible for a specific badge
badgeSchema.statics.isUserEligibleForBadge = async function (user, badge) {
  // Skip if user already has this badge
  if (user.badges.includes(badge._id)) {
    return false;
  }

  const requirements = badge.requirements;

  // Check XP requirement
  if (user.xp < requirements.xpRequired) {
    return false;
  }

  // Check blogs requirement
  const blogCount = await this.model('Blog').countDocuments({
    author: user._id,
    status: 'published',
  });
  if (blogCount < requirements.blogsRequired) {
    return false;
  }

  // Check followers requirement
  if (user.followers.length < requirements.followersRequired) {
    return false;
  }

  // Check likes requirement
  if (user.totalLikes < requirements.likesRequired) {
    return false;
  }

  // Check comments requirement
  if (user.totalComments < requirements.commentsRequired) {
    return false;
  }

  // Check days active requirement
  const daysActive = Math.floor(
    (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24)
  );
  if (daysActive < requirements.daysActiveRequired) {
    return false;
  }

  return true;
};

module.exports = mongoose.model('Badge', badgeSchema);
