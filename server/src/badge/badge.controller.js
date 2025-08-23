const { StatusCodes } = require('http-status-codes');
const BadgeService = require('../services/BadgeService');
const Badge = require('../models/badge.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const {
  createBadgeSchema,
  updateBadgeSchema,
  claimBadgeSchema,
  searchBadgesSchema,
  filterBadgesSchema,
  reviewClaimSchema
} = require('../validations/badgeSchema');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
} = require('../utils/errors');
const logger = require('../utils/logger');

// Get all badges with advanced filtering
exports.getAllBadges = async (req, res) => {
  try {
    const { error, value } = filterBadgesSchema.validate(req.query);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }

    const result = await BadgeService.getAllBadges(value);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error in getAllBadges:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching badges',
      });
    }
  }
};

// Get badge by ID with enhanced details
exports.getBadgeById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const badgeData = await BadgeService.getBadgeById(id, userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: badgeData,
    });
  } catch (error) {
    logger.error('Error in getBadgeById:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching badge',
      });
    }
  }
};

// Search badges
exports.searchBadges = async (req, res) => {
  try {
    const { query } = req.query;
    
    if (!query) {
      return res.status(400).json({
        success: false,
        message: 'Query parameter is required'
      });
    }

    const { error, value } = searchBadgesSchema.validate(req.query);
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.details[0].message
      });
    }

    const badges = await BadgeService.searchBadges(value.query, value);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        badges,
        count: badges.length,
      },
    });
  } catch (error) {
    logger.error('Error in searchBadges:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while searching badges',
      });
    }
  }
};

// Get popular badges
exports.getPopularBadges = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const badges = await BadgeService.getPopularBadges(parseInt(limit));

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        badges,
        count: badges.length,
      },
    });
  } catch (error) {
    logger.error('Error in getPopularBadges:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching popular badges',
    });
  }
};

// Get rare badges
exports.getRareBadges = async (req, res) => {
  try {
    const { limit = 10 } = req.query;
    const badges = await BadgeService.getRareBadges(parseInt(limit));

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        badges,
        count: badges.length,
      },
    });
  } catch (error) {
    logger.error('Error in getRareBadges:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching rare badges',
    });
  }
};

// Create new badge (admin only)
exports.createBadge = async (req, res) => {
  try {
    const { error, value } = createBadgeSchema.validate(req.body);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }

    const badge = await BadgeService.createBadge(value, req.user.id);

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Badge created successfully',
      data: badge,
    });
  } catch (error) {
    logger.error('Error in createBadge:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while creating badge',
      });
    }
  }
};

// Update badge (admin only)
exports.updateBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const { error, value } = updateBadgeSchema.validate(req.body);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }

    const badge = await BadgeService.updateBadge(id, value, req.user.id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Badge updated successfully',
      data: badge,
    });
  } catch (error) {
    logger.error('Error in updateBadge:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while updating badge',
      });
    }
  }
};

// Delete badge (admin only)
exports.deleteBadge = async (req, res) => {
  try {
    const { id } = req.params;

    const badge = await Badge.findById(id);
    if (!badge) {
      throw new NotFoundError('Badge not found');
    }

    // Check if any users have this badge
    const usersWithBadge = await User.countDocuments({ badges: id });
    if (usersWithBadge > 0) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: `Cannot delete badge. ${usersWithBadge} users have earned this badge.`,
      });
    }

    await Badge.findByIdAndDelete(id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Badge deleted successfully',
    });
  } catch (error) {
    logger.error('Error in deleteBadge:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while deleting badge',
      });
    }
  }
};

// Claim badge (user action)
exports.claimBadge = async (req, res) => {
  try {
    const { badgeId } = req.params;
    const userId = req.user.id;

    const { error } = claimBadgeSchema.validate({ badgeId });
    if (error) {
      throw new ValidationError(error.details[0].message);
    }

    // Get request information for security
    const requestInfo = {
      ipAddress: req.ip,
      userAgent: req.get('User-Agent'),
      deviceFingerprint: req.headers['x-device-fingerprint'],
      location: req.headers['x-user-location'] ? JSON.parse(req.headers['x-user-location']) : null,
      sessionId: req.session?.id
    };

    const claim = await BadgeService.initiateBadgeClaim(badgeId, userId, requestInfo);

    let responseData = {
      claim,
      message: 'Badge claim initiated successfully'
    };

    // If claim was automatically approved, include badge details
    if (claim.status === 'approved') {
      const badge = await Badge.findById(badgeId);
      responseData.message = `Congratulations! You earned the "${badge.name}" badge!`;
      responseData.badge = badge;
      responseData.xpGained = claim.rewards.xpAwarded;
    }

    res.status(StatusCodes.OK).json({
      success: true,
      ...responseData
    });
  } catch (error) {
    logger.error('Error in claimBadge:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while claiming badge',
      });
    }
  }
};

