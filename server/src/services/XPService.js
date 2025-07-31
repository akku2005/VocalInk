const XPTransaction = require('../models/xpTransaction.model');
const User = require('../models/user.model');
const Badge = require('../models/badge.model');
const logger = require('../utils/logger');

class XPService {
  // XP Configuration - Base values for different actions
  static XP_CONFIG = {
    // Content Creation (High Value)
    create_blog_draft: { base: 50, dailyLimit: null, qualityMultiplier: true },
    publish_blog: { base: 25, dailyLimit: null, qualityMultiplier: true },
    update_blog: { base: 5, dailyLimit: 1, qualityMultiplier: true },
    create_series: { base: 30, dailyLimit: null, qualityMultiplier: true },
    add_to_series: { base: 10, dailyLimit: null, qualityMultiplier: false },
    upload_media: { base: 5, dailyLimit: 20, qualityMultiplier: false },
    
    // Content Consumption (Medium Value)
    complete_blog_read: { base: 5, dailyLimit: 15, qualityMultiplier: false },
    bookmark_blog: { base: 2, dailyLimit: 25, qualityMultiplier: false },
    share_blog_external: { base: 15, dailyLimit: 10, qualityMultiplier: false },
    subscribe_author: { base: 8, dailyLimit: 15, qualityMultiplier: false },
    join_series: { base: 3, dailyLimit: 20, qualityMultiplier: false },
    
    // Social Interaction (Variable Value)
    write_comment: { base: 10, dailyLimit: 20, qualityMultiplier: true },
    reply_comment: { base: 5, dailyLimit: 30, qualityMultiplier: true },
    receive_comment_like: { base: 1, dailyLimit: null, qualityMultiplier: false },
    receive_blog_like: { base: 2, dailyLimit: null, qualityMultiplier: false },
    start_discussion: { base: 8, dailyLimit: 5, qualityMultiplier: true },
    
    // Platform Engagement (Low-Medium Value)
    daily_login: { base: 5, dailyLimit: 1, qualityMultiplier: false },
    complete_profile: { base: 20, dailyLimit: 1, qualityMultiplier: false },
    upload_profile_picture: { base: 5, dailyLimit: 1, qualityMultiplier: false },
    connect_social_media: { base: 10, dailyLimit: 1, qualityMultiplier: false },
    invite_friend: { base: 25, dailyLimit: 5, qualityMultiplier: false },
    
    // Badge & Achievement
    earn_badge: { base: 0, dailyLimit: null, qualityMultiplier: false }, // XP comes from badge
    level_up: { base: 0, dailyLimit: null, qualityMultiplier: false }, // Bonus XP for leveling
    streak_bonus: { base: 0, dailyLimit: null, qualityMultiplier: false },
    quality_bonus: { base: 0, dailyLimit: null, qualityMultiplier: false },
    
    // Admin Actions
    admin_grant: { base: 0, dailyLimit: null, qualityMultiplier: false },
    admin_deduct: { base: 0, dailyLimit: null, qualityMultiplier: false },
    penalty: { base: 0, dailyLimit: null, qualityMultiplier: false },
    appeal_grant: { base: 0, dailyLimit: null, qualityMultiplier: false },
  };

  // Quality Score Multipliers
  static QUALITY_MULTIPLIERS = {
    90: 2.5, // 90-100% quality
    80: 2.0, // 80-89% quality
    70: 1.5, // 70-79% quality
    0: 1.0,  // Below 70% quality
  };

  // Streak Bonus Configuration
  static STREAK_BONUSES = {
    login: {
      7: 10,   // 7-day login streak
      14: 20,  // 14-day login streak
      30: 35,  // 30-day login streak
    },
    publishing: {
      7: 25,   // 7-day publishing streak
    },
    reading: {
      14: 5,   // 14-day reading streak
    },
  };

