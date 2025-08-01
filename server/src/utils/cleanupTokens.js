const Token = require('../models/token.model');
const logger = require('./logger');

/**
 * Clean up expired blacklisted tokens
 * This should be run periodically (e.g., daily) to prevent database bloat
 */
const cleanupExpiredBlacklistedTokens = async () => {
  try {
    const deletedCount = await Token.cleanupExpiredBlacklistedTokens();
    logger.info(`Cleaned up ${deletedCount} expired blacklisted tokens`);
    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired blacklisted tokens:', error);
    throw error;
  }
};

/**
 * Clean up all expired tokens (not just blacklisted ones)
 */
const cleanupAllExpiredTokens = async () => {
  try {
    const result = await Token.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    logger.info(`Cleaned up ${result.deletedCount} expired tokens`);
    return result.deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired tokens:', error);
    throw error;
  }
};

module.exports = {
  cleanupExpiredBlacklistedTokens,
  cleanupAllExpiredTokens,
}; 