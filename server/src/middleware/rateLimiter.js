const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const cacheService = require('../services/CacheService');
const { StatusCodes } = require('http-status-codes');

let RedisStore;
try {
  RedisStore = require('rate-limit-redis').default || require('rate-limit-redis');
} catch (e) {
  logger.warn('rate-limit-redis not found, falling back to memory store');
  RedisStore = null;
}

/**
 * Rate Limiting Configuration
 * 
 * Production vs Development:
 * - Development: Limits are 5x higher and windows are shorter for easier testing.
 * - Production: Strict limits applied based on user roles.
 * 
 * Key Features:
 * - Redis Support: Uses Redis for distributed rate limiting if available.
 * - Role-Based: Different limits for Admin, Writer, Reader, and Anonymous.
 * - Standard Headers: Returns RateLimit-* headers (Draft 7).
 * - No "Stuck" Blocks: Blocked requests do NOT reset the window.
 */

// Robust IP extraction
const getClientIp = (req) => {
  return (
    req.headers['x-forwarded-for']?.split(',').shift() ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
};

// Standard Key Generator: IP for anonymous, UserID for authenticated
const standardKeyGenerator = (req) => {
  if (req.user && req.user.id) {
    return `user:${req.user.id}`;
  }
  return `ip:${getClientIp(req)}`;
};

// Get Store (Redis or Memory)
function getStore() {
  if (RedisStore && cacheService.redisClient && cacheService.redisClient.isOpen) {
    return new RedisStore({
      sendCommand: (...args) => cacheService.redisClient.sendCommand(args),
    });
  }
  return undefined; // Defaults to MemoryStore
}

// Factory function for creating rate limiters
const createLimiter = (options) => {
  // 1. Bypass for Test Environment
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }

  const isDev = process.env.NODE_ENV === 'development';

  // 2. Adjust limits for Development
  const max = isDev ? (options.max * 5) : options.max;
  const windowMs = isDev ? Math.min(options.windowMs, 5 * 60 * 1000) : options.windowMs;

  return rateLimit({
    windowMs,
    max,
    store: getStore(),
    keyGenerator: options.keyGenerator || standardKeyGenerator,
    standardHeaders: true, // Return RateLimit-* headers
    legacyHeaders: false, // Disable X-RateLimit-* headers
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,

    // Custom Handler for consistent error responses
    handler: (req, res, next, options) => {
      logger.warn(`Rate limit exceeded: ${options.message}`, {
        ip: getClientIp(req),
        userId: req.user?.id || 'anonymous',
        url: req.originalUrl,
        limit: options.max,
        windowMs: options.windowMs
      });

      res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        success: false,
        message: typeof options.message === 'string' ? options.message : 'Too many requests, please try again later.',
        retryAfter: Math.ceil(options.windowMs / 1000),
        error: {
          code: 'RATE_LIMIT_EXCEEDED',
          details: `Limit of ${options.max} requests per ${Math.round(options.windowMs / 1000 / 60)} minutes exceeded.`
        }
      });
    },

    // Custom message (used by default handler if not overridden, but we override handler above)
    message: options.message || 'Too many requests, please try again later.',
  });
};

// --- PRE-CONFIGURED LIMITERS ---

// 1. Global API Limiter (Baseline protection)
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // 300 requests per 15m (generous baseline)
  message: 'Too many requests to the API.',
});

// 2. Auth Limiter (Login/Register - Strict)
const authLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // 20 attempts per 15m
  skipSuccessfulRequests: true, // Don't count successful logins
  message: 'Too many login/register attempts. Please try again later.',
  keyGenerator: (req) => {
    // Limit by IP AND Email to prevent brute force on specific accounts
    const ip = getClientIp(req);
    const email = req.body.email || '';
    return `auth:${ip}:${email}`;
  }
});

// 3. Sensitive Operations (Password Reset, etc.)
const sensitiveLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
  message: 'Too many sensitive operations. Please try again in an hour.',
});

// 4. Tier-Based Limiter (For heavy endpoints like AI generation)
const tierLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  standardHeaders: true,
  legacyHeaders: false,
  store: getStore(),
  keyGenerator: standardKeyGenerator,
  max: (req) => {
    const user = req.user;
    if (!user) return 50; // Anonymous

    switch (user.role) {
      case 'admin': return 1000;
      case 'writer': return 200;
      case 'reader': return 100;
      default: return 50;
    }
  },
  handler: (req, res, next, options) => {
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: 'Rate limit exceeded for your plan.',
      retryAfter: Math.ceil(options.windowMs / 1000),
    });
  }
});

// 5. Upload Limiter
const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 20,
  message: 'Upload limit exceeded.',
});

module.exports = {
  createLimiter,
  apiLimiter,
  authLimiter,
  sensitiveLimiter,
  tierLimiter,
  uploadLimiter,

  // Aliases for backward compatibility
  loginLimiter: authLimiter,
  registerLimiter: authLimiter,
  passwordResetLimiter: sensitiveLimiter,
  verificationLimiter: authLimiter,
  adminApiLimiter: tierLimiter,
  smartRateLimit: tierLimiter,
  adaptiveRateLimiter: tierLimiter,
  burstRateLimiter: apiLimiter,
  exportLimiter: sensitiveLimiter,
  searchLimiter: apiLimiter,
  sensitiveOperationLimiter: sensitiveLimiter
};
