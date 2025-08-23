const TTSService = require('./TTSService');
const logger = require('../utils/logger');
const config = require('../config');

class TTSWorkerService {
  constructor(queueService) {
    this.queueService = queueService;
    this.ttsService = new TTSService();
    this.processingJobs = new Map();
    this.maxConcurrentJobs = parseInt(process.env.TTS_MAX_CONCURRENT_JOBS) || 5;
  }

  /**
   * Start the TTS worker
   */
  async start() {
    try {
      if (!this.queueService) {
        throw new Error('Queue service is required for TTS worker');
      }

      // Process jobs with the queue
      this.queueService.queue.process(
        this.maxConcurrentJobs,
        async (job) => {
          return await this.processTTSJob(job);
        }
      );

      // Handle queue events instead of worker events
      this.queueService.queue.on('completed', (job, result) => {
        this.handleJobCompleted(job, result);
      });

      this.queueService.queue.on('failed', (job, err) => {
        this.handleJobFailed(job, err);
      });

      this.queueService.queue.on('stalled', (job) => {
        this.handleJobStalled(job);
      });

      logger.info('TTS Worker started successfully', {
        maxConcurrentJobs: this.maxConcurrentJobs
      });
    } catch (error) {
      logger.error('Failed to start TTS Worker:', error);
      throw error;
    }
  }

  /**
   * Process TTS job with comprehensive error handling
   */
  async processTTSJob(job) {
    const startTime = Date.now();
    const { text, options, userId, idempotencyKey, requestInfo } = job.data;

    try {
      logger.info('Processing TTS job', {
        jobId: job.id,
        idempotencyKey,
        userId,
        provider: options.provider,
        textLength: text.length,
      });

      // Track processing job
      this.processingJobs.set(job.id, {
        startTime,
        userId,
        provider: options.provider,
      });

      // Update job progress
      await job.progress(10);

      // Validate input
      this.validateTTSInput(text, options);

      // Update job progress
      await job.progress(20);

      // Check circuit breaker for primary provider
      const primaryProvider = options.provider || 'elevenlabs';
      if (!this.queueService.isProviderAvailable(primaryProvider)) {
        throw new Error(`Provider ${primaryProvider} is temporarily unavailable`);
      }

      // Update job progress
      await job.progress(30);

      // Try primary provider first
      let result;
      let usedProvider = primaryProvider;
      let fallbackUsed = false;

      try {
        result = await this.generateWithProvider(text, options, primaryProvider);
        this.queueService.updateCircuitBreaker(primaryProvider, true);
      } catch (error) {
        logger.warn(`Primary provider ${primaryProvider} failed, trying fallback`, {
          jobId: job.id,
          error: error.message,
        });

        this.queueService.updateCircuitBreaker(primaryProvider, false);
        fallbackUsed = true;

        // Try fallback providers
        result = await this.tryFallbackProviders(text, options, primaryProvider);
        usedProvider = result.provider;
      }

      // Update job progress
      await job.progress(80);

      // Upload to storage if not already done
      if (result.path && !result.url.startsWith('http')) {
        result = await this.uploadToStorage(result, options);
      }

      // Update job progress
      await job.progress(100);

      const processingTime = Date.now() - startTime;

      // Update health check statistics
      this.updateHealthCheck(usedProvider, true, processingTime);

      // Log successful processing
      logger.info('TTS job completed successfully', {
        jobId: job.id,
        idempotencyKey,
        userId,
        provider: usedProvider,
        fallbackUsed,
        processingTime,
        resultUrl: result.url,
      });

      // Remove from processing jobs
      this.processingJobs.delete(job.id);

      return {
        success: true,
        result,
        provider: usedProvider,
        fallbackUsed,
        processingTime,
        timestamp: new Date(),
      };

    } catch (error) {
      const processingTime = Date.now() - startTime;
      
      // Update health check statistics
      this.updateHealthCheck(options.provider || 'elevenlabs', false, processingTime);

      // Log error
      logger.error('TTS job failed', {
        jobId: job.id,
        idempotencyKey,
        userId,
        provider: options.provider,
        error: error.message,
        processingTime,
        attempt: job.attemptsMade + 1,
      });

      // Remove from processing jobs
      this.processingJobs.delete(job.id);

      // Categorize error for retry logic
      const errorCategory = this.categorizeError(error);
      
      throw {
        message: error.message,
        category: errorCategory,
        retryable: this.isRetryableError(errorCategory),
        provider: options.provider,
        processingTime,
      };
    }
  }

