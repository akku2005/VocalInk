const { StatusCodes } = require('http-status-codes');

const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

// Get all notifications for a user
exports.getUserNotifications = async (req, res) => {
  try {
    const userId = req.user.id;
    const { page = 1, limit = 20, type, unreadOnly = false } = req.query;

    let query = { userId, isDeleted: false };

    if (type) {
      query.type = type;
    }

    if (unreadOnly === 'true') {
      query.read = false;
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('data.fromUserId', 'name email avatar')
      .populate('data.badgeId', 'name description icon')
      .populate('data.blogId', 'title')
      .exec();

    const total = await Notification.countDocuments(query);
    const unreadCount = await Notification.getUnreadCount(userId);

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

// Get notification by ID
exports.getNotificationById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(id)
      .populate('data.fromUserId', 'name email avatar')
      .populate('data.badgeId', 'name description icon')
      .populate('data.blogId', 'title');

    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Ensure user can only access their own notifications
    if (notification.userId.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You can only view your own notifications',
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: notification,
    });
  } catch (error) {
    logger.error('Error in getNotificationById:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching notification',
      });
    }
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

    await notification.markAsRead();

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

    await Notification.markAllAsRead(userId);

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

// Mark notification as unread
exports.markNotificationUnread = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Ensure user can only mark their own notifications as unread
    if (notification.userId.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You can only mark your own notifications as unread',
      });
    }

    await notification.markAsUnread();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Notification marked as unread',
    });
  } catch (error) {
    logger.error('Error in markNotificationUnread:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while marking notification as unread',
      });
    }
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { notificationId } = req.params;
    const userId = req.user.id;

    const notification = await Notification.findById(notificationId);
    if (!notification) {
      throw new NotFoundError('Notification not found');
    }

    // Ensure user can only delete their own notifications
    if (notification.userId.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You can only delete your own notifications',
      });
    }

    notification.isDeleted = true;
    await notification.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Notification deleted successfully',
    });
  } catch (error) {
    logger.error('Error in deleteNotification:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while deleting notification',
      });
    }
  }
};

// Get notification statistics
exports.getNotificationStats = async (req, res) => {
  try {
    const userId = req.user.id;

    const totalNotifications = await Notification.countDocuments({
      userId,
      isDeleted: false,
    });

    const unreadCount = await Notification.getUnreadCount(userId);

    const notificationsByType = await Notification.aggregate([
      {
        $match: {
          userId: require('mongoose').Types.ObjectId(userId),
          isDeleted: false,
        },
      },
      { $group: { _id: '$type', count: { $sum: 1 } } },
    ]);

    const recentNotifications = await Notification.find({
      userId,
      isDeleted: false,
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('data.fromUserId', 'name avatar');

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        totalNotifications,
        unreadCount,
        readCount: totalNotifications - unreadCount,
        byType: notificationsByType,
        recent: recentNotifications,
      },
    });
  } catch (error) {
    logger.error('Error in getNotificationStats:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching notification statistics',
    });
  }
};

// Create system notification (admin only)
exports.createSystemNotification = async (req, res) => {
  try {
    const {
      userIds,
      title,
      content,
      type = 'system',
      priority = 'normal',
    } = req.body;

    if (!userIds || !Array.isArray(userIds) || userIds.length === 0) {
      throw new ValidationError('User IDs array is required');
    }

    if (!title || !content) {
      throw new ValidationError('Title and content are required');
    }

    const notifications = [];

    for (const userId of userIds) {
      // Verify user exists
      const user = await User.findById(userId);
      if (!user) {
        logger.warn(
          `Attempted to create notification for non-existent user: ${userId}`
        );
        continue;
      }

      const notification = await Notification.create({
        userId,
        type,
        title,
        content,
        priority,
        data: {
          actionUrl: '/notifications',
        },
      });

      notifications.push(notification);
    }

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: `System notification sent to ${notifications.length} users`,
      data: {
        sentCount: notifications.length,
        totalRequested: userIds.length,
      },
    });
  } catch (error) {
    logger.error('Error in createSystemNotification:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while creating system notification',
      });
    }
  }
};

// Get notification preferences
exports.getNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await User.findById(userId).select(
      'emailNotifications pushNotifications marketingEmails notificationSettings'
    );

    if (!user) {
      throw new NotFoundError('User not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications,
        marketingEmails: user.marketingEmails,
        notificationSettings: user.notificationSettings,
      },
    });
  } catch (error) {
    logger.error('Error in getNotificationPreferences:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching notification preferences',
      });
    }
  }
};

// Update notification preferences
exports.updateNotificationPreferences = async (req, res) => {
  try {
    const userId = req.user.id;
    const { emailNotifications, pushNotifications, marketingEmails, notificationSettings } = req.body;

    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Update basic notification preferences
    if (emailNotifications !== undefined) {
      user.emailNotifications = emailNotifications;
    }

    if (pushNotifications !== undefined) {
      user.pushNotifications = pushNotifications;
    }

    if (marketingEmails !== undefined) {
      user.marketingEmails = marketingEmails;
    }

    // Update detailed notification settings
    if (notificationSettings !== undefined) {
      user.notificationSettings = {
        ...user.notificationSettings,
        ...notificationSettings
      };
    }

    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Notification preferences updated successfully',
      data: {
        emailNotifications: user.emailNotifications,
        pushNotifications: user.pushNotifications,
        marketingEmails: user.marketingEmails,
        notificationSettings: user.notificationSettings,
      },
    });
  } catch (error) {
    logger.error('Error in updateNotificationPreferences:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while updating notification preferences',
      });
    }
  }
};
