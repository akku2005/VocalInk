const Badge = require('../models/badge.model');
const BadgeClaim = require('../models/badgeClaim.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const NotificationService = require('./NotificationService');
const XPService = require('./XPService');
const logger = require('../utils/logger');

// Optional Redis import with fallback
let redis = null;
try {
  redis = require('redis');
} catch (error) {
  logger.warn('Redis module not found, using in-memory cache fallback');
}

class BadgeService {
  constructor() {
    this.redisClient = null;
    this.memoryCache = new Map(); // Fallback in-memory cache
    this.initializeRedis();
  }

  async initializeRedis() {
    if (!redis) {
      logger.info('Redis not available, using in-memory cache');
      return;
    }

    try {
      this.redisClient = redis.createClient({
        url: process.env.REDIS_URL || 'redis://localhost:6379'
      });
      await this.redisClient.connect();
      logger.info('Redis connected for BadgeService');
    } catch (error) {
      logger.warn('Redis not available for BadgeService, using in-memory cache');
      this.redisClient = null;
    }
  }

  // Helper method to get from cache (Redis or memory)
  async getFromCache(key) {
    if (this.redisClient) {
      try {
        const cached = await this.redisClient.get(key);
        return cached ? JSON.parse(cached) : null;
      } catch (error) {
        logger.warn('Redis cache read failed:', error.message);
        return this.memoryCache.get(key) || null;
      }
    } else {
      const cached = this.memoryCache.get(key);
      if (cached && cached.expiresAt > Date.now()) {
        return cached.data;
      }
      this.memoryCache.delete(key);
      return null;
    }
  }

  // Helper method to set cache (Redis or memory)
  async setCache(key, data, ttlSeconds = 300) {
    if (this.redisClient) {
      try {
        await this.redisClient.setEx(key, ttlSeconds, JSON.stringify(data));
      } catch (error) {
        logger.warn('Redis cache write failed:', error.message);
        // Fallback to memory cache
        this.memoryCache.set(key, {
          data,
          expiresAt: Date.now() + (ttlSeconds * 1000)
        });
      }
    } else {
      this.memoryCache.set(key, {
        data,
        expiresAt: Date.now() + (ttlSeconds * 1000)
      });
    }
  }

  // Helper method to delete from cache
  async deleteFromCache(key) {
    if (this.redisClient) {
      try {
        await this.redisClient.del(key);
      } catch (error) {
        logger.warn('Redis cache delete failed:', error.message);
        this.memoryCache.delete(key);
      }
    } else {
      this.memoryCache.delete(key);
    }
  }

  /**
   * Get all badges with advanced filtering and pagination
   */
  async getAllBadges(options = {}) {
    const {
      category,
      rarity,
      status = 'active',
      search,
      tags,
      limit = 50,
      page = 1,
      sortBy = 'createdAt',
      sortOrder = 'desc'
    } = options;

    let query = { status };

    // Apply filters
    if (category) {
      query.category = category;
    }

    if (rarity) {
      query.rarity = rarity;
    }

    if (tags && tags.length > 0) {
      query.tags = { $in: tags };
    }

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { longDescription: { $regex: search, $options: 'i' } }
      ];
    }

    // Build sort object
    const sort = {};
    sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const badges = await Badge.find(query)
      .sort(sort)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Badge.countDocuments(query);

    return {
      badges,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalBadges: total,
        hasNext: page * limit < total,
        hasPrev: page > 1,
      }
    };
  }

  /**
   * Get badge by ID with enhanced details
   */
  async getBadgeById(badgeId, userId = null) {
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      throw new Error('Badge not found');
    }

    // Get users who have earned this badge
    const earnedUsers = await User.find({ badges: badge._id })
      .select('name email avatar')
      .limit(10);

    const badgeData = badge.toObject();
    badgeData.earnedUsers = earnedUsers;
    badgeData.earnedCount = earnedUsers.length;

    // Add user-specific information if userId provided
    if (userId) {
      const user = await User.findById(userId);
      if (user) {
        badgeData.userHasEarned = user.badges.includes(badge._id);
        badgeData.userEligible = await Badge.isUserEligibleForBadge(user, badge);
        badgeData.userProgress = await this.getUserBadgeProgress(user, badge);
      }
    }

    return badgeData;
  }

  /**
   * Get user's progress toward a specific badge
   */
  async getUserBadgeProgress(user, badge) {
    if (user.badges.includes(badge._id)) {
      return { completed: true, progress: 100, requirements: [] };
    }

    const progress = {
      completed: false,
      progress: 0,
      requirements: []
    };

    // Evaluate legacy requirements
    const requirements = badge.requirements;
    const totalRequirements = 6; // XP, blogs, followers, likes, comments, days
    let completedRequirements = 0;

    // Check XP requirement
    const xpProgress = Math.min(user.xp / requirements.xpRequired, 1);
    progress.requirements.push({
      name: 'XP Required',
      current: user.xp,
      required: requirements.xpRequired,
      completed: user.xp >= requirements.xpRequired,
      progress: xpProgress * 100
    });
    if (user.xp >= requirements.xpRequired) completedRequirements++;

    // Check blogs requirement
    const blogCount = await this.model('Blog').countDocuments({
      author: user._id,
      status: 'published',
    });
    const blogProgress = Math.min(blogCount / requirements.blogsRequired, 1);
    progress.requirements.push({
      name: 'Blogs Required',
      current: blogCount,
      required: requirements.blogsRequired,
      completed: blogCount >= requirements.blogsRequired,
      progress: blogProgress * 100
    });
    if (blogCount >= requirements.blogsRequired) completedRequirements++;

    // Check followers requirement
    const followerProgress = Math.min(user.followers.length / requirements.followersRequired, 1);
    progress.requirements.push({
      name: 'Followers Required',
      current: user.followers.length,
      required: requirements.followersRequired,
      completed: user.followers.length >= requirements.followersRequired,
      progress: followerProgress * 100
    });
    if (user.followers.length >= requirements.followersRequired) completedRequirements++;

    // Check likes requirement
    const likeProgress = Math.min(user.totalLikes / requirements.likesRequired, 1);
    progress.requirements.push({
      name: 'Likes Required',
      current: user.totalLikes,
      required: requirements.likesRequired,
      completed: user.totalLikes >= requirements.likesRequired,
      progress: likeProgress * 100
    });
    if (user.totalLikes >= requirements.likesRequired) completedRequirements++;

    // Check comments requirement
    const commentProgress = Math.min(user.totalComments / requirements.commentsRequired, 1);
    progress.requirements.push({
      name: 'Comments Required',
      current: user.totalComments,
      required: requirements.commentsRequired,
      completed: user.totalComments >= requirements.commentsRequired,
      progress: commentProgress * 100
    });
    if (user.totalComments >= requirements.commentsRequired) completedRequirements++;

    // Check days active requirement
    const daysActive = Math.floor((Date.now() - user.createdAt) / (1000 * 60 * 60 * 24));
    const daysProgress = Math.min(daysActive / requirements.daysActiveRequired, 1);
    progress.requirements.push({
      name: 'Days Active Required',
      current: daysActive,
      required: requirements.daysActiveRequired,
      completed: daysActive >= requirements.daysActiveRequired,
      progress: daysProgress * 100
    });
    if (daysActive >= requirements.daysActiveRequired) completedRequirements++;

    progress.progress = Math.round((completedRequirements / totalRequirements) * 100);

    return progress;
  }

  /**
   * Get user's overall badge progress
   */
  async getUserBadgeProgress(userId) {
    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    const allBadges = await Badge.find({ status: 'active' });
    const userBadgeIds = user.badges.map(b => b.toString());
    
    const progressData = {
      totalBadges: allBadges.length,
      earnedBadges: user.badges.length,
      availableBadges: allBadges.length - user.badges.length,
      completionPercentage: Math.round((user.badges.length / allBadges.length) * 100),
      badges: []
    };

    // Get progress for each badge
    for (const badge of allBadges) {
      const badgeProgress = await this.getUserBadgeProgress(user, badge);
      progressData.badges.push({
        badgeId: badge._id,
        badgeKey: badge.badgeKey,
        name: badge.name,
        category: badge.category,
        rarity: badge.rarity,
        earned: userBadgeIds.includes(badge._id.toString()),
        progress: badgeProgress.progress,
        requirements: badgeProgress.requirements
      });
    }

    return progressData;
  }

  /**
   * Get user's eligible badges
   */
  async getEligibleBadges(userId) {
    const cacheKey = `eligible_badges:${userId}`;
    
    // Try to get from cache first
    const cached = await this.getFromCache(cacheKey);
    if (cached) {
      return cached;
    }

    const eligibleBadges = await Badge.checkUserEligibility(userId);

    // Cache the result for 5 minutes
    await this.setCache(cacheKey, eligibleBadges, 300);

    return eligibleBadges;
  }

  /**
   * Initiate badge claim with comprehensive validation
   */
  async initiateBadgeClaim(badgeId, userId, requestInfo = {}) {
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      throw new Error('Badge not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // Check if user already has this badge
    if (user.badges.includes(badgeId)) {
      throw new Error('You have already earned this badge');
    }

    // Check if badge is available for user
    if (!badge.isAvailableForUser(user)) {
      throw new Error('This badge is not available for you');
    }

    // Check eligibility
    const isEligible = await Badge.isUserEligibleForBadge(user, badge);
    if (!isEligible) {
      throw new Error('You are not eligible for this badge yet');
    }

    // Check for existing pending claims
    const existingClaim = await BadgeClaim.findOne({
      badgeId,
      userId,
      status: { $in: ['pending', 'under_review'] }
    });

    if (existingClaim) {
      throw new Error('You already have a pending claim for this badge');
    }

    // Create claim
    const claim = await BadgeClaim.createClaim(badgeId, userId, requestInfo);

    // Perform eligibility check
    claim.eligibilityCheck.passed = true;
    claim.eligibilityCheck.checkedAt = new Date();
    claim.eligibilityCheck.confidence = 0.95;

    // Perform fraud check
    await this.performFraudCheck(claim, user, badge);

    // Determine if manual review is required
    if (claim.fraudCheck.riskLevel === 'high' || claim.fraudCheck.riskLevel === 'critical') {
      claim.status = 'under_review';
      claim.fraudCheck.manualReviewRequired = true;
    } else {
      claim.status = 'approved';
    }

    await claim.save();

    // If approved, process the claim immediately
    if (claim.status === 'approved') {
      await this.processApprovedClaim(claim, user, badge);
    }

    return claim;
  }

  /**
   * Perform comprehensive fraud check
   */
  async performFraudCheck(claim, user, badge) {
    let fraudScore = 0;
    const flags = [];

    // Check rate limiting
    const attemptsInWindow = claim.checkRateLimit();
    if (attemptsInWindow > 5) {
      fraudScore += 0.3;
      flags.push('high_claim_frequency');
    }

    // Check user account age
    const accountAge = (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24);
    if (accountAge < 1) {
      fraudScore += 0.4;
      flags.push('new_account');
    }

    // Check for suspicious patterns
    const recentClaims = await BadgeClaim.find({
      userId: user._id,
      createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
    });

    if (recentClaims.length > 10) {
      fraudScore += 0.5;
      flags.push('excessive_claims');
    }

    // Check IP address patterns
    if (claim.security.ipAddress) {
      const ipClaims = await BadgeClaim.find({
        'security.ipAddress': claim.security.ipAddress,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (ipClaims.length > 20) {
        fraudScore += 0.3;
        flags.push('suspicious_ip');
      }
    }

    // Check user behavior patterns
    if (user.totalLikes === 0 && user.totalComments === 0) {
      fraudScore += 0.2;
      flags.push('inactive_user');
    }

    // Update fraud check results
    claim.fraudCheck.score = Math.min(fraudScore, 1);
    claim.fraudCheck.flags = flags;

    // Determine risk level
    if (fraudScore >= 0.8) {
      claim.fraudCheck.riskLevel = 'critical';
    } else if (fraudScore >= 0.6) {
      claim.fraudCheck.riskLevel = 'high';
    } else if (fraudScore >= 0.3) {
      claim.fraudCheck.riskLevel = 'medium';
    } else {
      claim.fraudCheck.riskLevel = 'low';
    }
  }

  /**
   * Process approved badge claim
   */
  async processApprovedClaim(claim, user, badge) {
    try {
      // Award badge to user
      user.badges.push(badge._id);
      
      // Award XP
      const xpReward = badge.rewards.xpReward;
      user.xp += xpReward;
      user.level = Math.floor(user.xp / 100) + 1;
      
      // Update claim rewards
      claim.rewards.xpAwarded = xpReward;
      claim.rewards.featuresUnlocked = badge.rewards.featureUnlocks || [];
      claim.rewards.privilegesGranted = badge.rewards.specialPrivileges || [];
      
      // Save user
      await user.save();
      
      // Update claim
      claim.updateStatus('approved', null, 'Automatically approved');
      claim.applyRewards();
      await claim.save();
      
      // Update badge analytics
      await Badge.updateAnalytics(badge._id, 'earned');
      
      // Send comprehensive notification (in-app + email)
      await NotificationService.sendBadgeEarnedNotification(user._id, badge._id, xpReward);
      
      // Clear user's eligible badges cache
      await this.deleteFromCache(`eligible_badges:${user._id}`);
      
      logger.info(`Badge ${badge.name} awarded to user ${user._id}`);
      
    } catch (error) {
      logger.error('Error processing approved claim:', error);
      claim.updateStatus('rejected', null, 'Processing error');
      await claim.save();
      throw error;
    }
  }

  /**
   * Get user's badge collection
   */
  async getUserBadges(userId, options = {}) {
    const user = await User.findById(userId).populate('badges');
    if (!user) {
      throw new Error('User not found');
    }

    const { earned, available } = options;
    let badges = [];

    if (earned) {
      badges = user.badges || [];
    } else if (available) {
      const allBadges = await Badge.find({ status: 'active' });
      const userBadgeIds = user.badges.map(b => b._id.toString());
      badges = allBadges.filter(badge => !userBadgeIds.includes(badge._id.toString()));
    } else {
      badges = user.badges || [];
    }

    return {
      badges,
      totalEarned: user.badges.length,
      totalAvailable: await Badge.countDocuments({ status: 'active' })
    };
  }

  /**
   * Get badge analytics and statistics
   */
  async getBadgeAnalytics(timeframe = '30d') {
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }

    const analytics = await Badge.aggregate([
      {
        $match: {
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: {
            category: '$category',
            rarity: '$rarity'
          },
          count: { $sum: 1 },
          totalEarned: { $sum: '$analytics.totalEarned' },
          avgPopularity: { $avg: '$analytics.popularityScore' }
        }
      }
    ]);

    const claimAnalytics = await BadgeClaim.getClaimsAnalytics(timeframe);

    return {
      badgeAnalytics: analytics,
      claimAnalytics,
      timeframe
    };
  }

  /**
   * Admin: Create new badge
   */
  async createBadge(badgeData, createdBy) {
    // Validate badge key format
    if (!badgeData.badgeKey || !/^[a-z0-9_-]+$/.test(badgeData.badgeKey)) {
      throw new Error('Invalid badge key format');
    }

    // Check if badge key already exists
    const existingBadge = await Badge.findOne({ badgeKey: badgeData.badgeKey });
    if (existingBadge) {
      throw new Error('Badge with this key already exists');
    }

    // Create badge
    const badge = new Badge({
      ...badgeData,
      createdBy,
      lastModifiedBy: createdBy
    });

    await badge.save();

    logger.info(`Badge ${badge.name} created by ${createdBy}`);
    return badge;
  }

  /**
   * Admin: Update badge
   */
  async updateBadge(badgeId, updates, modifiedBy) {
    const badge = await Badge.findById(badgeId);
    if (!badge) {
      throw new Error('Badge not found');
    }

    // Update badge
    Object.assign(badge, updates, { lastModifiedBy: modifiedBy });
    await badge.save();

    logger.info(`Badge ${badge.name} updated by ${modifiedBy}`);
    return badge;
  }

  /**
   * Admin: Review pending claims
   */
  async reviewClaim(claimId, decision, reviewedBy, notes = '') {
    const claim = await BadgeClaim.findById(claimId);
    if (!claim) {
      throw new Error('Claim not found');
    }

    if (!['pending', 'under_review'].includes(claim.status)) {
      throw new Error('Claim is not in a reviewable state');
    }

    const user = await User.findById(claim.userId);
    const badge = await Badge.findById(claim.badgeId);

    if (decision === 'approve') {
      claim.updateStatus('approved', reviewedBy, notes);
      await this.processApprovedClaim(claim, user, badge);
    } else if (decision === 'reject') {
      claim.updateStatus('rejected', reviewedBy, notes);
    }

    await claim.save();

    logger.info(`Claim ${claimId} ${decision}d by ${reviewedBy}`);
    return claim;
  }

  /**
   * Get popular badges
   */
  async getPopularBadges(limit = 10) {
    return await Badge.getPopular(limit);
  }

  /**
   * Get rare badges
   */
  async getRareBadges(limit = 10) {
    return await Badge.getRare(limit);
  }

  /**
   * Search badges
   */
  async searchBadges(query, options = {}) {
    const { limit = 20, category, rarity } = options;

    let searchQuery = {
      status: 'active',
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { longDescription: { $regex: query, $options: 'i' } },
        { tags: { $in: [new RegExp(query, 'i')] } }
      ]
    };

    if (category) searchQuery.category = category;
    if (rarity) searchQuery.rarity = rarity;

    return await Badge.find(searchQuery)
      .sort({ 'analytics.popularityScore': -1 })
      .limit(limit);
  }

  /**
   * Get badge statistics
   */
  async getBadgeStats() {
    try {
      const totalBadges = await Badge.countDocuments({ status: 'active' });
      const badgesByCategory = await Badge.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$category', count: { $sum: 1 } } },
      ]);
      const badgesByRarity = await Badge.aggregate([
        { $match: { status: 'active' } },
        { $group: { _id: '$rarity', count: { $sum: 1 } } },
      ]);

      return {
        totalBadges,
        byCategory: badgesByCategory,
        byRarity: badgesByRarity,
      };
    } catch (error) {
      logger.error('Error getting badge stats:', error);
      throw error;
    }
  }
}

module.exports = new BadgeService(); 