const Badge = require('../models/badge.model');
const User = require('../models/user.model');
const BadgeClaim = require('../models/badgeClaim.model');
const NotificationService = require('./NotificationService');
const logger = require('../utils/logger');

class BadgeEvaluationEngine {
  constructor() {
    this.evaluationQueue = [];
    this.processingInterval = null;
    this.maxBatchSize = 100;
    this.processingDelay = 1000; // 1 second
  }

  /**
   * Initialize the evaluation engine
   */
  async initialize() {
    // Start batch processing
    this.startBatchProcessing();
    logger.info('BadgeEvaluationEngine initialized');
  }

  /**
   * Evaluate badges for a user based on an event
   */
  async evaluateOnEvent(event, user) {
    const evaluation = {
      userId: user._id,
      event: event,
      timestamp: new Date(),
      priority: this.getEventPriority(event)
    };

    // Add to processing queue
    this.evaluationQueue.push(evaluation);
    
    // Log the evaluation request
    logger.info('Badge evaluation queued', {
      userId: user._id,
      event: event.type,
      priority: evaluation.priority
    });

    return evaluation;
  }

  /**
   * Get priority for different event types
   */
  getEventPriority(event) {
    const priorities = {
      'user.login': 1,
      'blog.published': 2,
      'comment.created': 3,
      'like.received': 4,
      'follow.gained': 5,
      'xp.earned': 6
    };
    return priorities[event.type] || 10;
  }

  /**
   * Start batch processing of evaluations
   */
  startBatchProcessing() {
    this.processingInterval = setInterval(async () => {
      await this.processBatch();
    }, this.processingDelay);
  }

  /**
   * Process a batch of evaluations
   */
  async processBatch() {
    if (this.evaluationQueue.length === 0) return;

    // Sort by priority and take batch
    const batch = this.evaluationQueue
      .sort((a, b) => a.priority - b.priority)
      .splice(0, this.maxBatchSize);

    logger.info(`Processing ${batch.length} badge evaluations`);

    for (const evaluation of batch) {
      try {
        await this.processEvaluation(evaluation);
      } catch (error) {
        logger.error('Error processing badge evaluation:', error);
      }
    }
  }

  /**
   * Process a single evaluation
   */
  async processEvaluation(evaluation) {
    const startTime = Date.now();
    
    try {
      // Get user with fresh data
      const user = await User.findById(evaluation.userId);
      if (!user) return;

      // Get all active badges
      const badges = await Badge.find({ status: 'active' });
      
      // Check eligibility for each badge
      for (const badge of badges) {
        // Skip if user already has this badge
        if (user.badges.includes(badge._id)) continue;

        // Check if user is eligible
        const isEligible = await Badge.isUserEligibleForBadge(user, badge);
        
        if (isEligible) {
          // Auto-claim or notify user
          await this.handleEligibleBadge(user, badge, evaluation);
        }
      }

      const processingTime = Date.now() - startTime;
      logger.info('Badge evaluation completed', {
        userId: user._id,
        processingTime,
        badgesChecked: badges.length
      });

    } catch (error) {
      logger.error('Error in badge evaluation:', error);
    }
  }

  /**
   * Handle when a user becomes eligible for a badge
   */
  async handleEligibleBadge(user, badge, evaluation) {
    try {
      // Check if auto-claim is enabled for this badge
      if (badge.security.autoClaim) {
        await this.autoClaimBadge(user, badge, evaluation);
      } else {
        // Notify user of eligibility
        await this.notifyUserOfEligibility(user, badge);
      }
    } catch (error) {
      logger.error('Error handling eligible badge:', error);
    }
  }

  /**
   * Auto-claim a badge for eligible user
   */
  async autoClaimBadge(user, badge, evaluation) {
    try {
      // Create claim
      const claim = await BadgeClaim.createClaim(badge._id, user._id, {
        event: evaluation.event,
        autoClaimed: true
      });

      // Process the claim
      await this.processApprovedClaim(claim, user, badge);

      logger.info('Badge auto-claimed', {
        userId: user._id,
        badgeId: badge._id,
        badgeName: badge.name
      });

    } catch (error) {
      logger.error('Error auto-claiming badge:', error);
    }
  }

  /**
   * Notify user of badge eligibility
   */
  async notifyUserOfEligibility(user, badge) {
    try {
      // Send comprehensive notification (in-app + email)
      await NotificationService.sendBadgeEligibilityNotification(user._id, badge._id);
      
      logger.info('Badge eligibility notification sent', {
        userId: user._id,
        badgeId: badge._id,
        badgeName: badge.name
      });
    } catch (error) {
      logger.error('Error sending badge eligibility notification:', error);
    }
  }

  /**
   * Process an approved badge claim
   */
  async processApprovedClaim(claim, user, badge) {
    try {
      // Award badge to user
      user.badges.push(badge._id);
      
      // Award XP
      const xpReward = badge.rewards.xpReward;
      user.xp += xpReward;
      user.level = Math.floor(user.xp / 100) + 1;
      
      // Save user
      await user.save();
      
      // Update claim
      claim.status = 'approved';
      claim.processedAt = new Date();
      await claim.save();
      
      // Update badge analytics
      await Badge.updateAnalytics(badge._id, 'earned');
      
      logger.info('Badge claim processed successfully', {
        userId: user._id,
        badgeId: badge._id,
        xpAwarded: xpReward
      });

    } catch (error) {
      logger.error('Error processing approved claim:', error);
      throw error;
    }
  }

  /**
   * Stop the evaluation engine
   */
  stop() {
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
      this.processingInterval = null;
    }
    logger.info('BadgeEvaluationEngine stopped');
  }

  /**
   * Get evaluation statistics
   */
  getStats() {
    return {
      queueLength: this.evaluationQueue.length,
      isProcessing: !!this.processingInterval
    };
  }
}

module.exports = new BadgeEvaluationEngine(); 