const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/auth');
const securityController = require('./security.controller');

// 2FA routes
router.post('/2fa/generate', protect, securityController.generate2FASecret);
router.post('/2fa/enable', protect, securityController.enable2FA);
router.post('/2fa/disable', protect, securityController.disable2FA);

// Session management routes
router.get('/sessions', protect, securityController.getActiveSessions);
router.delete('/sessions/:sessionId', protect, securityController.revokeSession);
router.delete('/sessions', protect, securityController.revokeAllSessions);

// Data export and account deletion
router.get('/export', protect, securityController.exportUserData);
router.delete('/account', protect, securityController.deleteAccount);

module.exports = router;
