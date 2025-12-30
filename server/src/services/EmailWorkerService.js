const EmailService = require('./EmailService');
const logger = require('../utils/logger');

class EmailWorkerService {
    constructor(emailQueueService) {
        this.emailQueueService = emailQueueService;
        this.isRunning = false;
        this.concurrency = parseInt(process.env.EMAIL_MARKETING_CONCURRENCY) || 5;
    }

    async start() {
        try {
            if (!this.emailQueueService || !this.emailQueueService.queue) {
                throw new Error('Email Queue Service not initialized');
            }

            logger.info(`Starting Email Worker with concurrency: ${this.concurrency}`);

            this.emailQueueService.queue.process(this.concurrency, async (job) => {
                return await this.processEmailJob(job);
            });

            this.isRunning = true;
            logger.info('Email Worker started successfully');
        } catch (error) {
            logger.error('Failed to start Email Worker:', error);
            throw error;
        }
    }

    async processEmailJob(job) {
        const { to, subject, html, campaignId } = job.data;

        try {
            // logger.debug(`Processing email for ${to} (Campaign: ${campaignId})`);

            // Use the generic notification method or create a specific one if needed
            // sendNotificationEmail takes (email, subject, html)
            await EmailService.sendNotificationEmail(to, subject, html);

            return { success: true, to, campaignId, timestamp: new Date() };
        } catch (error) {
            logger.error(`Failed to send email to ${to}:`, error);
            throw error; // Let Bull handle retries
        }
    }

    async stop() {
        // Bull queue close is handled by QueueService, usually we just stop processing
        // But mostly we rely on the process exit.
        this.isRunning = false;
    }
}

module.exports = EmailWorkerService;
