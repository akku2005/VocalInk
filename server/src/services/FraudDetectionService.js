const BadgeClaim = require('../models/badgeClaim.model');
const User = require('../models/user.model');
const Badge = require('../models/badge.model');
const logger = require('../utils/logger');

class FraudDetectionService {
  constructor() {
    this.riskThresholds = {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
      critical: 0.9
    };
  }

  /**
   * Comprehensive fraud analysis for badge claims
   */
  async analyzeClaim(claim, user, badge) {
    const analysis = {
      score: 0,
      flags: [],
      riskLevel: 'low',
      automatedDecision: true,
      manualReviewRequired: false,
      confidence: 0.95
    };

    try {
      // Behavioral analysis
      const behavioralScore = await this.analyzeBehavioralPatterns(claim, user);
      analysis.score += behavioralScore.score * 0.3;
      analysis.flags.push(...behavioralScore.flags);

      // Velocity analysis
      const velocityScore = await this.analyzeVelocity(claim, user);
      analysis.score += velocityScore.score * 0.25;
      analysis.flags.push(...velocityScore.flags);

      // Pattern analysis
      const patternScore = await this.analyzePatterns(claim, user);
      analysis.score += patternScore.score * 0.2;
      analysis.flags.push(...patternScore.flags);

      // Device and location analysis
      const deviceScore = await this.analyzeDeviceAndLocation(claim, user);
      analysis.score += deviceScore.score * 0.15;
      analysis.flags.push(...deviceScore.flags);

      // Account analysis
      const accountScore = await this.analyzeAccount(claim, user);
      analysis.score += accountScore.score * 0.1;
      analysis.flags.push(...accountScore.flags);

      // Determine risk level
      analysis.riskLevel = this.determineRiskLevel(analysis.score);
      analysis.automatedDecision = analysis.riskLevel === 'low' || analysis.riskLevel === 'medium';
      analysis.manualReviewRequired = analysis.riskLevel === 'high' || analysis.riskLevel === 'critical';

      logger.info('Fraud analysis completed', {
        claimId: claim.claimId,
        userId: user._id,
        score: analysis.score,
        riskLevel: analysis.riskLevel,
        flags: analysis.flags
      });

      return analysis;

    } catch (error) {
      logger.error('Error in fraud analysis:', error);
      analysis.score = 0.5; // Default to medium risk on error
      analysis.riskLevel = 'medium';
      analysis.automatedDecision = false;
      analysis.manualReviewRequired = true;
      return analysis;
    }
  }

