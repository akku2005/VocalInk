const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { protect, requireAdmin } = require('../middleware/auth');

router.get('/:id', userController.getProfile);
router.put('/:id', protect, userController.updateProfile);
router.get('/:id/blogs', userController.getUserBlogs);
router.get('/:id/badges', userController.getUserBadges);
router.get('/:id/leaderboard', userController.getUserLeaderboard);
router.get('/:id/notifications', protect, userController.getUserNotifications);
router.patch('/:id/promote', protect, requireAdmin, userController.promoteToAdmin);
router.patch('/:id/upgrade', protect, userController.upgradeToWriter);

module.exports = router; 