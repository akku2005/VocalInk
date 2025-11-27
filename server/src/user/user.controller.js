const { StatusCodes } = require('http-status-codes');

const User = require('../models/user.model');
const Blog = require('../models/blog.model');
const Badge = require('../models/badge.model');
const Notification = require('../models/notification.model');
const EmailService = require('../services/EmailService');
const Series = require('../models/series.model');
const bcrypt = require('bcryptjs');
const {
  ValidationError,
  NotFoundError,
  ConflictError,
} = require('../utils/errors');
const { validatePassword } = require('../utils/sanitize');
const logger = require('../utils/logger');
const mongoose = require('mongoose');
const { sanitizeUsername } = require('../utils/username');
const { canViewProfile } = require('../utils/privacy');

const buildObjectId = (id) => {
  if (!mongoose.Types.ObjectId.isValid(id)) return null;
  return new mongoose.Types.ObjectId(id);
};

const getTotalViewsForUser = async (userId) => {
  const objectId = buildObjectId(userId);
  if (!objectId) return 0;

  const result = await Blog.aggregate([
    {
      $match: {
        author: objectId,
        status: 'published',
      },
    },
    {
      $group: {
        _id: null,
        totalViews: { $sum: { $ifNull: ['$views', 0] } },
      },
    },
  ]);

  return (result[0]?.totalViews) || 0;
};

const ensureProfileVisible = async (targetId, viewerId) => {
  const targetUser = await User.findById(targetId).select('privacySettings followers');
  if (!targetUser) {
    throw new NotFoundError('User not found');
  }

  if (!canViewProfile(viewerId, targetUser)) {
    const error = new ConflictError('Profile is private');
    error.statusCode = StatusCodes.FORBIDDEN;
    throw error;
  }

  return targetUser;
};

// Get current user's detailed profile
exports.getMyProfile = async (req, res) => {
  try {
    logger.info('Fetching user profile for ID:', req.user.id);
    const user = await User.findById(req.user.id)
      .select(
        '-password -resetPasswordToken -resetPasswordCode -resetPasswordExpires -twoFactorSecret'
      )
      .populate('badges', 'name description icon')
      .populate('followers', 'firstName lastName name email avatar profilePicture username')
      .populate('following', 'firstName lastName name email avatar profilePicture username');

    if (!user) {
      logger.warn('User not found for ID:', req.user.id);
      throw new NotFoundError('User not found');
    }
    logger.info('User found:', user._id);

    // Add computed fields
    const profile = user.toObject();
    logger.info('Calculating blogCount...');
    profile.blogCount = await Blog.countDocuments({
      author: user._id,
      status: 'published',
    });
    logger.info('Calculating seriesCount...');
    const publishedSeriesStatuses = ['active', 'completed', 'published']; // include legacy string
    profile.seriesCount = await Series.countDocuments({
      $or: [
        { authorId: user._id, status: { $in: publishedSeriesStatuses } },
        { savedBy: user._id }
      ],
    });
    profile.followerCount = user.followers.length;
    profile.followingCount = user.following.length;

    // Add view counts
    logger.info('Calculating totalViews...');
    profile.totalViews = await getTotalViewsForUser(user._id);

    // Calculate engagement score
    logger.info('Calculating engagementScore...');
    profile.engagementScore = Math.min(100, Math.floor(
      (profile.totalLikes * 0.3 +
        profile.totalComments * 0.4 +
        profile.totalBookmarks * 0.2 +
        profile.totalShares * 0.1) / 10
    ));

    // Calculate level based on XP
    profile.level = Math.floor(profile.xp / 100) + 1;

    // Ensure coverImage is included
    if (!profile.coverImage) {
      profile.coverImage = null;
    }

    // Ensure twoFactorEnabled is included for frontend 2FA status display
    profile.twoFactorEnabled = user.twoFactorEnabled || false;

    res.status(StatusCodes.OK).json({
      success: true,
      data: profile,
    });
  } catch (error) {
    logger.error('Error in getMyProfile:', error.message, error.stack);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching profile',
      });
    }
  }
};

