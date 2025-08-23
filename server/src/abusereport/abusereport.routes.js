const express = require('express');
const router = express.Router();
const { protect, authorize } = require('../middleware/auth');
const abuseReportController = require('./abusereport.controller');

// Public routes (require authentication)
router.post('/', protect, abuseReportController.createReport);
router.get('/categories', protect, abuseReportController.getReportCategories);
router.get('/my-reports', protect, abuseReportController.getUserReports);
router.get('/my-reports/:reportId', protect, abuseReportController.getReportById);
router.post('/my-reports/:reportId/appeal', protect, abuseReportController.appealReport);

// Admin/Moderator routes
router.get('/', protect, authorize(['admin', 'moderator']), abuseReportController.getReports);
router.get('/urgent', protect, authorize(['admin', 'moderator']), abuseReportController.getUrgentReports);
router.get('/analytics', protect, authorize(['admin']), abuseReportController.getReportAnalytics);
router.get('/target/:targetType/:targetId', protect, authorize(['admin', 'moderator']), abuseReportController.getReportsByTarget);
router.get('/:reportId', protect, authorize(['admin', 'moderator']), abuseReportController.getReportById);
router.put('/:reportId/status', protect, authorize(['admin', 'moderator']), abuseReportController.updateReportStatus);
router.put('/:reportId/resolve', protect, authorize(['admin', 'moderator']), abuseReportController.resolveReport);

module.exports = router;
