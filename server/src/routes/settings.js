const express = require('express');
const router = express.Router();
const { protect, optionalAuth } = require('../middleware/auth');
const { validateSchema } = require('../middleware/validators');
const settingsController = require('../controllers/settings.controller');
const {
  updateProfileSchema,
  updateAccountSchema,
  updatePrivacySchema,
  updateNotificationsSchema,
  updateAISchema,
  updateGamificationSchema,
  updateAppearanceSchema,
  updateSecuritySchema,
  changePasswordSchema,
  verify2FASchema,
  disable2FASchema,
  deleteAccountSchema,
} = require('../validations/settingsSchema');

// Get all user settings (allow unauthenticated access for default settings)
router.get('/', optionalAuth, settingsController.getAllSettings);

// Update specific settings sections with validation
router.patch('/profile', protect, validateSchema(updateProfileSchema), settingsController.updateProfile);
router.patch('/account', protect, validateSchema(updateAccountSchema), settingsController.updateAccount);
router.patch('/privacy', protect, validateSchema(updatePrivacySchema), settingsController.updatePrivacy);
router.patch('/notifications', protect, validateSchema(updateNotificationsSchema), settingsController.updateNotifications);
router.patch('/ai', protect, validateSchema(updateAISchema), settingsController.updateAI);
router.patch('/gamification', protect, validateSchema(updateGamificationSchema), settingsController.updateGamification);
router.patch('/appearance', protect, validateSchema(updateAppearanceSchema), settingsController.updateAppearance);
router.patch('/security', protect, validateSchema(updateSecuritySchema), settingsController.updateSecurity);
router.delete('/sessions/history', protect, settingsController.clearLoginHistory);

// Password management with validation
router.patch('/change-password', protect, validateSchema(changePasswordSchema), settingsController.changePassword);

// Bulk update (for backward compatibility)
router.patch('/bulk', protect, settingsController.bulkUpdate);

// Security & Privacy endpoints with validation
router.post('/2fa/enable', protect, settingsController.enable2FA);
router.post('/2fa/verify', protect, validateSchema(verify2FASchema), settingsController.verify2FA);
router.post('/2fa/disable', protect, validateSchema(disable2FASchema), settingsController.disable2FA);

// 2FA Recovery endpoints (for users who lost their authenticator)
router.post('/2fa/recovery/request', settingsController.request2FARecovery); // No auth - email-based
router.post('/2fa/recovery/verify', settingsController.verify2FARecovery); // No auth - email-based
router.post('/2fa/backup-codes/regenerate', protect, settingsController.regenerateBackupCodes);
router.get('/2fa/backup-codes/status', protect, settingsController.getBackupCodesStatus);

// Session management
router.get('/sessions', protect, settingsController.getActiveSessions);
router.delete('/sessions/:sessionId', protect, settingsController.revokeSession);
router.delete('/sessions', protect, settingsController.revokeAllSessions);

// Data management
router.get('/export', protect, settingsController.exportUserData);
router.delete('/account', protect, validateSchema(deleteAccountSchema), settingsController.deleteAccount);

module.exports = router;

