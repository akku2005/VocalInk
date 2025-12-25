const express = require('express');
const router = express.Router();
const { protect, requireAdmin } = require('../middleware/auth');
const badgeController = require('./badge.controller');
const {
  badgeClaimLimiter,
  badgeSearchLimiter,
  badgeListLimiter,
  validateBadge,
  checkUserBadgeOwnership,
  checkExistingClaims,
  validateBadgeAvailability,
  checkUserEligibility,
  collectRequestInfo,
  basicFraudDetection,
  validateClaimReviewPermissions,
  logBadgeActivity,
  addBadgeSecurityHeaders,
  validatePagination,
  cacheBadgeResponse
} = require('../middleware/badgeMiddleware');

// Apply security headers to all badge routes
router.use(addBadgeSecurityHeaders);

// Public routes (no authentication required)
router.get('/',
  badgeListLimiter,
  validatePagination,
  badgeController.getAllBadges
);

router.get('/search',
  badgeSearchLimiter,
  validatePagination,
  badgeController.searchBadges
);

router.get('/popular',
  cacheBadgeResponse(600),
  badgeController.getPopularBadges
);

router.get('/rare',
  cacheBadgeResponse(600),
  badgeController.getRareBadges
);

router.get('/stats',
  cacheBadgeResponse(1800),
  badgeController.getBadgeStats
);

router.get('/analytics',
  protect,
  requireAdmin,
  badgeController.getBadgeAnalytics
);

router.get('/category/:category',
  validatePagination,
  cacheBadgeResponse(300),
  badgeController.getBadgesByCategory
);

// User routes (require authentication)
router.get('/user/badges',
  protect,
  validatePagination,
  badgeController.getUserBadges
);

router.get('/user/badges/:userId',
  protect,
  validatePagination,
  badgeController.getUserBadges
);

router.get('/user/eligible',
  protect,
  cacheBadgeResponse(300),
  badgeController.getEligibleBadges
);

router.get('/user/claims',
  protect,
  validatePagination,
  badgeController.getUserClaimHistory
);

router.get('/user/claims/:userId',
  protect,
  validatePagination,
  badgeController.getUserClaimHistory
);

router.get('/user/progress',
  protect,
  badgeController.getUserBadgeProgress
);

router.get('/user/progress/:userId',
  protect,
  badgeController.getUserBadgeProgress
);

// Badge detail (must be after /user/* to avoid route conflicts)
router.get('/:id',
  validateBadge,
  cacheBadgeResponse(600),
  badgeController.getBadgeById
);

router.post('/:badgeId/claim',
  protect,
  badgeClaimLimiter,
  validateBadge,
  checkUserBadgeOwnership,
  checkExistingClaims,
  validateBadgeAvailability,
  checkUserEligibility,
  collectRequestInfo,
  basicFraudDetection,
  logBadgeActivity('badge_claim_attempt'),
  badgeController.claimBadge
);

// Admin routes (require admin privileges)
router.post('/',
  protect,
  requireAdmin,
  logBadgeActivity('badge_created'),
  badgeController.createBadge
);

router.put('/:id',
  protect,
  requireAdmin,
  validateBadge,
  logBadgeActivity('badge_updated'),
  badgeController.updateBadge
);

router.delete('/:id',
  protect,
  requireAdmin,
  validateBadge,
  logBadgeActivity('badge_deleted'),
  badgeController.deleteBadge
);

router.post('/award',
  protect,
  requireAdmin,
  logBadgeActivity('badge_awarded'),
  badgeController.awardBadgeToUser
);

// Admin claim management routes
router.get('/admin/claims/pending',
  protect,
  requireAdmin,
  validatePagination,
  badgeController.getPendingClaims
);

router.put('/admin/claims/:claimId/review',
  protect,
  requireAdmin,
  validateClaimReviewPermissions,
  logBadgeActivity('claim_reviewed'),
  badgeController.reviewClaim
);

module.exports = router;
