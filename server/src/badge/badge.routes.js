const express = require('express');
const router = express.Router();
const badgeController = require('./badge.controller');
const { protect } = require('../middleware/auth');

router.get('/', badgeController.getBadges);
router.post('/claim', protect, badgeController.claimBadge);

module.exports = router; 