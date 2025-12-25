const rateLimit = require('express-rate-limit');
const { ValidationError } = require('../utils/errors');
const BadgeClaim = require('../models/badgeClaim.model');
const Badge = require('../models/badge.model');
const logger = require('../utils/logger');
const mongoose = require('mongoose');

// Helper function to get client IP safely
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',').shift() ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

// Rate limiting for badge claims - reduced for testing
const badgeClaimLimiter = rateLimit({
  windowMs: 24 * 60 * 60 * 1000, // 24 hours
  max: 50, // Increased limit for testing
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
    // Disable rate limiting for badges in non-production or when explicitly disabled
    if (process.env.NODE_ENV !== 'production') return true;
    if (process.env.DISABLE_BADGE_RATE_LIMIT === 'true') return true;
    return req.user && req.user.role === 'admin' || process.env.NODE_ENV === 'test';
  }
});

// Rate limiting for badge searches - reduced for testing
const badgeSearchLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 500, // Increased limit for testing
  message: {
    success: false,
    message: 'Too many badge searches. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user.id : getClientIp(req);
  },
  skip: (req) => {
    if (process.env.NODE_ENV !== 'production') return true;
    if (process.env.DISABLE_BADGE_RATE_LIMIT === 'true') return true;
    return process.env.NODE_ENV === 'test';
  }
});

// Rate limiting for badge listing - reduced for testing
const badgeListLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 1000, // Increased limit for testing
  message: {
    success: false,
    message: 'Too many badge listing requests. Please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    return req.user ? req.user.id : getClientIp(req);
  },
  skip: (req) => {
    if (process.env.NODE_ENV !== 'production') return true;
    if (process.env.DISABLE_BADGE_RATE_LIMIT === 'true') return true;
    return process.env.NODE_ENV === 'test';
  }
});

// Middleware to validate badge exists and is active
const validateBadge = async (req, res, next) => {
  try {
    const badgeId = req.params.badgeId || req.params.id;
    
    if (!badgeId) {
      return res.status(400).json({
        success: false,
        message: 'Badge ID is required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(badgeId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid badge ID format'
      });
    }

    const badge = await Badge.findById(badgeId);
    if (!badge) {
      return res.status(404).json({
        success: false,
        message: 'Badge not found'
      });
    }

    if (badge.status !== 'active') {
      return res.status(400).json({
        success: false,
        message: 'This badge is not available'
      });
    }

    req.badge = badge;
    next();
  } catch (error) {
    logger.error('Error in validateBadge middleware:', error);
    return res.status(400).json({
      success: false,
      message: 'Invalid badge ID'
    });
  }
};

// Middleware to check if user already has the badge
const checkUserBadgeOwnership = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const badgeId = req.params.badgeId || req.params.id;
    const user = req.user;

    // Check if user already has this badge
    if (user.badges && user.badges.includes(badgeId)) {
      return res.status(400).json({
        success: false,
        message: 'You already have this badge'
      });
    }

    next();
  } catch (error) {
    logger.error('Error in checkUserBadgeOwnership middleware:', error);
    next(error);
  }
};

// Middleware to check for existing claims
const checkExistingClaims = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const badgeId = req.params.badgeId || req.params.id;
    const userId = req.user._id;

    // Check for existing pending or approved claims
    const existingClaim = await BadgeClaim.findOne({
      badgeId,
      userId,
      status: { $in: ['pending', 'approved'] }
    });

    if (existingClaim) {
      return res.status(400).json({
        success: false,
        message: existingClaim.status === 'approved' 
          ? 'You already have this badge' 
          : 'You already have a pending claim for this badge'
      });
    }

    next();
  } catch (error) {
    logger.error('Error in checkExistingClaims middleware:', error);
    next(error);
  }
};

// Middleware to validate badge availability
const validateBadgeAvailability = async (req, res, next) => {
  try {
    const badge = req.badge;
    
    if (!badge) {
      return res.status(400).json({
        success: false,
        message: 'Badge not found'
      });
    }

    // Check if badge is available for claiming
    if (!badge.isActive) {
      return res.status(400).json({
        success: false,
        message: 'This badge is not available for claiming'
      });
    }

    next();
  } catch (error) {
    logger.error('Error in validateBadgeAvailability middleware:', error);
    next(error);
  }
};

