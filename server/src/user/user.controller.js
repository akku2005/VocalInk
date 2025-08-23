const { StatusCodes } = require('http-status-codes');

const User = require('../models/user.model');
const Blog = require('../models/blog.model');
const Badge = require('../models/badge.model');
const Notification = require('../models/notification.model');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
} = require('../utils/errors');
const logger = require('../utils/logger');

// Get user profile by ID
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select(
        '-password -resetPasswordToken -resetPasswordCode -resetPasswordExpires -twoFactorSecret'
      )
      .populate('badges', 'name description icon')
      .populate('followers', 'name email avatar')
      .populate('following', 'name email avatar');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Add computed fields
    const profile = user.toObject();
    profile.blogCount = await Blog.countDocuments({
      author: user._id,
      status: 'published',
    });
    profile.followerCount = user.followers.length;
    profile.followingCount = user.following.length;

    res.status(StatusCodes.OK).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Error in getProfile:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching user profile',
      });
    }
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  try {
    // Support PATCH /me (no :id param)
    const userId = req.params.id || req.user.id;

    // Ensure user can only update their own profile (unless admin)
    if (req.user.id !== userId && req.user.role !== 'admin') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You can only update your own profile',
      });
    }

    const allowedFields = [
      'bio',
      'dob',
      'nationality',
      'mobile',
      'occupation',
      'gender',
      'address',
      'profilePicture',
      'company',
      'jobTitle',
      'website',
      'linkedin',
      'birthday',
      'name',
      'avatar',
      'socialLinks',
    ];

    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    })
      .select(
        '-password -resetPasswordToken -resetPasswordCode -resetPasswordExpires -twoFactorSecret'
      )
      .populate('badges', 'name description icon');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Profile updated successfully',
      data: user,
    });
  } catch (error) {
    logger.error('Error in updateProfile:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while updating profile',
      });
    }
  }
};

// Follow a user
exports.followUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const followerId = req.user.id;

    if (followerId === targetUserId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'You cannot follow yourself',
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError('User to follow not found');
    }

    const follower = await User.findById(followerId);

    // Check if already following
    if (follower.following.includes(targetUserId)) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: 'You are already following this user',
      });
    }

    // Add to following/followers
    await User.findByIdAndUpdate(followerId, {
      $addToSet: { following: targetUserId },
    });

    await User.findByIdAndUpdate(targetUserId, {
      $addToSet: { followers: followerId },
    });

    // Create notification for the followed user
    await Notification.create({
      userId: targetUserId,
      type: 'follow',
      title: 'New Follower',
      content: `${follower.name} started following you`,
      read: false,
    });

    // Award XP for following (engagement)
    await awardXP(followerId, 5, 'follow_user');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Successfully followed user',
    });
  } catch (error) {
    logger.error('Error in followUser:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while following user',
      });
    }
  }
};

// Unfollow a user
exports.unfollowUser = async (req, res) => {
  try {
    const { targetUserId } = req.params;
    const followerId = req.user.id;

    if (followerId === targetUserId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'You cannot unfollow yourself',
      });
    }

    const targetUser = await User.findById(targetUserId);
    if (!targetUser) {
      throw new NotFoundError('User to unfollow not found');
    }

    const follower = await User.findById(followerId);

    // Check if not following
    if (!follower.following.includes(targetUserId)) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: 'You are not following this user',
      });
    }

    // Remove from following/followers
    await User.findByIdAndUpdate(followerId, {
      $pull: { following: targetUserId },
    });

    await User.findByIdAndUpdate(targetUserId, {
      $pull: { followers: followerId },
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Successfully unfollowed user',
    });
  } catch (error) {
    logger.error('Error in unfollowUser:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while unfollowing user',
      });
    }
  }
};

// Get user's blogs
exports.getUserBlogs = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status = 'published' } = req.query;

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const query = { author: id };
    if (status !== 'all') {
      query.status = status;
    }

    const blogs = await Blog.find(query)
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Blog.countDocuments(query);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalBlogs: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Error in getUserBlogs:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching user blogs',
      });
    }
  }
};

