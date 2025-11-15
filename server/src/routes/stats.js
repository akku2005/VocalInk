const express = require('express');
const router = express.Router();
const statsController = require('../controllers/statsController');
const { apiLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting
router.use(apiLimiter);

/**
 * @route   GET /api/stats
 * @desc    Get platform-wide statistics
 * @access  Public
 */
router.get('/', statsController.getPlatformStats);

/**
 * @route   GET /api/stats/analytics
 * @desc    Get detailed analytics
 * @access  Public
 */
router.get('/analytics', statsController.getAnalytics);

module.exports = router;
