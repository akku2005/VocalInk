const crypto = require('crypto');
const Token = require('../models/token.model');
const logger = require('../utils/logger');
const { UnauthorizedError } = require('../utils/errors');

class TokenService {
  static async generateAuthToken(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
    await Token.create({ tokenHash, type: 'auth', user: userId, expiresAt });
    return token;
  }

  static async generateRefreshToken(userId) {
    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
    await Token.create({ tokenHash, type: 'refresh', user: userId, expiresAt });
    return token;
  }

  static async generateVerificationToken(userId, code) {
    const tokenHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await Token.create({ tokenHash, type: 'verification', user: userId, expiresAt });
    return code;
  }

  static async verifyVerificationToken(userId, code) {
    const tokenHash = crypto.createHash('sha256').update(code).digest('hex');
    const tokenRecord = await Token.findOne({ tokenHash, type: 'verification', user: userId, revoked: false });
    if (!tokenRecord) return false;
    if (tokenRecord.expiresAt < new Date()) return false;
    await tokenRecord.revoke();
    return true;
  }

  static async generateResetToken(userId, code) {
    const tokenHash = crypto.createHash('sha256').update(code).digest('hex');
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await Token.create({ tokenHash, type: 'reset', user: userId, expiresAt });
    return code;
  }

  static async verifyResetToken(userId, code) {
    const tokenHash = crypto.createHash('sha256').update(code).digest('hex');
    const tokenRecord = await Token.findOne({ tokenHash, type: 'reset', user: userId, revoked: false });
    if (!tokenRecord) return false;
    if (tokenRecord.expiresAt < new Date()) return false;
    await tokenRecord.revoke();
    return true;
  }

  static async generateTokens(user) {
    const authToken = await this.generateAuthToken(user._id);
    const refreshToken = await this.generateRefreshToken(user._id);
    return {
      accessToken: authToken,
      refreshToken: refreshToken
    };
  }

  static async verifyToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenRecord = await Token.findOne({ tokenHash });
    if (!tokenRecord) throw new UnauthorizedError('Invalid token');
    if (tokenRecord.revoked) throw new UnauthorizedError('Token has been revoked');
    if (tokenRecord.expiresAt < new Date()) throw new UnauthorizedError('Token has expired');
    await tokenRecord.updateLastUsed();
    return { userId: tokenRecord.user, type: tokenRecord.type };
  }

  static async revokeToken(token) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const tokenRecord = await Token.findOne({ tokenHash });
    if (!tokenRecord) throw new UnauthorizedError('Token not found');
    await tokenRecord.revoke();
  }

  static async revokeAllUserTokens(userId) {
    await Token.revokeAllUserTokens(userId);
  }

  static async revokeAllUserTokensByType(userId, type) {
    await Token.revokeAllUserTokensByType(userId, type);
  }
}

module.exports = TokenService; 