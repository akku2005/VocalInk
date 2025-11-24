const TTSEnhancedService = require('../services/TTSEnhancedService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class TTSController {
  constructor() {
    this.ttsService = new TTSEnhancedService();
    this.initialized = false;
  }

  /**
   * Initialize the TTS service
   */
  async initialize() {
    if (!this.initialized) {
      await this.ttsService.initialize();
      this.initialized = true;
    }
  }

  /**
   * Generate TTS from text
   */
  async generateTTS(req, res) {
    try {
      await this.initialize();

      // Validate request
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({
          success: false,
          message: 'Validation failed',
          errors: errors.array()
        });
      }

      const {
        text,
        provider,
        voice,
        voiceId,
        voiceName,
        languageCode,
        ssmlGender,
        speed,
        speakingRate,
        language,
        stability,
        similarityBoost,
        style,
        useSpeakerBoost,
        pitch,
        volumeGainDb,
        effectsProfileId
      } = req.body;

      const { blogId } = req.params;

      // Validate required fields
      if (!text && !blogId) {
        return res.status(400).json({
          success: false,
          message: 'Either text or blogId is required'
        });
      }

      let content = text;
      let blog = null;

      // If blogId is provided, get content from blog
      if (blogId) {
        const Blog = require('../models/blog.model');
        blog = await Blog.findById(blogId);
        if (!blog) {
          return res.status(404).json({
            success: false,
            message: 'Blog not found'
          });
        }

        // Check authorization
        if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
          return res.status(403).json({
            success: false,
            message: 'Forbidden'
          });
        }

        content = blog.content;
      }

      // Prepare options
      const options = {
        provider: provider || 'googlecloud',
        voice: voice || 'en-US-Neural2-F',
        voiceId,
        voiceName,
        languageCode,
        ssmlGender,
        speed: speed || 150,
        speakingRate,
        language: language || 'en',
        stability,
        similarityBoost,
        style,
        useSpeakerBoost,
        pitch,
        volumeGainDb,
        effectsProfileId
      };

      // Prepare request info
      const requestInfo = {
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        userId: req.user.id,
        userRole: req.user.role,
        timestamp: new Date(),
        blogId: blogId || null
      };

      // Generate TTS
      const result = await this.ttsService.generateSpeech(content, options, req.user.id, requestInfo);

      // If immediate processing, update blog
      if (result.processedImmediately && blog) {
        blog.ttsUrl = result.result.url;
        blog.ttsOptions = options;
        blog.audioDuration = result.result.duration;
        await blog.save();

        logger.info('TTS generated for blog (immediate)', {
          userId: req.user.id,
          blogId: blog._id,
          ttsUrl: result.result.url,
          provider: result.result.provider
        });
      }

      res.json({
        success: true,
        ...result,
        metadata: {
          contentLength: content.length,
          wordCount: content.split(/\s+/).length,
          userId: req.user.id,
          timestamp: new Date()
        }
      });

    } catch (error) {
      logger.error('TTS generation failed:', error);

      res.status(500).json({
        success: false,
        message: 'TTS generation failed',
        error: error.message
      });
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(req, res) {
    try {
      await this.initialize();

      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: 'Job ID is required'
        });
      }

      const status = await this.ttsService.getJobStatus(jobId, req.user.id);

      res.json({
        success: true,
        ...status
      });

    } catch (error) {
      logger.error('Failed to get job status:', error);

      if (error.message === 'Queue service not available') {
        return res.status(503).json({
          success: false,
          message: 'Queue service not available',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get job status',
        error: error.message
      });
    }
  }

  /**
   * Get job by idempotency key
   */
  async getJobByIdempotencyKey(req, res) {
    try {
      await this.initialize();

      const { idempotencyKey } = req.params;

      if (!idempotencyKey) {
        return res.status(400).json({
          success: false,
          message: 'Idempotency key is required'
        });
      }

      const status = await this.ttsService.getJobByIdempotencyKey(idempotencyKey, req.user.id);

      res.json({
        success: true,
        ...status
      });

    } catch (error) {
      logger.error('Failed to get job by idempotency key:', error);

      if (error.message === 'Queue service not available') {
        return res.status(503).json({
          success: false,
          message: 'Queue service not available',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get job',
        error: error.message
      });
    }
  }

  /**
   * Cancel job
   */
  async cancelJob(req, res) {
    try {
      await this.initialize();

      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: 'Job ID is required'
        });
      }

      const result = await this.ttsService.cancelJob(jobId, req.user.id);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      logger.error('Failed to cancel job:', error);

      if (error.message === 'Queue service not available') {
        return res.status(503).json({
          success: false,
          message: 'Queue service not available',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to cancel job',
        error: error.message
      });
    }
  }

  /**
   * Retry failed job
   */
  async retryJob(req, res) {
    try {
      await this.initialize();

      const { jobId } = req.params;

      if (!jobId) {
        return res.status(400).json({
          success: false,
          message: 'Job ID is required'
        });
      }

      const result = await this.ttsService.retryJob(jobId, req.user.id);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      logger.error('Failed to retry job:', error);

      if (error.message === 'Queue service not available') {
        return res.status(503).json({
          success: false,
          message: 'Queue service not available',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to retry job',
        error: error.message
      });
    }
  }

  /**
   * Get available voices
   */
  async getAvailableVoices(req, res) {
    try {
      await this.initialize();

      const { provider = 'elevenlabs' } = req.query;

      const voices = await this.ttsService.getAvailableVoices(provider);

      res.json({
        success: true,
        ...voices
      });

    } catch (error) {
      logger.error('Failed to get available voices:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to get available voices',
        error: error.message
      });
    }
  }

  /**
   * Get user's TTS jobs
   */
  async getUserJobs(req, res) {
    try {
      await this.initialize();

      const { status, limit = 50, offset = 0 } = req.query;

      // This would need to be implemented in the queue service
      // For now, return a placeholder
      res.json({
        success: true,
        jobs: [],
        total: 0,
        limit: parseInt(limit),
        offset: parseInt(offset)
      });

    } catch (error) {
      logger.error('Failed to get user jobs:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to get user jobs',
        error: error.message
      });
    }
  }

  /**
   * Health check
   */
  async healthCheck(req, res) {
    try {
      await this.initialize();

      const health = await this.ttsService.healthCheck();

      res.json({
        success: true,
        ...health
      });

    } catch (error) {
      logger.error('Health check failed:', error);

      res.status(500).json({
        success: false,
        message: 'Health check failed',
        error: error.message
      });
    }
  }

  /**
   * Get service statistics
   */
  async getServiceStats(req, res) {
    try {
      await this.initialize();

      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden'
        });
      }

      const stats = await this.ttsService.getServiceStats();

      res.json({
        success: true,
        ...stats
      });

    } catch (error) {
      logger.error('Failed to get service stats:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to get service stats',
        error: error.message
      });
    }
  }

  /**
   * Cleanup old jobs
   */
  async cleanupOldJobs(req, res) {
    try {
      await this.initialize();

      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden'
        });
      }

      const { maxAge = 24 * 60 * 60 * 1000 } = req.body; // Default 24 hours

      const result = await this.ttsService.cleanupOldJobs(maxAge);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      logger.error('Failed to cleanup old jobs:', error);

      res.status(500).json({
        success: false,
        message: 'Failed to cleanup old jobs',
        error: error.message
      });
    }
  }

  /**
   * Get dead letter queue jobs
   */
  async getDeadLetterJobs(req, res) {
    try {
      await this.initialize();

      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden'
        });
      }

      const { limit = 50 } = req.query;

      const jobs = await this.ttsService.getDeadLetterJobs(parseInt(limit));

      res.json({
        success: true,
        jobs
      });

    } catch (error) {
      logger.error('Failed to get dead letter queue jobs:', error);

      if (error.message === 'Queue service not available') {
        return res.status(503).json({
          success: false,
          message: 'Queue service not available',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to get dead letter queue jobs',
        error: error.message
      });
    }
  }

  /**
   * Reprocess dead letter queue jobs
   */
  async reprocessDeadLetterJobs(req, res) {
    try {
      await this.initialize();

      // Check if user is admin
      if (req.user.role !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Forbidden'
        });
      }

      const { jobIds = [] } = req.body;

      const result = await this.ttsService.reprocessDeadLetterJobs(jobIds);

      res.json({
        success: true,
        ...result
      });

    } catch (error) {
      logger.error('Failed to reprocess dead letter queue jobs:', error);

      if (error.message === 'Queue service not available') {
        return res.status(503).json({
          success: false,
          message: 'Queue service not available',
          error: error.message
        });
      }

      res.status(500).json({
        success: false,
        message: 'Failed to reprocess dead letter queue jobs',
        error: error.message
      });
    }
  }
}

module.exports = TTSController; 