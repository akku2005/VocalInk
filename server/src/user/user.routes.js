const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { protect, requireAdmin } = require('../middleware/auth');

// Profile routes
router.get('/:id', userController.getProfile);
router.put('/:id', protect, userController.updateProfile);
router.patch('/me', protect, userController.updateProfile);

// Follow system
router.post('/:targetUserId/follow', protect, userController.followUser);
router.delete('/:targetUserId/follow', protect, userController.unfollowUser);

// User content
router.get('/:id/blogs', userController.getUserBlogs);
router.get('/:id/badges', userController.getUserBadges);

// Notifications
router.get('/:id/notifications', protect, userController.getUserNotifications);
router.patch('/notifications/:notificationId/read', protect, userController.markNotificationRead);
router.patch('/notifications/read-all', protect, userController.markAllNotificationsRead);

// Leaderboard
router.get('/leaderboard', userController.getLeaderboard);
router.get('/:id/leaderboard', userController.getUserLeaderboard);

// Search
router.get('/search', userController.searchUsers);

// Role management
router.patch('/:id/promote', protect, requireAdmin, userController.promoteToAdmin);
router.patch('/:id/upgrade', protect, userController.upgradeToWriter);

module.exports = router; 