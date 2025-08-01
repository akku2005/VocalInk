const Series = require('../models/series.model');
const SeriesProgress = require('../models/seriesProgress.model');
const Blog = require('../models/blog.model');
const User = require('../models/user.model');
const { 
  ValidationError, 
  NotFoundError, 
  ForbiddenError, 
  BadRequestError 
} = require('../utils/errors');
const XPService = require('../services/XPService');
const logger = require('../utils/logger');

// Series Management
exports.createSeries = async (req, res, next) => {
  try {
    const seriesData = {
      ...req.body,
      authorId: req.user.id,
      timeline: {
        ...req.body.timeline,
        startDate: req.body.timeline?.startDate || new Date()
      }
    };

    const series = new Series(seriesData);
    await series.save();

    // Add change history
    await series.addChangeHistory('Series created', req.user.id);

    // Award XP for creating a series
    await XPService.awardXP(req.user.id, 'create_series', { seriesId: series._id });

    // Populate author info
    await series.populate('authorId', 'name email profilePicture');

    logger.info(`Series created: ${series.title} by ${req.user.email}`);

    res.status(201).json({
      success: true,
      data: series,
      message: 'Series created successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getSeries = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      category,
      tags,
      author,
      status,
      visibility,
      template,
      difficulty,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search
    } = req.query;

    const query = {};

    // Apply filters
    if (category) query.category = category;
    if (tags) {
      const tagArray = tags.split(',').map(tag => tag.trim());
      query.tags = { $in: tagArray };
    }
    if (author) query.authorId = author;
    if (status) query.status = status;
    if (visibility) query.visibility = visibility;
    if (template) query.template = template;
    if (difficulty) query.difficulty = difficulty;

    // Search functionality
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    // For non-authenticated users, only show public series
    if (!req.user) {
      query.visibility = 'public';
      query.status = { $in: ['active', 'completed'] };
    } else if (req.user.role !== 'admin') {
      // For regular users, show public series and their own series
      query.$or = [
        { visibility: 'public', status: { $in: ['active', 'completed'] } },
        { authorId: req.user.id },
        { 'collaborators.userId': req.user.id }
      ];
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortOrder === 'desc' ? -1 : 1;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [series, total] = await Promise.all([
      Series.find(query)
        .populate('authorId', 'name email profilePicture')
        .populate('collaborators.userId', 'name email profilePicture')
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit)),
      Series.countDocuments(query)
    ]);

    const totalPages = Math.ceil(total / parseInt(limit));

    res.json({
      success: true,
      data: series,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        totalPages
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.getSeriesById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { includeProgress } = req.query;

    const series = await Series.findById(id)
      .populate('authorId', 'name email profilePicture bio')
      .populate('collaborators.userId', 'name email profilePicture')
      .populate({
        path: 'episodes.episodeId',
        select: 'title content summary coverImage status publishedAt likes bookmarks'
      });

    if (!series) {
      throw new NotFoundError('Series not found');
    }

    // Check access permissions
    if (series.visibility !== 'public' && req.user) {
      const hasAccess = series.authorId._id.toString() === req.user.id ||
        series.collaborators.some(col => col.userId._id.toString() === req.user.id) ||
        req.user.role === 'admin';

      if (!hasAccess) {
        throw new ForbiddenError('You do not have access to this series');
      }
    } else if (series.visibility !== 'public' && !req.user) {
      throw new ForbiddenError('Authentication required to access this series');
    }

    // Increment view count
    await series.incrementViews();

    // Get user progress if requested and user is authenticated
    let userProgress = null;
    if (includeProgress && req.user) {
      userProgress = await SeriesProgress.findOne({
        userId: req.user.id,
        seriesId: id
      });
    }

    // Get series analytics
    const analytics = await SeriesProgress.getSeriesAnalytics(id);

    res.json({
      success: true,
      data: {
        series,
        userProgress,
        analytics: analytics[0] || {}
      }
    });
  } catch (error) {
    next(error);
  }
};

exports.updateSeries = async (req, res, next) => {
  try {
    const { id } = req.params;
    const series = await Series.findById(id);

    if (!series) {
      throw new NotFoundError('Series not found');
    }

    // Check permissions
    if (!series.hasPermission(req.user.id, 'write')) {
      throw new ForbiddenError('You do not have permission to update this series');
    }

    const updatedSeries = await Series.findByIdAndUpdate(
      id,
      req.body,
      { new: true, runValidators: true }
    ).populate('authorId', 'name email profilePicture');

    // Add change history
    await updatedSeries.addChangeHistory('Series updated', req.user.id);

    logger.info(`Series updated: ${updatedSeries.title} by ${req.user.email}`);

    res.json({
      success: true,
      data: updatedSeries,
      message: 'Series updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteSeries = async (req, res, next) => {
  try {
    const { id } = req.params;
    const series = await Series.findById(id);

    if (!series) {
      throw new NotFoundError('Series not found');
    }

    // Check permissions
    if (!series.hasPermission(req.user.id, 'delete')) {
      throw new ForbiddenError('You do not have permission to delete this series');
    }

    // Delete associated progress records
    await SeriesProgress.deleteMany({ seriesId: id });

    await Series.findByIdAndDelete(id);

    logger.info(`Series deleted: ${series.title} by ${req.user.email}`);

    res.json({
      success: true,
      message: 'Series deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Episode Management
exports.addEpisode = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { blogId, order, title, status, scheduledAt, prerequisites, estimatedReadTime, isPremium } = req.body;

    const series = await Series.findById(id);
    if (!series) {
      throw new NotFoundError('Series not found');
    }

    // Check permissions
    if (!series.hasPermission(req.user.id, 'write')) {
      throw new ForbiddenError('You do not have permission to add episodes to this series');
    }

    // Verify blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      throw new NotFoundError('Blog not found');
    }

    // Check if episode already exists in this series
    const existingEpisode = series.episodes.find(ep => ep.episodeId.toString() === blogId);
    if (existingEpisode) {
      throw new BadRequestError('This blog is already part of this series');
    }

    // Add episode to series
    await series.addEpisode(blogId, order, title);

    // Update blog with series reference
    blog.seriesId = id;
    await blog.save();

    // Add change history
    await series.addChangeHistory(`Episode added: ${title}`, req.user.id);

    // Award XP for adding episode
    await XPService.awardXP(req.user.id, 'add_to_series', { seriesId: series._id, episodeId: blogId });

    logger.info(`Episode added to series: ${title} in ${series.title}`);

    res.status(201).json({
      success: true,
      data: series,
      message: 'Episode added successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.updateEpisode = async (req, res, next) => {
  try {
    const { id, episodeId } = req.params;
    const series = await Series.findById(id);

    if (!series) {
      throw new NotFoundError('Series not found');
    }

    // Check permissions
    if (!series.hasPermission(req.user.id, 'write')) {
      throw new ForbiddenError('You do not have permission to update episodes in this series');
    }

    const episode = series.episodes.find(ep => ep.episodeId.toString() === episodeId);
    if (!episode) {
      throw new NotFoundError('Episode not found in this series');
    }

    // Update episode fields
    Object.assign(episode, req.body);
    await series.save();

    // Add change history
    await series.addChangeHistory(`Episode updated: ${episode.title}`, req.user.id);

    res.json({
      success: true,
      data: series,
      message: 'Episode updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.removeEpisode = async (req, res, next) => {
  try {
    const { id, episodeId } = req.params;
    const series = await Series.findById(id);

    if (!series) {
      throw new NotFoundError('Series not found');
    }

    // Check permissions
    if (!series.hasPermission(req.user.id, 'write')) {
      throw new ForbiddenError('You do not have permission to remove episodes from this series');
    }

    const episode = series.episodes.find(ep => ep.episodeId.toString() === episodeId);
    if (!episode) {
      throw new NotFoundError('Episode not found in this series');
    }

    // Remove episode from series
    await series.removeEpisode(episodeId);

    // Remove series reference from blog
    await Blog.findByIdAndUpdate(episodeId, { $unset: { seriesId: 1 } });

    // Add change history
    await series.addChangeHistory(`Episode removed: ${episode.title}`, req.user.id);

    res.json({
      success: true,
      data: series,
      message: 'Episode removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Collaboration Management
exports.addCollaborator = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { userId, role, permissions } = req.body;

    const series = await Series.findById(id);
    if (!series) {
      throw new NotFoundError('Series not found');
    }

    // Check permissions
    if (!series.hasPermission(req.user.id, 'manage')) {
      throw new ForbiddenError('You do not have permission to manage collaborators');
    }

    // Verify user exists
    const user = await User.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Add collaborator
    await series.addCollaborator(userId, role, permissions);

    // Add change history
    await series.addChangeHistory(`Collaborator added: ${user.name}`, req.user.id);

    // Award XP for collaboration
    await XPService.awardXP(req.user.id, 'start_discussion', { seriesId: series._id, collaboratorId: userId });

    res.json({
      success: true,
      data: series,
      message: 'Collaborator added successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.removeCollaborator = async (req, res, next) => {
  try {
    const { id, userId } = req.params;
    const series = await Series.findById(id);

    if (!series) {
      throw new NotFoundError('Series not found');
    }

    // Check permissions
    if (!series.hasPermission(req.user.id, 'manage')) {
      throw new ForbiddenError('You do not have permission to manage collaborators');
    }

    await series.removeCollaborator(userId);

    // Add change history
    await series.addChangeHistory(`Collaborator removed`, req.user.id);

    res.json({
      success: true,
      data: series,
      message: 'Collaborator removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Progress Tracking
exports.updateProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { episodeId, progress, timeSpent, sessionId } = req.body;

    // Verify series exists
    const series = await Series.findById(id);
    if (!series) {
      throw new NotFoundError('Series not found');
    }

    // Get or create progress record
    let progressRecord = await SeriesProgress.findOne({
      userId: req.user.id,
      seriesId: id
    });

    if (!progressRecord) {
      progressRecord = new SeriesProgress({
        userId: req.user.id,
        seriesId: id,
        overallProgress: {
          totalEpisodes: series.episodes.length
        },
        episodeProgress: series.episodes.map(ep => ({
          episodeId: ep.episodeId,
          order: ep.order,
          status: 'not_started'
        }))
      });
    }

    // Ensure episode exists in progress record
    const episodeExists = progressRecord.episodeProgress.find(
      ep => ep.episodeId.toString() === episodeId.toString()
    );
    
    if (!episodeExists) {
      // Find episode in series
      const seriesEpisode = series.episodes.find(
        ep => ep.episodeId.toString() === episodeId.toString()
      );
      
      if (seriesEpisode) {
        progressRecord.episodeProgress.push({
          episodeId: episodeId,
          order: seriesEpisode.order,
          status: 'not_started',
          progress: 0,
          timeSpent: 0
        });
      }
    }

    // Update episode progress
    await progressRecord.updateEpisodeProgress(episodeId, progress, timeSpent);

    // Update engagement metrics
    progressRecord.engagement.totalTimeSpent += timeSpent;
    progressRecord.engagement.sessionsCount += 1;
    progressRecord.engagement.lastSessionAt = new Date();

    // Update reading streak
    await progressRecord.updateStreak();

    // Check for achievements
    await checkAndAwardAchievements(progressRecord, req.user.id);

    await progressRecord.save();

    res.json({
      success: true,
      data: progressRecord,
      message: 'Progress updated successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.getUserProgress = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.params.userId || req.user.id;

    const progress = await SeriesProgress.findOne({
      userId: userId,
      seriesId: id
    }).populate('seriesId', 'title description coverImage');

    if (!progress) {
      return res.json({
        success: true,
        data: null,
        message: 'No progress found for this series'
      });
    }

    res.json({
      success: true,
      data: progress
    });
  } catch (error) {
    next(error);
  }
};

// Bookmark Management
exports.addBookmark = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { episodeId, position, note } = req.body;

    let progressRecord = await SeriesProgress.findOne({
      userId: req.user.id,
      seriesId: id
    });

    if (!progressRecord) {
      throw new NotFoundError('No progress record found for this series');
    }

    await progressRecord.addBookmark(episodeId, position, note);

    res.json({
      success: true,
      data: progressRecord,
      message: 'Bookmark added successfully'
    });
  } catch (error) {
    next(error);
  }
};

exports.removeBookmark = async (req, res, next) => {
  try {
    const { id, episodeId } = req.params;

    const progressRecord = await SeriesProgress.findOne({
      userId: req.user.id,
      seriesId: id
    });

    if (!progressRecord) {
      throw new NotFoundError('No progress record found for this series');
    }

    await progressRecord.removeBookmark(episodeId);

    res.json({
      success: true,
      data: progressRecord,
      message: 'Bookmark removed successfully'
    });
  } catch (error) {
    next(error);
  }
};

// Analytics and Insights
exports.getSeriesAnalytics = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { startDate, endDate, groupBy = 'day', metrics } = req.query;

    const series = await Series.findById(id);
    if (!series) {
      throw new NotFoundError('Series not found');
    }

    // Check permissions
    if (!series.hasPermission(req.user.id, 'read')) {
      throw new ForbiddenError('You do not have permission to view analytics for this series');
    }

    // Get analytics data
    const analytics = await SeriesProgress.getSeriesAnalytics(id);
    const progressRecords = await SeriesProgress.findBySeries(id);

    // Calculate additional metrics
    const totalReaders = progressRecords.length;
    const activeReaders = progressRecords.filter(p => p.isActive).length;
    const completedReaders = progressRecords.filter(p => p.isCompleted).length;
    const averageEngagementScore = progressRecords.reduce((sum, p) => sum + p.engagement.engagementScore, 0) / totalReaders || 0;

    res.json({
      success: true,
      data: {
        series: {
          totalViews: series.analytics.totalViews,
          totalReads: series.analytics.totalReads,
          completionRate: series.analytics.completionRate,
          revenue: series.analytics.revenue,
          subscribers: series.analytics.subscribers
        },
        readers: {
          total: totalReaders,
          active: activeReaders,
          completed: completedReaders,
          averageEngagementScore
        },
        analytics: analytics[0] || {}
      }
    });
  } catch (error) {
    next(error);
  }
};

// Recommendations
exports.getRecommendations = async (req, res, next) => {
  try {
    const { userId, limit = 10, categories, excludeCompleted = true, includePremium = false } = req.query;

    let query = {
      visibility: 'public',
      status: { $in: ['active', 'completed'] }
    };

    if (categories) {
      query.category = { $in: categories.split(',') };
    }

    if (!includePremium) {
      query['monetization.model'] = 'free';
    }

    let series = await Series.find(query)
      .populate('authorId', 'name email profilePicture')
      .sort({ 'analytics.totalViews': -1 })
      .limit(parseInt(limit));

    // If user is authenticated, personalize recommendations
    if (req.user) {
      const userProgress = await SeriesProgress.findByUser(req.user.id);
      const completedSeriesIds = userProgress
        .filter(p => p.isCompleted)
        .map(p => p.seriesId.toString());

      if (excludeCompleted) {
        series = series.filter(s => !completedSeriesIds.includes(s._id.toString()));
      }

      // Sort by user preferences if available
      const userPreferences = await getUserPreferences(req.user.id);
      if (userPreferences.categories.length > 0) {
        series.sort((a, b) => {
          const aScore = userPreferences.categories.includes(a.category) ? 1 : 0;
          const bScore = userPreferences.categories.includes(b.category) ? 1 : 0;
          return bScore - aScore;
        });
      }
    }

    res.json({
      success: true,
      data: series
    });
  } catch (error) {
    next(error);
  }
};

// Trending Series
exports.getTrendingSeries = async (req, res, next) => {
  try {
    const { limit = 10, timeframe = 'week' } = req.query;

    const dateFilter = getDateFilter(timeframe);

    const series = await Series.find({
      visibility: 'public',
      status: { $in: ['active', 'completed'] },
      createdAt: dateFilter
    })
    .populate('authorId', 'name email profilePicture')
    .sort({ 'analytics.totalViews': -1 })
    .limit(parseInt(limit));

    res.json({
      success: true,
      data: series
    });
  } catch (error) {
    next(error);
  }
};

// Helper functions
async function checkAndAwardAchievements(progressRecord, userId) {
  const achievements = [];

  // First episode completed
  if (progressRecord.overallProgress.episodesCompleted === 1) {
    achievements.push({
      type: 'milestone',
      name: 'First Steps',
      description: 'Completed your first episode',
      xpReward: 25
    });
  }

  // Series completed
  if (progressRecord.isCompleted) {
    achievements.push({
      type: 'milestone',
      name: 'Series Master',
      description: 'Completed the entire series',
      xpReward: 100
    });
  }

  // Reading streak
  if (progressRecord.streaks.current >= 7) {
    achievements.push({
      type: 'streak',
      name: 'Week Warrior',
      description: 'Read for 7 consecutive days',
      xpReward: 50
    });
  }

  // Award achievements
  for (const achievement of achievements) {
    const existingAchievement = progressRecord.achievements.find(
      a => a.name === achievement.name
    );

    if (!existingAchievement) {
      await progressRecord.addAchievement(
        achievement.type,
        achievement.name,
        achievement.description,
        achievement.xpReward
      );

      // Award XP to user
      await XPService.awardXP(userId, 'earn_badge', { 
        badgeName: achievement.name,
        xpReward: achievement.xpReward 
      });
    }
  }
}

async function getUserPreferences(userId) {
  const progressRecords = await SeriesProgress.findByUser(userId);
  const categories = progressRecords
    .map(p => p.seriesId.category)
    .filter((category, index, arr) => arr.indexOf(category) === index);

  return { categories };
}

function getDateFilter(timeframe) {
  const now = new Date();
  const filters = {
    day: new Date(now.getTime() - 24 * 60 * 60 * 1000),
    week: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
    month: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
  };

  return { $gte: filters[timeframe] || filters.week };
}

module.exports = exports;
