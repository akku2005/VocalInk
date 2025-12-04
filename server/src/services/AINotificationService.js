const logger = require('../utils/logger');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const EmailService = require('./EmailService');

class AINotificationService {
  constructor() {
    this.emailService = EmailService;

    // User engagement patterns cache
    this.userEngagementCache = new Map();
    this.lastCacheUpdate = null;
  }

  /**
   * Predict optimal timing for notifications
   */
  async predictOptimalTiming(userId, notificationType, options = {}) {
    try {
      const {
        timezone = 'UTC',
        urgency = 'normal',
        contentType = 'general'
      } = options;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user engagement patterns
      const engagementPatterns = await this.analyzeUserEngagement(userId);

      // Get user's timezone preferences
      const userTimezone = user.timezone || timezone;

      // Calculate optimal timing based on patterns
      const optimalTime = this.calculateOptimalTime(engagementPatterns, userTimezone, urgency, contentType);

      logger.info('Optimal timing predicted', {
        userId,
        notificationType,
        optimalTime,
        timezone: userTimezone
      });

      return {
        optimalTime,
        timezone: userTimezone,
        confidence: optimalTime.confidence,
        alternativeTimes: optimalTime.alternatives
      };

    } catch (error) {
      logger.error('Error predicting optimal timing:', error);
      // Return default timing
      return {
        optimalTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // 2 hours from now
        timezone: 'UTC',
        confidence: 0.5,
        alternativeTimes: []
      };
    }
  }

  /**
   * Personalize notification content
   */
  async personalizeNotification(userId, template, options = {}) {
    try {
      const {
        notificationType = 'general',
        includePersonalization = true,
        includeRecommendations = false
      } = options;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let personalizedContent = { ...template };

      if (includePersonalization) {
        // Personalize title
        personalizedContent.title = this.personalizeTitle(template.title, user);

        // Personalize content
        personalizedContent.content = this.personalizeContent(template.content, user);

        // Add user-specific data
        personalizedContent.data = {
          ...template.data,
          userName: user.name,
          userLevel: user.level,
          userXP: user.xp,
          userBadges: user.badges?.length || 0
        };
      }

      if (includeRecommendations) {
        // Add personalized recommendations
        const recommendations = await this.generatePersonalizedRecommendations(userId);
        personalizedContent.recommendations = recommendations;
      }

      // Add engagement hooks
      personalizedContent.engagementHooks = this.generateEngagementHooks(user, notificationType);

      logger.info('Notification personalized', {
        userId,
        notificationType,
        personalizationLevel: includePersonalization ? 'full' : 'basic'
      });

      return personalizedContent;

    } catch (error) {
      logger.error('Error personalizing notification:', error);
      return template; // Return original template on error
    }
  }

  /**
   * Predict notification engagement
   */
  async predictEngagement(userId, notificationData, options = {}) {
    try {
      const {
        notificationType = 'general',
        includeUserHistory = true,
        includeContentAnalysis = true
      } = options;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      let engagementScore = 0;
      const factors = {};

      // User engagement history
      if (includeUserHistory) {
        const userEngagement = await this.analyzeUserEngagement(userId);
        factors.userHistory = this.calculateUserEngagementScore(userEngagement, notificationType);
        engagementScore += factors.userHistory * 0.4;
      }

      // Content analysis
      if (includeContentAnalysis) {
        factors.contentAnalysis = this.analyzeNotificationContent(notificationData);
        engagementScore += factors.contentAnalysis * 0.3;
      }

      // Timing analysis
      const timingScore = await this.analyzeNotificationTiming(userId, notificationType);
      factors.timing = timingScore;
      engagementScore += timingScore * 0.2;

      // User preferences
      const preferenceScore = this.analyzeUserPreferences(user, notificationType);
      factors.preferences = preferenceScore;
      engagementScore += preferenceScore * 0.1;

      // Calculate confidence
      const confidence = this.calculateEngagementConfidence(factors);

      const prediction = {
        score: Math.min(Math.max(engagementScore, 0), 1),
        confidence,
        factors,
        recommendation: this.getEngagementRecommendation(engagementScore, factors)
      };

      logger.info('Engagement prediction completed', {
        userId,
        notificationType,
        score: prediction.score,
        confidence: prediction.confidence
      });

      return prediction;

    } catch (error) {
      logger.error('Error predicting engagement:', error);
      return {
        score: 0.5,
        confidence: 0.3,
        factors: {},
        recommendation: 'Unable to predict engagement'
      };
    }
  }