// Get user profile by ID
exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select(
        '-password -resetPasswordToken -resetPasswordCode -resetPasswordExpires -twoFactorSecret'
      )
      .populate('badges', 'name description icon')
      .populate('followers', 'firstName lastName name email avatar profilePicture username')
      .populate('following', 'firstName lastName name email avatar profilePicture username');

    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Add computed fields
    const profile = user.toObject();
    profile.blogCount = await Blog.countDocuments({
      author: user._id,
      status: 'published',
    });
    const publishedSeriesStatuses = ['active', 'completed', 'published']; // include legacy string
    const seriesCountQuery = {
      authorId: user._id,
      status: { $in: publishedSeriesStatuses },
    };

    // If viewing own profile, include saved series in count
    if (req.user && req.user.id.toString() === user._id.toString()) {
      profile.seriesCount = await Series.countDocuments({
        $or: [
          seriesCountQuery,
          { savedBy: user._id },
        ],
      });
    } else {
      profile.seriesCount = await Series.countDocuments(seriesCountQuery);
    }
    profile.followerCount = user.followers.length;
    profile.followingCount = user.following.length;

    // Add view counts
    profile.totalViews = await getTotalViewsForUser(user._id);

    // Check if current user is following
    if (req.user) {
      logger.info('getProfile - Viewer:', req.user._id);
      logger.info('getProfile - Target:', user._id);
      logger.info('getProfile - Viewer Following Count:', req.user.following?.length);

      // Use req.user.following as source of truth since that's what followUser checks
      // req.user.following is an array of IDs (ref: 'User')
      profile.isFollowing = req.user.following.some(
        (followingId) => {
          const isMatch = followingId.toString() === user._id.toString();
          if (isMatch) logger.info('getProfile - Found match in following list');
          return isMatch;
        }
      );
      logger.info('getProfile - Calculated isFollowing:', profile.isFollowing);
    } else {
      logger.info('getProfile - No req.user, isFollowing = false');
      profile.isFollowing = false;
    }

    // DEBUG: Inject debug info into response
    profile.debug_reqUser = req.user ? 'Present' : 'Missing';
    profile.debug_viewerId = req.user ? req.user._id : null;
    profile.debug_followingCount = req.user && req.user.following ? req.user.following.length : 'N/A';
    profile.debug_isFollowing = profile.isFollowing;

    res.status(StatusCodes.OK).json({
      success: true,
      data: profile,
      _debug_server_timestamp: new Date().toISOString(),
      _debug_controller_version: 'v2-fix-check'
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
      'coverImage',
      'socialLinks',
      'firstName',
      'lastName',
      'displayName',
      'location',
      // Account settings
      'emailNotifications',
      'pushNotifications',
      'marketingEmails',
      'accountVisibility',
      'notificationSettings',
    ];


    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    if (req.body.username !== undefined) {
      const sanitizedUsername = sanitizeUsername(req.body.username);
      if (!sanitizedUsername) {
        throw new ValidationError('Username must be 3-30 characters and may contain only letters, numbers, dots, or underscores');
      }

      const existingUsername = await User.findOne({
        username: sanitizedUsername,
        _id: { $ne: userId },
      });

      if (existingUsername) {
        throw new ConflictError('Username is already taken');
      }

      updates.username = sanitizedUsername;
    }

    const user = await User.findByIdAndUpdate(userId, updates, {
      new: true,
      runValidators: true,
    })
      .select(
        '-password -resetPasswordToken -resetPasswordCode -resetPasswordExpires -twoFactorSecret -followers -following'
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
    const NotificationTriggers = require('../utils/notificationTriggers');
    await NotificationTriggers.createFollowNotification(targetUserId, followerId)
      .catch(err => logger.error('Failed to create follow notification', err));

    // Send email notification
    // Check both global email toggle and specific new follower toggle
    if (targetUser.notificationSettings?.emailNotifications && targetUser.notificationSettings?.newFollowers) {
      const followerProfileUrl = `${process.env.FRONTEND_URL}/profile/${followerId}`;
      await EmailService.sendFollowerNotificationEmail(
        targetUser.email,
        targetUser.name,
        follower.name,
        followerProfileUrl
      ).catch(err => logger.error('Failed to send follower email notification', err));
    }

    // Award XP for following (engagement)
    await awardXP(followerId, 5, 'follow_user');

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Successfully followed user',
      data: {
        isFollowing: true,
        followerCount: targetUser.followers.length + 1
      }
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
      data: {
        isFollowing: false,
        followerCount: Math.max(0, targetUser.followers.length - 1)
      }
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

// Remove a follower from current user's followers list
exports.removeFollower = async (req, res) => {
  try {
    const { followerId } = req.params;
    const currentUserId = req.user.id;

    // Ensure user exists
    const follower = await User.findById(followerId);
    if (!follower) {
      throw new NotFoundError('Follower not found');
    }

    // Remove follower from current user's followers
    await User.findByIdAndUpdate(currentUserId, {
      $pull: { followers: followerId },
    });

    // Remove current user from follower's following
    await User.findByIdAndUpdate(followerId, {
      $pull: { following: currentUserId },
    });

    // Recalculate follower count
    const updatedUser = await User.findById(currentUserId).select('followers');
    const followerCount = updatedUser?.followers?.length || 0;

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Follower removed successfully',
      data: {
        followerCount,
        removedFollowerId: followerId,
      },
    });
  } catch (error) {
    logger.error('Error in removeFollower:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while removing follower',
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

    const authorObjectId = new mongoose.Types.ObjectId(id);
    const query = { author: authorObjectId };
    if (status !== 'all') {
      query.status = status;
    }

    const numericLimit = Math.max(1, parseInt(limit, 10) || 10);
    const numericPage = Math.max(1, parseInt(page, 10) || 1);
    const skip = (numericPage - 1) * numericLimit;

    const blogs = await Blog.aggregate([
      { $match: query },
      { $sort: { createdAt: -1 } },
      { $skip: skip },
      { $limit: numericLimit },
      {
        $lookup: {
          from: 'comments',
          let: { blogId: '$_id' },
          pipeline: [
            { $match: { $expr: { $eq: ['$blogId', '$$blogId'] }, status: 'active' } },
            { $count: 'count' }
          ],
          as: 'commentStats'
        }
      },
      {
        $addFields: {
          commentCount: { $ifNull: [{ $arrayElemAt: ['$commentStats.count', 0] }, 0] },
          views: {
            $ifNull: [
              '$views',
              '$analytics.totalViews',
              0
            ]
          },
          totalViews: {
            $ifNull: [
              '$analytics.totalViews',
              '$views',
              0
            ]
          }
        }
      },
      {
        $project: {
          title: 1,
          slug: 1,
          content: 1,
          summary: 1,
          coverImage: 1,
          tags: 1,
          mood: 1,
          language: 1,
          status: 1,
          publishedAt: 1,
          createdAt: 1,
          updatedAt: 1,
          likes: 1,
          commentCount: 1,
          views: 1,
          totalViews: 1,
          shares: 1,
          bookmarks: 1,
          likedBy: 1,
          bookmarkedBy: 1,
          author: 1,
        }
      }
    ]);

    const total = await Blog.countDocuments(query);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: numericPage,
          totalPages: Math.ceil(total / numericLimit),
          totalBlogs: total,
          hasNext: numericPage * numericLimit < total,
          hasPrev: numericPage > 1,
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

const paginateUserContent = async (req, res, filter) => {
  try {
    const { id } = req.params;
    const viewerId = req.user?.id;
    await ensureProfileVisible(id, viewerId);

    const { page = 1, limit = 10 } = req.query;
    const numericPage = Math.max(1, parseInt(page, 10) || 1);
    const numericLimit = Math.min(20, Math.max(5, parseInt(limit, 10) || 10));

    const query = {
      status: 'published',
      ...filter,
    };

    const blogsPromise = Blog.find(query)
      .populate('author', 'name email avatar')
      .sort({ createdAt: -1 })
      .skip((numericPage - 1) * numericLimit)
      .limit(numericLimit)
      .lean();

    const countPromise = Blog.countDocuments(query);

    const [blogs, total] = await Promise.all([blogsPromise, countPromise]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        blogs,
        pagination: {
          currentPage: numericPage,
          totalPages: Math.ceil(total / numericLimit),
          totalBlogs: total,
          hasNext: numericPage * numericLimit < total,
          hasPrev: numericPage > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Error in paginateUserContent:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching user content',
      });
    }
  }
};

exports.getUserLikedBlogs = async (req, res) => {
  await paginateUserContent(req, res, { likedBy: buildObjectId(req.params.id) });
};

exports.getUserBookmarkedBlogs = async (req, res) => {
  await paginateUserContent(req, res, { bookmarkedBy: buildObjectId(req.params.id) });
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

// Search users with privacy-aware filters
exports.searchUsers = async (req, res) => {
  try {
    const { q, page = 1, limit = 20 } = req.query;
    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const limitNumber = Math.min(50, Math.max(5, parseInt(limit, 10) || 20));

    if (!q || q.trim().length < 2) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Search query must be at least 2 characters long',
      });
    }

    const { safeRegExp } = require('../utils/secureParser');
    const searchRegex = safeRegExp(q, 'i');
    if (!searchRegex) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid search query',
      });
    }

    const viewerId = req.user ? req.user.id : null;
    const viewerObjectId = viewerId ? mongoose.Types.ObjectId(viewerId) : null;

    const visibilityClause = viewerObjectId
      ? {
        $or: [
          { 'privacySettings.profileVisibility': 'public' },
          { _id: viewerObjectId },
          {
            'privacySettings.profileVisibility': { $in: ['followers', 'private'] },
            followers: viewerObjectId,
          },
        ],
      }
      : { 'privacySettings.profileVisibility': 'public' };

    const match = {
      $and: [
        { 'privacySettings.allowSearch': { $ne: false } },
        visibilityClause,
        {
          $or: [
            { username: searchRegex },
            { displayName: searchRegex },
            { firstName: searchRegex },
            { lastName: searchRegex },
            { email: searchRegex },
            { bio: searchRegex },
          ],
        },
      ],
    };

    const projection = '-password -resetPasswordToken -resetPasswordCode -resetPasswordExpires -twoFactorSecret -followers -following';

    const [users, total] = await Promise.all([
      User.find(match)
        .select(projection)
        .populate('badges', 'name description icon')
        .sort({ displayName: 1, username: 1 })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .lean(),
      User.countDocuments(match),
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        users,
        pagination: {
          currentPage: pageNumber,
          totalPages: Math.ceil(total / limitNumber),
          totalUsers: total,
          hasNext: pageNumber * limitNumber < total,
          hasPrev: pageNumber > 1,
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

exports.checkUsernameAvailability = async (req, res) => {
  try {
    const { username } = req.query;
    if (!username) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Username query parameter is required',
      });
    }

    const sanitizedUsername = sanitizeUsername(username);
    if (!sanitizedUsername) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Invalid username provided',
      });
    }

    const existing = await User.findOne({ username: sanitizedUsername });
    const requesterId = req.user?.id;
    const available =
      !existing || (requesterId && existing._id.toString() === requesterId);

    res.status(StatusCodes.OK).json({
      success: true,
      available,
      username: sanitizedUsername,
    });
  } catch (error) {
    logger.error('Error checking username availability:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to check username availability',
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

// Change user password
exports.changePassword = async (req, res) => {
  try {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Current password and new password are required',
      });
    }

    // Validate new password with standardized requirements
    const passwordValidation = validatePassword(newPassword);
    if (!passwordValidation.isValid) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Password does not meet security requirements',
        details: passwordValidation.errors,
      });
    }

    // Get user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Current password is incorrect',
      });
    }

    // SECURITY FIX: Use save() to trigger pre-save hook for password hashing
    // Pre-save hook in user.model.js will handle hashing automatically
    user.password = newPassword;
    user.passwordChangedAt = new Date();
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Password changed successfully',
    });
  } catch (error) {
    logger.error('Error in changePassword:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while changing password',
      });
    }
  }
};