  /**
   * Award XP to a user for a specific action
   */
  static async awardXP(userId, action, metadata = {}, requestInfo = {}) {
    try {
      // Get user
      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Validate action
      if (!this.XP_CONFIG[action]) {
        throw new Error(`Invalid action: ${action}`);
      }

      // Check daily limits
      const dailyLimitCheck = await this.checkDailyLimit(userId, action);
      if (!dailyLimitCheck.allowed) {
        throw new Error(`Daily limit exceeded for action: ${action}`);
      }

      // Calculate base XP
      let baseAmount = this.XP_CONFIG[action].base;
      
      // Handle special cases
      if (action === 'earn_badge' && metadata.badgeId) {
        const badge = await Badge.findById(metadata.badgeId);
        baseAmount = badge ? badge.xpReward : 0;
      }

      // Calculate multiplier
      const multiplier = await this.calculateMultiplier(user, action, metadata);

      // Calculate bonuses
      const bonuses = await this.calculateBonuses(user, action, metadata);

      // Calculate final amount
      const finalAmount = Math.round((baseAmount * multiplier) + bonuses.reduce((sum, b) => sum + b.amount, 0));

      // Fraud detection
      const fraudCheck = await this.detectFraud(userId, action, finalAmount, metadata, requestInfo);
      if (fraudCheck.flagged) {
        logger.warn(`Fraud detected for user ${userId}, action ${action}`, fraudCheck);
      }

      // Create transaction
      const transaction = await this.createTransaction(user, action, baseAmount, finalAmount, multiplier, bonuses, metadata, requestInfo, fraudCheck);

      // Update user XP
      const previousXP = user.xp;
      const previousLevel = user.level;
      
      user.xp += finalAmount;
      user.level = this.calculateLevel(user.xp);
      await user.save();

      // Update transaction with final values
      transaction.newXP = user.xp;
      transaction.newLevel = user.level;
      await transaction.save();

      // Check for level up
      const levelUp = user.level > previousLevel;
      if (levelUp) {
        await this.handleLevelUp(user, previousLevel, user.level);
      }

      // Check for badge eligibility
      await this.checkBadgeEligibility(user);

      logger.info(`XP awarded: ${finalAmount} to user ${userId} for ${action}`, {
        userId,
        action,
        baseAmount,
        multiplier,
        bonuses: bonuses.length,
        finalAmount,
        levelUp,
        fraudFlagged: fraudCheck.flagged,
      });

      return {
        success: true,
        xpAwarded: finalAmount,
        newTotalXP: user.xp,
        newLevel: user.level,
        levelUp,
        transaction: transaction._id,
        fraudFlagged: fraudCheck.flagged,
      };

    } catch (error) {
      logger.error(`Error awarding XP to user ${userId} for action ${action}:`, error);
      throw error;
    }
  }

  /**
   * Calculate level based on XP
   */
  static calculateLevel(xp) {
    if (xp < 100) return 1;
    if (xp < 500) return Math.floor(xp / 100) + 1;
    if (xp < 2500) return Math.floor(Math.sqrt(xp / 50)) + 1;
    return Math.floor(Math.sqrt(xp / 75)) + 1;
  }

  /**
   * Check daily limits for an action
   */
  static async checkDailyLimit(userId, action) {
    const config = this.XP_CONFIG[action];
    if (!config.dailyLimit) {
      return { allowed: true, remaining: null };
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTransactions = await XPTransaction.countDocuments({
      userId,
      action,
      createdAt: { $gte: today, $lt: tomorrow },
    });

    const remaining = Math.max(0, config.dailyLimit - todayTransactions);
    return {
      allowed: todayTransactions < config.dailyLimit,
      remaining,
      used: todayTransactions,
      limit: config.dailyLimit,
    };
  }

  /**
   * Calculate multiplier based on user status and quality
   */
  static async calculateMultiplier(user, action, metadata) {
    let multiplier = 1.0;

    // Quality multiplier for content actions
    if (this.XP_CONFIG[action].qualityMultiplier && metadata.qualityScore) {
      const qualityMultiplier = this.getQualityMultiplier(metadata.qualityScore);
      multiplier *= qualityMultiplier;
    }

    // New user bonus (first 30 days)
    const daysSinceJoin = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));
    if (daysSinceJoin <= 30) {
      multiplier *= 2.0;
    }

    // Mentor badge bonus
    if (user.badges && user.badges.length > 0) {
      // Check if user has mentor badge (would need to be implemented)
      // if (user.hasBadge('mentor')) {
      //   multiplier *= 1.2;
      // }
    }

