const User = require('../models/user.model');
const emailQueueService = require('./EmailQueueService');
const EmailWorkerService = require('./EmailWorkerService');
const logger = require('../utils/logger');

class MarketingService {
    constructor() {
        this.workerService = null;
        this.initialized = false;
    }

    async initialize() {
        if (this.initialized) return;

        try {
            // Initialize Queue
            await emailQueueService.initialize();

            // Initialize Worker
            this.workerService = new EmailWorkerService(emailQueueService);
            await this.workerService.start();

            this.initialized = true;
            logger.info(' Marketing Service initialized with queue system');
        } catch (error) {
            logger.error('Failed to initialize Marketing Service:', error);
            // Don't throw to prevent server startup failure, simply log
        }
    }

    /**
     * Send a marketing campaign
     * @param {Object} data - { subject, content, filters }
     * @param {string} adminId - ID of admin sending the campaign
     */
    async sendCampaign({ subject, content, filters }, adminId) {
        if (!this.initialized) await this.initialize();

        try {
            // Build query based on filters
            const query = this.buildQuery(filters);

            logger.info(`Preparing campaign "${subject}" with filters:`, filters);

            // Find users - use cursor for memory efficiency if huge, 
            // but find() with select is okay for moderate size (e.g. < 50k users)
            // For massive scale, cursor is better. Let's use cursor.
            const userCursor = User.find(query)
                .select('email firstName lastName')
                .cursor();

            let count = 0;
            const campaignId = `campaign_${Date.now()}_${adminId}`;

            for (let user = await userCursor.next(); user != null; user = await userCursor.next()) {
                const personalizedContent = this.personalizeContent(content, user);

                await emailQueueService.addEmailJob({
                    to: user.email,
                    subject,
                    html: personalizedContent,
                    campaignId
                });

                count++;
            }

            logger.info(`Campaign queued: ${count} emails`);
            return { success: true, count, campaignId };

        } catch (error) {
            logger.error('Failed to send campaign:', error);
            throw error;
        }
    }

    /**
     * Personalize email content with user details
     */
    personalizeContent(html, user) {
        let content = html;
        // Simple replacement
        content = content.replace(/{{name}}/g, user.firstName || 'User');
        content = content.replace(/{{email}}/g, user.email);
        return content;
    }

    /**
     * Get service stats
     */
    async getStats() {
        if (!this.initialized) await this.initialize();
        return await emailQueueService.getQueueStats();
    }

    /**
     * Get estimated audience count
     * @param {Object} filters 
     */
    async getAudienceCount(filters) {
        try {
            const query = this.buildQuery(filters);
            const count = await User.countDocuments(query);
            return count;
        } catch (error) {
            logger.error('Failed to get audience count:', error);
            throw error;
        }
    }

    /**
     * Helper to build query from filters
     */
    buildQuery(filters) {
        try {
            const query = { isDeleted: false };

            if (filters.target === 'subscribed') {
                query['notificationSettings.marketingEmails'] = true;
            }

            if (filters.role) {
                query.role = filters.role;
            }

            if (filters.isVerified !== undefined) {
                query.isVerified = filters.isVerified;
            }

            return query;
        } catch (error) {
            throw error;
        }
    }
}

module.exports = new MarketingService();