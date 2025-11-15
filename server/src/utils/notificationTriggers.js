const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const Blog = require('../models/blog.model');
const logger = require('./logger');

/**
 * Notification Triggers
 * Centralized system for creating notifications on various events
 */

class NotificationTriggers {
  /**
   * Create welcome notification for new user
   * @param {Object} user - User object
   */
  static async createWelcomeNotification(user) {
    try {
      await Notification.create({
        userId: user._id,
        type: 'system',
        title: 'Welcome to VocalInk!',
        content: `Hi ${user.firstName}! We're excited to have you join our community. Start by creating your first blog post and exploring AI-powered features like Text-to-Speech, AI summaries, and more!`,
        priority: 'normal',
        data: {
          actionUrl: '/create-blog',
          metadata: {
            isWelcome: true,
            registrationDate: new Date(),
          },
        },
      });
      logger.info('Welcome notification created', { userId: user._id });
    } catch (error) {
      logger.error('Error creating welcome notification:', error);
    }
  }

  /**
   * Create notification when someone likes a blog
   * @param {string} blogId - Blog ID
   * @param {string} likedByUserId - User who liked
   */
  static async createLikeNotification(blogId, likedByUserId) {
    try {
      const blog = await Blog.findById(blogId).populate('author', 'firstName lastName');
      const likedByUser = await User.findById(likedByUserId).select('firstName lastName');

      if (!blog || !likedByUser || !blog.author) return;

      // Don't notify if user likes their own blog
      if (blog.author._id.toString() === likedByUserId.toString()) return;

      await Notification.create({
        userId: blog.author._id,
        type: 'like',
        title: 'New like on your blog',
        content: `${likedByUser.firstName} ${likedByUser.lastName} liked your blog "${blog.title}"`,
        priority: 'normal',
        data: {
          blogId: blog._id,
          fromUserId: likedByUserId,
          actionUrl: `/article/${blog._id}`,
        },
      });
    } catch (error) {
      logger.error('Error creating like notification:', error);
    }
  }

  /**
   * Create notification when someone comments on a blog
   * @param {string} blogId - Blog ID
   * @param {string} commentId - Comment ID
   * @param {string} commentedByUserId - User who commented
   * @param {string} commentContent - Comment content
   */
  static async createCommentNotification(blogId, commentId, commentedByUserId, commentContent) {
    try {
      const blog = await Blog.findById(blogId).populate('author', 'firstName lastName');
      const commentedByUser = await User.findById(commentedByUserId).select('firstName lastName');

      if (!blog || !commentedByUser || !blog.author) return;

      // Don't notify if user comments on their own blog
      if (blog.author._id.toString() === commentedByUserId.toString()) return;

      const excerpt = commentContent.length > 100 
        ? commentContent.substring(0, 100) + '...' 
        : commentContent;

      await Notification.create({
        userId: blog.author._id,
        type: 'comment',
        title: 'New comment on your blog',
        content: `${commentedByUser.firstName} ${commentedByUser.lastName} commented: "${excerpt}"`,
        priority: 'normal',
        data: {
          blogId: blog._id,
          commentId,
          fromUserId: commentedByUserId,
          actionUrl: `/article/${blog._id}#comment-${commentId}`,
        },
      });
    } catch (error) {
      logger.error('Error creating comment notification:', error);
    }
  }

  /**
   * Create notification when someone follows a user
   * @param {string} followedUserId - User being followed
   * @param {string} followerUserId - User who followed
   */
  static async createFollowNotification(followedUserId, followerUserId) {
    try {
      const follower = await User.findById(followerUserId).select('firstName lastName avatar');

      if (!follower) return;

      await Notification.create({
        userId: followedUserId,
        type: 'follow',
        title: 'New follower',
        content: `${follower.firstName} ${follower.lastName} started following you`,
        priority: 'normal',
        data: {
          fromUserId: followerUserId,
          actionUrl: `/profile/${followerUserId}`,
        },
      });
    } catch (error) {
      logger.error('Error creating follow notification:', error);
    }
  }

  /**
   * Create notification when user earns a badge
   * @param {string} userId - User ID
   * @param {Object} badge - Badge object
   */
  static async createBadgeNotification(userId, badge) {
    try {
      await Notification.create({
        userId,
        type: 'badge_earned',
        title: 'Badge earned!',
        content: `Congratulations! You earned the "${badge.name}" badge: ${badge.description}`,
        priority: 'high',
        data: {
          badgeId: badge._id,
          actionUrl: `/badges/${badge._id}`,
          metadata: {
            badgeName: badge.name,
            badgeRarity: badge.rarity,
          },
        },
      });
    } catch (error) {
      logger.error('Error creating badge notification:', error);
    }
  }

  /**
   * Create notification when user levels up
   * @param {string} userId - User ID
   * @param {number} newLevel - New level
   * @param {number} xpGained - XP gained
   */
  static async createLevelUpNotification(userId, newLevel, xpGained) {
    try {
      await Notification.create({
        userId,
        type: 'level_up',
        title: 'Level up!',
        content: `Congratulations! You reached level ${newLevel}. You earned ${xpGained} XP. Keep up the great work!`,
        priority: 'high',
        data: {
          level: newLevel,
          xpGained,
          actionUrl: '/profile/me',
        },
      });
    } catch (error) {
      logger.error('Error creating level up notification:', error);
    }
  }

