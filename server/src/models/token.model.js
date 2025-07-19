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

module.exports = mongoose.model('Token', tokenSchema); 