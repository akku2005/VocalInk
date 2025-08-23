const AIRecommendationService = require('../services/AIRecommendationService');
const AIModerationService = require('../services/AIModerationService');
const AISearchService = require('../services/AISearchService');
const AINotificationService = require('../services/AINotificationService');
const Blog = require('../models/blog.model');
const Comment = require('../models/comment.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

class AIEnhancedController {
  constructor() {
    this.recommendationService = AIRecommendationService;
    this.moderationService = AIModerationService;
    this.searchService = AISearchService;
    this.notificationService = AINotificationService;
  }

  // ===== RECOMMENDATION ENDPOINTS =====

  /**
   * Get personalized recommendations
   */
  async getRecommendations(req, res) {
    try {
      const { contentType, limit, includeTrending } = req.query;
      const userId = req.user.id;

      const recommendations = await this.recommendationService.getPersonalizedRecommendations(
        userId,
        {
          contentType: contentType || 'all',
          limit: parseInt(limit) || 10,
          includeTrending: includeTrending !== 'false'
        }
      );

      res.json({
        success: true,
        data: recommendations,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      logger.error('Error getting recommendations:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get recommendations',
        error: error.message
      });
    }
  }

  /**
   * Get trending content
   */
  async getTrendingContent(req, res) {
    try {
      const { limit, timeframe } = req.query;

      const trending = await this.recommendationService.getTrendingContent(
        parseInt(limit) || 10
      );

      res.json({
        success: true,
        data: trending,
        timeframe: timeframe || '24h'
      });

    } catch (error) {
      logger.error('Error getting trending content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get trending content',
        error: error.message
      });
    }
  }

  /**
   * Get similar content
   */
  async getSimilarContent(req, res) {
    try {
      const { contentId, contentType, limit } = req.query;
      const userId = req.user.id;

      const similar = await this.recommendationService.getSimilarContent(
        userId,
        parseInt(limit) || 10
      );

      res.json({
        success: true,
        data: similar
      });

    } catch (error) {
      logger.error('Error getting similar content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get similar content',
        error: error.message
      });
    }
  }

  // ===== MODERATION ENDPOINTS =====

  /**
   * Screen content for moderation
   */
  async screenContent(req, res) {
    try {
      const { content, contentType, options } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Content is required'
        });
      }

      const screeningResult = await this.moderationService.screenContent(
        content,
        contentType || 'blog',
        options || {}
      );

      res.json({
        success: true,
        data: screeningResult
      });

    } catch (error) {
      logger.error('Error screening content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to screen content',
        error: error.message
      });
    }
  }

  /**
   * Moderate comment in real-time
   */
  async moderateComment(req, res) {
    try {
      const { comment, context } = req.body;
      const userId = req.user.id;

      if (!comment) {
        return res.status(400).json({
          success: false,
          message: 'Comment content is required'
        });
      }

      const moderationResult = await this.moderationService.moderateComment(
        comment,
        {
          userId,
          ...context
        }
      );

      res.json({
        success: true,
        data: moderationResult
      });

    } catch (error) {
      logger.error('Error moderating comment:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to moderate comment',
        error: error.message
      });
    }
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(req, res) {
    try {
      const { timeframe } = req.query;

      // Check admin permissions
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const stats = await this.moderationService.getModerationStats(
        timeframe || '30d'
      );

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      logger.error('Error getting moderation stats:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get moderation stats',
        error: error.message
      });
    }
  }

  // ===== SEARCH ENDPOINTS =====

  /**
   * Perform semantic search
   */
  async semanticSearch(req, res) {
    try {
      const { query, contentType, limit, filters, includeSimilar } = req.query;

      if (!query || query.trim().length < 2) {
        return res.status(400).json({
          success: false,
          message: 'Search query must be at least 2 characters long'
        });
      }

      const searchResults = await this.searchService.semanticSearch(
        query,
        {
          contentType: contentType || 'all',
          limit: parseInt(limit) || 20,
          filters: filters ? require('../utils/secureParser').secureJSONParse(filters, {
          maxLength: 2000,
          validateSchema: (data) => typeof data === 'object' && data !== null
        }) || {} : {},
          includeSimilar: includeSimilar !== 'false'
        }
      );

      res.json({
        success: true,
        data: searchResults,
        query: query.trim()
      });

    } catch (error) {
      logger.error('Error performing semantic search:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to perform search',
        error: error.message
      });
    }
  }

  /**
   * Auto-generate tags for content
   */
  async autoTagContent(req, res) {
    try {
      const { content, contentType } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Content is required'
        });
      }

      const tags = await this.searchService.autoTagContent(
        content,
        contentType || 'blog'
      );

      res.json({
        success: true,
        data: {
          tags,
          count: tags.length
        }
      });

    } catch (error) {
      logger.error('Error auto-generating tags:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate tags',
        error: error.message
      });
    }
  }

  /**
   * Find similar content
   */
  async findSimilarContent(req, res) {
    try {
      const { query, limit } = req.query;

      if (!query) {
        return res.status(400).json({
          success: false,
          message: 'Query is required'
        });
      }

      const similar = await this.searchService.findSimilarContent(
        query,
        parseInt(limit) || 10
      );

      res.json({
        success: true,
        data: similar
      });

    } catch (error) {
      logger.error('Error finding similar content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to find similar content',
        error: error.message
      });
    }
  }

  /**
   * Cluster content by similarity
   */
  async clusterContent(req, res) {
    try {
      const { contentType, limit, minClusterSize } = req.query;

      const clusters = await this.searchService.clusterContent(
        contentType || 'blogs',
        {
          limit: parseInt(limit) || 100,
          minClusterSize: parseInt(minClusterSize) || 3
        }
      );

      res.json({
        success: true,
        data: clusters
      });

    } catch (error) {
      logger.error('Error clustering content:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to cluster content',
        error: error.message
      });
    }
  }

  // ===== NOTIFICATION ENDPOINTS =====

  /**
   * Predict optimal notification timing
   */
  async predictNotificationTiming(req, res) {
    try {
      const { notificationType, timezone, urgency, contentType } = req.body;
      const userId = req.user.id;

      const timing = await this.notificationService.predictOptimalTiming(
        userId,
        notificationType || 'general',
        {
          timezone,
          urgency: urgency || 'normal',
          contentType: contentType || 'general'
        }
      );

      res.json({
        success: true,
        data: timing
      });

    } catch (error) {
      logger.error('Error predicting notification timing:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to predict timing',
        error: error.message
      });
    }
  }

  /**
   * Personalize notification
   */
  async personalizeNotification(req, res) {
    try {
      const { template, notificationType, includePersonalization, includeRecommendations } = req.body;
      const userId = req.user.id;

      if (!template) {
        return res.status(400).json({
          success: false,
          message: 'Notification template is required'
        });
      }

      const personalized = await this.notificationService.personalizeNotification(
        userId,
        template,
        {
          notificationType: notificationType || 'general',
          includePersonalization: includePersonalization !== false,
          includeRecommendations: includeRecommendations === true
        }
      );

      res.json({
        success: true,
        data: personalized
      });

    } catch (error) {
      logger.error('Error personalizing notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to personalize notification',
        error: error.message
      });
    }
  }

  /**
   * Predict notification engagement
   */
  async predictNotificationEngagement(req, res) {
    try {
      const { notificationData, notificationType, includeUserHistory, includeContentAnalysis } = req.body;
      const userId = req.user.id;

      if (!notificationData) {
        return res.status(400).json({
          success: false,
          message: 'Notification data is required'
        });
      }

      const prediction = await this.notificationService.predictEngagement(
        userId,
        notificationData,
        {
          notificationType: notificationType || 'general',
          includeUserHistory: includeUserHistory !== false,
          includeContentAnalysis: includeContentAnalysis !== false
        }
      );

      res.json({
        success: true,
        data: prediction
      });

    } catch (error) {
      logger.error('Error predicting notification engagement:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to predict engagement',
        error: error.message
      });
    }
  }

  /**
   * Generate smart summaries
   */
  async generateSmartSummaries(req, res) {
    try {
      const { content, maxLength, style, includeKeyPoints, includeActionItems } = req.body;

      if (!content) {
        return res.status(400).json({
          success: false,
          message: 'Content is required'
        });
      }

      const summaries = await this.notificationService.generateSmartSummaries(
        content,
        {
          maxLength: parseInt(maxLength) || 150,
          style: style || 'concise',
          includeKeyPoints: includeKeyPoints !== false,
          includeActionItems: includeActionItems === true
        }
      );

      res.json({
        success: true,
        data: summaries
      });

    } catch (error) {
      logger.error('Error generating smart summaries:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to generate summaries',
        error: error.message
      });
    }
  }

  /**
   * Send intelligent notification
   */
  async sendIntelligentNotification(req, res) {
    try {
      const { notificationData, predictTiming, personalize, predictEngagement, includeSummary } = req.body;
      const userId = req.user.id;

      if (!notificationData) {
        return res.status(400).json({
          success: false,
          message: 'Notification data is required'
        });
      }

      const result = await this.notificationService.sendIntelligentNotification(
        userId,
        notificationData,
        {
          predictTiming: predictTiming !== false,
          personalize: personalize !== false,
          predictEngagement: predictEngagement !== false,
          includeSummary: includeSummary !== false
        }
      );

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      logger.error('Error sending intelligent notification:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to send notification',
        error: error.message
      });
    }
  }

  // ===== UTILITY ENDPOINTS =====

  /**
   * Get AI service status
   */
  async getAIStatus(req, res) {
    try {
      const status = {
        services: {
          recommendations: 'active',
          moderation: 'active',
          search: 'active',
          notifications: 'active'
        },
        timestamp: new Date().toISOString(),
        version: '1.0.0'
      };

      res.json({
        success: true,
        data: status
      });

    } catch (error) {
      logger.error('Error getting AI status:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get AI status',
        error: error.message
      });
    }
  }

  /**
   * Get AI analytics
   */
  async getAIAnalytics(req, res) {
    try {
      const { timeframe } = req.query;

      // Check admin permissions
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin access required'
        });
      }

      const analytics = {
        recommendations: {
          totalRequests: 0,
          averageResponseTime: 0,
          topCategories: []
        },
        moderation: {
          totalScreened: 0,
          flaggedContent: 0,
          averageScore: 0
        },
        search: {
          totalSearches: 0,
          averageResults: 0,
          topQueries: []
        },
        notifications: {
          totalSent: 0,
          averageEngagement: 0,
          topTypes: []
        },
        timeframe: timeframe || '30d'
      };

      res.json({
        success: true,
        data: analytics
      });

    } catch (error) {
      logger.error('Error getting AI analytics:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to get AI analytics',
        error: error.message
      });
    }
  }
}

module.exports = new AIEnhancedController(); 