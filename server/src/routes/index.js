const express = require('express');
const router = express.Router();
const { API_ROUTES } = require('../config/routes');

const userRoutes = require('../user/user.routes');
const blogRoutes = require('../blog/blog.routes');
const commentRoutes = require('../comment/comment.routes');
const seriesRoutes = require('../series/series.routes');
const badgeRoutes = require('../badge/badge.routes');
const notificationRoutes = require('../notification/notification.routes');
const abuseReportRoutes = require('../abusereport/abusereport.routes');
const aiRoutes = require('../ai/ai.routes');
const ttsRoutes = require('./tts.routes');
const xpRoutes = require('./xp');
const uploadRoutes = require('./upload.routes');
const imageRoutes = require('./imageRoutes');
const settingsRoutes = require('./settings');
const securityRoutes = require('../security/security.routes');
const statsRoutes = require('./stats');
const dashboardRoutes = require('./dashboard.routes');

const authRoutes = require('./auth');

// Use centralized route configuration
router.use(API_ROUTES.AUTH, authRoutes);
router.use(API_ROUTES.USERS, userRoutes);
router.use(API_ROUTES.BLOGS, blogRoutes);
router.use(API_ROUTES.COMMENTS, commentRoutes);
router.use(API_ROUTES.SERIES, seriesRoutes);
router.use(API_ROUTES.BADGES, badgeRoutes);
router.use(API_ROUTES.NOTIFICATIONS, notificationRoutes);
router.use(API_ROUTES.ABUSE_REPORTS, abuseReportRoutes);
router.use(API_ROUTES.AI, aiRoutes);
router.use(API_ROUTES.TTS, ttsRoutes);
router.use(API_ROUTES.XP, xpRoutes);
router.use(API_ROUTES.UPLOADS, uploadRoutes);
router.use(API_ROUTES.IMAGES, imageRoutes);
router.use(API_ROUTES.SETTINGS, settingsRoutes);
router.use(API_ROUTES.SECURITY, securityRoutes);
router.use('/stats', statsRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/test', (req, res) => {
  res.json({
    success: true,
    message: 'index is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
