const TTSService = require('./TTSService');
const TTSQueueService = require('./TTSQueueService');
const TTSWorkerService = require('./TTSWorkerService');
const logger = require('../utils/logger');

class TTSEnhancedService {
  constructor() {
    this.ttsService = new TTSService();
    this.queueService = null;
    this.workerService = null;
    this.initialized = false;
  }

  /**
   * Initialize the enhanced TTS service
   */
  async initialize() {
    try {
      // Check if queue is enabled
      if (process.env.TTS_QUEUE_ENABLED === 'true') {
        // Initialize queue service
        this.queueService = new TTSQueueService();
        await this.queueService.initialize();

        // Initialize worker service if enabled
        if (process.env.TTS_WORKER_ENABLED === 'true') {
          this.workerService = new TTSWorkerService(this.queueService);
          await this.workerService.start();
        }

        logger.info('TTS Enhanced Service initialized with queue system');
      } else {
        logger.info('TTS Enhanced Service initialized without queue system');
      }

      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize TTS Enhanced Service:', error);
      throw error;
    }
  }

  /**
   * Generate TTS with enhanced features
   */
  async generateSpeech(text, options = {}, userId, requestInfo = {}) {
    if (!this.initialized) {
      await this.initialize();
    }

    try {
      // Validate input
      this.validateInput(text, options);

      // If queue is disabled, process immediately
      if (!this.queueService) {
        return await this.processImmediately(text, options, userId);
      }

      // Add job to queue
      const queueResult = await this.queueService.addTTSJob(text, options, userId, requestInfo);

      // If it's a duplicate request, return existing result
      if (queueResult.existingJob) {
        const existingStatus = await this.queueService.getJobStatus(queueResult.jobId);
        if (existingStatus.status === 'completed' && existingStatus.result) {
          return existingStatus.result;
        }
      }

      // For immediate processing (small text), process synchronously
      if (text.length <= 500 && options.provider !== 'elevenlabs') {
        return await this.processImmediately(text, options, userId);
      }

      // Return job information for async processing
      return {
        jobId: queueResult.jobId,
        idempotencyKey: queueResult.idempotencyKey,
        status: 'queued',
        estimatedWaitTime: queueResult.estimatedWaitTime,
        message: 'TTS job queued for processing. Use getJobStatus to check progress.',
      };

    } catch (error) {
      logger.error('Failed to generate TTS:', error);
      throw error;
    }
  }

