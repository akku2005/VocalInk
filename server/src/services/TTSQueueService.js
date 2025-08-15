const Bull = require('bull');
const crypto = require('crypto');
const logger = require('../utils/logger');
const config = require('../config');

class TTSQueueService {
  constructor() {
    this.queue = null;
    this.processingQueue = null;
    this.deadLetterQueue = null;
    this.circuitBreakers = new Map();
    this.healthChecks = new Map();
    this.initialize();
  }

  async initialize() {
    try {
      // Redis configuration based on environment variables
      const redisConfig = {
        host: process.env.REDIS_HOST || 'localhost',
        port: parseInt(process.env.REDIS_PORT) || 6379,
        password: process.env.REDIS_PASSWORD || undefined,
        db: parseInt(process.env.REDIS_DB) || 0,
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
        retryDelayOnFailover: parseInt(process.env.REDIS_RETRY_DELAY) || 1000,
        maxRetriesPerRequest: parseInt(process.env.REDIS_MAX_RETRIES) || 3,
      };

      // Main TTS processing queue
      this.queue = new Bull('tts-processing', {
        redis: redisConfig,
        defaultJobOptions: {
          attempts: parseInt(process.env.TTS_RETRY_ATTEMPTS) || 3,
          backoff: {
            type: 'exponential',
            delay: parseInt(process.env.TTS_RETRY_DELAY) || 2000,
          },
          removeOnComplete: 100,
          removeOnFail: 50,
          timeout: parseInt(process.env.TTS_JOB_TIMEOUT) || 300000, // 5 minutes
        },
      });

      // Dead letter queue for failed jobs
      this.deadLetterQueue = new Bull('tts-dead-letter', {
        redis: redisConfig,
        defaultJobOptions: {
          removeOnComplete: false,
          removeOnFail: false,
        },
      });

      // Processing queue for active jobs
      this.processingQueue = new Bull('tts-processing-status', {
        redis: redisConfig,
      });

      // Initialize circuit breakers for each provider
      this.initializeCircuitBreakers();

      // Initialize health checks
      this.initializeHealthChecks();

      logger.info('TTS Queue Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize TTS Queue Service:', error);
      throw error;
    }
  }

  /**
   * Initialize circuit breakers for each TTS provider
   */
  initializeCircuitBreakers() {
    const providers = ['elevenlabs', 'googlecloud', 'espeak', 'gtts', 'responsivevoice'];
    
    providers.forEach(provider => {
      this.circuitBreakers.set(provider, {
        failures: 0,
        lastFailureTime: null,
        state: 'CLOSED', // CLOSED, OPEN, HALF_OPEN
        threshold: parseInt(process.env.TTS_CIRCUIT_BREAKER_THRESHOLD) || 5,
        timeout: parseInt(process.env.TTS_CIRCUIT_BREAKER_TIMEOUT) || 60000, // 1 minute
        successThreshold: 2,
      });
    });
  }

  /**
   * Initialize health checks for providers
   */
  initializeHealthChecks() {
    const providers = ['elevenlabs', 'googlecloud', 'espeak', 'gtts', 'responsivevoice'];
    
    providers.forEach(provider => {
      this.healthChecks.set(provider, {
        lastCheck: null,
        isHealthy: true,
        responseTime: null,
        errorRate: 0,
        totalRequests: 0,
        failedRequests: 0,
      });
    });

    // Run health checks every 5 minutes
    const healthCheckInterval = parseInt(process.env.TTS_HEALTH_CHECK_INTERVAL) || 300000; // 5 minutes
    setInterval(() => {
      this.runHealthChecks();
    }, healthCheckInterval);
  }

