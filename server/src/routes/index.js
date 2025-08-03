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
const xpRoutes = require('./xp');

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
router.use('/xp', xpRoutes);

module.exports = router;
