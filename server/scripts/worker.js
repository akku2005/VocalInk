const dotenv = require('dotenv');
dotenv.config();

const { connectDB } = require('../src/config/connectDB');
const { cleanupExpiredBlacklistedTokens } = require('../src/utils/cleanupTokens');
const logger = require('../src/utils/logger');

(async () => {
  try {
    const conn = await connectDB();
    if (!conn) {
      logger.error('Worker: database not connected. Exiting with code 1');
      process.exit(1);
    }

    logger.info('Worker: starting scheduled jobs');

    // Run cleanup immediately
    await cleanupExpiredBlacklistedTokens();

    // Schedule periodic cleanup (every 24 hours)
    setInterval(async () => {
      try {
        await cleanupExpiredBlacklistedTokens();
      } catch (err) {
        logger.error('Worker: scheduled cleanup failed', { message: err.message });
      }
    }, 24 * 60 * 60 * 1000);

  } catch (err) {
    logger.error('Worker initialization error', { message: err.message });
    process.exit(1);
  }
})(); 