const Token = require('../models/token.model');
const logger = require('./logger');
const mongoose = require('mongoose');

/**
 * Clean up expired blacklisted tokens
 * This should be run periodically (e.g., daily) to prevent database bloat
 */
const cleanupExpiredBlacklistedTokens = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      logger.warn('Skipping cleanup of expired blacklisted tokens: database not connected');
      return 0;
    }
    const deletedCount = await Token.cleanupExpiredBlacklistedTokens();
    logger.production.info(`Cleaned up ${deletedCount} expired blacklisted tokens`);
    return deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired blacklisted tokens:', { message: error.message, name: error.name, code: error.code });
    throw error;
  }
};

/**
 * Clean up all expired tokens (not just blacklisted ones)
 */
const cleanupAllExpiredTokens = async () => {
  try {
    if (mongoose.connection.readyState !== 1) {
      logger.warn('Skipping cleanup of expired tokens: database not connected');
      return 0;
    }
    const result = await Token.deleteMany({
      expiresAt: { $lt: new Date() },
    });
    logger.production.info(`Cleaned up ${result.deletedCount} expired tokens`);
    return result.deletedCount;
  } catch (error) {
    logger.error('Error cleaning up expired tokens:', { message: error.message, name: error.name, code: error.code });
    throw error;
  }
};

module.exports = {
  cleanupExpiredBlacklistedTokens,
  cleanupAllExpiredTokens,
}; 