  /**
   * Generate smart notification summaries
   */
  async generateSmartSummaries(content, options = {}) {
    try {
      const {
        maxLength = 150,
        style = 'concise',
        includeKeyPoints = true,
        includeActionItems = false
      } = options;

      const summaries = {
        short: '',
        medium: '',
        long: '',
        keyPoints: [],
        actionItems: []
      };

      // Generate different length summaries
      summaries.short = this.generateSummary(content, Math.floor(maxLength * 0.6), 'concise');
      summaries.medium = this.generateSummary(content, maxLength, style);
      summaries.long = this.generateSummary(content, Math.floor(maxLength * 1.5), 'detailed');

      // Extract key points
      if (includeKeyPoints) {
        summaries.keyPoints = this.extractKeyPoints(content);
      }

      // Extract action items
      if (includeActionItems) {
        summaries.actionItems = this.extractActionItems(content);
      }

      logger.info('Smart summaries generated', {
        contentLength: content.length,
        summaryCount: Object.keys(summaries).length
      });

      return summaries;

    } catch (error) {
      logger.error('Error generating smart summaries:', error);
      return {
        short: content.substring(0, 100) + '...',
        medium: content.substring(0, 150) + '...',
        long: content.substring(0, 200) + '...',
        keyPoints: [],
        actionItems: []
      };
    }
  }

  /**
   * Send intelligent notifications
   */
  async sendIntelligentNotification(userId, notificationData, options = {}) {
    try {
      const {
        predictTiming = true,
        personalize = true,
        predictEngagement = true,
        includeSummary = true
      } = options;

      // Predict optimal timing
      let sendTime = new Date();
      if (predictTiming) {
        const timingPrediction = await this.predictOptimalTiming(userId, notificationData.type);
        sendTime = timingPrediction.optimalTime;
      }

      // Personalize content
      let personalizedData = notificationData;
      if (personalize) {
        personalizedData = await this.personalizeNotification(userId, notificationData, {
          includePersonalization: true,
          includeRecommendations: true
        });
      }

      // Predict engagement
      let engagementPrediction = null;
      if (predictEngagement) {
        engagementPrediction = await this.predictEngagement(userId, personalizedData);
      }

      // Generate summary if needed
      if (includeSummary && personalizedData.content) {
        const summaries = await this.generateSmartSummaries(personalizedData.content);
        personalizedData.summary = summaries.short;
        personalizedData.keyPoints = summaries.keyPoints;
      }

      // Create notification
      const notification = await Notification.create({
        userId,
        ...personalizedData,
        scheduledFor: sendTime,
        engagementPrediction
      });

      // Send email if user has email notifications enabled
      if (personalizedData.sendEmail && user.emailNotifications !== false) {
        await this.sendEmailNotification(user.email, personalizedData);
      }

      logger.info('Intelligent notification sent', {
        userId,
        notificationId: notification._id,
        sendTime,
        engagementScore: engagementPrediction?.score
      });

      return {
        notification,
        timing: sendTime,
        engagement: engagementPrediction,
        personalization: personalize
      };

    } catch (error) {
      logger.error('Error sending intelligent notification:', error);
      throw error;
    }
  }