// Get user's badges
exports.getUserBadges = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await User.findById(id).populate('badges');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Get all available badges to show progress
    const allBadges = await Badge.find();

    const userBadges = user.badges || [];
    const availableBadges = allBadges.filter(
      (badge) =>
        !userBadges.some(
          (userBadge) => userBadge._id.toString() === badge._id.toString()
        )
    );

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        earned: userBadges,
        available: availableBadges,
        totalEarned: userBadges.length,
        totalAvailable: allBadges.length,
      },
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

// Get user's notifications
exports.getUserNotifications = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 20, unreadOnly = false } = req.query;

    // Ensure user can only access their own notifications
    if (req.user.id !== id && req.user.role !== 'admin') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You can only view your own notifications',
      });
    }

    const query = { userId: id };
    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.countDocuments({
      userId: id,
      read: false,
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        notifications,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalNotifications: total,
          unreadCount,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Error in getUserNotifications:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching notifications',
    });
  }
};

// Mark notification as read
exports.markNotificationRead = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Ensure user can only mark their own notifications as read
    if (notification.userId.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You can only mark your own notifications as read',
      });
    }

    notification.read = true;
    await notification.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Notification marked as read',
    });
  } catch (error) {
    logger.error('Error in markNotificationRead:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while marking notification as read',
      });
    }
  }
};

// Mark all notifications as read
exports.markAllNotificationsRead = async (req, res) => {
  try {
    const userId = req.user.id;

    await Notification.updateMany({ userId, read: false }, { read: true });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'All notifications marked as read',
    });
  } catch (error) {
    logger.error('Error in markAllNotificationsRead:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while marking notifications as read',
    });
  }
};

// Get leaderboard
exports.getLeaderboard = async (req, res) => {
  try {
    const { type = 'xp', limit = 50 } = req.query;

    let sortField = 'xp';
    let sortOrder = -1;

    switch (type) {
      case 'blogs':
        sortField = 'blogCount';
        break;
      case 'followers':
        sortField = 'followerCount';
        break;
      case 'engagement':
        sortField = 'engagementScore';
        break;
      default:
        sortField = 'xp';
    }

    // Aggregate to get user statistics
    const leaderboard = await User.aggregate([
      {
        $lookup: {
          from: 'blogs',
          localField: '_id',
          foreignField: 'author',
          as: 'blogs',
        },
      },
      {
        $addFields: {
          blogCount: { $size: '$blogs' },
          followerCount: { $size: '$followers' },
          followingCount: { $size: '$following' },
        },
      },
      {
        $sort: { [sortField]: sortOrder },
      },
      {
        $limit: parseInt(limit),
      },
      {
        $project: {
          _id: 1,
          name: 1,
          email: 1,
          avatar: 1,
          role: 1,
          xp: 1,
          blogCount: 1,
          followerCount: 1,
          followingCount: 1,
          badges: 1,
        },
      },
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        leaderboard,
        type,
        totalUsers: leaderboard.length,
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

// Get user's leaderboard position
exports.getUserLeaderboard = async (req, res) => {
  try {
    const { id } = req.params;
    const { type = 'xp' } = req.query;

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    let sortField = 'xp';
    switch (type) {
      case 'blogs':
        sortField = 'blogCount';
        break;
      case 'followers':
        sortField = 'followerCount';
        break;
      case 'engagement':
        sortField = 'engagementScore';
        break;
      default:
        sortField = 'xp';
    }

    // Get user's rank
    const userRank = await User.countDocuments({
      [sortField]: { $gt: user[sortField] || 0 },
    });

    // Get nearby users (5 above, 5 below)
    const nearbyUsers = await User.aggregate([
      {
        $lookup: {
          from: 'blogs',
          localField: '_id',
          foreignField: 'author',
          as: 'blogs',
        },
      },
      {
        $addFields: {
          blogCount: { $size: '$blogs' },
          followerCount: { $size: '$followers' },
          followingCount: { $size: '$following' },
        },
      },
      {
        $sort: { [sortField]: -1 },
      },
      {
        $facet: {
          above: [
            { $match: { [sortField]: { $gt: user[sortField] || 0 } } },
            { $limit: 5 },
            { $sort: { [sortField]: 1 } },
          ],
          below: [
            { $match: { [sortField]: { $lte: user[sortField] || 0 } } },
            { $limit: 6 },
          ],
        },
      },
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        rank: userRank + 1,
        type,
        user: {
          _id: user._id,
          name: user.name,
          email: user.email,
          avatar: user.avatar,
          xp: user.xp,
          [sortField]: user[sortField] || 0,
        },
        nearby: {
          above: nearbyUsers[0].above.reverse(),
          below: nearbyUsers[0].below,
        },
      },
    });
  } catch (error) {
    logger.error('Error in getUserLeaderboard:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching user leaderboard',
      });
    }
  }
};

// Search users
exports.searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;

    if (!q || q.trim().length < 2) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Search query must be at least 2 characters long',
      });
    }

    const searchRegex = new RegExp(q, 'i');

    const users = await User.find({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { bio: searchRegex },
      ],
    })
      .select(
        '-password -resetPasswordToken -resetPasswordCode -resetPasswordExpires -twoFactorSecret'
      )
      .populate('badges', 'name description icon')
      .sort({ name: 1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await User.countDocuments({
      $or: [
        { name: searchRegex },
        { email: searchRegex },
        { bio: searchRegex },
      ],
    });

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalUsers: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Error in searchUsers:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while searching users',
    });
  }
};

