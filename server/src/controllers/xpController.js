const { StatusCodes } = require('http-status-codes');
const XPService = require('../services/XPService');
const XPTransaction = require('../models/xpTransaction.model');
const User = require('../models/user.model');
const { ValidationError, NotFoundError, UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

// Get user's XP information
exports.getUserXP = async (req, res) => {
  try {
    const userId = req.user.id;
    const user = await User.findById(userId).populate('badges', 'name icon color rarity');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get user stats
    const stats = await XPService.getUserStats(userId, 'month');
    const rank = await XPService.getUserRank(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        xp: user.xp,
        level: user.level,
        badges: user.badges,
        badgeCount: user.badges.length,
        streaks: user.streaks,
        qualityScore: user.qualityScore,
        engagementScore: user.engagementScore,
        unlockedFeatures: user.unlockedFeatures,
        gamificationSettings: user.gamificationSettings,
        stats,
        rank,
        nextLevelXP: XPService.calculateLevel(user.xp + 1) > user.level ? 
          user.xp + 1 : null,
      },
    });
  } catch (error) {
    logger.error('Error in getUserXP:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching XP information',
      });
    }
  }
};

// Get user's XP transaction history
exports.getTransactionHistory = async (req, res) => {
  try {
    const userId = req.user.id;
    const { 
      page = 1, 
      limit = 20, 
      action, 
      status, 
      startDate, 
      endDate 
    } = req.query;

    const options = {
      page: parseInt(page),
      limit: parseInt(limit),
      action,
      status,
      startDate,
      endDate,
    };

    const transactions = await XPService.getUserTransactionHistory(userId, options);
    const total = await XPTransaction.countDocuments({ userId });

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTransactions: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Error in getTransactionHistory:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching transaction history',
    });
  }
};

// Get user's XP statistics
exports.getUserStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const { timeframe = 'all' } = req.query;

    const stats = await XPService.getUserStats(userId, timeframe);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        timeframe,
        stats,
      },
    });
  } catch (error) {
    logger.error('Error in getUserStats:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching user statistics',
    });
  }
};

// Award XP for specific action (internal use)
exports.awardXP = async (req, res) => {
  try {
    const { userId, action, metadata = {}, requestInfo = {} } = req.body;

    // Validate required fields
    if (!userId || !action) {
      throw new ValidationError('User ID and action are required');
    }

    // Check if user is authorized to award XP
    if (req.user.role !== 'admin' && req.user.id !== userId) {
      throw new UnauthorizedError('Not authorized to award XP to this user');
    }

    const result = await XPService.awardXP(userId, action, metadata, requestInfo);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'XP awarded successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error in awardXP:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while awarding XP',
      });
    }
  }
};

// Get XP leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { 
      type = 'xp', 
      limit = 50, 
      page = 1,
      timeframe = 'all',
      category 
    } = req.query;

    let query = {};
    let sortField = 'xp';

    // Determine sort field based on type
    switch (type) {
      case 'blogs':
        sortField = 'totalBlogs';
        break;
      case 'followers':
        sortField = 'followerCount';
        break;
      case 'engagement':
        sortField = 'engagementScore';
        break;
      case 'quality':
        sortField = 'qualityScore';
        break;
      case 'streaks':
        sortField = 'streaks.login.longest';
        break;
      default:
        sortField = 'xp';
    }

    // Add timeframe filter if specified
    if (timeframe !== 'all') {
      const now = new Date();
      let startDate = null;
      
      switch (timeframe) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
      }
      
      if (startDate) {
        query.createdAt = { $gte: startDate };
      }
    }

    // Add category filter if specified
    if (category) {
      query.role = category;
    }

    const users = await User.find(query)
      .select('name email avatar xp level totalBlogs followerCount engagementScore qualityScore streaks badges')
      .populate('badges', 'name icon color rarity')
      .sort({ [sortField]: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));

    const total = await User.countDocuments(query);

    // Calculate ranks
    const leaderboard = users.map((user, index) => ({
      rank: (parseInt(page) - 1) * parseInt(limit) + index + 1,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        xp: user.xp,
        level: user.level,
        totalBlogs: user.totalBlogs,
        followerCount: user.followerCount,
        engagementScore: user.engagementScore,
        qualityScore: user.qualityScore,
        badges: user.badges,
        badgeCount: user.badges.length,
        streaks: user.streaks,
      },
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        leaderboard,
        type,
        timeframe,
        category,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Error in getLeaderboard:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching leaderboard',
    });
  }
};

