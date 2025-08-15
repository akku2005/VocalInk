const rateLimit = require('express-rate-limit');
const logger = require('../utils/logger');
const cacheService = require('../services/CacheService');
let RedisStore;
try { RedisStore = require('rate-limit-redis').default || require('rate-limit-redis'); } catch (e) { RedisStore = null; }

// Custom IP key generator function
const ipKeyGenerator = (req) => {
  // Get the real IP address considering proxies
  const ip = req.ip || 
             req.connection?.remoteAddress || 
             req.socket?.remoteAddress || 
             req.connection?.socket?.remoteAddress || 
             'unknown';
  return ip;
};

// Custom function to get client IP (fallback)
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',').shift() ||
    req.socket?.remoteAddress ||
    req.ip ||
    ''
  );
}

function getStore() {
  if (RedisStore && cacheService.redisClient) {
    return new RedisStore({
      sendCommand: (...args) => cacheService.redisClient.sendCommand(args)
    });
  }
  return undefined; // default memory store
}

// Enhanced rate limiter configuration with adaptive thresholds
const createLimiter = (options) => {
  // Disable rate limiting in test environment
  if (process.env.NODE_ENV === 'test') {
    return (req, res, next) => next();
  }
  
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    store: getStore(),
    message: {
      success: false,
      message: options.message,
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: (req) => {
      // Use a safe IP extraction method with user ID for better rate limiting
      const ip = ipKeyGenerator(req);
      const userKey = req.user ? req.user.id : 'anonymous';
      const key = [
        ip,
        req.headers['user-agent'],
        userKey,
        options.additionalKey ? options.additionalKey(req) : '',
      ]
        .filter(Boolean)
        .join(':');
      return key;
    },
    handler: (req, res) => {
      const rateLimitInfo = req.rateLimit;
      
      logger.warn('Rate limit exceeded', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user?.id || 'anonymous',
        userRole: req.user?.role || 'anonymous',
        url: req.originalUrl,
        method: req.method,
        rateLimitInfo: {
          current: rateLimitInfo.current,
          limit: rateLimitInfo.limit,
          remaining: rateLimitInfo.remaining,
          resetTime: rateLimitInfo.resetTime,
        },
      });

      res.status(429).json({
        success: false,
        message: options.message,
        retryAfter: res.getHeader('Retry-After'),
        requiresCaptcha: rateLimitInfo.current >= 3,
        rateLimitInfo: {
          current: rateLimitInfo.current,
          limit: rateLimitInfo.limit,
          remaining: rateLimitInfo.remaining,
          resetTime: rateLimitInfo.resetTime,
        },
      });
    },
  });
};

// Tier-based rate limiting with dynamic limits
const tierRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    const user = req.user;
    if (!user) return parseInt(process.env.ANONYMOUS_RATE_LIMIT_MAX) || 50;
    
    switch (user.role) {
      case 'admin': return parseInt(process.env.ADMIN_RATE_LIMIT_MAX) || 500;
      case 'writer': return parseInt(process.env.WRITER_RATE_LIMIT_MAX) || 200;
      case 'reader': return parseInt(process.env.READER_RATE_LIMIT_MAX) || 100;
      default: return parseInt(process.env.ANONYMOUS_RATE_LIMIT_MAX) || 50;
    }
  },
  store: getStore(),
  keyGenerator: (req) => (req.user ? req.user.id : ipKeyGenerator(req)),
  handler: (req, res) => {
    const rateLimitInfo = req.rateLimit;
    
    logger.warn('Tier rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
      role: req.user?.role || 'anonymous',
      url: req.originalUrl,
      method: req.method,
      rateLimitInfo: {
        current: rateLimitInfo.current,
        limit: rateLimitInfo.limit,
        remaining: rateLimitInfo.remaining,
        resetTime: rateLimitInfo.resetTime,
      },
    });
    
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded for your tier. Please try again later.',
      retryAfter: Math.ceil(15 * 60 / 1000),
      requiresCaptcha: rateLimitInfo.current >= 3,
      rateLimitInfo: {
        current: rateLimitInfo.current,
        limit: rateLimitInfo.limit,
        remaining: rateLimitInfo.remaining,
        resetTime: rateLimitInfo.resetTime,
      },
    });
  },
});