    // Top contributor bonus (top 10% by XP)
    const userRank = await this.getUserRank(user._id);
    if (userRank && userRank.percentile <= 10) {
      multiplier *= 1.3;
    }

    return Math.min(multiplier, 10.0); // Cap at 10x
  }

  /**
   * Calculate bonuses (streaks, special events, etc.)
   */
  static async calculateBonuses(user, action, metadata) {
    const bonuses = [];

    // Streak bonuses
    const streakBonuses = await this.calculateStreakBonuses(user, action);
    bonuses.push(...streakBonuses);

    // Quality bonus for high-quality content
    if (metadata.qualityScore && metadata.qualityScore >= 90) {
      bonuses.push({
        type: 'quality',
        amount: Math.floor(this.XP_CONFIG[action].base * 0.5),
        description: 'High quality content bonus',
      });
    }

    // Weekend bonus
    const now = new Date();
    if (now.getDay() === 0 || now.getDay() === 6) { // Saturday or Sunday
      bonuses.push({
        type: 'seasonal',
        amount: Math.floor(this.XP_CONFIG[action].base * 0.2),
        description: 'Weekend bonus',
      });
    }

    return bonuses;
  }

  /**
   * Calculate streak bonuses
   */
  static async calculateStreakBonuses(user, action) {
    const bonuses = [];
    
    // This would need to be implemented with actual streak tracking
    // For now, we'll return empty array
    // In a real implementation, you'd check user's current streaks
    
    return bonuses;
  }

  /**
   * Get quality multiplier based on score
   */
  static getQualityMultiplier(qualityScore) {
    if (qualityScore >= 90) return this.QUALITY_MULTIPLIERS[90];
    if (qualityScore >= 80) return this.QUALITY_MULTIPLIERS[80];
    if (qualityScore >= 70) return this.QUALITY_MULTIPLIERS[70];
    return this.QUALITY_MULTIPLIERS[0];
  }

  /**
   * Detect potential fraud
   */
  static async detectFraud(userId, action, amount, metadata, requestInfo) {
    const flags = [];
    let severity = 'low';

    // Velocity check - rapid XP gain
    const recentTransactions = await XPTransaction.find({
      userId,
      createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }, // Last hour
      status: 'approved',
    });

    const recentXP = recentTransactions.reduce((sum, tx) => sum + tx.finalAmount, 0);
    if (recentXP > 500) { // More than 500 XP in an hour
      flags.push({
        type: 'velocity',
        reason: `High XP velocity: ${recentXP} XP in last hour`,
        severity: 'high',
      });
      severity = 'high';
    }

    // Pattern check - same action repeated rapidly
    const sameActionCount = recentTransactions.filter(tx => tx.action === action).length;
    if (sameActionCount > 10) { // Same action more than 10 times in an hour
      flags.push({
        type: 'pattern',
        reason: `Repeated action: ${action} performed ${sameActionCount} times in last hour`,
        severity: 'medium',
      });
      severity = severity === 'low' ? 'medium' : severity;
    }

    // Quality check - suspicious quality scores
    if (metadata.qualityScore && (metadata.qualityScore < 10 || metadata.qualityScore > 95)) {
      flags.push({
        type: 'quality',
        reason: `Suspicious quality score: ${metadata.qualityScore}`,
        severity: 'medium',
      });
      severity = severity === 'low' ? 'medium' : severity;
    }

    return {
      flagged: flags.length > 0,
      flags,
      severity,
    };
  }

  /**
   * Create XP transaction record
   */
  static async createTransaction(user, action, baseAmount, finalAmount, multiplier, bonuses, metadata, requestInfo, fraudCheck) {
    const now = new Date();
    
    const transaction = new XPTransaction({
      userId: user._id,
      action,
      baseAmount,
      finalAmount,
      multiplier,
      bonuses,
      reason: this.getActionReason(action, metadata),
      metadata: {
        ...metadata,
        ipAddress: requestInfo.ip,
        userAgent: requestInfo.userAgent,
        deviceFingerprint: requestInfo.deviceFingerprint,
        sessionId: requestInfo.sessionId,
        timeOfDay: now.getHours(),
        dayOfWeek: now.getDay(),
        isWeekend: now.getDay() === 0 || now.getDay() === 6,
        platform: requestInfo.platform || 'web',
      },
      status: fraudCheck.flagged ? 'under_review' : 'approved',
      flags: fraudCheck.flags,
      previousXP: user.xp,
      newXP: user.xp + finalAmount,
      previousLevel: user.level,
      newLevel: this.calculateLevel(user.xp + finalAmount),
    });

    return await transaction.save();
  }

  /**
   * Get action reason description
   */
  static getActionReason(action, metadata) {
    const reasons = {
      create_blog_draft: 'Created blog draft',
      publish_blog: 'Published blog post',
      update_blog: 'Updated blog post',
      create_series: 'Created blog series',
      add_to_series: 'Added blog to series',
      upload_media: 'Uploaded media content',
      complete_blog_read: 'Completed reading blog',
      bookmark_blog: 'Bookmarked blog',
      share_blog_external: 'Shared blog externally',
      subscribe_author: 'Subscribed to author',
      join_series: 'Joined blog series',
      write_comment: 'Wrote thoughtful comment',
      reply_comment: 'Replied to comment',
      receive_comment_like: 'Received comment like',
      receive_blog_like: 'Received blog like',
      start_discussion: 'Started discussion thread',
      daily_login: 'Daily login',
      complete_profile: 'Completed profile',
      upload_profile_picture: 'Uploaded profile picture',
      connect_social_media: 'Connected social media',
      invite_friend: 'Invited friend',
      earn_badge: 'Earned badge',
      level_up: 'Level up bonus',
      streak_bonus: 'Streak bonus',
      quality_bonus: 'Quality bonus',
    };

    return reasons[action] || `Performed action: ${action}`;
  }

  /**
   * Handle level up events
   */
  static async handleLevelUp(user, previousLevel, newLevel) {
    // Award bonus XP for leveling up
    const levelUpBonus = Math.floor(newLevel * 10);
    
    await this.awardXP(user._id, 'level_up', {
      previousLevel,
      newLevel,
      bonusAmount: levelUpBonus,
    }, { platform: 'system' });

    // Could also trigger notifications, achievements, etc.
    logger.info(`User ${user._id} leveled up from ${previousLevel} to ${newLevel}`);
  }

  /**
   * Check badge eligibility for user
   */
  static async checkBadgeEligibility(user) {
    try {
      const eligibleBadges = await Badge.checkUserEligibility(user._id);
      
      for (const badge of eligibleBadges) {
        // Award badge (this will trigger XP award)
        user.badges.push(badge._id);
        await user.save();
        
        logger.info(`User ${user._id} earned badge: ${badge.name}`);
      }
    } catch (error) {
      logger.error(`Error checking badge eligibility for user ${user._id}:`, error);
    }
  }

  /**
   * Get user rank by XP
   */
  static async getUserRank(userId) {
    try {
      const user = await User.findById(userId);
      if (!user) return null;

      const totalUsers = await User.countDocuments();
      const usersWithMoreXP = await User.countDocuments({ xp: { $gt: user.xp } });
      
      const rank = usersWithMoreXP + 1;
      const percentile = Math.round((rank / totalUsers) * 100);

      return {
        rank,
        totalUsers,
        percentile,
      };
    } catch (error) {
      logger.error(`Error getting user rank for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Get user XP statistics
   */
  static async getUserStats(userId, timeframe = 'all') {
    return await XPTransaction.getUserStats(userId, timeframe);
  }

  /**
   * Get user transaction history
   */
  static async getUserTransactionHistory(userId, options = {}) {
    return await XPTransaction.getUserTransactionHistory(userId, options);
  }

  /**
   * Admin: Grant XP to user
   */
  static async adminGrantXP(userId, amount, reason, adminId) {
    return await this.awardXP(userId, 'admin_grant', {
      adminGranted: true,
      adminId,
      reason,
    }, { platform: 'admin' });
  }

  /**
   * Admin: Deduct XP from user
   */
  static async adminDeductXP(userId, amount, reason, adminId) {
    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    const deduction = Math.min(amount, user.xp); // Can't go below 0

    return await this.awardXP(userId, 'admin_deduct', {
      adminDeducted: true,
      adminId,
      reason,
      deductionAmount: deduction,
    }, { platform: 'admin' });
  }
}

module.exports = XPService; 