// Get user's series
exports.getUserSeries = async (req, res) => {
  try {
    const { id } = req.params;
    const { page = 1, limit = 10, status } = req.query;
    const requesterId = req.user?.id;
    const isOwnerOrAdmin = requesterId && (requesterId.toString() === id.toString() || req.user?.role === 'admin');

    const user = await User.findById(id);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Default to publicly viewable, published series for other users
    const publishedSeriesStatuses = ['active', 'completed', 'published'];
    const allowedStatuses = ['draft', 'active', 'completed', 'archived', 'suspended', 'published'];

    const query = isOwnerOrAdmin
      ? {
        $or: [
          { authorId: id },
          { savedBy: id }
        ]
      }
      : { authorId: id };

    if (isOwnerOrAdmin) {
      if (status === 'all') {
        // no additional status filter
      } else if (status && allowedStatuses.includes(status)) {
        query.status = status;
      } else {
        // Default for owner: show everything they created
        // (no status filter so drafts/archived are visible to the creator)
      }
    } else {
      // Public viewers only see public, published series
      query.visibility = 'public';
      query.status = { $in: publishedSeriesStatuses };
    }

    const numericPage = Math.max(1, parseInt(page, 10) || 1);
    const numericLimit = Math.min(50, Math.max(5, parseInt(limit, 10) || 10));

    const series = await Series.find(query)
      .populate('authorId', 'name email avatar username')
      .sort({ createdAt: -1 })
      .limit(numericLimit)
      .skip((numericPage - 1) * numericLimit)
      .exec();

    const total = await Series.countDocuments(query);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        series,
        pagination: {
          currentPage: numericPage,
          totalPages: Math.ceil(total / numericLimit),
          totalSeries: total,
          hasNext: numericPage * numericLimit < total,
          hasPrev: numericPage > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Error in getUserSeries:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching user series',
      });
    }
  }
};
