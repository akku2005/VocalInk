const Blog = require('../models/blog.model');
const User = require('../models/user.model');
const AnalyticsFetchLog = require('../models/analyticsFetchLog.model');
const cacheService = require('./CacheService');
const logger = require('../utils/logger');

const CACHE_TTL_SECONDS = parseInt(process.env.PERSONAL_ANALYTICS_CACHE_TTL || '300', 10);
const PERIOD_CONFIG = {
  '7d': 7,
  '30d': 30,
  '90d': 90,
  '1y': 365,
};
const DEFAULT_PERIOD = '30d';

class AnalyticsService {
  static normalizePeriod(period) {
    if (PERIOD_CONFIG[period]) {
      return period;
    }
    return DEFAULT_PERIOD;
  }

  static resolveStartDate(period) {
    const now = new Date();
    const startDate = new Date(now);

    switch (period) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
        break;
    }

    return startDate;
  }

  static buildCacheKey(userId, period) {
    return cacheService.generateKey('personal-analytics', userId, period);
  }

  static async recordFetch(userId, period, source, durationMs = 0) {
    try {
      await AnalyticsFetchLog.create({
        user: userId,
        period,
        source,
        durationMs,
      });
    } catch (error) {
      logger.warn('Failed to record analytics fetch log', { error: error.message });
    }
  }

  static async buildTimeline(blogs) {
    const timelineMap = {};

    blogs.forEach((blog) => {
      const date = blog.publishedAt ? new Date(blog.publishedAt) : new Date(blog.createdAt);
      if (Number.isNaN(date.getTime())) return;

      const key = date.toISOString().split('T')[0];
      const label = `${date.getMonth() + 1}/${date.getDate()}`;

      if (!timelineMap[key]) {
        timelineMap[key] = {
          label,
          views: 0,
          likes: 0,
          comments: 0,
          timestamp: date.getTime(),
        };
      }

      timelineMap[key].views += blog.views || 0;
      timelineMap[key].likes += blog.likes || 0;
      timelineMap[key].comments += blog.commentCount || 0;
    });

    return Object.values(timelineMap)
      .sort((a, b) => a.timestamp - b.timestamp)
      .map(({ label, views, likes, comments }) => ({ label, views, likes, comments }));
  }

  static async buildAudience(followerIds = []) {
    const now = new Date();
    const ageGroups = [
      { label: '13-17', min: 13, max: 17, value: 0 },
      { label: '18-24', min: 18, max: 24, value: 0 },
      { label: '25-34', min: 25, max: 34, value: 0 },
      { label: '35-44', min: 35, max: 44, value: 0 },
      { label: '45-54', min: 45, max: 54, value: 0 },
      { label: '55-64', min: 55, max: 64, value: 0 },
      { label: '65+', min: 65, max: 120, value: 0 },
    ];

    const locationMap = {};

    if (!followerIds.length) {
      return {
        ageGroups,
        locations: [],
      };
    }

    const followers = await User.find({
      _id: { $in: followerIds },
    })
      .select('dob location')
      .lean();

    followers.forEach((follower) => {
      if (follower.dob) {
        const dob = new Date(follower.dob);
        const age = now.getFullYear() - dob.getFullYear();
        const bucket = ageGroups.find(
          (group) => age >= group.min && age <= group.max
        );
        if (bucket) {
          bucket.value += 1;
        }
      }

      const location = follower.location?.split(',')?.[0]?.trim();
      if (location) {
        locationMap[location] = (locationMap[location] || 0) + 1;
      }
    });

    const locationStats = Object.entries(locationMap)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    return {
      ageGroups,
      locations: locationStats,
    };
  }

  static async buildPayload(user, period, startDate) {
    const blogs = await Blog.find({
      author: user._id,
      status: 'published',
      publishedAt: { $gte: startDate },
    })
      .sort({ publishedAt: -1 })
      .lean();

    const totalViews = blogs.reduce((sum, blog) => sum + (blog.views || 0), 0);
    const totalLikes = blogs.reduce((sum, blog) => sum + (blog.likes || 0), 0);
    const totalComments = blogs.reduce(
      (sum, blog) => sum + (blog.commentCount || 0),
      0
    );
    const totalBookmarks = blogs.reduce(
      (sum, blog) => sum + (blog.bookmarks || 0),
      0
    );
    const totalShares = blogs.reduce((sum, blog) => sum + (blog.shares || 0), 0);

    const stats = {
      totalViews,
      totalLikes,
      totalComments,
      totalShares,
      totalBookmarks,
      totalBlogs: blogs.length,
      followerCount: Array.isArray(user.followers) ? user.followers.length : 0,
      followingCount: Array.isArray(user.following) ? user.following.length : 0,
      engagementRate: totalViews
        ? Math.round(
            ((totalLikes + totalComments + totalBookmarks) / totalViews) * 100
          )
        : 0,
      avgLikesPerBlog: blogs.length ? Math.round(totalLikes / blogs.length) : 0,
      avgCommentsPerBlog: blogs.length
        ? Math.round(totalComments / blogs.length)
        : 0,
      avgBookmarksPerBlog: blogs.length
        ? Math.round(totalBookmarks / blogs.length)
        : 0,
    };

    const timeline = await this.buildTimeline(blogs);

    const activeHours = new Array(24).fill(0);
    blogs.forEach((blog) => {
      const published = blog.publishedAt || blog.createdAt;
      const hour = published ? new Date(published).getHours() : -1;
      if (hour >= 0) {
        activeHours[hour] += 1;
      }
    });

    const bestTimes = activeHours
      .map((count, hour) => ({ hour, value: count }))
      .filter((entry) => entry.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 3)
      .map((entry) => ({
        label: `${entry.hour}:00`,
        value: entry.value,
      }));

    const followerIds = Array.isArray(user.followers) ? user.followers : [];
    const audience = await this.buildAudience(followerIds);

    const topPosts = blogs.slice(0, 3).map((blog) => {
      const engagementScore = blog.views
        ? Math.round(
            ((blog.likes || 0) +
              (blog.commentCount || 0) +
              (blog.bookmarks || 0)) /
              (blog.views || 1) *
              100
          )
        : 0;
      return {
        id: blog._id,
        title: blog.title,
        slug: blog.slug,
        coverImage: blog.coverImage,
        views: blog.views || 0,
        likes: blog.likes || 0,
        comments: blog.commentCount || 0,
        bookmarks: blog.bookmarks || 0,
        engagementScore,
        publishedAt: blog.publishedAt,
      };
    });

    const generatedAt = new Date().toISOString();

    return {
      stats,
      timeline,
      topPosts,
      audience,
      bestTimes,
      period,
      generatedAt,
    };
  }

  static async getPersonalAnalytics(user, rawPeriod) {
    const userId = user._id.toString();
    const period = this.normalizePeriod(rawPeriod);
    const startDate = this.resolveStartDate(period);
    const cacheKey = this.buildCacheKey(userId, period);
    const computeStart = Date.now();

    const cached = await cacheService.get(cacheKey);
    if (cached) {
      await this.recordFetch(userId, period, 'cache', Date.now() - computeStart);
      return {
        ...cached,
        meta: {
          source: 'cache',
          period,
          cacheTTL: CACHE_TTL_SECONDS,
        },
      };
    }

    const payload = await this.buildPayload(user, period, startDate);

    try {
      await cacheService.set(cacheKey, payload, CACHE_TTL_SECONDS);
    } catch (error) {
      logger.warn('Failed to cache personal analytics payload', {
        error: error.message,
        userId,
      });
    }

    const durationMs = Date.now() - computeStart;
    await this.recordFetch(userId, period, 'live', durationMs);

    return {
      ...payload,
      meta: {
        source: 'live',
        period,
        cacheTTL: CACHE_TTL_SECONDS,
        durationMs,
      },
    };
  }

  static async clearPersonalAnalyticsCache(userId) {
    if (!userId) return;
    const normalizedId = userId.toString();
    const keys = Array.from(
      new Set(
        Object.keys(PERIOD_CONFIG)
          .concat(DEFAULT_PERIOD)
          .map((period) => this.buildCacheKey(normalizedId, period))
      )
    );

    await Promise.all(keys.map((key) => cacheService.delete(key)));
  }
}

module.exports = AnalyticsService;