  /**
   * Generate idempotency key for request
   */
  generateIdempotencyKey(text, options, userId) {
    const data = JSON.stringify({
      text: text.substring(0, 100), // First 100 chars for uniqueness
      options: this.sanitizeOptions(options),
      userId,
      timestamp: Math.floor(Date.now() / (5 * 60 * 1000)) * (5 * 60 * 1000), // 5-minute window
    });
    
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Sanitize options for idempotency key generation
   */
  sanitizeOptions(options) {
    const sanitized = {};
    const allowedKeys = [
      'provider', 'voice', 'voiceId', 'voiceName', 'languageCode', 
      'ssmlGender', 'speed', 'speakingRate', 'language', 'stability', 
      'similarityBoost', 'style', 'useSpeakerBoost', 'pitch', 
      'volumeGainDb', 'effectsProfileId'
    ];
    
    allowedKeys.forEach(key => {
      if (options[key] !== undefined) {
        sanitized[key] = options[key];
      }
    });
    
    return sanitized;
  }

  /**
   * Add TTS job to queue with idempotency
   */
  async addTTSJob(text, options, userId, requestInfo = {}) {
    try {
      const idempotencyKey = this.generateIdempotencyKey(text, options, userId);
      
      // Check if job with same idempotency key already exists
      const existingJob = await this.queue.getJob(idempotencyKey);
      if (existingJob) {
        logger.info('Duplicate TTS request detected, returning existing job', {
          idempotencyKey,
          userId,
          jobId: existingJob.id,
        });
        
        return {
          jobId: existingJob.id,
          idempotencyKey,
          status: 'duplicate',
          existingJob: true,
        };
      }

      // Create job data
      const jobData = {
        text,
        options,
        userId,
        idempotencyKey,
        requestInfo,
        timestamp: new Date(),
        attempts: 0,
      };

      // Add job to queue
      const job = await this.queue.add(idempotencyKey, jobData, {
        jobId: idempotencyKey,
        priority: this.getJobPriority(options),
        delay: this.getJobDelay(options),
      });

      // Add to processing queue for status tracking
      await this.processingQueue.add(`status-${idempotencyKey}`, {
        jobId: job.id,
        idempotencyKey,
        userId,
        status: 'queued',
        timestamp: new Date(),
      });

      logger.info('TTS job added to queue', {
        jobId: job.id,
        idempotencyKey,
        userId,
        provider: options.provider,
        textLength: text.length,
      });

      return {
        jobId: job.id,
        idempotencyKey,
        status: 'queued',
        estimatedWaitTime: this.estimateWaitTime(),
      };
    } catch (error) {
      logger.error('Failed to add TTS job to queue:', error);
      throw error;
    }
  }

  /**
   * Get job priority based on options
   */
  getJobPriority(options) {
    // Higher priority for premium providers
    const priorityMap = {
      elevenlabs: 1,
      googlecloud: 2,
      espeak: 5,
      gtts: 4,
      responsivevoice: 3,
    };
    
    return priorityMap[options.provider] || 5;
  }

  /**
   * Get job delay based on rate limits
   */
  getJobDelay(options) {
    // Add small delay for rate limiting
    const delayMap = {
      elevenlabs: 1000, // 1 second
      googlecloud: 500,  // 0.5 seconds
      espeak: 0,
      gtts: 2000,       // 2 seconds
      responsivevoice: 0,
    };
    
    return delayMap[options.provider] || 0;
  }

  /**
   * Estimate wait time based on queue length
   */
  async estimateWaitTime() {
    try {
      const waiting = await this.queue.getWaiting();
      const active = await this.queue.getActive();
      const totalJobs = waiting.length + active.length;
      
      // Estimate 30 seconds per job
      return totalJobs * 30;
    } catch (error) {
      logger.error('Failed to estimate wait time:', error);
      return 60; // Default 1 minute
    }
  }

  /**
   * Get job status
   */
  async getJobStatus(jobId) {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        return { status: 'not_found' };
      }

      const state = await job.getState();
      const progress = job.progress();
      const result = job.returnvalue;
      const failedReason = job.failedReason;

      return {
        jobId: job.id,
        status: state,
        progress,
        result,
        failedReason,
        timestamp: job.timestamp,
        processedOn: job.processedOn,
        finishedOn: job.finishedOn,
      };
    } catch (error) {
      logger.error('Failed to get job status:', error);
      throw error;
    }
  }

  /**
   * Get job by idempotency key
   */
  async getJobByIdempotencyKey(idempotencyKey) {
    try {
      const job = await this.queue.getJob(idempotencyKey);
      if (!job) {
        return null;
      }

      return await this.getJobStatus(job.id);
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
      const job = await this.queue.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Check if user owns the job
      if (job.data.userId !== userId) {
        throw new Error('Unauthorized to cancel this job');
      }

      await job.remove();
      
      logger.info('TTS job cancelled', {
        jobId,
        userId,
      });

      return { success: true, message: 'Job cancelled successfully' };
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
      const job = await this.queue.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Check if user owns the job
      if (job.data.userId !== userId) {
        throw new Error('Unauthorized to retry this job');
      }

      await job.retry();
      
      logger.info('TTS job retried', {
        jobId,
        userId,
      });

      return { success: true, message: 'Job retried successfully' };
    } catch (error) {
      logger.error('Failed to retry job:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats() {
    try {
      const waiting = await this.queue.getWaiting();
      const active = await this.queue.getActive();
      const completed = await this.queue.getCompleted();
      const failed = await this.queue.getFailed();
      const delayed = await this.queue.getDelayed();

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        total: waiting.length + active.length + completed.length + failed.length + delayed.length,
        providers: this.getProviderStats(),
        circuitBreakers: this.getCircuitBreakerStats(),
        healthChecks: this.getHealthCheckStats(),
      };
    } catch (error) {
      logger.error('Failed to get queue stats:', error);
      throw error;
    }
  }

  /**
   * Get provider statistics
   */
  getProviderStats() {
    const stats = {};
    this.circuitBreakers.forEach((breaker, provider) => {
      stats[provider] = {
        state: breaker.state,
        failures: breaker.failures,
        lastFailureTime: breaker.lastFailureTime,
      };
    });
    return stats;
  }

  /**
   * Get circuit breaker statistics
   */
  getCircuitBreakerStats() {
    const stats = {};
    this.circuitBreakers.forEach((breaker, provider) => {
      stats[provider] = {
        state: breaker.state,
        failures: breaker.failures,
        threshold: breaker.threshold,
        timeout: breaker.timeout,
      };
    });
    return stats;
  }

  /**
   * Get health check statistics
   */
  getHealthCheckStats() {
    const stats = {};
    this.healthChecks.forEach((health, provider) => {
      stats[provider] = {
        isHealthy: health.isHealthy,
        lastCheck: health.lastCheck,
        responseTime: health.responseTime,
        errorRate: health.errorRate,
        totalRequests: health.totalRequests,
        failedRequests: health.failedRequests,
      };
    });
    return stats;
  }

  /**
   * Run health checks for all providers
   */
  async runHealthChecks() {
    logger.info('Running TTS provider health checks');
    
    // This would implement actual health checks for each provider
    // For now, we'll just log the check
    this.healthChecks.forEach((health, provider) => {
      health.lastCheck = new Date();
      logger.info(`Health check for ${provider}: ${health.isHealthy ? 'HEALTHY' : 'UNHEALTHY'}`);
    });
  }

  /**
   * Update circuit breaker state
   */
  updateCircuitBreaker(provider, success) {
    const breaker = this.circuitBreakers.get(provider);
    if (!breaker) return;

    if (success) {
      breaker.failures = 0;
      if (breaker.state === 'HALF_OPEN') {
        breaker.state = 'CLOSED';
        logger.info(`Circuit breaker for ${provider} closed`);
      }
    } else {
      breaker.failures++;
      breaker.lastFailureTime = new Date();
      
      if (breaker.failures >= breaker.threshold && breaker.state === 'CLOSED') {
        breaker.state = 'OPEN';
        logger.warn(`Circuit breaker for ${provider} opened`);
      }
    }
  }

  /**
   * Check if provider is available
   */
  isProviderAvailable(provider) {
    const breaker = this.circuitBreakers.get(provider);
    if (!breaker) return false;

    if (breaker.state === 'OPEN') {
      const timeSinceLastFailure = Date.now() - breaker.lastFailureTime.getTime();
      if (timeSinceLastFailure >= breaker.timeout) {
        breaker.state = 'HALF_OPEN';
        logger.info(`Circuit breaker for ${provider} moved to half-open`);
        return true;
      }
      return false;
    }

    return true;
  }

  /**
   * Get available providers (filtered by circuit breaker state)
   */
  getAvailableProviders() {
    const providers = [];
    this.circuitBreakers.forEach((breaker, provider) => {
      if (this.isProviderAvailable(provider)) {
        providers.push(provider);
      }
    });
    return providers;
  }

  /**
   * Clean up old jobs
   */
  async cleanupOldJobs(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      const completed = await this.queue.getCompleted();
      const failed = await this.queue.getFailed();
      
      const cutoffTime = Date.now() - maxAge;
      let cleanedCount = 0;

      // Clean up completed jobs
      for (const job of completed) {
        if (job.finishedOn < cutoffTime) {
          await job.remove();
          cleanedCount++;
        }
      }

      // Clean up failed jobs (keep for 7 days)
      const failedCutoffTime = Date.now() - (7 * 24 * 60 * 60 * 1000);
      for (const job of failed) {
        if (job.finishedOn < failedCutoffTime) {
          await job.remove();
          cleanedCount++;
        }
      }

      logger.info(`Cleaned up ${cleanedCount} old TTS jobs`);
      return cleanedCount;
    } catch (error) {
      logger.error('Failed to cleanup old jobs:', error);
      throw error;
    }
  }

  /**
   * Graceful shutdown
   */
  async shutdown() {
    try {
      if (this.queue) {
        await this.queue.close();
      }
      if (this.processingQueue) {
        await this.processingQueue.close();
      }
      if (this.deadLetterQueue) {
        await this.deadLetterQueue.close();
      }
      
      logger.info('TTS Queue Service shutdown completed');
    } catch (error) {
      logger.error('Error during TTS Queue Service shutdown:', error);
    }
  }
}

module.exports = TTSQueueService; 