  /**
   * Notify user of level up
   */
  async notifyLevelUp(userId, level, xpGained) {
    try {
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Only send if email notifications are enabled
      if (user.emailNotifications === false) {
        return;
      }

      const subject = `🎉 Level Up! You've reached Level ${level}!`;

      const html = `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <div style="background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); padding: 40px 20px; text-align: center;">
            <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 800;">Level Up!</h1>
            <p style="color: rgba(255,255,255,0.9); font-size: 18px; margin-top: 10px;">Congratulations, ${user.name}!</p>
          </div>
          
          <div style="padding: 40px 30px; text-align: center;">
            <div style="background-color: #f3f4f6; border-radius: 16px; padding: 30px; margin-bottom: 30px;">
              <h2 style="color: #ea580c; font-size: 48px; margin: 0; font-weight: 800;">Level ${level}</h2>
              <p style="color: #4b5563; font-size: 16px; margin: 10px 0 0;">You've reached a new milestone!</p>
              <div style="margin-top: 20px; display: inline-block; background-color: rgba(234, 88, 12, 0.1); color: #ea580c; padding: 8px 16px; border-radius: 20px; font-weight: 600;">
                +${xpGained} XP gained
              </div>
            </div>

            <p style="color: #374151; font-size: 16px; line-height: 1.6; margin-bottom: 30px;">
              Your dedication is paying off. You're unlocking new possibilities and establishing yourself as a key member of the VocalInk community.
            </p>

            <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/profile/${user.username || user._id}" 
               style="display: inline-block; background-color: #3b82f6; color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: 600; font-size: 16px; transition: background-color 0.2s;">
              View Your Profile
            </a>
          </div>

          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e5e7eb;">
            <p style="color: #9ca3af; font-size: 14px; margin: 0;">
              Keep engaging with the community to reach even higher levels!
            </p>
          </div>
        </div>
      `;

      await this.emailService.sendNotificationEmail(user.email, subject, html);

      logger.info('Level up notification sent', {
        userId,
        level,
        email: user.email
      });

    } catch (error) {
      logger.error('Error sending level up notification:', error);
      // Don't throw, just log
    }
  }

  /**
   * Analyze user engagement patterns
   */
  async analyzeUserEngagement(userId) {
    try {
      // Check cache first
      const cacheKey = `engagement_${userId}`;
      if (this.userEngagementCache.has(cacheKey)) {
        const cached = this.userEngagementCache.get(cacheKey);
        if (Date.now() - cached.timestamp < 60 * 60 * 1000) { // 1 hour cache
          return cached.data;
        }
      }

      // Get user's notification history
      const notifications = await Notification.find({ userId })
        .sort({ createdAt: -1 })
        .limit(100);

      // Get user's activity patterns
      const user = await User.findById(userId);

      const patterns = {
        notificationOpenRate: this.calculateOpenRate(notifications),
        preferredTimes: this.analyzePreferredTimes(notifications),
        preferredTypes: this.analyzePreferredTypes(notifications),
        activityLevel: this.calculateActivityLevel(user),
        timezone: user.timezone || 'UTC'
      };

      // Cache the results
      this.userEngagementCache.set(cacheKey, {
        data: patterns,
        timestamp: Date.now()
      });

      return patterns;

    } catch (error) {
      logger.error('Error analyzing user engagement:', error);
      return {
        notificationOpenRate: 0.5,
        preferredTimes: [],
        preferredTypes: [],
        activityLevel: 'medium',
        timezone: 'UTC'
      };
    }
  }

  /**
   * Calculate optimal timing based on patterns
   */
  calculateOptimalTime(patterns, timezone, urgency, contentType) {
    try {
      const now = new Date();
      let optimalTime = new Date(now.getTime() + 2 * 60 * 60 * 1000); // Default: 2 hours from now
      let confidence = 0.5;
      const alternatives = [];

      // Adjust based on urgency
      if (urgency === 'high') {
        optimalTime = new Date(now.getTime() + 30 * 60 * 1000); // 30 minutes
        confidence = 0.8;
      } else if (urgency === 'low') {
        optimalTime = new Date(now.getTime() + 6 * 60 * 60 * 1000); // 6 hours
        confidence = 0.6;
      }

      // Adjust based on user's preferred times
      if (patterns.preferredTimes.length > 0) {
        const preferredTime = this.findNextPreferredTime(patterns.preferredTimes, timezone);
        if (preferredTime) {
          optimalTime = preferredTime;
          confidence = Math.min(confidence + 0.2, 1.0);
        }
      }

      // Generate alternative times
      alternatives.push(
        new Date(optimalTime.getTime() + 2 * 60 * 60 * 1000),
        new Date(optimalTime.getTime() - 2 * 60 * 60 * 1000)
      );

      return {
        optimalTime,
        confidence,
        alternatives
      };

    } catch (error) {
      logger.error('Error calculating optimal time:', error);
      return {
        optimalTime: new Date(Date.now() + 2 * 60 * 60 * 1000),
        confidence: 0.5,
        alternatives: []
      };
    }
  }

