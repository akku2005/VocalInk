const express = require('express');
const router = express.Router();
const badgeController = require('./badge.controller');
const { protect, requireAdmin } = require('../middleware/auth');

// Public routes
router.get('/', badgeController.getAllBadges);
router.get('/stats', badgeController.getBadgeStats);
router.get('/:id', badgeController.getBadgeById);
router.get('/category/:category', badgeController.getBadgesByCategory);

// User routes (require authentication)
router.get('/eligible/badges', protect, badgeController.getEligibleBadges);
router.post('/:badgeId/claim', protect, badgeController.claimBadge);

// Admin routes
router.post('/', protect, requireAdmin, badgeController.createBadge);
router.put('/:id', protect, requireAdmin, badgeController.updateBadge);
router.delete('/:id', protect, requireAdmin, badgeController.deleteBadge);
router.post('/award', protect, requireAdmin, badgeController.awardBadgeToUser);

module.exports = router; 