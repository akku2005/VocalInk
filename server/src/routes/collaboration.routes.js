const express = require('express');
const router = express.Router();
const collaborationController = require('../controllers/collaborationController');
const { protect } = require('../middleware/auth');

// Series-specific routes
router.post('/series/:seriesId/invite', protect, collaborationController.inviteUser);
router.get('/series/:seriesId/invites', protect, collaborationController.getPendingInvites);

// Token-based routes
router.post('/invites/:token/accept', protect, collaborationController.acceptInvite);
router.post('/invites/:token/reject', protect, collaborationController.rejectInvite);

module.exports = router;