  /**
   * Personalize notification title
   */
  personalizeTitle(title, user) {
    let personalizedTitle = title;

    // Add user's name if not present
    if (!personalizedTitle.includes(user.name)) {
      personalizedTitle = personalizedTitle.replace(/^/, `${user.name}, `);
    }

    // Add level-specific messaging
    if (user.level > 10) {
      personalizedTitle = personalizedTitle.replace(/!/, '! 🏆');
    } else if (user.level > 5) {
      personalizedTitle = personalizedTitle.replace(/!/, '! ⭐');
    }

    return personalizedTitle;
  }

  /**
   * Personalize notification content
   */
  personalizeContent(content, user) {
    let personalizedContent = content;

    // Replace placeholders
    personalizedContent = personalizedContent
      .replace(/\{userName\}/g, user.name)
      .replace(/\{userLevel\}/g, user.level)
      .replace(/\{userXP\}/g, user.xp)
      .replace(/\{badgeCount\}/g, user.badges?.length || 0);

    // Add personalized elements
    if (user.level > 10) {
      personalizedContent += '\n\nYou\'re a VocalInk veteran! Keep inspiring others.';
    } else if (user.level > 5) {
      personalizedContent += '\n\nYou\'re making great progress! Keep it up.';
    } else {
      personalizedContent += '\n\nWelcome to the VocalInk community!';
    }

    return personalizedContent;
  }

  /**
   * Generate engagement hooks
   */
  generateEngagementHooks(user, notificationType) {
    const hooks = [];

    // Level-based hooks
    if (user.level < 5) {
      hooks.push('Complete your profile to unlock more features');
      hooks.push('Write your first blog to earn XP');
    } else if (user.level < 10) {
      hooks.push('You\'re close to the next level!');
      hooks.push('Share your knowledge with the community');
    } else {
      hooks.push('You\'re a top contributor!');
      hooks.push('Mentor new members');
    }

    // Type-specific hooks
    switch (notificationType) {
      case 'badge_earned':
        hooks.push('Show off your new badge!');
        break;
      case 'level_up':
        hooks.push('Unlock new features with your level');
        break;
      case 'blog_published':
        hooks.push('Engage with your readers');
        break;
      default:
        hooks.push('Stay active to earn more rewards');
    }

    return hooks;
  }