// Middleware to check user eligibility
const checkUserEligibility = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required'
      });
    }

    const badge = req.badge;
    const user = req.user;

    if (!badge) {
      return res.status(400).json({
        success: false,
        message: 'Badge not found'
      });
    }

    // Check if user is eligible for this badge
    const isEligible = await Badge.isUserEligibleForBadge(user, badge);
    
    if (!isEligible) {
      return res.status(400).json({
        success: false,
        message: 'You are not eligible for this badge'
      });
    }

    next();
  } catch (error) {
    logger.error('Error in checkUserEligibility middleware:', error);
    next(error);
  }
};

// Middleware to collect request information
const collectRequestInfo = (req, res, next) => {
  try {
    req.badgeRequestInfo = {
      ipAddress: getClientIp(req),
      userAgent: req.headers['user-agent'] || 'unknown',
      timestamp: new Date(),
      userId: req.user ? req.user._id : null,
      badgeId: req.params.badgeId || req.params.id
    };
    next();
  } catch (error) {
    logger.error('Error in collectRequestInfo middleware:', error);
    next();
  }
};

// Basic fraud detection middleware
const basicFraudDetection = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    const requestInfo = req.badgeRequestInfo;
    const userId = req.user._id;

    // Check for suspicious patterns
    const recentClaims = await BadgeClaim.countDocuments({
      userId,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) } // Last 24 hours
    });

    const fraudScore = recentClaims > 10 ? 0.8 : 0.1;

    req.fraudCheck = {
      score: fraudScore,
      riskLevel: fraudScore > 0.7 ? 'high' : 'low',
      flags: recentClaims > 10 ? ['excessive_claims'] : [],
      manualReviewRequired: fraudScore > 0.7
    };

    next();
  } catch (error) {
    logger.error('Error in basicFraudDetection middleware:', error);
    next();
  }
};

// Middleware to validate claim review permissions
const validateClaimReviewPermissions = async (req, res, next) => {
  try {
    if (!req.user || req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Admin privileges required'
      });
    }

    const claimId = req.params.claimId;
    
    if (!claimId) {
      return res.status(400).json({
        success: false,
        message: 'Claim ID is required'
      });
    }

    // Validate ObjectId format
    if (!mongoose.Types.ObjectId.isValid(claimId)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid claim ID format'
      });
    }

    const claim = await BadgeClaim.findById(claimId);
    if (!claim) {
      return res.status(404).json({
        success: false,
        message: 'Claim not found'
      });
    }

    req.claim = claim;
    next();
  } catch (error) {
    logger.error('Error in validateClaimReviewPermissions middleware:', error);
    next(error);
  }
};

// Middleware to log badge activity
const logBadgeActivity = (activity) => {
  return (req, res, next) => {
    try {
      const activityData = {
        activity,
        userId: req.user ? req.user._id : null,
        badgeId: req.params.badgeId || req.params.id,
        timestamp: new Date(),
        ipAddress: getClientIp(req),
        userAgent: req.headers['user-agent'] || 'unknown'
      };

      logger.info('Badge activity logged', activityData);
      next();
    } catch (error) {
      logger.error('Error in logBadgeActivity middleware:', error);
      next();
    }
  };
};

// Middleware to add security headers
const addBadgeSecurityHeaders = (req, res, next) => {
  res.setHeader('x-badge-system', 'v1.0.0');
  res.setHeader('x-content-type-options', 'nosniff');
  res.setHeader('x-frame-options', 'DENY');
  res.setHeader('x-xss-protection', '1; mode=block');
  next();
};

// Middleware to validate pagination parameters
const validatePagination = (req, res, next) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    if (page < 1) {
      return res.status(400).json({
        success: false,
        message: 'Page must be a positive integer'
      });
    }

    if (limit < 1 || limit > 100) {
      return res.status(400).json({
        success: false,
        message: 'Limit must be between 1 and 100'
      });
    }

    req.pagination = { page, limit };
    next();
  } catch (error) {
    logger.error('Error in validatePagination middleware:', error);
    return res.status(400).json({
      success: false,
      message: 'Invalid pagination parameters'
    });
  }
};

// Middleware to cache badge responses
const cacheBadgeResponse = (duration = 300) => {
  return (req, res, next) => {
    // In a real implementation, this would use Redis or similar
    // For now, we'll just pass through
    res.setHeader('Cache-Control', `public, max-age=${duration}`);
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
