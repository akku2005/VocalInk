const rateLimit = require('express-rate-limit');
const { ValidationError } = require('../utils/errors');
const BadgeClaim = require('../models/badgeClaim.model');
const Badge = require('../models/badge.model');
const logger = require('../utils/logger');

// Helper function to get client IP safely
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',').shift() ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

// Rate limiting for badge claims
const badgeClaimLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 10, // Limit each user to 10 badge claims per day
  message: {
    success: false,
    message: 'Too many badge claims. Please try again tomorrow.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user.id : getClientIp(req);
  },
  skip: (req) => {
    // Skip rate limiting for admin users
    return req.user && req.user.role === 'admin';
  }
});

// Rate limiting for badge searches
const badgeSearchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each user to 100 searches per 15 minutes
  message: {
    success: false,
    message: 'Too many badge searches. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user.id : getClientIp(req);
  }
});

// Rate limiting for badge listing
const badgeListLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 200, // Limit each user to 200 requests per 5 minutes
  message: {
    success: false,
    message: 'Too many badge listing requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user.id : getClientIp(req);
  }
});

// Middleware to validate badge exists and is active
const validateBadge = async (req, res, next) => {
  try {
    const badgeId = req.params.badgeId || req.params.id;
    
    if (!badgeId) {
      return next(new ValidationError('Badge ID is required'));
    }

    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return next(new ValidationError('Badge not found'));
    }

    if (badge.status !== 'active') {
      return next(new ValidationError('This badge is not available'));
    }

    req.badge = badge;
    next();
  } catch (error) {
    logger.error('Error in validateBadge middleware:', error);
    next(new ValidationError('Invalid badge ID'));
  }
};

// Middleware to check if user already has the badge
const checkUserBadgeOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ValidationError('Authentication required'));
    }

    const badgeId = req.params.badgeId || req.params.id;
    const user = req.user;

    if (user.badges.includes(badgeId)) {
      return next(new ValidationError('You already have this badge'));
    }

    next();
  } catch (error) {
    logger.error('Error in checkUserBadgeOwnership middleware:', error);
    next(new ValidationError('Error checking badge ownership'));
  }
};

// Middleware to check for existing pending claims
const checkExistingClaims = async (req, res, next) => {
  try {
    if (!req.user) {
      return next(new ValidationError('Authentication required'));
    }

    const badgeId = req.params.badgeId;
    const userId = req.user.id;

    const existingClaim = await BadgeClaim.findOne({
      badgeId,
      userId,
      status: { $in: ['pending', 'under_review'] }
    });

    if (existingClaim) {
      return next(new ValidationError('You already have a pending claim for this badge'));
    }

    next();
  } catch (error) {
    logger.error('Error in checkExistingClaims middleware:', error);
    next(new ValidationError('Error checking existing claims'));
  }
};

// Middleware to validate badge availability for user
const validateBadgeAvailability = async (req, res, next) => {
  try {
    if (!req.user || !req.badge) {
      return next(new ValidationError('User and badge information required'));
    }

    const isAvailable = req.badge.isAvailableForUser(req.user);
    if (!isAvailable) {
      return next(new ValidationError('This badge is not available for you'));
    }

    next();
  } catch (error) {
    logger.error('Error in validateBadgeAvailability middleware:', error);
    next(new ValidationError('Error validating badge availability'));
  }
};

// Middleware to check user eligibility
const checkUserEligibility = async (req, res, next) => {
  try {
    if (!req.user || !req.badge) {
      return next(new ValidationError('User and badge information required'));
    }

    const isEligible = await Badge.isUserEligibleForBadge(req.user, req.badge);
    if (!isEligible) {
      return next(new ValidationError('You are not eligible for this badge yet'));
    }

    next();
  } catch (error) {
    logger.error('Error in checkUserEligibility middleware:', error);
    next(new ValidationError('Error checking user eligibility'));
  }
};

// Middleware to collect request information for security
const collectRequestInfo = (req, res, next) => {
  try {
    req.requestInfo = {
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent'),
      deviceFingerprint: req.headers['x-device-fingerprint'],
      location: req.headers['x-user-location'] ? 
        JSON.parse(req.headers['x-user-location']) : null,
      sessionId: req.session?.id,
      referer: req.get('Referer'),
      timestamp: new Date()
    };

    next();
  } catch (error) {
    logger.error('Error in collectRequestInfo middleware:', error);
    next();
  }
};

