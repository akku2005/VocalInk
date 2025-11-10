const express = require('express');

const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');

const notificationController = require('./notification.controller');

// User notification routes (require authentication)
// NOTE: Specific routes must come BEFORE parameterized routes to avoid conflicts
router.get('/', protect, notificationController.getUserNotifications);
router.get('/stats', protect, notificationController.getNotificationStats);
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