// Promote user to admin (admin only)
exports.promoteToAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    user.role = 'admin';
    await user.save();

    // Award XP for promotion
    await awardXP(user._id, 100, 'promoted_to_admin');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User promoted to admin successfully',
      data: user,
    });
  } catch (error) {
    logger.error('Error in promoteToAdmin:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while promoting user',
      });
    }
  }
};

// Upgrade user to writer
exports.upgradeToWriter = async (req, res) => {
  try {
    // Only allow the user themselves or an admin to upgrade
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to upgrade this user',
      });
    }

    const user = await User.findById(req.params.id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role === 'writer') {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: 'User is already a writer',
      });
    }

    user.role = 'writer';
    await user.save();

    // Award XP for becoming a writer
    await awardXP(user._id, 50, 'upgraded_to_writer');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User upgraded to writer successfully',
      data: user,
    });
  } catch (error) {
    logger.error('Error in upgradeToWriter:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while upgrading user',
      });
    }
  }
};

// Helper function to award XP
async function awardXP(userId, amount, reason) {
  try {
    await User.findByIdAndUpdate(userId, {
      $inc: { xp: amount },
    });

    // Check for badge achievements
    await checkBadgeAchievements(userId);

    logger.info(`Awarded ${amount} XP to user ${userId} for: ${reason}`);
  } catch (error) {
    logger.error('Error awarding XP:', error);
  }
}

// Helper function to check badge achievements
async function checkBadgeAchievements(userId) {
  try {
    const user = await User.findById(userId);
    const allBadges = await Badge.find();

    // Check for various badge criteria
    const blogCount = await Blog.countDocuments({
      author: userId,
      status: 'published',
    });
    const followerCount = user.followers.length;

    // Example badge checks
    const newBadges = [];

    // First blog badge
    if (blogCount >= 1) {
      const firstBlogBadge = allBadges.find(
        (badge) => badge.name === 'First Blog'
      );
      if (firstBlogBadge && !user.badges.includes(firstBlogBadge._id)) {
        newBadges.push(firstBlogBadge._id);
      }
    }

    // Popular writer badge
    if (followerCount >= 10) {
      const popularBadge = allBadges.find(
        (badge) => badge.name === 'Popular Writer'
      );
      if (popularBadge && !user.badges.includes(popularBadge._id)) {
        newBadges.push(popularBadge._id);
      }
    }

    // Add new badges to user
    if (newBadges.length > 0) {
      await User.findByIdAndUpdate(userId, {
        $addToSet: { badges: { $each: newBadges } },
      });

      // Create notifications for new badges
      for (const badgeId of newBadges) {
        const badge = allBadges.find(
          (b) => b._id.toString() === badgeId.toString()
        );
        await Notification.create({
          userId,
          type: 'badge_earned',
          title: 'Badge Earned!',
          content: `Congratulations! You earned the "${badge.name}" badge!`,
          read: false,
        });
      }
    }
  } catch (error) {
    logger.error('Error checking badge achievements:', error);
  }
}