// Check user's eligible badges
exports.getEligibleBadges = async (req, res) => {
  try {
    const userId = req.user.id;

    const eligibleBadges = await BadgeService.getEligibleBadges(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        eligibleBadges,
        count: eligibleBadges.length,
      },
    });
  } catch (error) {
    logger.error('Error in getEligibleBadges:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while checking eligible badges',
    });
  }
};

// Get user's badge collection
exports.getUserBadges = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { earned, available } = req.query;

    const result = await BadgeService.getUserBadges(userId, { earned, available });

    res.status(StatusCodes.OK).json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error('Error in getUserBadges:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching user badges',
      });
    }
  }
};

// Get user's badge progress
exports.getUserBadgeProgress = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;

    const progress = await BadgeService.getUserBadgeProgress(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: progress,
    });
  } catch (error) {
    logger.error('Error in getUserBadgeProgress:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching user badge progress',
      });
    }
  }
};

// Get badges by category
exports.getBadgesByCategory = async (req, res) => {
  try {
    const { category } = req.params;
    const { limit = 20 } = req.query;

    const badges = await Badge.getByCategory(category).limit(limit);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        category,
        badges,
        count: badges.length,
      },
    });
  } catch (error) {
    logger.error('Error in getBadgesByCategory:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching badges by category',
    });
  }
};

// Get badge statistics
exports.getBadgeStats = async (req, res) => {
  try {
    const stats = await BadgeService.getBadgeStats();

    res.status(StatusCodes.OK).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    logger.error('Error in getBadgeStats:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching badge statistics',
    });
  }
};

// Get badge analytics
exports.getBadgeAnalytics = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    const analytics = await BadgeService.getBadgeAnalytics(timeframe);

    res.status(StatusCodes.OK).json({
      success: true,
      data: analytics,
    });
  } catch (error) {
    logger.error('Error in getBadgeAnalytics:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching badge analytics',
    });
  }
};

// Award badge to user (admin only)
exports.awardBadgeToUser = async (req, res) => {
  try {
    const { badgeId, userId } = req.body;

    const badge = await Badge.findById(badgeId);
    if (!badge) {
      throw new NotFoundError('Badge not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user already has this badge
    if (user.badges.includes(badgeId)) {
      throw new ConflictError('User already has this badge');
    }

    // Award badge to user
    user.badges.push(badgeId);
    user.xp += badge.rewards.xpReward;
    user.level = Math.floor(user.xp / 100) + 1;
    await user.save();

    // Create notification
    await Notification.createBadgeNotification(userId, badgeId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Badge "${badge.name}" awarded to user successfully`,
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
        },
        badge,
        xpGained: badge.rewards.xpReward,
        newTotalXP: user.xp,
        newLevel: user.level,
      },
    });
  } catch (error) {
    logger.error('Error in awardBadgeToUser:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while awarding badge',
      });
    }
  }
};

// Get pending claims (admin only)
exports.getPendingClaims = async (req, res) => {
  try {
    const { riskLevel, limit = 50 } = req.query;
    const BadgeClaim = require('../models/badgeClaim.model');
    
    const claims = await BadgeClaim.getPendingClaims({ riskLevel, limit: parseInt(limit) });

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        claims,
        count: claims.length,
      },
    });
  } catch (error) {
    logger.error('Error in getPendingClaims:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching pending claims',
    });
  }
};

// Review claim (admin only)
exports.reviewClaim = async (req, res) => {
  try {
    const { claimId } = req.params;
    const { error, value } = reviewClaimSchema.validate(req.body);
    if (error) {
      throw new ValidationError(error.details[0].message);
    }

    const claim = await BadgeService.reviewClaim(
      claimId,
      value.decision,
      req.user.id,
      value.notes
    );

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Claim ${value.decision}d successfully`,
      data: claim,
    });
  } catch (error) {
    logger.error('Error in reviewClaim:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while reviewing claim',
      });
    }
  }
};

// Get user's claim history
exports.getUserClaimHistory = async (req, res) => {
  try {
    const userId = req.params.userId || req.user.id;
    const { status, limit = 50, page = 1 } = req.query;
    const BadgeClaim = require('../models/badgeClaim.model');
    
    const claims = await BadgeClaim.getUserClaims(userId, {
      status,
      limit: parseInt(limit),
      skip: (parseInt(page) - 1) * parseInt(limit)
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        claims,
        count: claims.length,
      },
    });
  } catch (error) {
    logger.error('Error in getUserClaimHistory:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching claim history',
    });
  }
};
