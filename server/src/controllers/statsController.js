const Blog = require('../models/blog.model');
const User = require('../models/user.model');
const Series = require('../models/series.model');
const logger = require('../utils/logger');

/**
 * Get platform-wide statistics
 * @route GET /api/stats
 * @access Public
 */
exports.getPlatformStats = async (req, res) => {
  try {
    // Get total blogs count
    const totalBlogs = await Blog.countDocuments({ status: 'published' });
    
    // Get total users count
    const totalUsers = await User.countDocuments({ isVerified: true });
    
    // Get total series count
    const totalSeries = await Series.countDocuments();
    
    // Get AI generations count (blogs with AI summary or TTS)
    const aiGenerations = await Blog.countDocuments({
      $or: [
        { aiSummary: { $exists: true, $ne: null } },
        { ttsUrl: { $exists: true, $ne: null } }
      ]
    });
    
    // Calculate growth percentages (last 30 days vs previous 30 days)
    const now = new Date();
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
    
    // Blogs growth
    const recentBlogs = await Blog.countDocuments({
      status: 'published',
      createdAt: { $gte: thirtyDaysAgo }
    });
    const previousBlogs = await Blog.countDocuments({
      status: 'published',
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });
    const blogsGrowth = previousBlogs > 0 
      ? Math.round(((recentBlogs - previousBlogs) / previousBlogs) * 100)
      : recentBlogs > 0 ? 100 : 0;
    
    // Users growth
    const recentUsers = await User.countDocuments({
      isVerified: true,
      createdAt: { $gte: thirtyDaysAgo }
    });
    const previousUsers = await User.countDocuments({
      isVerified: true,
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });
    const usersGrowth = previousUsers > 0
      ? Math.round(((recentUsers - previousUsers) / previousUsers) * 100)
      : recentUsers > 0 ? 100 : 0;
    
    // Series growth
    const recentSeries = await Series.countDocuments({
      createdAt: { $gte: thirtyDaysAgo }
    });
    const previousSeries = await Series.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo }
    });
    const seriesGrowth = previousSeries > 0
      ? Math.round(((recentSeries - previousSeries) / previousSeries) * 100)
      : recentSeries > 0 ? 100 : 0;
    
    // AI generations growth
    const recentAI = await Blog.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
      $or: [
        { aiSummary: { $exists: true, $ne: null } },
        { ttsUrl: { $exists: true, $ne: null } }
      ]
    });
    const previousAI = await Blog.countDocuments({
      createdAt: { $gte: sixtyDaysAgo, $lt: thirtyDaysAgo },
      $or: [
        { aiSummary: { $exists: true, $ne: null } },
        { ttsUrl: { $exists: true, $ne: null } }
      ]
    });
    const aiGrowth = previousAI > 0
      ? Math.round(((recentAI - previousAI) / previousAI) * 100)
      : recentAI > 0 ? 100 : 0;
    
    // Return stats
    res.json({
      totalBlogs,
      totalUsers,
      totalSeries,
      aiGenerations,
      growth: {
        blogs: blogsGrowth,
        users: usersGrowth,
        series: seriesGrowth,
        ai: aiGrowth
      },
      lastUpdated: new Date()
    });
    
    logger.info('Platform stats retrieved successfully');
  } catch (error) {
    logger.error('Error getting platform stats:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve platform statistics',
      error: error.message 
    });
  }
};

/**
 * Get detailed analytics
 * @route GET /api/stats/analytics
 * @access Public
 */
exports.getAnalytics = async (req, res) => {
  try {
    const { timeframe = '30d' } = req.query;
    
    // Calculate date range
    const now = new Date();
    let startDate;
    
    switch (timeframe) {
      case '7d':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case '30d':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case '90d':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
      case '1y':
        startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
    }
    
    // Get blog statistics
    const blogStats = await Blog.aggregate([
      {
        $match: {
          status: 'published',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: null,
          totalBlogs: { $sum: 1 },
          totalLikes: { $sum: '$likes' },
          totalBookmarks: { $sum: '$bookmarks' },
          avgLikes: { $avg: '$likes' },
          avgBookmarks: { $avg: '$bookmarks' }
        }
      }
    ]);
    
    // Get top tags
    const topTags = await Blog.aggregate([
      {
        $match: {
          status: 'published',
          createdAt: { $gte: startDate }
        }
      },
      { $unwind: '$tags' },
      {
        $group: {
          _id: '$tags',
          count: { $sum: 1 }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 10 }
    ]);
    
    // Get most active authors
    const topAuthors = await Blog.aggregate([
      {
        $match: {
          status: 'published',
          createdAt: { $gte: startDate }
        }
      },
      {
        $group: {
          _id: '$author',
          blogCount: { $sum: 1 },
          totalLikes: { $sum: '$likes' }
        }
      },
      { $sort: { blogCount: -1 } },
      { $limit: 10 },
      {
        $lookup: {
          from: 'users',
          localField: '_id',
          foreignField: '_id',
          as: 'authorInfo'
        }
      },
      { $unwind: '$authorInfo' },
      {
        $project: {
          _id: 1,
          blogCount: 1,
          totalLikes: 1,
          name: '$authorInfo.name',
          username: '$authorInfo.username',
          avatar: '$authorInfo.avatar'
        }
      }
    ]);
    
    res.json({
      timeframe,
      blogStats: blogStats[0] || {
        totalBlogs: 0,
        totalLikes: 0,
        totalBookmarks: 0,
        avgLikes: 0,
        avgBookmarks: 0
      },
      topTags,
      topAuthors,
      generatedAt: new Date()
    });
    
    logger.info('Analytics retrieved successfully', { timeframe });
  } catch (error) {
    logger.error('Error getting analytics:', error);
    res.status(500).json({ 
      message: 'Failed to retrieve analytics',
      error: error.message 
    });
  }
};


