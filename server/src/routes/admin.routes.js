const express = require('express');
const router = express.Router();
const AdminService = require('../services/AdminService');
const { protect, requireAdmin } = require('../middleware/auth');
const { apiLimiter } = require('../middleware/rateLimiter');
const logger = require('../utils/logger');
const { body } = require('express-validator');
const validateRequest = require('../middleware/validateRequest');

// Apply authentication and admin check to all routes
router.use(protect);
router.use(requireAdmin);
router.use(apiLimiter);

/**
 * @route   GET /api/admin/dashboard
 * @desc    Get complete admin dashboard overview
 * @access  Admin
 */
router.get('/dashboard', async (req, res) => {
  try {
    const data = await AdminService.getDashboardOverview();
    res.json(data);
  } catch (error) {
    logger.error('Error fetching admin dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/users
 * @desc    Get user management data with pagination
 * @access  Admin
 */
router.get('/users', async (req, res) => {
  try {
    const { page, limit, search, role, status, sortBy, sortOrder } = req.query;
    const data = await AdminService.getUsers({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      search,
      role,
      status,
      sortBy,
      sortOrder
    });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching users:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch users',
      error: error.message
    });
  }
});

/**
 * @route   PUT /api/admin/users/:userId/status
 * @desc    Update user status (ban, verify, role change)
 * @access  Admin
 */
router.put('/users/:userId/status', async (req, res) => {
  try {
    const { userId } = req.params;
    const updates = req.body;
    const user = await AdminService.updateUserStatus(userId, updates, req.user.id);
    res.json({
      success: true,
      message: 'User status updated successfully',
      data: user
    });
  } catch (error) {
    logger.error('Error updating user status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update user status',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/stats/users
 * @desc    Get detailed user statistics
 * @access  Admin
 */
router.get('/stats/users', async (req, res) => {
  try {
    const stats = await AdminService.getUserStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching user stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/stats/content
 * @desc    Get detailed content statistics
 * @access  Admin
 */
router.get('/stats/content', async (req, res) => {
  try {
    const stats = await AdminService.getContentStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching content stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch content statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/stats/engagement
 * @desc    Get detailed engagement statistics
 * @access  Admin
 */
router.get('/stats/engagement', async (req, res) => {
  try {
    const stats = await AdminService.getEngagementStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching engagement stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch engagement statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/blogs
 * @desc    Get blogs with pagination and filtering for admin
 * @access  Admin
 */
router.get('/blogs', async (req, res) => {
  try {
    const { page, limit, search, status, authorId, sortBy, sortOrder } = req.query;
    const data = await AdminService.getBlogs({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      search,
      status,
      authorId,
      sortBy,
      sortOrder
    });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching blogs for admin:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch blogs',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/stats/tts
 * @desc    Get TTS usage statistics
 * @access  Admin
 */
router.get('/stats/tts', async (req, res) => {
  try {
    const stats = await AdminService.getTTSStats();
    res.json({ success: true, data: stats });
  } catch (error) {
    logger.error('Error fetching TTS stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch TTS statistics',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/system/health
 * @desc    Get system health metrics
 * @access  Admin
 */
router.get('/system/health', async (req, res) => {
  try {
    const health = await AdminService.getSystemHealth();
    res.json({ success: true, data: health });
  } catch (error) {
    logger.error('Error fetching system health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch system health',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/activity
 * @desc    Get recent activity feed
 * @access  Admin
 */
router.get('/activity', async (req, res) => {
  try {
    const { limit } = req.query;
    const activity = await AdminService.getRecentActivity(parseInt(limit) || 20);
    res.json({ success: true, data: activity });
  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch recent activity',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/moderation
 * @desc    Get content moderation queue
 * @access  Admin
 */
router.get('/moderation', async (req, res) => {
  try {
    const { page, limit, status, priority } = req.query;
    const data = await AdminService.getModerationQueue({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      status,
      priority
    });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching moderation queue:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch moderation queue',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/audit-logs
 * @desc    Get audit logs
 * @access  Admin
 */
router.get('/audit-logs', async (req, res) => {
  try {
    const { page, limit, action, userId, startDate, endDate } = req.query;
    const data = await AdminService.getAuditLogs({
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 50,
      action,
      userId,
      startDate,
      endDate
    });
    res.json({ success: true, data });
  } catch (error) {
    logger.error('Error fetching audit logs:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch audit logs',
      error: error.message
    });
  }
});

/**
 * @route   GET /api/admin/analytics/trends
 * @desc    Get analytics trends over time
 * @access  Admin
 */
router.get('/analytics/trends', async (req, res) => {
  try {
    const { days } = req.query;
    const trends = await AdminService.getAnalyticsTrends(parseInt(days) || 30);
    res.json({ success: true, data: trends });
  } catch (error) {
    logger.error('Error fetching analytics trends:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch analytics trends',
      error: error.message
    });
  }
});

/**
 * @route   DELETE /api/admin/content/:type/:id
 * @desc    Delete content (blog, comment)
 * @access  Admin
 */
router.delete('/content/:type/:id', async (req, res) => {
  try {
    const { type, id } = req.params;
    const { reason } = req.body;
    const result = await AdminService.deleteContent(type, id, req.user.id, reason);
    res.json(result);
  } catch (error) {
    logger.error('Error deleting content:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to delete content',
      error: error.message
    });
  }
});


// Marketing Routes
router.post(
  '/marketing/send',
  protect,
  requireAdmin,
  [
    body('subject').trim().notEmpty().withMessage('Subject is required'),
    body('content').trim().notEmpty().withMessage('Content is required'),
    body('filters').optional().isObject()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const result = await AdminService.sendMarketingCampaign(req.body, req.user.id);
      res.status(200).json({
        success: true,
        data: result,
        message: 'Marketing campaign queued successfully'
      });
    } catch (error) {
      next(error);
    }
  }
);

router.post(
  '/marketing/estimate',
  protect,
  requireAdmin,
  [
    body('target').optional().isString(),
    body('role').optional().isString()
  ],
  validateRequest,
  async (req, res, next) => {
    try {
      const filters = {
        target: req.body.target || 'subscribed',
        role: req.body.role
      };
      const result = await AdminService.getMarketingAudienceEstimation(filters);
      res.status(200).json({
        success: true,
        data: result
      });
    } catch (error) {
      next(error);
    }
  }
);

module.exports = router;
