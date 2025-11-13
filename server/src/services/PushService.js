const webpush = require('web-push');
const logger = require('../utils/logger');

class PushService {
  constructor() {
    const publicKey = process.env.VAPID_PUBLIC_KEY;
    const privateKey = process.env.VAPID_PRIVATE_KEY;
    const subject = process.env.VAPID_SUBJECT || 'mailto:admin@example.com';

    if (!publicKey || !privateKey) {
      logger.warn('VAPID keys not configured. Web Push will be disabled.');
      this.enabled = false;
      return;
    }

    webpush.setVapidDetails(subject, publicKey, privateKey);
    this.enabled = true;
    this.subscriptions = new Map();
  }

  addSubscription(userId, subscription) {
    if (!this.enabled) throw new Error('Web Push disabled');
    this.subscriptions.set(userId, subscription);
    logger.info('Push subscription saved', { userId });
    return { success: true };
  }

  async sendNotification(userId, payload) {
    if (!this.enabled) throw new Error('Web Push disabled');
    const sub = this.subscriptions.get(userId);
    if (!sub) throw new Error('No subscription for user');
    await webpush.sendNotification(sub, JSON.stringify(payload));
    logger.info('Push notification sent', { userId });
    return { success: true };
  }
}

module.exports = new PushService();