// Adaptive rate limiting based on user behavior
const adaptiveRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    const user = req.user;
    
    // Base limits
    let baseLimit = 100;
    
    if (user) {
      switch (user.role) {
        case 'admin': baseLimit = 500; break;
        case 'writer': baseLimit = 200; break;
        case 'reader': baseLimit = 100; break;
        default: baseLimit = 50; break;
      }
      
      // Reduce limits for suspicious behavior
      if (user.failedLoginAttempts > 5) {
        baseLimit = Math.floor(baseLimit * 0.5);
      }
      
      // Increase limits for trusted users
      if (user.isVerified && user.lastLoginAt) {
        const daysSinceLastLogin = (Date.now() - user.lastLoginAt) / (1000 * 60 * 60 * 24);
        if (daysSinceLastLogin < 7) {
          baseLimit = Math.floor(baseLimit * 1.2);
        }
      }
    } else {
      // Anonymous users get lower limits
      baseLimit = 50;
    }
    
    return baseLimit;
  },
  store: getStore(),
  keyGenerator: (req) => (req.user ? req.user.id : ipKeyGenerator(req)),
  handler: (req, res) => {
    const rateLimitInfo = req.rateLimit;
    
    logger.warn('Adaptive rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
      role: req.user?.role || 'anonymous',
      url: req.originalUrl,
      method: req.method,
      rateLimitInfo: {
        current: rateLimitInfo.current,
        limit: rateLimitInfo.limit,
        remaining: rateLimitInfo.remaining,
        resetTime: rateLimitInfo.resetTime,
      },
    });
    
    res.status(429).json({
      success: false,
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter: Math.ceil(15 * 60 / 1000),
      requiresCaptcha: rateLimitInfo.current >= 3,
      rateLimitInfo: {
        current: rateLimitInfo.current,
        limit: rateLimitInfo.limit,
        remaining: rateLimitInfo.remaining,
        resetTime: rateLimitInfo.resetTime,
      },
    });
  },
});

// Login rate limiter - More strict with progressive delays
const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true,
  additionalKey: (req) => req.body.email, // Rate limit by email too
});

// Register rate limiter with enhanced security
const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per window
  message: 'Too many registration attempts, please try again after 1 hour',
  skipSuccessfulRequests: true,
  additionalKey: (req) => req.body.email, // Rate limit by email
});

// Password reset rate limiter with enhanced security
const passwordResetLimiter = createLimiter({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 3, // 3 attempts per window
  message: 'Too many password reset attempts, please try again after 30 minutes',
  skipSuccessfulRequests: true,
  additionalKey: (req) => req.body.email,
});

// Verification code rate limiter with enhanced security
const verificationLimiter = createLimiter({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 5, // 5 attempts per window
  message: 'Too many verification attempts, please try again after 1 minute',
  skipSuccessfulRequests: true,
  additionalKey: (req) => req.body.email,
});

// Global API rate limiter - More granular with tier support
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    const user = req.user;
    if (!user) return 100; // Anonymous users
    
    switch (user.role) {
      case 'admin': return 500;
      case 'writer': return 200;
      case 'reader': return 100;
      default: return 100;
    }
  },
  message: 'Too many requests, please try again later',
  skipSuccessfulRequests: false,
});

// Admin API rate limiter - Stricter for admin operations
const adminApiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many admin requests, please try again later',
  skipSuccessfulRequests: false,
});

// File upload rate limiter with size consideration
const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many file uploads, please try again later',
  skipSuccessfulRequests: true,
});

