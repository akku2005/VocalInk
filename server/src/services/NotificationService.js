const Notification = require('../models/notification.model');
const User = require('../models/user.model');
const Badge = require('../models/badge.model');
const EmailService = require('./EmailService');
const webSocketService = require('./WebSocketService');
const logger = require('../utils/logger');

class NotificationService {
  constructor() {
    this.emailService = EmailService;
  }

  /**
   * Attempt to push a realtime notification over WebSocket (best effort)
   */
  async sendRealtimeNotification(userId, notification) {
    try {
      if (!userId || !notification) return;
      webSocketService.sendNotification(userId.toString(), notification);
    } catch (error) {
      logger.debug('WebSocket notification dispatch failed (non-blocking)', { error: error.message });
    }
  }

  /**
   * Send badge earned notification (in-app + email)
   */
  async sendBadgeEarnedNotification(userId, badgeId, xpReward = 0) {
    try {
      const user = await User.findById(userId);
      const badge = await Badge.findById(badgeId);

      if (!user || !badge) {
        logger.error('User or badge not found for notification', { userId, badgeId });
        return;
      }

      // Create in-app notification
      const notification = await Notification.createBadgeNotification(userId, badgeId);
      this.sendRealtimeNotification(userId, notification);

      // Send email notification if user has email notifications enabled
      if (user.emailNotifications !== false) {
        await this.sendBadgeEarnedEmail(user, badge, xpReward);
      }

      logger.info('Badge earned notification sent', {
        userId,
        badgeId,
        notificationId: notification._id,
        emailSent: user.emailNotifications !== false
      });

      return notification;

    } catch (error) {
      logger.error('Error sending badge earned notification:', error);
      throw error;
    }
  }

  /**
   * Send badge eligibility notification
   */
  async sendBadgeEligibilityNotification(userId, badgeId) {
    try {
      const user = await User.findById(userId);
      const badge = await Badge.findById(badgeId);

      if (!user || !badge) {
        logger.error('User or badge not found for eligibility notification', { userId, badgeId });
        return;
      }

      // Create in-app notification
      const notification = await Notification.create({
        userId,
        type: 'achievement',
        title: 'New Badge Available!',
        content: `You're now eligible to earn the "${badge.name}" badge!`,
        data: {
          badgeId,
          actionUrl: `/badges/${badgeId}/claim`,
        },
        priority: 'normal',
      });

      // Send email notification if user has email notifications enabled
      if (user.emailNotifications !== false) {
        await this.sendBadgeEligibilityEmail(user, badge);
      }
      this.sendRealtimeNotification(userId, notification);

      logger.info('Badge eligibility notification sent', {
        userId,
        badgeId,
        notificationId: notification._id,
        emailSent: user.emailNotifications !== false
      });

      return notification;

    } catch (error) {
      logger.error('Error sending badge eligibility notification:', error);
      throw error;
    }
  }

