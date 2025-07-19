const rateLimit = require('express-rate-limit');
const { ipKeyGenerator } = require('express-rate-limit');

// Common rate limiter configuration
const createLimiter = (options) => {
  return rateLimit({
    windowMs: options.windowMs,
    max: options.max,
    message: {
      success: false,
      message: options.message
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: options.skipSuccessfulRequests || false,
    keyGenerator: (req) => {
      // Use ipKeyGenerator for IPv6 safety
      const ip = ipKeyGenerator(req);
      const key = [
        ip,
        req.headers['user-agent'],
        options.additionalKey ? options.additionalKey(req) : ''
      ].filter(Boolean).join(':');
      return key;
    },
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: options.message,
        retryAfter: res.getHeader('Retry-After')
      });
    }
  });
};

// Login rate limiter - More strict
const loginLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts per window
  message: 'Too many login attempts, please try again after 15 minutes',
  skipSuccessfulRequests: true,
  additionalKey: (req) => req.body.email // Rate limit by email too
});

// Register rate limiter
const registerLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 3, // 3 attempts per window
  message: 'Too many registration attempts, please try again after 1 hour',
  skipSuccessfulRequests: true
});

// Password reset rate limiter
const passwordResetLimiter = createLimiter({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 2, // 2 attempts per window
  message: 'Too many password reset attempts, please try again after 30 minutes',
  skipSuccessfulRequests: true,
  additionalKey: (req) => req.body.email
});

// Verification code rate limiter
const verificationLimiter = createLimiter({
  windowMs: 30 * 60 * 1000, // 30 minutes
  max: 3, // 3 attempts per window
  message: 'Too many verification attempts, please try again after 30 minutes',
  skipSuccessfulRequests: true,
  additionalKey: (req) => req.body.email
});

// Global API rate limiter - More granular
const apiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  skipSuccessfulRequests: false
});

// Admin API rate limiter - Stricter
const adminApiLimiter = createLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: 'Too many admin requests, please try again later',
  skipSuccessfulRequests: false
});

// File upload rate limiter
const uploadLimiter = createLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 uploads per hour
  message: 'Too many file uploads, please try again later',
  skipSuccessfulRequests: true
});

module.exports = {
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  verificationLimiter,
  apiLimiter,
  adminApiLimiter,
  uploadLimiter,
  createLimiter // Export for custom limiters
}; 