const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const Blog = require('../models/blog.model');
const logger = require('./logger');

/**
 * Seed sample notifications for testing
 * This creates various types of notifications for the authenticated user
 */
async function seedNotifications(userId) {
  try {
    logger.info('Seeding notifications for user:', userId);

    // Get user info
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Get a sample blog if exists (optional, don't fail if Blog model has issues)
    let sampleBlog = null;
    try {
      sampleBlog = await Blog.findOne({ author: userId }).lean();
    } catch (blogError) {
      logger.warn('Could not fetch sample blog:', blogError.message);
    }

    const notifications = [];
    
    logger.info('User found:', { userId, firstName: user.firstName, blogCount: sampleBlog ? 1 : 0 });

    // 1. Welcome notification (system)
    notifications.push({
      userId,
      type: 'system',
      title: 'Welcome to VocalInk!',
      content: `Hi ${user.firstName}! We're excited to have you join our community. Start by creating your first blog post and exploring AI-powered features.`,
      priority: 'normal',
      read: false,
      data: {
        actionUrl: '/create-blog',
        metadata: {
          isWelcome: true,
        },
      },
    });

    // 2. Like notification
    notifications.push({
      userId,
      type: 'like',
      title: 'New like on your blog',
      content: sampleBlog 
        ? `Someone liked your blog "${sampleBlog.title}"`
        : 'Someone liked your blog post',
      priority: 'normal',
      read: false,
      data: {
        blogId: sampleBlog?._id,
        actionUrl: sampleBlog ? `/article/${sampleBlog._id}` : '/my-blogs',
      },
    });

    // 3. Comment notification
    notifications.push({
      userId,
      type: 'comment',
      title: 'New comment on your blog',
      content: sampleBlog
        ? `Someone commented: "Great insights! This really helped me understand the topic better."`
        : 'Someone commented on your blog',
      priority: 'normal',
      read: false,
      data: {
        blogId: sampleBlog?._id,
        actionUrl: sampleBlog ? `/article/${sampleBlog._id}` : '/my-blogs',
      },
    });

    // 4. Follow notification
    notifications.push({
      userId,
      type: 'follow',
      title: 'New follower',
      content: 'Someone started following you',
      priority: 'normal',
      read: true,
      data: {
        actionUrl: '/profile/me',
      },
    });

    // 5. Level up notification
    notifications.push({
      userId,
      type: 'level_up',
      title: 'Level up!',
      content: 'Congratulations! You reached level 5! Keep up the great work!',
      priority: 'high',
      read: true,
      data: {
        level: 5,
        xpGained: 500,
        actionUrl: '/profile/me',
      },
    });

    // 6. Level up notification (another one)
    notifications.push({
      userId,
      type: 'level_up',
      title: 'Level up!',
      content: 'Congratulations! You reached level 4!',
      priority: 'high',
      read: true,
      data: {
        level: 4,
        xpGained: 400,
        actionUrl: '/profile/me',
      },
    });

    // 7. Badge earned notification
    notifications.push({
      userId,
      type: 'badge_earned',
      title: 'Badge earned!',
      content: 'Congratulations! You earned the "First Blog" badge for publishing your first blog post',
      priority: 'high',
      read: true,
      data: {
        actionUrl: '/badges',
        metadata: {
          badgeName: 'First Blog',
          badgeRarity: 'common',
        },
      },
    });

    // 8. Blog published notification
    if (sampleBlog) {
      notifications.push({
        userId,
        type: 'blog_published',
        title: 'Blog published successfully!',
        content: `Your blog "${sampleBlog.title}" has been published and is now live. Share it with your followers!`,
        priority: 'normal',
        read: true,
        data: {
          blogId: sampleBlog._id,
          actionUrl: `/article/${sampleBlog._id}`,
        },
      });
    }

    // 9. Reply notification
    notifications.push({
      userId,
      type: 'reply',
      title: 'New reply to your comment',
      content: 'Someone replied: "I totally agree with your point! Thanks for sharing."',
      priority: 'normal',
      read: false,
      data: {
        blogId: sampleBlog?._id,
        actionUrl: sampleBlog ? `/article/${sampleBlog._id}` : '/my-blogs',
      },
    });

    // 10. Achievement notification
    notifications.push({
      userId,
      type: 'achievement',
      title: 'Milestone achieved!',
      content: 'Amazing! You\'ve published 10 blogs. You\'re becoming a prolific writer!',
      priority: 'high',
      read: true,
      data: {
        milestone: 'blogs_10',
        value: 10,
        actionUrl: '/profile/me',
      },
    });

    // Create all notifications
    const created = await Notification.insertMany(notifications);
    
    logger.info(`Successfully seeded ${created.length} notifications for user ${userId}`);
    
    return {
      success: true,
      count: created.length,
      notifications: created,
    };
  } catch (error) {
    logger.error('Error seeding notifications:', error);
    throw error;
  }
}

/**
 * Clear all notifications for a user
 */
async function clearNotifications(userId) {
  try {
    const result = await Notification.deleteMany({ userId });
    logger.info(`Cleared ${result.deletedCount} notifications for user ${userId}`);
    return {
      success: true,
      deletedCount: result.deletedCount,
    };
  } catch (error) {
    logger.error('Error clearing notifications:', error);
    throw error;
  }
}

module.exports = {
  seedNotifications,
  clearNotifications,
};
