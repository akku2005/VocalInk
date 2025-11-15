const Blog = require('../models/blog.model');
const User = require('../models/user.model');
const Comment = require('../models/comment.model');
const logger = require('../utils/logger');

/**
 * Get comprehensive dashboard data for authenticated user
 * @route GET /api/dashboard
 * @access Private
 */
exports.getDashboardData = async (req, res) => {
  try {
    const userId = req.user.id;

    // Fetch user with populated data
    const user = await User.findById(userId)
      .populate('badges', 'name icon rarity')
      .select('-password');

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Get blog statistics
    const totalBlogs = await Blog.countDocuments({
      author: userId,
      status: 'published',
    });

    const draftBlogs = await Blog.countDocuments({
      author: userId,
      status: 'draft',
    });

    // Get total engagement metrics
    const blogs = await Blog.find({ author: userId, status: 'published' });
    const totalViews = blogs.reduce((sum, blog) => sum + (blog.views || 0), 0);
    const totalLikes = blogs.reduce((sum, blog) => sum + (blog.likes?.length || 0), 0);
    const totalBookmarks = blogs.reduce((sum, blog) => sum + (blog.bookmarks?.length || 0), 0);

    // Get total comments on user's blogs
    const blogIds = blogs.map(blog => blog._id);
    const totalComments = await Comment.countDocuments({
      blogId: { $in: blogIds },
      status: 'active',
    });

    // Calculate engagement rate
    const engagementRate = totalViews > 0
      ? Math.round(((totalLikes + totalComments + totalBookmarks) / totalViews) * 100)
      : 0;

    // Get follower/following counts
    const followerCount = user.followers?.length || 0;
    const followingCount = user.following?.length || 0;

    // Get recent activity (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentBlogs = await Blog.countDocuments({
      author: userId,
      status: 'published',
      publishedAt: { $gte: thirtyDaysAgo },
    });

    const recentViews = await Blog.aggregate([
      {
        $match: {
          author: userId,
          status: 'published',
          publishedAt: { $gte: thirtyDaysAgo },
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
        },
      },
    ]);

    // Build response
    const dashboardData = {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        avatar: user.avatar || user.profilePicture,
        bio: user.bio,
        role: user.role,
        isVerified: user.isVerified,
        level: user.level || 1,
        xp: user.xp || 0,
        badges: user.badges || [],
      },
      stats: {
        totalBlogs,
        draftBlogs,
        totalViews,
        totalLikes,
        totalComments,
        totalBookmarks,
        followerCount,
        followingCount,
        engagementRate,
      },
      recentActivity: {
        blogsPublished: recentBlogs,
        viewsGained: recentViews[0]?.totalViews || 0,
        period: '30 days',
      },
      growth: {
        blogs: recentBlogs,
        views: recentViews[0]?.totalViews || 0,
      },
    };

    res.json(dashboardData);
  } catch (error) {
    logger.error('Error fetching dashboard data:', error);
    res.status(500).json({ message: 'Failed to fetch dashboard data' });
  }
};

/**
 * Get user's recent blogs
 * @route GET /api/dashboard/recent-blogs
 * @access Private
 */
exports.getRecentBlogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    const blogs = await Blog.find({
      author: userId,
      status: 'published',
    })
      .sort({ publishedAt: -1 })
      .limit(limit)
      .select('title slug coverImage publishedAt views likes comments bookmarks tags mood')
      .lean();

    // Add engagement metrics
    const blogsWithMetrics = blogs.map(blog => ({
      ...blog,
      likesCount: blog.likes?.length || 0,
      commentsCount: blog.comments?.length || 0,
      bookmarksCount: blog.bookmarks?.length || 0,
    }));

    res.json(blogsWithMetrics);
  } catch (error) {
    logger.error('Error fetching recent blogs:', error);
    res.status(500).json({ message: 'Failed to fetch recent blogs' });
  }
};

/**
 * Get user's top performing blogs
 * @route GET /api/dashboard/top-blogs
 * @access Private
 */
