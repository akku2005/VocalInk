const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    sessionToken: {
      type: String,
      required: true,
      unique: true,

    },
    refreshToken: {
      type: String,
      required: true,
      index: true,
    },
    deviceInfo: {
      device: { type: String },
      browser: { type: String },
      os: { type: String },
      userAgent: { type: String },
    },
    ipAddress: {
      type: String,
      required: true,
    },
    location: {
      country: { type: String },
      region: { type: String },
      city: { type: String },
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastActivity: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    revokedAt: {
      type: Date,
    },
    loginMethod: {
      type: String,
      enum: ['password', 'google', 'github', '2fa'],
      default: 'password',
    },
  },
  {
    timestamps: true,
  }
);

// Index for cleanup of expired sessions
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

// Index for user session queries
sessionSchema.index({ userId: 1, isActive: 1, expiresAt: 1 });

// Static method to cleanup expired sessions
sessionSchema.statics.cleanupExpiredSessions = async function () {
  try {
    const result = await this.deleteMany({
      $or: [
        { expiresAt: { $lt: new Date() } },
        { isActive: false, revokedAt: { $lt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) } } // 30 days old revoked sessions
      ]
    });
    return result.deletedCount;
  } catch (error) {
    console.error('Error cleaning up expired sessions:', error);
    throw error;
  }
};

// Instance method to extend session
sessionSchema.methods.extend = function (duration = 24 * 60 * 60 * 1000) {
  this.expiresAt = new Date(Date.now() + duration);
  this.lastActivity = new Date();
  return this.save();
};

// Instance method to revoke session
sessionSchema.methods.revoke = function () {
  this.isActive = false;
  this.revokedAt = new Date();
  return this.save();
};

module.exports = mongoose.model('Session', sessionSchema);
