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
router.patch('/security', protect, settingsController.updateSecurity);

// Password management
router.patch('/change-password', protect, settingsController.changePassword);

// Bulk update (for backward compatibility)
router.patch('/bulk', protect, settingsController.bulkUpdate);

// Security & Privacy endpoints
router.post('/2fa/enable', protect, settingsController.enable2FA);
router.post('/2fa/verify', protect, settingsController.verify2FA);
router.post('/2fa/disable', protect, settingsController.disable2FA);

// Session management
router.get('/sessions', protect, settingsController.getActiveSessions);
router.delete('/sessions/:sessionId', protect, settingsController.revokeSession);
router.delete('/sessions', protect, settingsController.revokeAllSessions);

// Data management
router.get('/export', protect, settingsController.exportUserData);
router.delete('/account', protect, settingsController.deleteAccount);

module.exports = router;