exports.getTopBlogs = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 5;

    const blogs = await Blog.find({
      author: userId,
      status: 'published',
    })
      .sort({ views: -1 })
      .limit(limit)
      .select('title slug coverImage publishedAt views likes comments bookmarks')
      .lean();

    const blogsWithMetrics = blogs.map(blog => ({
      ...blog,
      likesCount: blog.likes?.length || 0,
      commentsCount: blog.comments?.length || 0,
      bookmarksCount: blog.bookmarks?.length || 0,
      engagementScore: blog.views > 0
        ? Math.round(((blog.likes?.length || 0) + (blog.comments?.length || 0)) / blog.views * 100)
        : 0,
    }));

    res.json(blogsWithMetrics);
  } catch (error) {
    logger.error('Error fetching top blogs:', error);
    res.status(500).json({ message: 'Failed to fetch top blogs' });
  }
};

/**
 * Get user's analytics over time
 * @route GET /api/dashboard/analytics
 * @access Private
 */
exports.getAnalytics = async (req, res) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || '30d';

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    let groupBy = '$dayOfMonth';

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        groupBy = '$dayOfMonth';
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        groupBy = '$dayOfMonth';
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        groupBy = '$week';
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        groupBy = '$month';
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Get blog analytics
    const blogAnalytics = await Blog.aggregate([
      {
        $match: {
          author: userId,
          status: 'published',
          publishedAt: { $gte: startDate },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$publishedAt' },
            month: { $month: '$publishedAt' },
            day: { $dayOfMonth: '$publishedAt' },
          },
          blogs: { $sum: 1 },
          views: { $sum: '$views' },
          likes: { $sum: { $size: { $ifNull: ['$likes', []] } } },
          comments: { $sum: { $size: { $ifNull: ['$comments', []] } } },
        },
      },
      {
        $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 },
      },
    ]);

    res.json({
      period,
      data: blogAnalytics,
    });
  } catch (error) {
    logger.error('Error fetching analytics:', error);
    res.status(500).json({ message: 'Failed to fetch analytics' });
  }
};

/**
 * Get user's recent activity feed
 * @route GET /api/dashboard/activity
 * @access Private
 */
exports.getRecentActivity = async (req, res) => {
  try {
    const userId = req.user.id;
    const limit = parseInt(req.query.limit) || 10;

    const activities = [];

    // Get recent blogs
    const recentBlogs = await Blog.find({
      author: userId,
      status: 'published',
    })
      .sort({ publishedAt: -1 })
      .limit(5)
      .select('title publishedAt')
      .lean();

    recentBlogs.forEach(blog => {
      activities.push({
        type: 'blog_published',
        title: 'Published a blog',
        description: blog.title,
        timestamp: blog.publishedAt,
        icon: 'BookOpen',
      });
    });

    // Get recent comments on user's blogs
    const userBlogs = await Blog.find({ author: userId }).select('_id title');
    const blogIds = userBlogs.map(b => b._id);

    const recentComments = await Comment.find({
      blogId: { $in: blogIds },
      status: 'active',
    })
      .sort({ createdAt: -1 })
      .limit(5)
      .populate('userId', 'firstName lastName')
      .populate('blogId', 'title')
      .lean();

    recentComments.forEach(comment => {
      activities.push({
        type: 'comment_received',
        title: 'New comment',
        description: `${comment.userId?.firstName || 'Someone'} commented on "${comment.blogId?.title}"`,
        timestamp: comment.createdAt,
        icon: 'MessageCircle',
      });
    });

    // Sort by timestamp and limit
    activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    const limitedActivities = activities.slice(0, limit);

    res.json(limitedActivities);
  } catch (error) {
    logger.error('Error fetching recent activity:', error);
    res.status(500).json({ message: 'Failed to fetch recent activity' });
  }
};

/**
 * Get user's engagement metrics
 * @route GET /api/dashboard/engagement
 * @access Private
 */