  /**
   * Process TTS immediately for small requests
   */
  async processImmediately(text, options, userId) {
    try {
      const result = await this.ttsService.generateSpeech(text, options);

      logger.info('TTS processed immediately', {
        userId,
        provider: result.provider,
        textLength: text.length,
      });

      return {
        success: true,
        result,
        processedImmediately: true,
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Immediate TTS processing failed:', error);
      throw error;
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId, userId) {
    try {
      if (!this.queueService) {
        throw new Error('Queue service not available');
      }

      const status = await this.queueService.getJobStatus(jobId);

      // Check if user owns the job
      if (status.result && status.result.userId !== userId) {
        throw new Error('Unauthorized to access this job');
      }

      return status;
    } catch (error) {
      logger.error('Failed to get job status:', error);
      throw error;
    }
  }

  /**
   * Get job by idempotency key
   */
  async getJobByIdempotencyKey(idempotencyKey, userId) {
    try {
      if (!this.queueService) {
        throw new Error('Queue service not available');
      }

      const status = await this.queueService.getJobByIdempotencyKey(idempotencyKey);

      if (!status) {
        return { status: 'not_found' };
      }

      // Check if user owns the job
      if (status.result && status.result.userId !== userId) {
        throw new Error('Unauthorized to access this job');
      }

      return status;
    } catch (error) {
      logger.error('Failed to get job by idempotency key:', error);
      throw error;
    }
  }

  /**
   * Cancel job
   */
  async cancelJob(jobId, userId) {
    try {
      if (!this.queueService) {
        throw new Error('Queue service not available');
      }

      return await this.queueService.cancelJob(jobId, userId);
    } catch (error) {
      logger.error('Failed to cancel job:', error);
      throw error;
    }
  }

  /**
   * Retry failed job
   */
  async retryJob(jobId, userId) {
    try {
      if (!this.queueService) {
        throw new Error('Queue service not available');
      }

      return await this.queueService.retryJob(jobId, userId);
    } catch (error) {
      logger.error('Failed to retry job:', error);
      throw error;
    }
  }

  /**
   * Get available voices with health check
   */
  async getAvailableVoices(provider = 'elevenlabs') {
    try {
      // Check if provider is healthy (if queue service is available)
      if (this.queueService && !this.queueService.isProviderAvailable(provider)) {
        logger.warn(`Provider ${provider} is not available, returning fallback voices`);
        return this.getFallbackVoices(provider);
      }

      const voices = await this.ttsService.getAvailableVoices(provider);

      return {
        success: true,
        provider,
        voices,
        count: voices.length,
        healthy: true,
      };
    } catch (error) {
      logger.warn(`Failed to get voices for provider ${provider}:`, error.message);

      // Return fallback voices
      return this.getFallbackVoices(provider);
    }
  }

  /**
   * Get fallback voices when provider is unavailable
   */
  getFallbackVoices(provider) {
    const fallbackVoices = {
      elevenlabs: [
        { id: 'default', name: 'Default Voice', gender: 'unknown', provider: 'espeak' },
      ],
      googlecloud: [
        { id: 'default', name: 'Default Voice', gender: 'unknown', provider: 'espeak' },
      ],
      espeak: [
        { id: 'en', name: 'English', gender: 'male', provider: 'espeak' },
        { id: 'en+f2', name: 'English Female', gender: 'female', provider: 'espeak' },
      ],
      gtts: [
        { id: 'en', name: 'English', gender: 'female', provider: 'gtts' },
      ],
      responsivevoice: [
        { id: 'US English Female', name: 'US English Female', gender: 'female', provider: 'responsivevoice' },
      ],
    };

    return {
      success: true,
      provider,
      voices: fallbackVoices[provider] || fallbackVoices.espeak,
      count: (fallbackVoices[provider] || fallbackVoices.espeak).length,
      healthy: false,
      fallback: true,
    };
  }

  /**
   * Get service statistics
   */
  async getServiceStats() {
    try {
      const queueStats = this.queueService ? await this.queueService.getQueueStats() : {};
      const workerStats = this.workerService ? this.workerService.getWorkerStats() : {};

      return {
        queue: queueStats,
        worker: workerStats,
        providers: this.getProviderHealthSummary(),
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Failed to get service stats:', error);
      throw error;
    }
  }

  /**
   * Get provider health summary
   */
  getProviderHealthSummary() {
    const summary = {};
    const providers = ['elevenlabs', 'googlecloud', 'espeak', 'gtts', 'responsivevoice'];

    providers.forEach(provider => {
      if (this.queueService) {
        const breaker = this.queueService.circuitBreakers.get(provider);
        const health = this.queueService.healthChecks.get(provider);

        summary[provider] = {
          available: this.queueService.isProviderAvailable(provider),
          circuitBreakerState: breaker ? breaker.state : 'UNKNOWN',
          health: health ? health.isHealthy : false,
          errorRate: health ? health.errorRate : 0,
          lastCheck: health ? health.lastCheck : null,
        };
      } else {
        summary[provider] = {
          available: true,
          circuitBreakerState: 'CLOSED',
          health: true,
          errorRate: 0,
          lastCheck: new Date(),
        };
      }
    });

    return summary;
  }

  /**
   * Validate input
   */
  validateInput(text, options) {
    if (!text || typeof text !== 'string') {
      throw new Error('Text is required and must be a string');
    }

    if (text.length > 10000) {
      throw new Error('Text too long (maximum 10,000 characters)');
    }

    if (text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Validate provider
    const validProviders = ['elevenlabs', 'googlecloud', 'espeak', 'gtts', 'responsivevoice'];
    if (options.provider && !validProviders.includes(options.provider)) {
      throw new Error(`Invalid provider. Must be one of: ${validProviders.join(', ')}`);
    }

    // Provider-specific validation
    if (options.provider === 'elevenlabs') {
      if (options.voiceId && typeof options.voiceId !== 'string') {
        throw new Error('voiceId must be a string');
      }
      if (options.stability !== undefined && (options.stability < 0 || options.stability > 1)) {
        throw new Error('stability must be between 0 and 1');
      }
      if (options.similarityBoost !== undefined && (options.similarityBoost < 0 || options.similarityBoost > 1)) {
        throw new Error('similarityBoost must be between 0 and 1');
      }
    }

    if (options.provider === 'googlecloud') {
      if (options.speakingRate !== undefined && (options.speakingRate < 0.25 || options.speakingRate > 4.0)) {
        throw new Error('speakingRate must be between 0.25 and 4.0');
      }
      if (options.pitch !== undefined && (options.pitch < -20.0 || options.pitch > 20.0)) {
        throw new Error('pitch must be between -20.0 and 20.0');
      }
    }

    // Language validation (basic whitelist used for gtts/espeak/general)
    if (options.language) {
      const supported = ['en', 'es', 'fr', 'de', 'it', 'pt', 'ja', 'ko', 'zh', 'hi'];
      if (!supported.includes(options.language)) {
        throw new Error(`Unsupported language: ${options.language}. Supported: ${supported.join(', ')}`);
      }
    }
  }

  /**
   * Clean up old jobs
   */
  async cleanupOldJobs(maxAge = 24 * 60 * 60 * 1000) {
    try {
      if (!this.queueService) {
        return { deletedCount: 0, message: 'Queue service not available' };
      }

      return await this.queueService.cleanupOldJobs(maxAge);
    } catch (error) {
      logger.error('Failed to cleanup old jobs:', error);
      throw error;
    }
  }

  /**
   * Reprocess dead letter queue jobs
   */
  async reprocessDeadLetterJobs(jobIds = []) {
    try {
      if (!this.queueService) {
        throw new Error('Queue service not available');
      }

      const deadLetterJobs = await this.queueService.deadLetterQueue.getJobs(['failed']);
      let reprocessedCount = 0;

      for (const job of deadLetterJobs) {
        if (jobIds.length === 0 || jobIds.includes(job.id)) {
          const originalData = job.data.originalData;
          const originalJobId = job.data.originalJobId;

          // Create new job with original data
          await this.queueService.addTTSJob(
            originalData.text,
            originalData.options,
            originalData.userId,
            originalData.requestInfo
          );

          // Remove from dead letter queue
          await job.remove();
          reprocessedCount++;
        }
      }

      logger.info(`Reprocessed ${reprocessedCount} dead letter queue jobs`);
      return { reprocessedCount };
    } catch (error) {
      logger.error('Failed to reprocess dead letter queue jobs:', error);
      throw error;
    }
  }

  /**
   * Get dead letter queue jobs
   */
  async getDeadLetterJobs(limit = 50) {
    try {
      if (!this.queueService) {
        throw new Error('Queue service not available');
      }

      const jobs = await this.queueService.deadLetterQueue.getJobs(['failed'], 0, limit);

      return jobs.map(job => ({
        id: job.id,
        originalJobId: job.data.originalJobId,
        error: job.data.error,
        timestamp: job.timestamp,
        failedAt: job.finishedOn,
      }));
    } catch (error) {
      logger.error('Failed to get dead letter queue jobs:', error);
      throw error;
    }
  }

  /**
   * Health check for the service
   */
  async healthCheck() {
    try {
      if (!this.queueService) {
        return {
          healthy: true,
          availableProviders: ['elevenlabs', 'googlecloud', 'espeak', 'gtts', 'responsivevoice'],
          queueHealth: {
            waiting: 0,
            active: 0,
            failed: 0,
          },
          timestamp: new Date(),
        };
      }

      const availableProviders = this.queueService.getAvailableProviders();
      const queueStats = await this.queueService.getQueueStats();

      return {
        healthy: availableProviders.length > 0,
        availableProviders,
        queueHealth: {
          waiting: queueStats.waiting,
          active: queueStats.active,
          failed: queueStats.failed,
        },
        timestamp: new Date(),
      };
    } catch (error) {
      logger.error('Health check failed:', error);
      return {
        healthy: false,
        error: error.message,
        timestamp: new Date(),
      };
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      if (this.workerService) {
        await this.workerService.stop();
      }

      if (this.queueService) {
        await this.queueService.shutdown();
      }

      logger.info('TTS Enhanced Service shutdown completed');
    } catch (error) {
      logger.error('Error during TTS Enhanced Service shutdown:', error);
    }
  }
}

module.exports = TTSEnhancedService;