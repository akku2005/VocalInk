const User = require('../models/user.model');
const Blog = require('../models/blog.model');
const Series = require('../models/series.model');
const Comment = require('../models/comment.model');
const Badge = require('../models/badge.model');
const BadgeClaim = require('../models/badgeClaim.model');
const AbuseReport = require('../models/abusereport.model');
const Notification = require('../models/notification.model');
const AuditLog = require('../models/auditlog.model');
const UsageLog = require('../models/usageLog.model');
const XPTransaction = require('../models/xpTransaction.model');
const logger = require('../utils/logger');
const os = require('os');
const mongoose = require('mongoose');
const MarketingService = require('./MarketingService');

/**
 * Admin Service - Provides comprehensive admin dashboard data
 */
class AdminService {
  /**
   * Get complete dashboard overview
   */
  static async getDashboardOverview() {
    try {
      const [
        userStats,
        contentStats,
        engagementStats,
        systemHealth,
        recentActivity
      ] = await Promise.all([
        this.getUserStats().catch(err => { console.error('getUserStats failed:', err); return {}; }),
        this.getContentStats().catch(err => { console.error('getContentStats failed:', err); return {}; }),
        this.getEngagementStats().catch(err => { console.error('getEngagementStats failed:', err); return {}; }),
        this.getSystemHealth().catch(err => { console.error('getSystemHealth failed:', err); return {}; }),
        this.getRecentActivity(10).catch(err => { console.error('getRecentActivity failed:', err); return []; })
      ]);

      return {
        success: true,
        data: {
          users: userStats || {},
          content: contentStats || {},
          engagement: engagementStats || {},
          system: systemHealth || {},
          recentActivity: recentActivity || [],
          lastUpdated: new Date()
        }
      };
    } catch (error) {
      logger.error('Error getting dashboard overview:', error);
      throw error;
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats() {
    try {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
      const lastMonth = new Date(today.getTime() - 60 * 24 * 60 * 60 * 1000);

      const [
        totalUsers,
        verifiedUsers,
        unverifiedUsers,
        newUsersToday,
        newUsersThisWeek,
        newUsersThisMonth,
        newUsersLastMonth,
        activeUsersToday,
        activeUsersThisWeek,
        usersByRole
      ] = await Promise.all([
        User.countDocuments(),
        User.countDocuments({ isVerified: true }),
        User.countDocuments({ isVerified: false }),
        User.countDocuments({ createdAt: { $gte: today } }),
        User.countDocuments({ createdAt: { $gte: thisWeek } }),
        User.countDocuments({ createdAt: { $gte: thisMonth } }),
        User.countDocuments({ createdAt: { $gte: lastMonth, $lt: thisMonth } }),
        User.countDocuments({ lastActive: { $gte: today } }),
        User.countDocuments({ lastActive: { $gte: thisWeek } }),
        User.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ])
      ]);

      // Calculate growth percentage
      const userGrowth = newUsersLastMonth > 0
        ? Math.round(((newUsersThisMonth - newUsersLastMonth) / newUsersLastMonth) * 100)
        : newUsersThisMonth > 0 ? 100 : 0;

      return {
        total: totalUsers,
        verified: verifiedUsers,
        unverified: unverifiedUsers,
        newToday: newUsersToday,
        newThisWeek: newUsersThisWeek,
        newThisMonth: newUsersThisMonth,
        activeToday: activeUsersToday,
        activeThisWeek: activeUsersThisWeek,
        growth: userGrowth,
        byRole: usersByRole.reduce((acc, item) => {
          acc[item._id || 'unknown'] = item.count;
          return acc;
        }, {})
      };
    } catch (error) {
      logger.error('Error getting user stats:', error);
      throw error;
    }
  }

