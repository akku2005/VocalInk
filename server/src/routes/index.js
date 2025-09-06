const express = require('express');
const router = express.Router();

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

const authRoutes = require('./auth');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/blogs', blogRoutes);
router.use('/comments', commentRoutes);
router.use('/series', seriesRoutes);
router.use('/badges', badgeRoutes);
router.use('/notifications', notificationRoutes);
router.use('/abusereports', abuseReportRoutes);
router.use('/ai', aiRoutes);
router.use('/tts', ttsRoutes);
router.use('/xp', xpRoutes);
router.use('/uploads', uploadRoutes);
router.use('/images', imageRoutes);
router.use('/settings', settingsRoutes);
router.use('/security', securityRoutes);
router.use('/test', (req, res) => {
  res.json({
    success: true,
    message: 'index is running',
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString(),
  });
});

module.exports = router;
