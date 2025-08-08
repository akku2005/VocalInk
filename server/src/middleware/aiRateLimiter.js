const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');
const logger = require('../utils/logger');
const cacheService = require('../services/CacheService');
let RedisStore;
try { RedisStore = require('rate-limit-redis').default || require('rate-limit-redis'); } catch (e) { RedisStore = null; }

const getStore = () => (RedisStore && cacheService.redisClient ? new RedisStore({
  sendCommand: (...args) => cacheService.redisClient.sendCommand(args)
}) : undefined);

// Helper to generate a consistent key that includes a safe IPv6-aware IP
const defaultKeyGenerator = (req) => {
  const userKey = req.user ? req.user.id : 'anonymous';
  const userAgent = req.get('User-Agent') || 'unknown';
  return `${ipKeyGenerator(req)}:${userKey}:${userAgent}`;
};

// AI-specific rate limiters
const aiRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.AI_RATE_LIMIT_PER_HOUR || 100,
  store: getStore(),
  message: {
    message: 'AI service rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(60 * 60 / 1000) // 1 hour in seconds
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: defaultKeyGenerator,
  handler: (req, res) => {
    logger.warn('AI rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
    
    res.status(429).json({
      message: 'AI service rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(60 * 60 / 1000)
    });
  }
});

// TTS-specific rate limiter
const ttsRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.TTS_RATE_LIMIT_PER_HOUR || 50,
  store: getStore(),
  message: {
    message: 'TTS generation rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(60 * 60 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: defaultKeyGenerator,
  handler: (req, res) => {
    logger.warn('TTS rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
    
    res.status(429).json({
      message: 'TTS generation rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(60 * 60 / 1000)
    });
  }
});

// STT-specific rate limiter
const sttRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.STT_RATE_LIMIT_PER_HOUR || 30,
  store: getStore(),
  message: {
    message: 'STT transcription rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(60 * 60 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: defaultKeyGenerator,
  handler: (req, res) => {
    logger.warn('STT rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
    
    res.status(429).json({
      message: 'STT transcription rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(60 * 60 / 1000)
    });
  }
});

// Summary generation rate limiter
const summaryRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.SUMMARY_RATE_LIMIT_PER_HOUR || 100,
  store: getStore(),
  message: {
    message: 'Summary generation rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(60 * 60 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: defaultKeyGenerator,
  handler: (req, res) => {
    logger.warn('Summary rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
    
    res.status(429).json({
      message: 'Summary generation rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(60 * 60 / 1000)
    });
  }
});

// Analysis rate limiter
const analysisRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.ANALYSIS_RATE_LIMIT_PER_HOUR || 200,
  store: getStore(),
  message: {
    message: 'Content analysis rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(60 * 60 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: defaultKeyGenerator,
  handler: (req, res) => {
    logger.warn('Analysis rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
    
    res.status(429).json({
      message: 'Content analysis rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(60 * 60 / 1000)
    });
  }
});

// File upload rate limiter
const fileUploadRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.FILE_UPLOAD_RATE_LIMIT_PER_HOUR || 20,
  store: getStore(),
  message: {
    message: 'File upload rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(60 * 60 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: defaultKeyGenerator,
  handler: (req, res) => {
    logger.warn('File upload rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
    
    res.status(429).json({
      message: 'File upload rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(60 * 60 / 1000)
    });
  }
});

// ===== ENHANCED AI RATE LIMITERS =====

// Recommendation rate limiter
const recommendationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.RECOMMENDATION_RATE_LIMIT_PER_HOUR || 150,
  store: getStore(),
  message: {
    message: 'Recommendation service rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(60 * 60 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: defaultKeyGenerator,
  handler: (req, res) => {
    logger.warn('Recommendation rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
    
    res.status(429).json({
      message: 'Recommendation service rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(60 * 60 / 1000)
    });
  }
});

// Search rate limiter
const searchRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.SEARCH_RATE_LIMIT_PER_HOUR || 300,
  store: getStore(),
  message: {
    message: 'Search service rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(60 * 60 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: defaultKeyGenerator,
  handler: (req, res) => {
    logger.warn('Search rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
    
    res.status(429).json({
      message: 'Search service rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(60 * 60 / 1000)
    });
  }
});

// Notification rate limiter
const notificationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.NOTIFICATION_RATE_LIMIT_PER_HOUR || 100,
  store: getStore(),
  message: {
    message: 'Notification service rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(60 * 60 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: defaultKeyGenerator,
  handler: (req, res) => {
    logger.warn('Notification rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
    
    res.status(429).json({
      message: 'Notification service rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(60 * 60 / 1000)
    });
  }
});

// Moderation rate limiter
const moderationRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.MODERATION_RATE_LIMIT_PER_HOUR || 200,
  store: getStore(),
  message: {
    message: 'Moderation service rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(60 * 60 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: defaultKeyGenerator,
  handler: (req, res) => {
    logger.warn('Moderation rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
    
    res.status(429).json({
      message: 'Moderation service rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(60 * 60 / 1000)
    });
  }
});

// Content clustering rate limiter
const clusteringRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.CLUSTERING_RATE_LIMIT_PER_HOUR || 50,
  store: getStore(),
  message: {
    message: 'Content clustering rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(60 * 60 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: defaultKeyGenerator,
  handler: (req, res) => {
    logger.warn('Clustering rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
    
    res.status(429).json({
      message: 'Content clustering rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(60 * 60 / 1000)
    });
  }
});

// Auto-tagging rate limiter
const autoTaggingRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: process.env.AUTO_TAGGING_RATE_LIMIT_PER_HOUR || 80,
  store: getStore(),
  message: {
    message: 'Auto-tagging service rate limit exceeded. Please try again later.',
    retryAfter: Math.ceil(60 * 60 / 1000)
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: defaultKeyGenerator,
  handler: (req, res) => {
    logger.warn('Auto-tagging rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id
    });
    
    res.status(429).json({
      message: 'Auto-tagging service rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(60 * 60 / 1000)
    });
  }
});

module.exports = {
  aiRateLimiter,
  ttsRateLimiter,
  sttRateLimiter,
  summaryRateLimiter,
  analysisRateLimiter,
  fileUploadRateLimiter,
  recommendationRateLimiter,
  searchRateLimiter,
  notificationRateLimiter,
  moderationRateLimiter,
  clusteringRateLimiter,
  autoTaggingRateLimiter
}; 