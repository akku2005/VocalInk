const express = require('express');

const router = express.Router();
const { protect, requireAdmin, optionalAuth } = require('../middleware/auth');

const userController = require('./user.controller');

// Leaderboard (place before dynamic :id route)
router.get('/leaderboard', userController.getLeaderboard);
router.get('/:id/leaderboard', userController.getUserLeaderboard);

// Profile routes
router.get('/me', protect, userController.getMyProfile);
router.get('/username/availability', userController.checkUsernameAvailability);
router.get('/search', userController.searchUsers);
router.get('/:id', optionalAuth, userController.getProfile);
router.put('/:id', protect, userController.updateProfile);
router.patch('/me', protect, userController.updateProfile);

// Password management
router.patch('/me/password', protect, userController.changePassword);

// Follow system
router.post('/:targetUserId/follow', protect, userController.followUser);
router.delete('/:targetUserId/follow', protect, userController.unfollowUser);
router.delete('/followers/:followerId', protect, userController.removeFollower);

// User content
router.get('/:id/blogs', optionalAuth, userController.getUserBlogs);
router.get('/:id/likes', optionalAuth, userController.getUserLikedBlogs);
router.get('/:id/bookmarks', optionalAuth, userController.getUserBookmarkedBlogs);
router.get('/:id/series', optionalAuth, userController.getUserSeries);
router.get('/:id/badges', userController.getUserBadges);

// Notifications
router.get('/:id/notifications', protect, userController.getUserNotifications);
router.patch(
  '/notifications/:notificationId/read',
  protect,
  userController.markNotificationRead
);
router.patch(
  '/notifications/read-all',
  protect,
  userController.markAllNotificationsRead
);

// Search
// Role management
router.patch(
  '/:id/promote',
  protect,
  requireAdmin,
  userController.promoteToAdmin
);
router.patch('/:id/upgrade', protect, userController.upgradeToWriter);

module.exports = router;