  /**
   * Get content statistics
   */
  static async getContentStats() {
    try {
      const now = new Date();
      const today = new Date(now.setHours(0, 0, 0, 0));
      const thisWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalBlogs,
        publishedBlogs,
        draftBlogs,
        blogsToday,
        blogsThisWeek,
        blogsThisMonth,
        totalSeries,
        totalComments,
        commentsThisWeek,
        aiGeneratedContent,
        ttsGeneratedContent,
        blogsByCategory
      ] = await Promise.all([
        Blog.countDocuments(),
        Blog.countDocuments({ status: 'published' }),
        Blog.countDocuments({ status: 'draft' }),
        Blog.countDocuments({ createdAt: { $gte: today } }),
        Blog.countDocuments({ createdAt: { $gte: thisWeek } }),
        Blog.countDocuments({ createdAt: { $gte: thisMonth } }),
        Series.countDocuments(),
        Comment.countDocuments(),
        Comment.countDocuments({ createdAt: { $gte: thisWeek } }),
        Blog.countDocuments({ aiSummary: { $exists: true, $ne: null } }),
        Blog.countDocuments({ ttsUrl: { $exists: true, $ne: null } }),
        Blog.aggregate([
          { $match: { status: 'published' } },
          { $group: { _id: '$category', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 }
        ])
      ]);

      return {
        blogs: {
          total: totalBlogs,
          published: publishedBlogs,
          draft: draftBlogs,
          today: blogsToday,
          thisWeek: blogsThisWeek,
          thisMonth: blogsThisMonth,
          byCategory: blogsByCategory.reduce((acc, item) => {
            acc[item._id || 'uncategorized'] = item.count;
            return acc;
          }, {})
        },
        series: {
          total: totalSeries
        },
        comments: {
          total: totalComments,
          thisWeek: commentsThisWeek
        },
        ai: {
          summaries: aiGeneratedContent,
          tts: ttsGeneratedContent
        }
      };
    } catch (error) {
      logger.error('Error getting content stats:', error);
      throw error;
    }
  }

  /**
   * Get blogs with pagination and filtering for admin
   */
  static async getBlogs(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        status = '',
        authorId = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const query = {};

      if (search) {
        query.title = { $regex: search, $options: 'i' };
      }

      if (status) {
        query.status = status;
      }

      if (authorId) {
        query.author = authorId;
      }

      const [blogs, total] = await Promise.all([
        Blog.find(query)
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('author', 'firstName lastName email'),
        Blog.countDocuments(query)
      ]);

      return {
        blogs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting blogs for admin:', error);
      throw error;
    }
  }

