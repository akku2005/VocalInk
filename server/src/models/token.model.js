const crypto = require('crypto');

const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema(
  {
    tokenHash: { type: String, required: true, unique: true },
    type: {
      type: String,
      enum: ['auth', 'refresh', 'verification', 'reset', 'access'],
      required: true,
    },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    expiresAt: { type: Date, required: true },
    revoked: { type: Boolean, default: false },
    lastUsedAt: { type: Date, default: Date.now },
    code: { type: String }, // For verification tokens
  },
  { timestamps: true }
);

tokenSchema.methods.revoke = function () {
  this.revoked = true;
  return this.save();
};

tokenSchema.methods.updateLastUsed = function () {
  this.lastUsedAt = new Date();
  return this.save();
};

tokenSchema.statics.revokeAllUserTokens = function (userId) {
  return this.updateMany({ user: userId }, { revoked: true });
};

tokenSchema.statics.revokeAllUserTokensByType = function (userId, type) {
  return this.updateMany({ user: userId, type }, { revoked: true });
};

// Add method to blacklist access tokens
tokenSchema.statics.blacklistAccessToken = async function (tokenHash, userId) {
  return this.create({
    tokenHash,
    type: 'access',
    user: userId,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    revoked: true,
  });
};

// Add method to check if access token is blacklisted
tokenSchema.statics.isAccessTokenBlacklisted = async function (tokenHash) {
  const blacklistedToken = await this.findOne({
    tokenHash,
    type: 'access',
    revoked: true,
  });
  return !!blacklistedToken;
};

// Add method to clean up expired blacklisted tokens
tokenSchema.statics.cleanupExpiredBlacklistedTokens = async function () {
  const result = await this.deleteMany({
    type: 'access',
    revoked: true,
    expiresAt: { $lt: new Date() },
  });
  return result.deletedCount;
};

tokenSchema.statics.generateVerificationToken = async function (user, code) {
  // Generate a secure random token
  const rawToken = crypto.randomBytes(32).toString('hex');
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  const expiresAt = Date.now() + 10 * 60 * 1000; // 10 minutes
  await this.create({
    tokenHash: tokenHash,
    type: 'verification',
    user: user._id,
    expiresAt: expiresAt,
    code: code, // Store the code
  });
  return { token: rawToken };
};

tokenSchema.statics.findByToken = async function (rawToken) {
  const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
  return this.findOne({
    tokenHash,
    revoked: false,
    type: 'verification',
    expiresAt: { $gt: new Date() },
  });
};

tokenSchema.methods.isExpired = function () {
  return this.expiresAt < new Date();
};

tokenSchema.methods.verifyCode = function (inputCode) {
  return this.code && inputCode && this.code === inputCode;
};

module.exports = mongoose.model('Token', tokenSchema);