  /**
   * Validate TTS input
   */
  validateTTSInput(text, options) {
    if (!text || typeof text !== 'string') {
      throw new Error('Invalid text input');
    }

    if (text.length > 10000) {
      throw new Error('Text too long (max 10,000 characters)');
    }

    if (text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    // Validate provider-specific options
    if (options.provider === 'elevenlabs') {
      if (options.voiceId && typeof options.voiceId !== 'string') {
        throw new Error('Invalid voiceId for ElevenLabs');
      }
    }

    if (options.provider === 'googlecloud') {
      if (options.voiceName && typeof options.voiceName !== 'string') {
        throw new Error('Invalid voiceName for Google Cloud');
      }
    }
  }

  /**
   * Generate TTS with specific provider
   */
  async generateWithProvider(text, options, provider) {
    const providerOptions = this.mapOptionsForProvider(options, provider);
    
    switch (provider) {
      case 'elevenlabs':
        return await this.ttsService.generateWithElevenLabs(text, providerOptions);
      case 'googlecloud':
        return await this.ttsService.generateWithGoogleCloud(text, providerOptions);
      case 'espeak':
        return await this.ttsService.generateWithESpeak(text, providerOptions);
      case 'gtts':
        return await this.ttsService.generateWithGTTS(text, providerOptions);
      case 'responsivevoice':
        return await this.ttsService.generateWithResponsiveVoice(text, providerOptions);
      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Map options for specific provider
   */
  mapOptionsForProvider(options, provider) {
    const mapped = {};

    switch (provider) {
      case 'elevenlabs':
        mapped.voiceId = options.voiceId;
        mapped.stability = options.stability;
        mapped.similarityBoost = options.similarityBoost;
        mapped.style = options.style;
        mapped.useSpeakerBoost = options.useSpeakerBoost;
        break;
      case 'googlecloud':
        mapped.voiceName = options.voiceName;
        mapped.languageCode = options.languageCode;
        mapped.ssmlGender = options.ssmlGender;
        mapped.speakingRate = options.speakingRate;
        mapped.pitch = options.pitch;
        mapped.volumeGainDb = options.volumeGainDb;
        mapped.effectsProfileId = options.effectsProfileId;
        break;
      case 'espeak':
        mapped.voice = options.voice;
        mapped.speed = options.speed;
        mapped.pitch = options.pitch;
        mapped.volume = options.volume;
        break;
      case 'gtts':
        mapped.language = options.language;
        mapped.slow = options.slow;
        break;
      case 'responsivevoice':
        mapped.voice = options.voice;
        mapped.rate = options.rate;
        mapped.pitch = options.pitch;
        mapped.volume = options.volume;
        break;
    }

    return mapped;
  }

  /**
   * Try fallback providers
   */
  async tryFallbackProviders(text, options, failedProvider) {
    const fallbackOrder = this.getFallbackOrder(failedProvider);
    
    for (const provider of fallbackOrder) {
      if (!this.queueService.isProviderAvailable(provider)) {
        logger.warn(`Fallback provider ${provider} is not available`);
        continue;
      }

      try {
        logger.info(`Trying fallback provider: ${provider}`);
        const result = await this.generateWithProvider(text, options, provider);
        this.queueService.updateCircuitBreaker(provider, true);
        
        logger.info(`Fallback provider ${provider} succeeded`);
        return result;
      } catch (error) {
        logger.warn(`Fallback provider ${provider} failed: ${error.message}`);
        this.queueService.updateCircuitBreaker(provider, false);
        continue;
      }
    }

    throw new Error('All TTS providers failed');
  }

  /**
   * Get fallback provider order
   */
  getFallbackOrder(failedProvider) {
    const fallbackMap = {
      elevenlabs: ['googlecloud', 'espeak', 'gtts', 'responsivevoice'],
      googlecloud: ['elevenlabs', 'espeak', 'gtts', 'responsivevoice'],
      espeak: ['gtts', 'responsivevoice', 'elevenlabs', 'googlecloud'],
      gtts: ['espeak', 'responsivevoice', 'elevenlabs', 'googlecloud'],
      responsivevoice: ['espeak', 'gtts', 'elevenlabs', 'googlecloud'],
    };

    return fallbackMap[failedProvider] || ['espeak', 'gtts', 'responsivevoice'];
  }

  /**
   * Upload result to storage
   */
  async uploadToStorage(result, options) {
    try {
      // This would integrate with the existing storage logic
      // For now, return the result as-is
      return result;
    } catch (error) {
      logger.error('Failed to upload to storage:', error);
      // Return result without storage upload
      return result;
    }
  }

  /**
   * Categorize error for retry logic
   */
  categorizeError(error) {
    const message = error.message.toLowerCase();
    
    // Permanent errors (no retry)
    if (message.includes('invalid') || 
        message.includes('unsupported') || 
        message.includes('not found') ||
        message.includes('unauthorized') ||
        message.includes('forbidden')) {
      return 'PERMANENT';
    }
    
    // Rate limit errors (retry with backoff)
    if (message.includes('rate limit') || 
        message.includes('quota') || 
        message.includes('too many requests')) {
      return 'RATE_LIMIT';
    }
    
    // Network errors (retry)
    if (message.includes('network') || 
        message.includes('timeout') || 
        message.includes('connection') ||
        message.includes('econnreset') ||
        message.includes('enotfound')) {
      return 'NETWORK';
    }
    
    // Provider errors (retry)
    if (message.includes('provider') || 
        message.includes('service') || 
        message.includes('internal')) {
      return 'PROVIDER';
    }
    
    // Default to temporary error
    return 'TEMPORARY';
  }

  /**
   * Check if error is retryable
   */
  isRetryableError(category) {
    const retryableCategories = ['RATE_LIMIT', 'NETWORK', 'PROVIDER', 'TEMPORARY'];
    return retryableCategories.includes(category);
  }

  /**
   * Update health check statistics
   */
  updateHealthCheck(provider, success, responseTime) {
    const health = this.queueService.healthChecks.get(provider);
    if (!health) return;

    health.totalRequests++;
    health.responseTime = responseTime;
    health.lastCheck = new Date();

    if (!success) {
      health.failedRequests++;
    }

    health.errorRate = health.failedRequests / health.totalRequests;
    const errorRateThreshold = parseFloat(process.env.TTS_HEALTH_CHECK_ERROR_RATE_THRESHOLD) || 0.1;
    health.isHealthy = health.errorRate < errorRateThreshold;
  }

  /**
   * Handle job completion
   */
  handleJobCompleted(job, result) {
    logger.info('TTS job completed', {
      jobId: job.id,
      userId: job.data.userId,
      provider: result.provider,
      fallbackUsed: result.fallbackUsed,
      processingTime: result.processingTime,
    });
  }

  /**
   * Handle job failure
   */
  handleJobFailed(job, error) {
    logger.error('TTS job failed', {
      jobId: job.id,
      userId: job.data.userId,
      error: error.message,
      category: error.category,
      retryable: error.retryable,
      attempts: job.attemptsMade,
    });

    // If job is not retryable, move to dead letter queue
    if (!error.retryable) {
      this.moveToDeadLetterQueue(job, error);
    }
  }

  /**
   * Handle job stall
   */
  handleJobStalled(job) {
    logger.warn('TTS job stalled', {
      jobId: job.id,
      userId: job.data.userId,
    });
  }

  /**
   * Move job to dead letter queue
   */
  async moveToDeadLetterQueue(job, error) {
    try {
      await this.queueService.deadLetterQueue.add(`dlq-${job.id}`, {
        originalJobId: job.id,
        originalData: job.data,
        error: {
          message: error.message,
          category: error.category,
          timestamp: new Date(),
        },
      });

      logger.info('Job moved to dead letter queue', {
        jobId: job.id,
        originalJobId: job.id,
      });
    } catch (dlqError) {
      logger.error('Failed to move job to dead letter queue:', dlqError);
    }
  }

  /**
   * Get worker statistics
   */
  getWorkerStats() {
    return {
      processingJobs: this.processingJobs.size,
      maxConcurrentJobs: this.maxConcurrentJobs,
      activeJobs: Array.from(this.processingJobs.values()).map(job => ({
        jobId: job.jobId,
        userId: job.userId,
        provider: job.provider,
        startTime: job.startTime,
        duration: Date.now() - job.startTime,
      })),
    };
  }

  /**
   * Stop the worker
   */
  async stop() {
    try {
      // Close the queue processing
      if (this.queueService && this.queueService.queue) {
        await this.queueService.queue.close();
      }
      
      logger.info('TTS Worker stopped');
    } catch (error) {
      logger.error('Error stopping TTS Worker:', error);
    }
  }
}

module.exports = TTSWorkerService; 