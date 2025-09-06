const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const settingsController = require('../controllers/settings.controller');

// Get all user settings
router.get('/', protect, settingsController.getAllSettings);

// Update specific settings sections
router.patch('/profile', protect, settingsController.updateProfile);
router.patch('/account', protect, settingsController.updateAccount);
router.patch('/privacy', protect, settingsController.updatePrivacy);
router.patch('/notifications', protect, settingsController.updateNotifications);
router.patch('/ai', protect, settingsController.updateAI);
router.patch('/gamification', protect, settingsController.updateGamification);
router.patch('/appearance', protect, settingsController.updateAppearance);

// Bulk update (for backward compatibility)
router.patch('/bulk', protect, settingsController.bulkUpdate);

module.exports = router;
