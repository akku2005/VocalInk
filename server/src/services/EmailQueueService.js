const Bull = require('bull');
const logger = require('../utils/logger');
const redisManager = require('./RedisManager');

class EmailQueueService {
    constructor() {
        this.queue = null;
        // Don't call initialize() in constructor - it will be called explicitly
    }

    async initialize() {
        try {
            // Get Redis configuration from centralized manager
            const redisConfig = redisManager.getBullConfig();

            // Marketing email queue
            this.queue = new Bull('marketing-email', {
                redis: redisConfig,
                defaultJobOptions: {
                    attempts: 3,
                    backoff: {
                        type: 'exponential',
                        delay: 5000,
                    },
                    removeOnComplete: 1000,
                    removeOnFail: 1000,
                    timeout: 60000, // 1 minute per email max
                },
            });

            logger.info(' Email Queue Service initialized successfully');
        } catch (error) {
            logger.error('Failed to initialize Email Queue Service:', error);
            throw error;
        }
    }

    /**
     * Add email job to queue
     * @param {Object} emailData - { to, subject, html, campaignId }
     */
    async addEmailJob(emailData) {
        try {
            if (!this.queue) {
                throw new Error('Email queue not initialized');
            }

            const job = await this.queue.add(emailData, {
                priority: 1, // Standard priority
                attempts: 3
            });

            return {
                jobId: job.id,
                status: 'queued',
            };
        } catch (error) {
            logger.error('Failed to add email job to queue:', error);
            throw error;
        }
    }

    /**
     * Get queue statistics
     */
    async getQueueStats() {
        try {
            if (!this.queue) return null;

            const waiting = await this.queue.getWaitingCount();
            const active = await this.queue.getActiveCount();
            const completed = await this.queue.getCompletedCount();
            const failed = await this.queue.getFailedCount();

            return {
                waiting,
                active,
                completed,
                failed,
                total: waiting + active + completed + failed
            };
        } catch (error) {
            logger.error('Failed to get email queue stats:', error);
            return null;
        }
    }

    /**
     * Shutdown queue
     */
    async shutdown() {
        try {
            if (this.queue) {
                await this.queue.close();
            }
            logger.info('Email Queue Service shutdown completed');
        } catch (error) {
            logger.error('Error during Email Queue Service shutdown:', error);
        }
    }
}

// Singleton
module.exports = new EmailQueueService();