  /**
   * Send level up notification
   */
  async sendLevelUpNotification(userId, newLevel, xpGained) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        logger.error('User not found for level up notification', { userId });
        return;
      }

      // Create in-app notification
      const notification = await Notification.createLevelUpNotification(userId, newLevel, xpGained);
      this.sendRealtimeNotification(userId, notification);

      // Send email notification if user has email notifications enabled
      if (user.emailNotifications !== false) {
        await this.sendLevelUpEmail(user, newLevel, xpGained);
      }

      logger.info('Level up notification sent', {
        userId,
        newLevel,
        xpGained,
        notificationId: notification._id,
        emailSent: user.emailNotifications !== false
      });

      return notification;

    } catch (error) {
      logger.error('Error sending level up notification:', error);
      throw error;
    }
  }

  /**
   * Send achievement milestone notification
   */
  async sendAchievementMilestoneNotification(userId, milestone, data = {}) {
    try {
      const user = await User.findById(userId);

      if (!user) {
        logger.error('User not found for achievement milestone notification', { userId });
        return;
      }

      // Create in-app notification
      const notification = await Notification.create({
        userId,
        type: 'achievement',
        title: 'Achievement Milestone!',
        content: `Congratulations! You've reached a new milestone: ${milestone}`,
        data: {
          ...data,
          actionUrl: `/users/${userId}/achievements`,
        },
        priority: 'high',
      });

      // Send email notification if user has email notifications enabled
      if (user.emailNotifications !== false) {
        await this.sendAchievementMilestoneEmail(user, milestone, data);
      }
      this.sendRealtimeNotification(userId, notification);

      logger.info('Achievement milestone notification sent', {
        userId,
        milestone,
        notificationId: notification._id,
        emailSent: user.emailNotifications !== false
      });

      return notification;

    } catch (error) {
      logger.error('Error sending achievement milestone notification:', error);
      throw error;
    }
  }

  /**
   * Send badge earned email
   */
  async sendBadgeEarnedEmail(user, badge, xpReward) {
    try {
      const subject = `🎉 Congratulations! You earned the "${badge.name}" badge!`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">🎉 Badge Earned!</h1>
            <p style="color: #666; font-size: 18px;">Congratulations, ${user.name}!</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h2 style="color: white; margin-bottom: 15px;">${badge.name}</h2>
            <p style="color: white; margin-bottom: 20px;">${badge.description}</p>
            ${badge.longDescription ? `<p style="color: white; font-style: italic;">${badge.longDescription}</p>` : ''}
          </div>
          
          ${xpReward > 0 ? `
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px; text-align: center;">
              <h3 style="color: #28a745; margin-bottom: 10px;">XP Reward</h3>
              <p style="color: #666; font-size: 18px;">+${xpReward} XP</p>
            </div>
          ` : ''}
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/users/${user._id}/badges" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Your Badges
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 14px;">
              Keep up the great work! Continue engaging with the community to earn more badges.
            </p>
          </div>
        </div>
      `;

      await this.emailService.sendNotificationEmail(user.email, subject, html);

      logger.info('Badge earned email sent', {
        userId: user._id,
        badgeId: badge._id,
        email: user.email
      });

    } catch (error) {
      logger.error('Error sending badge earned email:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Send badge eligibility email
   */
  async sendBadgeEligibilityEmail(user, badge) {
    try {
      const subject = `🏆 New Badge Available: "${badge.name}"`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">🏆 New Badge Available!</h1>
            <p style="color: #666; font-size: 18px;">Great news, ${user.name}!</p>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 30px; border-radius: 10px; margin-bottom: 30px;">
            <h2 style="color: #333; margin-bottom: 15px;">${badge.name}</h2>
            <p style="color: #666; margin-bottom: 20px;">${badge.description}</p>
            ${badge.longDescription ? `<p style="color: #666; font-style: italic;">${badge.longDescription}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/badges/${badge._id}/claim" 
               style="background-color: #28a745; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              Claim Your Badge
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 14px;">
              You've met all the requirements! Click the button above to claim your badge.
            </p>
          </div>
        </div>
      `;

      await this.emailService.sendNotificationEmail(user.email, subject, html);

      logger.info('Badge eligibility email sent', {
        userId: user._id,
        badgeId: badge._id,
        email: user.email
      });

    } catch (error) {
      logger.error('Error sending badge eligibility email:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Send level up email
   */
  async sendLevelUpEmail(user, newLevel, xpGained) {
    try {
      const subject = `🎊 Level Up! You reached Level ${newLevel}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">🎊 Level Up!</h1>
            <p style="color: #666; font-size: 18px;">Congratulations, ${user.name}!</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h2 style="color: white; margin-bottom: 15px;">Level ${newLevel}</h2>
            <p style="color: white; margin-bottom: 20px;">You've reached a new milestone!</p>
            ${xpGained > 0 ? `<p style="color: white;">+${xpGained} XP gained</p>` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/users/${user._id}/profile" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Your Profile
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 14px;">
              Keep engaging with the community to reach even higher levels!
            </p>
          </div>
        </div>
      `;

      await this.emailService.sendNotificationEmail(user.email, subject, html);

      logger.info('Level up email sent', {
        userId: user._id,
        newLevel,
        xpGained,
        email: user.email
      });

    } catch (error) {
      logger.error('Error sending level up email:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Send achievement milestone email
   */
  async sendAchievementMilestoneEmail(user, milestone, data) {
    try {
      const subject = `🏅 Achievement Milestone: ${milestone}`;
      
      const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="text-align: center; margin-bottom: 30px;">
            <h1 style="color: #333; margin-bottom: 10px;">🏅 Achievement Milestone!</h1>
            <p style="color: #666; font-size: 18px;">Congratulations, ${user.name}!</p>
          </div>
          
          <div style="background: linear-gradient(135deg, #ffd700 0%, #ffa500 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
            <h2 style="color: white; margin-bottom: 15px;">${milestone}</h2>
            <p style="color: white; margin-bottom: 20px;">You've reached an amazing milestone!</p>
            ${data.description ? `<p style="color: white; font-style: italic;">${data.description}</p>` : ''}
          </div>
          
          <div style="text-align: center; margin-top: 30px;">
            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/users/${user._id}/achievements" 
               style="background-color: #007bff; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; display: inline-block;">
              View Your Achievements
            </a>
          </div>
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; text-align: center;">
            <p style="color: #999; font-size: 14px;">
              Your dedication and engagement are truly impressive!
            </p>
          </div>
        </div>
      `;

      await this.emailService.sendNotificationEmail(user.email, subject, html);

      logger.info('Achievement milestone email sent', {
        userId: user._id,
        milestone,
        email: user.email
      });

    } catch (error) {
      logger.error('Error sending achievement milestone email:', error);
      // Don't throw error to avoid breaking the main flow
    }
  }

  /**
   * Send bulk notifications to multiple users
   */
  async sendBulkNotifications(userIds, notificationData) {
    try {
      const notifications = [];
      const emailPromises = [];

      for (const userId of userIds) {
        try {
          const user = await User.findById(userId);
          if (!user) continue;

          // Create in-app notification
          const notification = await Notification.create({
            userId,
            ...notificationData
          });

          notifications.push(notification);
          this.sendRealtimeNotification(userId, notification);

          // Queue email notification
          if (user.emailNotifications !== false) {
            emailPromises.push(
              this.emailService.sendNotificationEmail(
                user.email,
                notificationData.title,
                notificationData.html
              ).catch(error => {
                logger.error('Error sending bulk email notification:', error);
              })
            );
          }

        } catch (error) {
          logger.error('Error creating notification for user:', { userId, error });
        }
      }

      // Send emails in parallel
      await Promise.all(emailPromises);

      logger.info('Bulk notifications sent', {
        totalUsers: userIds.length,
        notificationsCreated: notifications.length,
        emailsSent: emailPromises.length
      });

      return notifications;

    } catch (error) {
      logger.error('Error sending bulk notifications:', error);
      throw error;
    }
  }

  /**
   * Get notification statistics
   */
  async getNotificationStats(userId) {
    try {
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

      return {
        totalNotifications,
        unreadCount,
        readCount: totalNotifications - unreadCount,
        byType: notificationsByType,
      };

    } catch (error) {
      logger.error('Error getting notification stats:', error);
      throw error;
    }
  }
}

module.exports = new NotificationService(); 
