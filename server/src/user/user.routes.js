const express = require('express');
const router = express.Router();
const userController = require('./user.controller');
const { protect } = require('../middleware/auth');

router.get('/:id', userController.getProfile);
router.put('/:id', protect, userController.updateProfile);
router.get('/:id/blogs', userController.getUserBlogs);
router.get('/:id/badges', userController.getUserBadges);
router.get('/:id/leaderboard', userController.getUserLeaderboard);
router.get('/:id/notifications', protect, userController.getUserNotifications);

module.exports = router; 