  /**
   * Create notification when blog is published
   * @param {string} userId - User ID
   * @param {Object} blog - Blog object
   */
  static async createBlogPublishedNotification(userId, blog) {
    try {
      await Notification.create({
        userId,
        type: 'blog_published',
        title: 'Blog published successfully!',
        content: `Your blog "${blog.title}" has been published and is now live. Share it with your followers!`,
        priority: 'normal',
        data: {
          blogId: blog._id,
          actionUrl: `/article/${blog._id}`,
        },
      });
    } catch (error) {
      logger.error('Error creating blog published notification:', error);
    }
  }

  /**
   * Create notification when blog is featured
   * @param {string} userId - User ID
   * @param {Object} blog - Blog object
   */
  static async createBlogFeaturedNotification(userId, blog) {
    try {
      await Notification.create({
        userId,
        type: 'blog_featured',
        title: 'Your blog was featured!',
        content: `Congratulations! Your blog "${blog.title}" has been featured on the homepage. Great work!`,
        priority: 'high',
        data: {
          blogId: blog._id,
          actionUrl: `/article/${blog._id}`,
        },
      });
    } catch (error) {
      logger.error('Error creating blog featured notification:', error);
    }
  }

  /**
   * Create notification when someone replies to a comment
   * @param {string} originalCommenterId - Original commenter ID
   * @param {string} replierUserId - User who replied
   * @param {string} blogId - Blog ID
   * @param {string} commentId - Comment ID
   * @param {string} replyContent - Reply content
   */
  static async createCommentReplyNotification(originalCommenterId, replierUserId, blogId, commentId, replyContent) {
    try {
      // Don't notify if user replies to their own comment
      if (originalCommenterId.toString() === replierUserId.toString()) return;

      const replier = await User.findById(replierUserId).select('firstName lastName');
      const blog = await Blog.findById(blogId).select('title');

      if (!replier || !blog) return;

      const excerpt = replyContent.length > 100 
        ? replyContent.substring(0, 100) + '...' 
        : replyContent;

      await Notification.create({
        userId: originalCommenterId,
        type: 'reply',
        title: 'New reply to your comment',
        content: `${replier.firstName} ${replier.lastName} replied: "${excerpt}"`,
        priority: 'normal',
        data: {
          blogId,
          commentId,
          fromUserId: replierUserId,
          actionUrl: `/article/${blogId}#comment-${commentId}`,
        },
      });
    } catch (error) {
      logger.error('Error creating comment reply notification:', error);
    }
  }

  /**
   * Create notification when someone likes a comment
   * @param {string} commenterId - Comment author ID
   * @param {string} likedByUserId - User who liked
   * @param {string} blogId - Blog ID
   * @param {string} commentId - Comment ID
   */
  static async createCommentLikedNotification(commenterId, likedByUserId, blogId, commentId) {
    try {
      // Don't notify if user likes their own comment
      if (commenterId.toString() === likedByUserId.toString()) return;

      const likedByUser = await User.findById(likedByUserId).select('firstName lastName');

      if (!likedByUser) return;

      await Notification.create({
        userId: commenterId,
        type: 'comment_liked',
        title: 'Someone liked your comment',
        content: `${likedByUser.firstName} ${likedByUser.lastName} liked your comment`,
        priority: 'low',
        data: {
          blogId,
          commentId,
          fromUserId: likedByUserId,
          actionUrl: `/article/${blogId}#comment-${commentId}`,
        },
      });
    } catch (error) {
      logger.error('Error creating comment liked notification:', error);
    }
  }

  /**
   * Create notification for milestone achievements
   * @param {string} userId - User ID
   * @param {string} milestone - Milestone type
   * @param {number} value - Milestone value
   */
  static async createMilestoneNotification(userId, milestone, value) {
    try {
      const milestoneMessages = {
        first_blog: 'Congratulations on publishing your first blog! This is just the beginning of your journey.',
        blogs_10: `Amazing! You've published ${value} blogs. You're becoming a prolific writer!`,
        blogs_50: `Incredible! You've published ${value} blogs. You're a true content creator!`,
        blogs_100: `Legendary! You've published ${value} blogs. You're a VocalInk master!`,
        followers_10: `You've reached ${value} followers! Your content is resonating with the community.`,
        followers_100: `Wow! ${value} followers! You're building an amazing audience.`,
        followers_1000: `Incredible! ${value} followers! You're a VocalInk influencer!`,
        views_1000: `Your content has been viewed ${value} times! Keep creating great content.`,
        views_10000: `Amazing! ${value} total views across all your blogs!`,
        likes_100: `You've received ${value} likes! Your content is loved by the community.`,
      };

      const content = milestoneMessages[milestone] || `Congratulations on reaching this milestone!`;

      await Notification.create({
        userId,
        type: 'achievement',
        title: 'Milestone achieved!',
        content,
        priority: 'high',
        data: {
          milestone,
          value,
          actionUrl: '/profile/me',
        },
      });
    } catch (error) {
      logger.error('Error creating milestone notification:', error);
    }
  }
}

module.exports = NotificationTriggers;
