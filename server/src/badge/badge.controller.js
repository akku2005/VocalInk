const Badge = require('../models/badge.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const { StatusCodes } = require('http-status-codes');
const { ValidationError, NotFoundError, ConflictError } = require('../utils/errors');
const logger = require('../utils/logger');

// Get all badges
exports.getAllBadges = async (req, res) => {
  try {
    const { category, rarity, limit = 50, page = 1 } = req.query;
    
    let query = { isActive: true };
    
    if (category) {
      query.category = category;
    }
    
    if (rarity) {
      query.rarity = rarity;
    }

    const badges = await Badge.find(query)
      .sort({ rarity: 1, name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Badge.countDocuments(query);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        badges,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalBadges: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });
  } catch (error) {
    logger.error('Error in getAllBadges:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching badges'
    });
  }
};

// Get badge by ID
exports.getBadgeById = async (req, res) => {
  try {
    const badge = await Badge.findById(req.params.id);
    
    if (!badge) {
      throw new NotFoundError('Badge not found');
    }

    // Get users who have earned this badge
    const earnedUsers = await User.find({ badges: badge._id })
      .select('name email avatar')
      .limit(10);

    const badgeData = badge.toObject();
    badgeData.earnedUsers = earnedUsers;
    badgeData.earnedCount = earnedUsers.length;

    res.status(StatusCodes.OK).json({
      success: true,
      data: badgeData
    });
  } catch (error) {
    logger.error('Error in getBadgeById:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching badge'
      });
    }
  }
};

// Create new badge (admin only)
exports.createBadge = async (req, res) => {
  try {
    const { name, description, icon, color, rarity, category, criteria, requirements, xpReward } = req.body;

    // Check if badge with same name already exists
    const existingBadge = await Badge.findOne({ name });
    if (existingBadge) {
      throw new ConflictError('Badge with this name already exists');
    }

    const badge = await Badge.create({
      name,
      description,
      icon,
      color,
      rarity,
      category,
      criteria,
      requirements,
      xpReward
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Badge created successfully',
      data: badge
    });
  } catch (error) {
    logger.error('Error in createBadge:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while creating badge'
      });
    }
  }
};

// Update badge (admin only)
exports.updateBadge = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const badge = await Badge.findByIdAndUpdate(id, updates, { 
      new: true, 
      runValidators: true 
    });

    if (!badge) {
      throw new NotFoundError('Badge not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Badge updated successfully',
      data: badge
    });
  } catch (error) {
    logger.error('Error in updateBadge:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while updating badge'
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
        message: `Cannot delete badge. ${usersWithBadge} users have earned this badge.`
      });
    }

    await Badge.findByIdAndDelete(id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Badge deleted successfully'
    });
  } catch (error) {
    logger.error('Error in deleteBadge:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while deleting badge'
      });
    }
  }
};

// Claim badge (user action)
exports.claimBadge = async (req, res) => {
  try {
    const { badgeId } = req.params;
    const userId = req.user.id;

    const badge = await Badge.findById(badgeId);
    if (!badge) {
      throw new NotFoundError('Badge not found');
    }

    if (!badge.isActive) {
      throw new ValidationError('This badge is not available for claiming');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Check if user already has this badge
    if (user.badges.includes(badgeId)) {
      throw new ConflictError('You have already earned this badge');
    }

    // Check if user is eligible for this badge
    const isEligible = await Badge.isUserEligibleForBadge(user, badge);
    if (!isEligible) {
      throw new ValidationError('You are not eligible for this badge yet');
    }

    // Award badge to user
    user.badges.push(badgeId);
    user.xp += badge.xpReward;
    user.level = Math.floor(user.xp / 100) + 1;
    await user.save();

    // Create notification
    await Notification.createBadgeNotification(userId, badgeId);

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Congratulations! You earned the "${badge.name}" badge!`,
      data: {
        badge,
        xpGained: badge.xpReward,
        newTotalXP: user.xp,
        newLevel: user.level
      }
    });
  } catch (error) {
    logger.error('Error in claimBadge:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while claiming badge'
      });
    }
  }
};

// Check user's eligible badges
exports.getEligibleBadges = async (req, res) => {
  try {
    const userId = req.user.id;

    const eligibleBadges = await Badge.checkUserEligibility(userId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        eligibleBadges,
        count: eligibleBadges.length
      }
    });
  } catch (error) {
    logger.error('Error in getEligibleBadges:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while checking eligible badges'
    });
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
        count: badges.length
      }
    });
  } catch (error) {
    logger.error('Error in getBadgesByCategory:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching badges by category'
    });
  }
};

// Get badge statistics
exports.getBadgeStats = async (req, res) => {
  try {
    const totalBadges = await Badge.countDocuments({ isActive: true });
    const badgesByCategory = await Badge.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$category', count: { $sum: 1 } } }
    ]);
    const badgesByRarity = await Badge.aggregate([
      { $match: { isActive: true } },
      { $group: { _id: '$rarity', count: { $sum: 1 } } }
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        totalBadges,
        byCategory: badgesByCategory,
        byRarity: badgesByRarity
      }
    });
  } catch (error) {
    logger.error('Error in getBadgeStats:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching badge statistics'
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
    user.xp += badge.xpReward;
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
          email: user.email
        },
        badge,
        xpGained: badge.xpReward,
        newTotalXP: user.xp,
        newLevel: user.level
      }
    });
  } catch (error) {
    logger.error('Error in awardBadgeToUser:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while awarding badge'
      });
    }
  }
}; 