  /**
   * Calculate user engagement score
   */
  calculateUserEngagementScore(patterns, notificationType) {
    let score = patterns.notificationOpenRate;

    // Adjust based on preferred types
    if (patterns.preferredTypes.includes(notificationType)) {
      score += 0.2;
    }

    // Adjust based on activity level
    switch (patterns.activityLevel) {
      case 'high':
        score += 0.1;
        break;
      case 'low':
        score -= 0.1;
        break;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Analyze notification content
   */
  analyzeNotificationContent(notificationData) {
    let score = 0.5; // Base score

    // Title analysis
    if (notificationData.title) {
      const titleLength = notificationData.title.length;
      if (titleLength > 10 && titleLength < 60) {
        score += 0.1; // Good title length
      }

      if (notificationData.title.includes('!')) {
        score += 0.05; // Excitement
      }

      if (notificationData.title.includes(user.name)) {
        score += 0.1; // Personalization
      }
    }

    // Content analysis
    if (notificationData.content) {
      const contentLength = notificationData.content.length;
      if (contentLength > 50 && contentLength < 300) {
        score += 0.1; // Good content length
      }

      if (notificationData.content.includes('action') || notificationData.content.includes('click')) {
        score += 0.05; // Call to action
      }
    }

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Analyze notification timing
   */
  async analyzeNotificationTiming(userId, notificationType) {
    try {
      const patterns = await this.analyzeUserEngagement(userId);
      const now = new Date();
      const hour = now.getHours();

      // Check if current time is in user's preferred times
      const isPreferredTime = patterns.preferredTimes.some(time => {
        const preferredHour = parseInt(time.split(':')[0]);
        return Math.abs(hour - preferredHour) <= 2;
      });

      return isPreferredTime ? 0.8 : 0.5;

    } catch (error) {
      logger.error('Error analyzing notification timing:', error);
      return 0.5;
    }
  }

  /**
   * Analyze user preferences
   */
  analyzeUserPreferences(user, notificationType) {
    let score = 0.5;

    // Check user's notification settings
    if (user.emailNotifications === false) {
      score -= 0.2;
    }

    if (user.pushNotifications === false) {
      score -= 0.2;
    }

    // Check user's engagement level
    if (user.engagementScore > 50) {
      score += 0.1;
    } else if (user.engagementScore < 10) {
      score -= 0.1;
    }

    return Math.min(Math.max(score, 0), 1);
  }

  /**
   * Calculate engagement confidence
   */
  calculateEngagementConfidence(factors) {
    const weights = {
      userHistory: 0.4,
      contentAnalysis: 0.3,
      timing: 0.2,
      preferences: 0.1
    };

    let confidence = 0;
    let totalWeight = 0;

    Object.entries(factors).forEach(([factor, score]) => {
      if (weights[factor]) {
        confidence += score * weights[factor];
        totalWeight += weights[factor];
      }
    });

    return totalWeight > 0 ? confidence / totalWeight : 0.5;
  }

  /**
   * Get engagement recommendation
   */
  getEngagementRecommendation(score, factors) {
    if (score > 0.8) {
      return 'High engagement expected. Send immediately.';
    } else if (score > 0.6) {
      return 'Good engagement potential. Consider optimal timing.';
    } else if (score > 0.4) {
      return 'Moderate engagement. Personalize content for better results.';
    } else {
      return 'Low engagement expected. Consider different approach or timing.';
    }
  }

  /**
   * Generate summary
   */
  generateSummary(content, maxLength, style) {
    try {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

      if (sentences.length === 0) {
        return content.substring(0, maxLength) + '...';
      }

      let summary = '';

      if (style === 'concise') {
        // Take first sentence or first few sentences
        summary = sentences[0];
        if (summary.length < maxLength && sentences.length > 1) {
          summary += ' ' + sentences[1];
        }
      } else if (style === 'detailed') {
        // Take more sentences
        summary = sentences.slice(0, 3).join('. ');
      } else {
        // Default: take first two sentences
        summary = sentences.slice(0, 2).join('. ');
      }

      // Truncate if too long
      if (summary.length > maxLength) {
        summary = summary.substring(0, maxLength - 3) + '...';
      }

      return summary;

    } catch (error) {
      logger.error('Error generating summary:', error);
      return content.substring(0, maxLength) + '...';
    }
  }

  /**
   * Extract key points
   */
  extractKeyPoints(content) {
    try {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const keyPoints = [];

      // Simple key point extraction
      sentences.forEach(sentence => {
        const trimmed = sentence.trim();
        if (trimmed.length > 20 && trimmed.length < 100) {
          if (trimmed.includes('important') || trimmed.includes('key') ||
            trimmed.includes('note') || trimmed.includes('remember')) {
            keyPoints.push(trimmed);
          }
        }
      });

      // If no key points found, take first few sentences
      if (keyPoints.length === 0) {
        keyPoints.push(...sentences.slice(0, 3).map(s => s.trim()));
      }

      return keyPoints.slice(0, 5);

    } catch (error) {
      logger.error('Error extracting key points:', error);
      return [];
    }
  }

  /**
   * Extract action items
   */
  extractActionItems(content) {
    try {
      const actionItems = [];
      const actionPatterns = [
        /\b(click|tap|visit|go to|check out)\b/gi,
        /\b(read|write|share|comment|like)\b/gi,
        /\b(complete|finish|start|begin)\b/gi
      ];

      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);

      sentences.forEach(sentence => {
        actionPatterns.forEach(pattern => {
          if (pattern.test(sentence)) {
            actionItems.push(sentence.trim());
          }
        });
      });

      return actionItems.slice(0, 3);

    } catch (error) {
      logger.error('Error extracting action items:', error);
      return [];
    }
  }

  /**
   * Send email notification
   */
  async sendEmailNotification(email, notificationData) {
    try {
      const subject = notificationData.title || 'New Notification';
      const html = this.generateEmailHTML(notificationData);

      await this.emailService.sendNotificationEmail(email, subject, html);

      logger.info('Email notification sent', { email, subject });

    } catch (error) {
      logger.error('Error sending email notification:', error);
    }
  }

  /**
   * Generate email HTML
   */
  generateEmailHTML(notificationData) {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>${notificationData.title}</h2>
        <p>${notificationData.content}</p>
        ${notificationData.keyPoints?.length > 0 ? `
          <h3>Key Points:</h3>
          <ul>
            ${notificationData.keyPoints.map(point => `<li>${point}</li>`).join('')}
          </ul>
        ` : ''}
        ${notificationData.actionUrl ? `
          <a href="${notificationData.actionUrl}" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
            Take Action
          </a>
        ` : ''}
      </div>
    `;
  }

  /**
   * Helper methods for engagement analysis
   */
  calculateOpenRate(notifications) {
    if (notifications.length === 0) return 0.5;

    const opened = notifications.filter(n => n.read).length;
    return opened / notifications.length;
  }

  analyzePreferredTimes(notifications) {
    const timeCounts = {};

    notifications.forEach(notification => {
      if (notification.readAt) {
        const hour = notification.readAt.getHours();
        timeCounts[hour] = (timeCounts[hour] || 0) + 1;
      }
    });

    const sortedTimes = Object.entries(timeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([hour]) => `${hour}:00`);

    return sortedTimes;
  }

  analyzePreferredTypes(notifications) {
    const typeCounts = {};

    notifications.forEach(notification => {
      if (notification.read) {
        typeCounts[notification.type] = (typeCounts[notification.type] || 0) + 1;
      }
    });

    return Object.entries(typeCounts)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([type]) => type);
  }

  calculateActivityLevel(user) {
    const engagement = user.engagementScore || 0;

    if (engagement > 70) return 'high';
    if (engagement > 30) return 'medium';
    return 'low';
  }

  findNextPreferredTime(preferredTimes, timezone) {
    // Simple implementation - find next preferred time
    if (preferredTimes.length === 0) return null;

    const now = new Date();
    const currentHour = now.getHours();

    for (const time of preferredTimes) {
      const preferredHour = parseInt(time.split(':')[0]);
      if (preferredHour > currentHour) {
        const nextTime = new Date(now);
        nextTime.setHours(preferredHour, 0, 0, 0);
        return nextTime;
      }
    }

    // If no preferred time today, use first preferred time tomorrow
    const firstPreferredHour = parseInt(preferredTimes[0].split(':')[0]);
    const nextTime = new Date(now);
    nextTime.setDate(nextTime.getDate() + 1);
    nextTime.setHours(firstPreferredHour, 0, 0, 0);
    return nextTime;
  }

  async generatePersonalizedRecommendations(userId) {
    // This would integrate with the AIRecommendationService
    // For now, return placeholder recommendations
    return [
      'Check out trending content in your favorite categories',
      'Complete your profile to unlock more features',
      'Write your next blog post to earn XP'
    ];
  }
}

module.exports = new AINotificationService(); 