// Enhanced smart rate limiting with behavior analysis
const smartRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    const user = req.user;
    
    // Base limits
    let limit = 100;
    
    if (user) {
      switch (user.role) {
        case 'admin': limit = 500; break;
        case 'writer': limit = 200; break;
        case 'reader': limit = 100; break;
        default: limit = 50; break;
      }
      
      // Reduce limits for suspicious behavior
      if (user.failedLoginAttempts > 5) {
        limit = Math.floor(limit * 0.5);
      }
      
      // Check for VPN/Proxy usage
      if (req.headers['x-forwarded-for'] && req.headers['x-forwarded-for'].includes(',')) {
        limit = Math.floor(limit * 0.7);
      }
      
      // Check for suspicious user agent
      const userAgent = req.headers['user-agent'] || '';
      if (userAgent.includes('bot') || userAgent.includes('crawler') || userAgent.includes('spider')) {
        limit = Math.floor(limit * 0.3);
      }
    } else {
      // Anonymous users get lower limits
      limit = 50;
      
      // Further reduce for suspicious anonymous requests
      if (req.headers['x-forwarded-for']) {
        limit = Math.floor(limit * 0.5);
      }
    }
    
    return Math.max(limit, 10); // Minimum limit of 10
  },
  keyGenerator: (req) => {
    const ip = ipKeyGenerator(req);
    const userKey = req.user ? req.user.id : 'anonymous';
    const userAgent = req.headers['user-agent'] || 'unknown';
    
    return `${ip}:${userKey}:${userAgent}`;
  },
  handler: (req, res) => {
    const rateLimitInfo = req.rateLimit;
    
    logger.warn('Smart rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
      role: req.user?.role || 'anonymous',
      userAgent: req.headers['user-agent'],
      url: req.originalUrl,
      method: req.method,
      rateLimitInfo: {
        current: rateLimitInfo.current,
        limit: rateLimitInfo.limit,
        remaining: rateLimitInfo.remaining,
        resetTime: rateLimitInfo.resetTime,
      },
    });
    
    // Progressive response based on violation count
    let message = 'Too many requests. Please try again later.';
    let statusCode = 429;
    
    if (rateLimitInfo.current >= 10) {
      message = 'Excessive requests detected. Your IP may be temporarily blocked.';
      statusCode = 429;
    } else if (rateLimitInfo.current >= 5) {
      message = 'Too many requests. Please slow down.';
      statusCode = 429;
    }
    
    res.status(statusCode).json({
      success: false,
      message: message,
      retryAfter: Math.ceil(15 * 60 / 1000),
      requiresCaptcha: rateLimitInfo.current >= 3,
      rateLimitInfo: {
        current: rateLimitInfo.current,
        limit: rateLimitInfo.limit,
        remaining: rateLimitInfo.remaining,
        resetTime: rateLimitInfo.resetTime,
      },
    });
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Burst rate limiting for sudden spikes
const burstRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: (req) => {
    const user = req.user;
    if (!user) return 20; // Anonymous users
    
    switch (user.role) {
      case 'admin': return 100;
      case 'writer': return 50;
      case 'reader': return 30;
      default: return 20;
    }
  },
  keyGenerator: (req) => (req.user ? req.user.id : ipKeyGenerator(req)),
  handler: (req, res) => {
    logger.warn('Burst rate limit exceeded', {
      ip: req.ip,
      userId: req.user?.id || 'anonymous',
      role: req.user?.role || 'anonymous',
      url: req.originalUrl,
      method: req.method,
    });
    
    res.status(429).json({
      success: false,
      message: 'Too many requests in a short time. Please slow down.',
      retryAfter: Math.ceil(1 * 60 / 1000),
      requiresCaptcha: true,
    });
  },
});

// Rate limiting for sensitive operations
const sensitiveOperationLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 sensitive operations per hour
  message: 'Too many sensitive operations, please try again later',
  skipSuccessfulRequests: true,
});

// Rate limiting for data export operations
const exportLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 exports per hour
  message: 'Too many export requests, please try again later',
  skipSuccessfulRequests: true,
});

// Rate limiting for search operations
const searchLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: (req) => {
    const user = req.user;
    if (!user) return 30; // Anonymous users
    
    switch (user.role) {
      case 'admin': return 200;
      case 'writer': return 100;
      case 'reader': return 50;
      default: return 30;
    }
  },
  message: 'Too many search requests, please try again later',
  skipSuccessfulRequests: false,
});

module.exports = { 
  smartRateLimit, 
  tierRateLimiter,
  adaptiveRateLimiter,
  apiLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  verificationLimiter,
  adminApiLimiter,
  uploadLimiter,
  burstRateLimiter,
  sensitiveOperationLimiter,
  exportLimiter,
  searchLimiter,
  createLimiter
};
