const express = require('express');
const router = express.Router();

const xpController = require('../controllers/xpController');
const { protect } = require('../middleware/auth');
const { authorize } = require('../middleware/authorize');

// Apply authentication to all routes
router.use(protect);

// User XP routes
router.get('/user', xpController.getUserXP);
router.get('/history', xpController.getTransactionHistory);
router.get('/stats', xpController.getUserStats);
router.get('/rank', xpController.getUserRank);
router.put('/settings', xpController.updateGamificationSettings);

// Leaderboard routes
router.get('/leaderboard', xpController.getLeaderboard);

// XP configuration (public info)
router.get('/config', xpController.getXPConfig);

// Internal XP awarding (for other services)
router.post('/award', xpController.awardXP);

// Admin routes (require admin role)
router.get('/flagged-transactions', 
  authorize(['admin']), 
  xpController.getFlaggedTransactions
);

router.put('/flagged-transactions/:transactionId/resolve', 
  authorize(['admin']), 
  xpController.resolveFlaggedTransaction
);

router.post('/admin/grant', 
  authorize(['admin']), 
  xpController.adminGrantXP
);

router.post('/admin/deduct', 
  authorize(['admin']), 
  xpController.adminDeductXP
);

module.exports = router; 