  /**
   * Get engagement statistics
   */
  static async getEngagementStats() {
    try {
      const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalViews,
        totalLikes,
        totalBookmarks,
        totalShares,
        badgesEarned,
        badgesEarnedThisMonth,
        totalXPAwarded,
        topBadges
      ] = await Promise.all([
        Blog.aggregate([
          { $group: { _id: null, total: { $sum: '$views' } } }
        ]),
        Blog.aggregate([
          { $group: { _id: null, total: { $sum: '$likes' } } }
        ]),
        Blog.aggregate([
          { $group: { _id: null, total: { $sum: '$bookmarks' } } }
        ]),
        Blog.aggregate([
          { $group: { _id: null, total: { $sum: '$shares' } } }
        ]),
        BadgeClaim.countDocuments({ status: 'completed' }),
        BadgeClaim.countDocuments({
          status: 'completed',
          claimedAt: { $gte: thisMonth }
        }),
        XPTransaction.aggregate([
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]),
        BadgeClaim.aggregate([
          { $match: { status: 'completed' } },
          { $group: { _id: '$badgeId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 5 },
          {
            $lookup: {
              from: 'badges',
              localField: '_id',
              foreignField: '_id',
              as: 'badge'
            }
          },
          { $unwind: { path: '$badge', preserveNullAndEmptyArrays: true } }
        ])
      ]);

      return {
        views: totalViews[0]?.total || 0,
        likes: totalLikes[0]?.total || 0,
        bookmarks: totalBookmarks[0]?.total || 0,
        shares: totalShares[0]?.total || 0,
        badges: {
          totalEarned: badgesEarned,
          earnedThisMonth: badgesEarnedThisMonth,
          topBadges: topBadges.map(b => ({
            id: b._id,
            name: b.badge?.name || 'Unknown',
            count: b.count
          }))
        },
        xp: {
          totalAwarded: totalXPAwarded[0]?.total || 0
        }
      };
    } catch (error) {
      logger.error('Error getting engagement stats:', error);
      throw error;
    }
  }

  /**
   * Get system health metrics
   */
  static async getSystemHealth() {
    try {
      const memUsage = process.memoryUsage();
      const cpus = os.cpus();
      const dbState = mongoose.connection.readyState;

      // Calculate average CPU load
      const avgCpuLoad = cpus.reduce((acc, cpu) => {
        const total = Object.values(cpu.times).reduce((a, b) => a + b, 0);
        const idle = cpu.times.idle;
        return acc + ((total - idle) / total) * 100;
      }, 0) / cpus.length;

      // Get database stats
      let dbStats = {};
      try {
        if (mongoose.connection.db) {
          dbStats = await mongoose.connection.db.stats();
        }
      } catch (e) {
        logger.warn('Could not get DB stats:', e.message);
      }

      return {
        server: {
          uptime: process.uptime(),
          nodeVersion: process.version,
          platform: process.platform,
          pid: process.pid
        },
        memory: {
          heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
          heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
          rss: Math.round(memUsage.rss / 1024 / 1024),
          external: Math.round(memUsage.external / 1024 / 1024),
          percentUsed: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
        },
        cpu: {
          cores: cpus.length,
          model: cpus[0]?.model || 'Unknown',
          averageLoad: Math.round(avgCpuLoad)
        },
        os: {
          hostname: os.hostname(),
          type: os.type(),
          release: os.release(),
          totalMemory: Math.round(os.totalmem() / 1024 / 1024 / 1024),
          freeMemory: Math.round(os.freemem() / 1024 / 1024 / 1024),
          loadAverage: os.loadavg()
        },
        database: {
          status: ['disconnected', 'connected', 'connecting', 'disconnecting'][dbState] || 'unknown',
          collections: dbStats.collections || 0,
          documents: dbStats.objects || 0,
          dataSize: dbStats.dataSize ? Math.round(dbStats.dataSize / 1024 / 1024) : 0,
          storageSize: dbStats.storageSize ? Math.round(dbStats.storageSize / 1024 / 1024) : 0
        }
      };
    } catch (error) {
      logger.error('Error getting system health:', error);
      throw error;
    }
  }

  /**
   * Get recent activity for admin dashboard
   */
  static async getRecentActivity(limit = 20) {
    try {
      const [recentUsers, recentBlogs, recentComments, recentReports] = await Promise.all([
        User.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .select('firstName lastName email createdAt isVerified role'),
        Blog.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('authorId', 'firstName lastName')
          .select('title status createdAt views authorId'),
        Comment.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('userId', 'firstName lastName')
          .populate('blogId', 'title')
          .select('content createdAt userId blogId'),
        AbuseReport.find()
          .sort({ createdAt: -1 })
          .limit(5)
          .populate('reporterId', 'firstName lastName')
          .select('reportType status priority createdAt reporterId')
      ]);

      // Combine and format activities
      const activities = [];

      recentUsers.forEach(user => {
        activities.push({
          type: 'user_registered',
          message: `New user registered: ${user.firstName} ${user.lastName}`,
          user: { id: user._id, name: `${user.firstName} ${user.lastName}`, email: user.email },
          timestamp: user.createdAt,
          metadata: { verified: user.isVerified, role: user.role }
        });
      });

      recentBlogs.forEach(blog => {
        activities.push({
          type: 'blog_created',
          message: `New blog: "${blog.title}"`,
          user: blog.authorId ? { id: blog.authorId._id, name: `${blog.authorId.firstName} ${blog.authorId.lastName}` } : null,
          timestamp: blog.createdAt,
          metadata: { status: blog.status, views: blog.views }
        });
      });

      recentComments.forEach(comment => {
        activities.push({
          type: 'comment_added',
          message: `New comment on "${comment.blogId?.title || 'Unknown blog'}"`,
          user: comment.userId ? { id: comment.userId._id, name: `${comment.userId.firstName} ${comment.userId.lastName}` } : null,
          timestamp: comment.createdAt,
          metadata: { preview: comment.content?.substring(0, 100) }
        });
      });

      recentReports.forEach(report => {
        activities.push({
          type: 'abuse_report',
          message: `Abuse report: ${report.reportType}`,
          user: report.reporterId ? { id: report.reporterId._id, name: `${report.reporterId.firstName} ${report.reporterId.lastName}` } : null,
          timestamp: report.createdAt,
          metadata: { status: report.status, priority: report.priority }
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      return activities.slice(0, limit);
    } catch (error) {
      logger.error('Error getting recent activity:', error);
      throw error;
    }
  }

  /**
   * Get user management data with pagination
   */
  static async getUsers(options = {}) {
    try {
      const {
        page = 1,
        limit = 20,
        search = '',
        role = '',
        status = '',
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = options;

      const query = {};

      if (search) {
        query.$or = [
          { firstName: { $regex: search, $options: 'i' } },
          { lastName: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } },
          { username: { $regex: search, $options: 'i' } }
        ];
      }

      if (role) {
        query.role = role;
      }

      if (status === 'verified') {
        query.isVerified = true;
      } else if (status === 'unverified') {
        query.isVerified = false;
      } else if (status === 'banned') {
        query.isBanned = true;
      }

      const [users, total] = await Promise.all([
        User.find(query)
          .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .select('-password -refreshTokens'),
        User.countDocuments(query)
      ]);

      return {
        users,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };
    } catch (error) {
      logger.error('Error getting users:', error);
      throw error;
    }
  }

  /**
   * Get content moderation queue
   */
  static async getModerationQueue(options = {}) {
    try {
      const { page = 1, limit = 20, status = 'pending', priority = '' } = options;

      const query = {};
      if (status) query.status = status;
      if (priority) query.priority = priority;

      const [reports, total] = await Promise.all([
        AbuseReport.find(query)
          .sort({ priority: -1, createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('reporterId', 'firstName lastName email')
          .populate('reportedUserId', 'firstName lastName email')
          .populate('contentId'),
        AbuseReport.countDocuments(query)
      ]);

      const pendingCount = await AbuseReport.countDocuments({ status: 'pending' });
      const urgentCount = await AbuseReport.countDocuments({ status: 'pending', priority: { $in: ['high', 'critical'] } });

      return {
        reports,
        pendingCount,
        urgentCount,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting moderation queue:', error);
      throw error;
    }
  }

  /**
   * Get audit logs
   */
  static async getAuditLogs(options = {}) {
    try {
      const {
        page = 1,
        limit = 50,
        action = '',
        userId = '',
        startDate = '',
        endDate = ''
      } = options;

      const query = {};

      if (action) query.action = action;
      if (userId) query.userId = userId;
      if (startDate || endDate) {
        query.createdAt = {};
        if (startDate) query.createdAt.$gte = new Date(startDate);
        if (endDate) query.createdAt.$lte = new Date(endDate);
      }

      const [logs, total] = await Promise.all([
        AuditLog.find(query)
          .sort({ createdAt: -1 })
          .skip((page - 1) * limit)
          .limit(limit)
          .populate('userId', 'firstName lastName email'),
        AuditLog.countDocuments(query)
      ]);

      return {
        logs,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error getting audit logs:', error);
      throw error;
    }
  }

  /**
   * Get analytics trends over time
   */
  static async getAnalyticsTrends(days = 30) {
    try {
      const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

      const [userTrend, blogTrend, engagementTrend] = await Promise.all([
        User.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        Blog.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 },
              views: { $sum: '$views' }
            }
          },
          { $sort: { _id: 1 } }
        ]),
        Comment.aggregate([
          { $match: { createdAt: { $gte: startDate } } },
          {
            $group: {
              _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
              count: { $sum: 1 }
            }
          },
          { $sort: { _id: 1 } }
        ])
      ]);

      return {
        users: userTrend.map(d => ({ date: d._id, value: d.count })),
        blogs: blogTrend.map(d => ({ date: d._id, count: d.count, views: d.views })),
        comments: engagementTrend.map(d => ({ date: d._id, value: d.count }))
      };
    } catch (error) {
      logger.error('Error getting analytics trends:', error);
      throw error;
    }
  }

  /**
   * Get TTS usage statistics
   */
  static async getTTSStats() {
    try {
      const thisMonth = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

      const [
        totalTTSBlogs,
        ttsThisMonth,
        ttsUsageByUser
      ] = await Promise.all([
        Blog.countDocuments({ ttsUrl: { $exists: true, $ne: null } }),
        Blog.countDocuments({
          ttsUrl: { $exists: true, $ne: null },
          updatedAt: { $gte: thisMonth }
        }),
        Blog.aggregate([
          { $match: { ttsUrl: { $exists: true, $ne: null } } },
          { $group: { _id: '$authorId', count: { $sum: 1 } } },
          { $sort: { count: -1 } },
          { $limit: 10 },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'user'
            }
          },
          { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } }
        ])
      ]);

      return {
        total: totalTTSBlogs,
        thisMonth: ttsThisMonth,
        topUsers: ttsUsageByUser.map(u => ({
          userId: u._id,
          name: u.user ? `${u.user.firstName} ${u.user.lastName}` : 'Unknown',
          count: u.count
        }))
      };
    } catch (error) {
      logger.error('Error getting TTS stats:', error);
      throw error;
    }
  }

  /**
   * Update user status (ban/unban, verify, change role)
   */
  static async updateUserStatus(userId, updates, adminId) {
    try {
      const allowedUpdates = ['isBanned', 'isVerified', 'role', 'banReason'];
      const sanitizedUpdates = {};

      for (const key of allowedUpdates) {
        if (updates[key] !== undefined) {
          sanitizedUpdates[key] = updates[key];
        }
      }

      const user = await User.findByIdAndUpdate(
        userId,
        sanitizedUpdates,
        { new: true, runValidators: true }
      ).select('-password -refreshTokens');

      if (!user) {
        throw new Error('User not found');
      }

      // Log the admin action
      await AuditLog.create({
        userId: adminId,
        event: 'admin_user_update',
        details: {
          targetType: 'user',
          targetId: userId,
          updates: sanitizedUpdates
        },
        ipAddress: 'admin-action'
      });

      logger.info(`Admin ${adminId} updated user ${userId}:`, sanitizedUpdates);

      return user;
    } catch (error) {
      logger.error('Error updating user status:', error);
      throw error;
    }
  }

  /**
   * Delete content (blog, comment)
   */
  static async deleteContent(contentType, contentId, adminId, reason) {
    try {
      let contentToDelete;
      let authorEmail;
      let authorName;
      let contentTitle;
      const EmailService = require('./EmailService');

      switch (contentType) {
        case 'blog':
          contentToDelete = await Blog.findById(contentId).populate('author', 'firstName lastName email');
          if (!contentToDelete) throw new Error('Blog not found');
          authorEmail = contentToDelete.author?.email;
          authorName = `${contentToDelete.author?.firstName} ${contentToDelete.author?.lastName}`;
          contentTitle = contentToDelete.title;
          await Blog.findByIdAndDelete(contentId);
          break;

        case 'comment':
          contentToDelete = await Comment.findById(contentId).populate('userId', 'firstName lastName email');
          if (!contentToDelete) throw new Error('Comment not found');
          authorEmail = contentToDelete.userId?.email;
          authorName = `${contentToDelete.userId?.firstName} ${contentToDelete.userId?.lastName}`;
          contentTitle = `comment on "${contentToDelete.blogId}"`; // Ideally fetch blog title too
          await Comment.findByIdAndDelete(contentId);
          break;

        default:
          throw new Error('Invalid content type');
      }

      // Log the admin action
      await AuditLog.create({
        userId: adminId,
        event: `admin_delete_${contentType}`,
        details: {
          reason,
          targetType: contentType,
          targetId: contentId
        },
        ipAddress: 'admin-action'
      });

      logger.info(`Admin ${adminId} deleted ${contentType} ${contentId}:`, reason);

      // Send notification email
      if (authorEmail) {
        await EmailService.sendContentDeletionEmail(
          authorEmail,
          authorName || 'User',
          contentTitle || contentType,
          reason,
          contentType
        );
      }

      return { success: true, message: `${contentType} deleted successfully` };
    } catch (error) {
      logger.error('Error deleting content:', error);
      throw error;
    }
  }

  /**
   * Send marketing campaign
   */
  static async sendMarketingCampaign(data, adminId) {
    try {
      // Log action
      await AuditLog.create({
        userId: adminId,
        event: 'admin_marketing_campaign',
        details: { subject: data.subject, filters: data.filters },
        ipAddress: 'admin-action'
      });

      return await MarketingService.sendCampaign(data, adminId);
    } catch (error) {
      logger.error('Error sending marketing campaign:', error);
      throw error;
    }
  }

  /**
   * Get estimated audience size for a campaign
   * @param {Object} filters - Campaign filters
   */
  static async getMarketingAudienceEstimation(filters) {
    try {
      const count = await MarketingService.getAudienceCount(filters);
      return { count };
    } catch (error) {
      logger.error('Error estimating audience:', error);
      throw error;
    }
  }

  /**
   * Get marketing stats
   */
  static async getMarketingStats() {
    return await MarketingService.getStats();
  }
}

module.exports = AdminService;
