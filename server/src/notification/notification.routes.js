const express = require('express');

const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');

const notificationController = require('./notification.controller');

// User notification routes (require authentication)
router.get('/', protect, notificationController.getUserNotifications);
router.get('/stats', protect, notificationController.getNotificationStats);
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
router.patch(
  '/read-all',
  protect,
  notificationController.markAllNotificationsRead
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

// Admin routes
router.post(
  '/system',
  protect,
  requireAdmin,
  notificationController.createSystemNotification
);

module.exports = router;