// Middleware to perform basic fraud detection
const basicFraudDetection = async (req, res, next) => {
  try {
    if (!req.user || !req.badge) {
      return next();
    }

    const requestInfo = req.requestInfo;
    let fraudScore = 0;
    const flags = [];

    // Check for suspicious IP patterns
    if (requestInfo.ipAddress) {
      const recentClaimsFromIP = await BadgeClaim.countDocuments({
        'security.ipAddress': requestInfo.ipAddress,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (recentClaimsFromIP > 50) {
        fraudScore += 0.3;
        flags.push('suspicious_ip_activity');
      }
    }

    // Check for rapid claiming
    const recentUserClaims = await BadgeClaim.countDocuments({
      userId: req.user.id,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) } // Last hour
    });

    if (recentUserClaims > 5) {
      fraudScore += 0.4;
      flags.push('rapid_claiming');
    }

    // Check for new account behavior
    const accountAge = (Date.now() - req.user.createdAt) / (1000 * 60 * 60 * 24);
    if (accountAge < 1 && recentUserClaims > 0) {
      fraudScore += 0.5;
      flags.push('new_account_claiming');
    }

    // Store fraud information in request
    req.fraudInfo = {
      score: fraudScore,
      flags,
      riskLevel: fraudScore >= 0.8 ? 'critical' : 
                 fraudScore >= 0.6 ? 'high' : 
                 fraudScore >= 0.3 ? 'medium' : 'low'
    };

    next();
  } catch (error) {
    logger.error('Error in basicFraudDetection middleware:', error);
    next();
  }
};

// Middleware to validate admin permissions for claim review
const validateClaimReviewPermissions = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return next(new ValidationError('Admin privileges required'));
    }

    const claimId = req.params.claimId;
    const claim = await BadgeClaim.findById(claimId);
    
    if (!claim) {
      return next(new ValidationError('Claim not found'));
    }

    if (!['pending', 'under_review'].includes(claim.status)) {
      return next(new ValidationError('Claim is not in a reviewable state'));
    }

    req.claim = claim;
    next();
  } catch (error) {
    logger.error('Error in validateClaimReviewPermissions middleware:', error);
    next(new ValidationError('Error validating claim review permissions'));
  }
};

// Middleware to log badge-related activities
const logBadgeActivity = (activity) => {
  return (req, res, next) => {
    try {
      const logData = {
        activity,
        userId: req.user?.id,
        badgeId: req.params.badgeId || req.params.id,
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
        timestamp: new Date(),
        method: req.method,
        path: req.path
      };

      logger.info('Badge activity:', logData);
      next();
    } catch (error) {
      logger.error('Error in logBadgeActivity middleware:', error);
      next();
    }
  };
};

// Middleware to add security headers for badge endpoints
const addBadgeSecurityHeaders = (req, res, next) => {
  res.setHeader('X-Badge-System', 'VocalInk-Badges-v2.0');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
};

// Middleware to validate pagination parameters
const validatePagination = (req, res, next) => {
  try {
    const { page, limit } = req.query;
    
    if (page && (isNaN(page) || parseInt(page) < 1)) {
      return next(new ValidationError('Page must be a positive integer'));
    }
    
    if (limit && (isNaN(limit) || parseInt(limit) < 1 || parseInt(limit) > 100)) {
      return next(new ValidationError('Limit must be between 1 and 100'));
    }
    
    next();
  } catch (error) {
    logger.error('Error in validatePagination middleware:', error);
    next(new ValidationError('Invalid pagination parameters'));
  }
};

// Middleware to cache badge responses
const cacheBadgeResponse = (duration = 300) => {
  return (req, res, next) => {
    // This is a simplified cache implementation
    // In production, you'd want to use Redis or a proper caching solution
    const cacheKey = `badge:${req.originalUrl}`;
    
    // For now, just add cache headers
    res.setHeader('Cache-Control', `public, max-age=${duration}`);
    res.setHeader('ETag', `"${Date.now()}"`);
    
    next();
  };
};

module.exports = {
  badgeClaimLimiter,
  badgeSearchLimiter,
  badgeListLimiter,
  validateBadge,
  checkUserBadgeOwnership,
  checkExistingClaims,
  validateBadgeAvailability,
  checkUserEligibility,
  collectRequestInfo,
  basicFraudDetection,
  validateClaimReviewPermissions,
  logBadgeActivity,
  addBadgeSecurityHeaders,
  validatePagination,
  cacheBadgeResponse
}; 