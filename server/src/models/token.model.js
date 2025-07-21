const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  tokenHash: { type: String, required: true, unique: true },
  type: { type: String, enum: ['auth', 'refresh', 'verification', 'reset'], required: true },
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
  revoked: { type: Boolean, default: false },
  lastUsedAt: { type: Date, default: Date.now },
}, { timestamps: true });

tokenSchema.methods.revoke = function() {
  this.revoked = true;
  return this.save();
};

tokenSchema.methods.updateLastUsed = function() {
  this.lastUsedAt = new Date();
  return this.save();
};

tokenSchema.statics.revokeAllUserTokens = function(userId) {
  return this.updateMany({ user: userId }, { revoked: true });
};

tokenSchema.statics.revokeAllUserTokensByType = function(userId, type) {
  return this.updateMany({ user: userId, type }, { revoked: true });
};

tokenSchema.statics.generateVerificationToken = async function(user, code) {
  // Generate a unique token hash (could use code or a random string)
  const tokenHash = code + '-' + Date.now();
  const token = await this.create({
    tokenHash: tokenHash,
    type: 'verification',
    user: user._id,
    expiresAt: Date.now() + 10 * 60 * 1000 // 10 minutes
  });
  return { token: token.tokenHash };
};

tokenSchema.statics.findByToken = async function(tokenHash) {
  return this.findOne({
    tokenHash,
    revoked: false,
    type: 'verification',
    expiresAt: { $gt: new Date() }
  });
};

tokenSchema.methods.isExpired = function() {
  return this.expiresAt < new Date();
};

tokenSchema.methods.verifyCode = function(code) {
  // The code is the part before the dash in tokenHash
  return this.tokenHash.split('-')[0] === code;
};

module.exports = mongoose.model('Token', tokenSchema); 