const dotenv = require('dotenv');
dotenv.config();

const TTSEnhancedService = require('../src/services/TTSEnhancedService');
const logger = require('../src/utils/logger');

class TTSWorker {
  constructor() {
    this.ttsService = new TTSEnhancedService();
    this.isRunning = false;
    this.shutdownRequested = false;
  }

  async start() {
    try {
      logger.info('Starting TTS Worker...');
      
      // Initialize TTS service
      await this.ttsService.initialize();
      
      this.isRunning = true;
      logger.info('TTS Worker started successfully');

      // Handle graceful shutdown
      this.setupGracefulShutdown();

      // Keep the process alive
      this.keepAlive();

    } catch (error) {
      logger.error('Failed to start TTS Worker:', error);
      process.exit(1);
    }
  }

  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      logger.info(`Received ${signal}, shutting down gracefully...`);
      this.shutdownRequested = true;
      
      try {
        await this.ttsService.shutdown();
        logger.info('TTS Worker shutdown completed');
        process.exit(0);
      } catch (error) {
        logger.error('Error during shutdown:', error);
        process.exit(1);
      }
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
    process.on('SIGUSR2', () => shutdown('SIGUSR2')); // For nodemon restart
  }

  keepAlive() {
    const interval = setInterval(() => {
      if (this.shutdownRequested) {
        clearInterval(interval);
        return;
      }

      // Log health status every 5 minutes
      this.logHealthStatus();
    }, 5 * 60 * 1000);

    // Keep the process alive
    process.stdin.resume();
  }

  async logHealthStatus() {
    try {
      const health = await this.ttsService.healthCheck();
      const stats = await this.ttsService.getServiceStats();
      
      logger.info('TTS Worker health status', {
        healthy: health.healthy,
        availableProviders: health.availableProviders,
        queueStats: {
          waiting: stats.queue.waiting,
          active: stats.queue.active,
          completed: stats.queue.completed,
          failed: stats.queue.failed,
        },
        workerStats: stats.worker,
      });
    } catch (error) {
      logger.error('Failed to get health status:', error);
    }
  }
}

// Start the worker
const worker = new TTSWorker();
worker.start().catch(error => {
  logger.error('Failed to start TTS Worker:', error);
  process.exit(1);
}); 