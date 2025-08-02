const express = require('express');
const { body, query, validationResult } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { 
  aiRateLimiter, 
  recommendationRateLimiter,
  searchRateLimiter,
  notificationRateLimiter
} = require('../middleware/aiRateLimiter');
const aiEnhancedController = require('./ai-enhanced.controller');

// Validation middleware
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      message: 'Validation failed',
      errors: errors.array() 
    });
  }
  next();
}

// ===== RECOMMENDATION ROUTES =====

// Get personalized recommendations
router.get(
  '/recommendations',
  protect,
  recommendationRateLimiter,
  [
    query('contentType').optional().isIn(['blogs', 'series', 'all']),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('includeTrending').optional().isBoolean()
  ],
  validate,
  aiEnhancedController.getRecommendations
);

// Get trending content
router.get(
  '/trending',
  protect,
  recommendationRateLimiter,
  [
    query('limit').optional().isInt({ min: 1, max: 20 }),
    query('timeframe').optional().isIn(['1h', '24h', '7d', '30d'])
  ],
  validate,
  aiEnhancedController.getTrendingContent
);

// Get similar content
router.get(
  '/similar',
  protect,
  recommendationRateLimiter,
  [
    query('contentId').optional().isMongoId(),
    query('contentType').optional().isIn(['blogs', 'series']),
    query('limit').optional().isInt({ min: 1, max: 20 })
  ],
  validate,
  aiEnhancedController.getSimilarContent
);

// ===== MODERATION ROUTES =====

// Screen content for moderation
router.post(
  '/moderation/screen',
  protect,
  aiRateLimiter,
  [
    body('content').isString().isLength({ min: 1, max: 10000 }),
    body('contentType').optional().isIn(['blog', 'comment', 'series']),
    body('options').optional().isObject()
  ],
  validate,
  aiEnhancedController.screenContent
);

// Moderate comment in real-time
router.post(
  '/moderation/comment',
  protect,
  aiRateLimiter,
  [
    body('comment').isString().isLength({ min: 1, max: 1000 }),
    body('context').optional().isObject()
  ],
  validate,
  aiEnhancedController.moderateComment
);

// Get moderation statistics (admin only)
router.get(
  '/moderation/stats',
  protect,
  [
    query('timeframe').optional().isIn(['7d', '30d', '90d'])
  ],
  validate,
  aiEnhancedController.getModerationStats
);

// ===== SEARCH ROUTES =====

// Perform semantic search
router.get(
  '/search/semantic',
  protect,
  searchRateLimiter,
  [
    query('query').isString().isLength({ min: 2, max: 200 }),
    query('contentType').optional().isIn(['blogs', 'series', 'users', 'all']),
    query('limit').optional().isInt({ min: 1, max: 50 }),
    query('filters').optional().isJSON(),
    query('includeSimilar').optional().isBoolean()
  ],
  validate,
  aiEnhancedController.semanticSearch
);

// Auto-generate tags for content
router.post(
  '/search/auto-tag',
  protect,
  aiRateLimiter,
  [
    body('content').isString().isLength({ min: 10, max: 50000 }),
    body('contentType').optional().isIn(['blog', 'series', 'comment'])
  ],
  validate,
  aiEnhancedController.autoTagContent
);

// Find similar content
router.get(
  '/search/similar',
  protect,
  searchRateLimiter,
  [
    query('query').isString().isLength({ min: 1, max: 200 }),
    query('limit').optional().isInt({ min: 1, max: 20 })
  ],
  validate,
  aiEnhancedController.findSimilarContent
);

// Cluster content by similarity
router.get(
  '/search/cluster',
  protect,
  searchRateLimiter,
  [
    query('contentType').optional().isIn(['blogs', 'series']),
    query('limit').optional().isInt({ min: 10, max: 500 }),
    query('minClusterSize').optional().isInt({ min: 2, max: 20 })
  ],
  validate,
  aiEnhancedController.clusterContent
);

// ===== NOTIFICATION ROUTES =====

// Predict optimal notification timing
router.post(
  '/notifications/predict-timing',
  protect,
  notificationRateLimiter,
  [
    body('notificationType').optional().isString(),
    body('timezone').optional().isString(),
    body('urgency').optional().isIn(['low', 'normal', 'high']),
    body('contentType').optional().isString()
  ],
  validate,
  aiEnhancedController.predictNotificationTiming
);

// Personalize notification
router.post(
  '/notifications/personalize',
  protect,
  notificationRateLimiter,
  [
    body('template').isObject(),
    body('template.title').isString().isLength({ min: 1, max: 200 }),
    body('template.content').isString().isLength({ min: 1, max: 2000 }),
    body('notificationType').optional().isString(),
    body('includePersonalization').optional().isBoolean(),
    body('includeRecommendations').optional().isBoolean()
  ],
  validate,
  aiEnhancedController.personalizeNotification
);

// Predict notification engagement
router.post(
  '/notifications/predict-engagement',
  protect,
  notificationRateLimiter,
  [
    body('notificationData').isObject(),
    body('notificationData.title').isString(),
    body('notificationData.content').isString(),
    body('notificationType').optional().isString(),
    body('includeUserHistory').optional().isBoolean(),
    body('includeContentAnalysis').optional().isBoolean()
  ],
  validate,
  aiEnhancedController.predictNotificationEngagement
);

// Generate smart summaries
router.post(
  '/notifications/summaries',
  protect,
  aiRateLimiter,
  [
    body('content').isString().isLength({ min: 10, max: 10000 }),
    body('maxLength').optional().isInt({ min: 50, max: 1000 }),
    body('style').optional().isIn(['concise', 'detailed', 'bullet']),
    body('includeKeyPoints').optional().isBoolean(),
    body('includeActionItems').optional().isBoolean()
  ],
  validate,
  aiEnhancedController.generateSmartSummaries
);

// Send intelligent notification
router.post(
  '/notifications/send',
  protect,
  notificationRateLimiter,
  [
    body('notificationData').isObject(),
    body('notificationData.title').isString(),
    body('notificationData.content').isString(),
    body('predictTiming').optional().isBoolean(),
    body('personalize').optional().isBoolean(),
    body('predictEngagement').optional().isBoolean(),
    body('includeSummary').optional().isBoolean()
  ],
  validate,
  aiEnhancedController.sendIntelligentNotification
);

// ===== UTILITY ROUTES =====

// Get AI service status
router.get(
  '/status',
  protect,
  aiEnhancedController.getAIStatus
);

// Get AI analytics (admin only)
router.get(
  '/analytics',
  protect,
  [
    query('timeframe').optional().isIn(['7d', '30d', '90d'])
  ],
  validate,
  aiEnhancedController.getAIAnalytics
);

module.exports = router; 