  /**
   * Analyze behavioral patterns
   */
  async analyzeBehavioralPatterns(claim, user) {
    const score = { score: 0, flags: [] };

    try {
      // Check for unusual activity patterns
      const recentClaims = await BadgeClaim.find({
        userId: user._id,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (recentClaims.length > 10) {
        score.score += 0.4;
        score.flags.push('excessive_claims_24h');
      }

      // Check for bot-like behavior
      const timeBetweenClaims = this.calculateTimeBetweenClaims(recentClaims);
      if (timeBetweenClaims < 60) { // Less than 1 minute between claims
        score.score += 0.3;
        score.flags.push('bot_like_behavior');
      }

      // Check for unusual hours
      const hour = new Date().getHours();
      if (hour < 6 || hour > 23) {
        score.score += 0.1;
        score.flags.push('unusual_hours');
      }

    } catch (error) {
      logger.error('Error in behavioral analysis:', error);
    }

    return score;
  }

  /**
   * Analyze velocity of achievements
   */
  async analyzeVelocity(claim, user) {
    const score = { score: 0, flags: [] };

    try {
      // Check how quickly user is earning badges
      const userBadges = user.badges.length;
      const accountAge = (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24);
      const badgesPerDay = userBadges / Math.max(accountAge, 1);

      if (badgesPerDay > 2) {
        score.score += 0.5;
        score.flags.push('high_velocity_achievement');
      }

      // Check for sudden spikes in activity
      const recentActivity = await this.getRecentUserActivity(user._id);
      if (recentActivity.spike > 5) {
        score.score += 0.3;
        score.flags.push('activity_spike');
      }

    } catch (error) {
      logger.error('Error in velocity analysis:', error);
    }

    return score;
  }

  /**
   * Analyze patterns across multiple users
   */
  async analyzePatterns(claim, user) {
    const score = { score: 0, flags: [] };

    try {
      // Check for coordinated attacks
      const similarClaims = await BadgeClaim.find({
        badgeId: claim.badgeId,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
      });

      if (similarClaims.length > 20) {
        score.score += 0.4;
        score.flags.push('coordinated_attack');
      }

      // Check for IP clustering
      const ipClaims = await BadgeClaim.find({
        'security.ipAddress': claim.security.ipAddress,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (ipClaims.length > 10) {
        score.score += 0.3;
        score.flags.push('ip_clustering');
      }

    } catch (error) {
      logger.error('Error in pattern analysis:', error);
    }

    return score;
  }

  /**
   * Analyze device and location data
   */
  async analyzeDeviceAndLocation(claim, user) {
    const score = { score: 0, flags: [] };

    try {
      // Check for device fingerprint anomalies
      const deviceClaims = await BadgeClaim.find({
        'security.deviceFingerprint': claim.security.deviceFingerprint,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (deviceClaims.length > 5) {
        score.score += 0.3;
        score.flags.push('device_fingerprint_anomaly');
      }

      // Check for location anomalies
      if (claim.security.location) {
        const locationClaims = await BadgeClaim.find({
          'security.location.country': claim.security.location.country,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        });

        if (locationClaims.length > 15) {
          score.score += 0.2;
          score.flags.push('location_anomaly');
        }
      }

    } catch (error) {
      logger.error('Error in device and location analysis:', error);
    }

    return score;
  }

  /**
   * Analyze account characteristics
   */
  async analyzeAccount(claim, user) {
    const score = { score: 0, flags: [] };

    try {
      // Check account age
      const accountAge = (Date.now() - user.createdAt) / (1000 * 60 * 60 * 24);
      if (accountAge < 1) {
        score.score += 0.4;
        score.flags.push('new_account');
      }

      // Check for suspicious account characteristics
      if (user.totalLikes === 0 && user.totalComments === 0) {
        score.score += 0.2;
        score.flags.push('inactive_account');
      }

      // Check for verification status
      if (!user.isVerified) {
        score.score += 0.1;
        score.flags.push('unverified_account');
      }

    } catch (error) {
      logger.error('Error in account analysis:', error);
    }

    return score;
  }

  /**
   * Determine risk level based on score
   */
  determineRiskLevel(score) {
    if (score >= this.riskThresholds.critical) return 'critical';
    if (score >= this.riskThresholds.high) return 'high';
    if (score >= this.riskThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Calculate time between claims
   */
  calculateTimeBetweenClaims(claims) {
    if (claims.length < 2) return Infinity;
    
    const sortedClaims = claims.sort((a, b) => b.createdAt - a.createdAt);
    const timeDiff = sortedClaims[0].createdAt - sortedClaims[1].createdAt;
    return timeDiff / 1000; // Return in seconds
  }

  /**
   * Get recent user activity
   */
  async getRecentUserActivity(userId) {
    try {
      const recentActivity = await BadgeClaim.find({
        userId: userId,
        createdAt: { $gte: new Date(Date.now() - 60 * 60 * 1000) }
      });

      return {
        count: recentActivity.length,
        spike: recentActivity.length > 5 ? recentActivity.length : 0
      };
    } catch (error) {
      logger.error('Error getting recent activity:', error);
      return { count: 0, spike: 0 };
    }
  }

  /**
   * Update fraud detection model based on outcomes
   */
  async updateModel(claim, actualOutcome) {
    try {
      // This would integrate with your ML model training
      logger.info('Fraud detection model updated', {
        claimId: claim.claimId,
        predictedRisk: claim.fraudCheck.riskLevel,
        actualOutcome: actualOutcome
      });
    } catch (error) {
      logger.error('Error updating fraud detection model:', error);
    }
  }
}

module.exports = new FraudDetectionService(); 