exports.getEngagementMetrics = async (req, res) => {
  try {
    const userId = req.user.id;

    const blogs = await Blog.find({ author: userId, status: 'published' });

    const metrics = {
      totalViews: 0,
      totalLikes: 0,
      totalComments: 0,
      totalBookmarks: 0,
      avgViewsPerBlog: 0,
      avgLikesPerBlog: 0,
      avgCommentsPerBlog: 0,
      engagementRate: 0,
    };

    blogs.forEach(blog => {
      metrics.totalViews += blog.views || 0;
      metrics.totalLikes += blog.likes?.length || 0;
      metrics.totalComments += blog.comments?.length || 0;
      metrics.totalBookmarks += blog.bookmarks?.length || 0;
    });

    if (blogs.length > 0) {
      metrics.avgViewsPerBlog = Math.round(metrics.totalViews / blogs.length);
      metrics.avgLikesPerBlog = Math.round(metrics.totalLikes / blogs.length);
      metrics.avgCommentsPerBlog = Math.round(metrics.totalComments / blogs.length);
    }

    if (metrics.totalViews > 0) {
      metrics.engagementRate = Math.round(
        ((metrics.totalLikes + metrics.totalComments + metrics.totalBookmarks) / metrics.totalViews) * 100
      );
    }

    res.json(metrics);
  } catch (error) {
    logger.error('Error fetching engagement metrics:', error);
    res.status(500).json({ message: 'Failed to fetch engagement metrics' });
  }
};

/**
 * Get user's growth statistics
 * @route GET /api/dashboard/growth
 * @access Private
 */
exports.getGrowthStats = async (req, res) => {
  try {
    const userId = req.user.id;
    const period = req.query.period || '30d';

    const now = new Date();
    let days = 30;

    switch (period) {
      case '7d':
        days = 7;
        break;
      case '30d':
        days = 30;
        break;
      case '90d':
        days = 90;
        break;
    }

    const currentPeriodStart = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
    const previousPeriodStart = new Date(now.getTime() - days * 2 * 24 * 60 * 60 * 1000);

    // Current period stats
    const currentBlogs = await Blog.countDocuments({
      author: userId,
      status: 'published',
      publishedAt: { $gte: currentPeriodStart },
    });

    const currentViewsData = await Blog.aggregate([
      {
        $match: {
          author: userId,
          status: 'published',
          publishedAt: { $gte: currentPeriodStart },
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
        },
      },
    ]);

    // Previous period stats
    const previousBlogs = await Blog.countDocuments({
      author: userId,
      status: 'published',
      publishedAt: { $gte: previousPeriodStart, $lt: currentPeriodStart },
    });

    const previousViewsData = await Blog.aggregate([
      {
        $match: {
          author: userId,
          status: 'published',
          publishedAt: { $gte: previousPeriodStart, $lt: currentPeriodStart },
        },
      },
      {
        $group: {
          _id: null,
          totalViews: { $sum: '$views' },
        },
      },
    ]);

    const currentViews = currentViewsData[0]?.totalViews || 0;
    const previousViews = previousViewsData[0]?.totalViews || 0;

    // Calculate growth percentages
    const blogsGrowth = previousBlogs > 0
      ? Math.round(((currentBlogs - previousBlogs) / previousBlogs) * 100)
      : currentBlogs > 0 ? 100 : 0;

    const viewsGrowth = previousViews > 0
      ? Math.round(((currentViews - previousViews) / previousViews) * 100)
      : currentViews > 0 ? 100 : 0;

    // Get follower growth
    const user = await User.findById(userId);
    const currentFollowers = user.followers?.length || 0;

    res.json({
      period,
      current: {
        blogs: currentBlogs,
        views: currentViews,
        followers: currentFollowers,
      },
      previous: {
        blogs: previousBlogs,
        views: previousViews,
      },
      growth: {
        blogs: blogsGrowth,
        views: viewsGrowth,
      },
    });
  } catch (error) {
    logger.error('Error fetching growth stats:', error);
    res.status(500).json({ message: 'Failed to fetch growth stats' });
  }
};