// Get user's rank
exports.getUserRank = async (req, res) => {
  try {
    const userId = req.user.id;
    const rank = await XPService.getUserRank(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: rank,
    });
  } catch (error) {
    logger.error('Error in getUserRank:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching user rank',
    });
  }
};

// Update gamification settings
exports.updateGamificationSettings = async (req, res) => {
  try {
    const userId = req.user.id;
    const { gamificationSettings } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update settings
    user.gamificationSettings = {
      ...user.gamificationSettings,
      ...gamificationSettings,
    };

    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Gamification settings updated successfully',
      data: user.gamificationSettings,
    });
  } catch (error) {
    logger.error('Error in updateGamificationSettings:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while updating settings',
      });
    }
  }
};

// Admin: Get flagged transactions
exports.getFlaggedTransactions = async (req, res) => {
  try {
    // Check admin permissions
    if (req.user.role !== 'admin') {
      throw new UnauthorizedError('Admin access required');
    }

    const { severity, reviewed, limit = 50, page = 1 } = req.query;

    const options = {
      severity,
      reviewed: reviewed === 'true',
      limit: parseInt(limit),
      page: parseInt(page),
    };

    const transactions = await XPTransaction.getFlaggedTransactions(options);
    const total = await XPTransaction.countDocuments({ 'flags.0': { $exists: true } });

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        transactions,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalTransactions: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Error in getFlaggedTransactions:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching flagged transactions',
      });
    }
  }
};

// Admin: Resolve flagged transaction
exports.resolveFlaggedTransaction = async (req, res) => {
  try {
    // Check admin permissions
    if (req.user.role !== 'admin') {
      throw new UnauthorizedError('Admin access required');
    }

    const { transactionId } = req.params;
    const { flagIndex, resolution } = req.body;

    const transaction = await XPTransaction.findById(transactionId);
    if (!transaction) {
      throw new NotFoundError('Transaction not found');
    }

    await transaction.resolveFlag(flagIndex, req.user.id, resolution);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Flag resolved successfully',
      data: transaction,
    });
  } catch (error) {
    logger.error('Error in resolveFlaggedTransaction:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while resolving flag',
      });
    }
  }
};

// Admin: Grant XP to user
exports.adminGrantXP = async (req, res) => {
  try {
    // Check admin permissions
    if (req.user.role !== 'admin') {
      throw new UnauthorizedError('Admin access required');
    }

    const { userId, amount, reason } = req.body;

    if (!userId || !amount || !reason) {
      throw new ValidationError('User ID, amount, and reason are required');
    }

    const result = await XPService.adminGrantXP(userId, amount, reason, req.user.id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'XP granted successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error in adminGrantXP:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while granting XP',
      });
    }
  }
};

// Admin: Deduct XP from user
exports.adminDeductXP = async (req, res) => {
  try {
    // Check admin permissions
    if (req.user.role !== 'admin') {
      throw new UnauthorizedError('Admin access required');
    }

    const { userId, amount, reason } = req.body;

    if (!userId || !amount || !reason) {
      throw new ValidationError('User ID, amount, and reason are required');
    }

    const result = await XPService.adminDeductXP(userId, amount, reason, req.user.id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'XP deducted successfully',
      data: result,
    });
  } catch (error) {
    logger.error('Error in adminDeductXP:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while deducting XP',
      });
    }
  }
};

// Get XP configuration (for frontend)
exports.getXPConfig = async (req, res) => {
  try {
    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        xpConfig: XPService.XP_CONFIG,
        qualityMultipliers: XPService.QUALITY_MULTIPLIERS,
        streakBonuses: XPService.STREAK_BONUSES,
      },
    });
  } catch (error) {
    logger.error('Error in getXPConfig:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching XP configuration',
    });
  }
}; 