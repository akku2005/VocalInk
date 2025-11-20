const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { protect } = require('../middleware/auth');

// All dashboard routes require authentication
router.use(protect);

// Main dashboard data
router.get('/', dashboardController.getDashboardData);

// Recent blogs
router.get('/recent-blogs', dashboardController.getRecentBlogs);

// Top performing blogs
router.get('/top-blogs', dashboardController.getTopBlogs);

// Analytics over time
router.get('/analytics', dashboardController.getAnalytics);

// Personalized analytics summary
router.get('/personal-analytics', dashboardController.getPersonalAnalytics);

// Recent activity feed
router.get('/activity', dashboardController.getRecentActivity);

// Engagement metrics
router.get('/engagement', dashboardController.getEngagementMetrics);

// Growth statistics
router.get('/growth', dashboardController.getGrowthStats);

module.exports = router;
