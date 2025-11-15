const express = require('express');

const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const PushService = require('../services/PushService');

const notificationController = require('./notification.controller');

// User notification routes (require authentication)
// NOTE: Specific routes must come BEFORE parameterized routes to avoid conflicts
router.get('/', protect, notificationController.getUserNotifications);
router.get('/stats', protect, notificationController.getNotificationStats);
router.get('/unread-count', protect, async (req, res) => {
  try {
    const count = await require('../models/notification.model').getUnreadCount(req.user.id);
    return res.json({ success: true, data: count });
  } catch (e) {
    return res.status(500).json({ success: false, message: 'Failed to fetch unread count' });
  }
});

// Web Push subscription
router.post('/push/subscribe', protect, async (req, res) => {
  try {
    const result = PushService.addSubscription(req.user.id, req.body.subscription);
    return res.json({ success: true, ...result });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});

// Send test push (admin only)
router.post('/push/test', protect, requireAdmin, async (req, res) => {
  try {
    const { userId, title = 'Vocalink', body = 'Test push notification' } = req.body;
    const result = await PushService.sendNotification(userId, { title, body });
    return res.json({ success: true, ...result });
  } catch (e) {
    return res.status(400).json({ success: false, message: e.message });
  }
});
router.patch(
  '/read-all',
  protect,
  notificationController.markAllNotificationsRead
);
router.get('/:id', protect, notificationController.getNotificationById);
router.patch(
  '/:notificationId/read',
  protect,
  notificationController.markNotificationRead
);
router.patch(
  '/:notificationId/unread',
  protect,
  notificationController.markNotificationUnread
);
router.delete(
  '/:notificationId',
  protect,
  notificationController.deleteNotification
);

// Notification preferences
router.get(
  '/preferences',
  protect,
  notificationController.getNotificationPreferences
);
router.put(
  '/preferences',
  protect,
  notificationController.updateNotificationPreferences
);

// Test/Development routes
router.post(
  '/seed-test',
  protect,
  notificationController.seedTestNotifications
);

// Admin routes
router.post(
  '/system',
  protect,
  requireAdmin,
  notificationController.createSystemNotification
);

module.exports = router;
