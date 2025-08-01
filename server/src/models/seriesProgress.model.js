const mongoose = require('mongoose');

const seriesProgressSchema = new mongoose.Schema(
  {
    // User and Series
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    seriesId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Series',
      required: true
    },
    
    // Progress Tracking
    currentEpisode: {
      episodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
      order: { type: Number, default: 0 },
      progress: { type: Number, default: 0 }, // 0-100 percentage
      lastReadAt: { type: Date },
      timeSpent: { type: Number, default: 0 }, // in seconds
      completedAt: { type: Date }
    },
    
    // Overall Series Progress
    overallProgress: {
      episodesCompleted: { type: Number, default: 0 },
      totalEpisodes: { type: Number, default: 0 },
      completionPercentage: { type: Number, default: 0 },
      startedAt: { type: Date, default: Date.now },
      lastActivityAt: { type: Date, default: Date.now },
      estimatedCompletionDate: { type: Date }
    },
    
    // Episode-level Progress
    episodeProgress: [{
      episodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
      order: { type: Number },
      status: {
        type: String,
        enum: ['not_started', 'in_progress', 'completed', 'bookmarked'],
        default: 'not_started'
      },
      progress: { type: Number, default: 0 }, // 0-100
      timeSpent: { type: Number, default: 0 }, // in seconds
      startedAt: { type: Date },
      completedAt: { type: Date },
      lastReadAt: { type: Date },
      readCount: { type: Number, default: 0 },
      bookmarkedAt: { type: Date },
      notes: { type: String },
      rating: { type: Number, min: 1, max: 5 }
    }],
    
    // Bookmarks and Notes
    bookmarks: [{
      episodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
      position: { type: Number }, // scroll position or time position
      note: { type: String },
      createdAt: { type: Date, default: Date.now }
    }],
    
    // Reading Preferences
    preferences: {
      readingSpeed: { type: String, enum: ['slow', 'normal', 'fast'], default: 'normal' },
      autoBookmark: { type: Boolean, default: true },
      showProgress: { type: Boolean, default: true },
      notifications: { type: Boolean, default: true },
      readingMode: { type: String, enum: ['linear', 'non_linear'], default: 'linear' }
    },
    
    // Engagement Metrics
    engagement: {
      totalTimeSpent: { type: Number, default: 0 }, // in seconds
      averageSessionTime: { type: Number, default: 0 },
      sessionsCount: { type: Number, default: 0 },
      lastSessionAt: { type: Date },
      engagementScore: { type: Number, default: 0 },
      commentsCount: { type: Number, default: 0 },
      likesCount: { type: Number, default: 0 },
      sharesCount: { type: Number, default: 0 }
    },
    
    // Subscription and Access
    subscription: {
      isSubscribed: { type: Boolean, default: false },
      subscriptionType: { type: String, enum: ['free', 'premium', 'early_access'] },
      subscribedAt: { type: Date },
      expiresAt: { type: Date },
      paymentHistory: [{
        amount: { type: Number },
        currency: { type: String, default: 'USD' },
        date: { type: Date },
        status: { type: String, enum: ['pending', 'completed', 'failed'] }
      }]
    },
    
    // Achievement Tracking
    achievements: [{
      type: { type: String },
      name: { type: String },
      description: { type: String },
      earnedAt: { type: Date, default: Date.now },
      xpReward: { type: Number }
    }],
    
    // Reading Streaks
    streaks: {
      current: { type: Number, default: 0 },
      longest: { type: Number, default: 0 },
      lastReadDate: { type: Date }
    },
    
    // Analytics
    analytics: {
      dropOffPoints: [{
        episodeOrder: { type: Number },
        dropOffReason: { type: String },
        timestamp: { type: Date }
      }],
      favoriteEpisodes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Blog' }],
      readingPatterns: [{
        dayOfWeek: { type: Number },
        timeOfDay: { type: Number },
        sessionCount: { type: Number }
      }]
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Compound index for efficient queries
seriesProgressSchema.index({ userId: 1, seriesId: 1 }, { unique: true });
seriesProgressSchema.index({ userId: 1, 'overallProgress.lastActivityAt': -1 });
seriesProgressSchema.index({ seriesId: 1, 'overallProgress.completionPercentage': -1 });

// Virtuals
seriesProgressSchema.virtual('isCompleted').get(function() {
  return this.overallProgress.completionPercentage >= 100;
});

seriesProgressSchema.virtual('isActive').get(function() {
  const daysSinceLastActivity = (Date.now() - this.overallProgress.lastActivityAt) / (1000 * 60 * 60 * 24);
  return daysSinceLastActivity <= 30;
});

seriesProgressSchema.virtual('estimatedTimeRemaining').get(function() {
  if (this.overallProgress.completionPercentage === 0) return null;
  
  const completedEpisodes = this.overallProgress.episodesCompleted;
  const totalTimeSpent = this.engagement.totalTimeSpent;
  const averageTimePerEpisode = totalTimeSpent / completedEpisodes;
  
  const remainingEpisodes = this.overallProgress.totalEpisodes - completedEpisodes;
  return remainingEpisodes * averageTimePerEpisode;
});

// Pre-save middleware
seriesProgressSchema.pre('save', function(next) {
  // Update last activity
  this.overallProgress.lastActivityAt = new Date();
  
  // Calculate completion percentage
  if (this.overallProgress.totalEpisodes > 0) {
    this.overallProgress.completionPercentage = 
      (this.overallProgress.episodesCompleted / this.overallProgress.totalEpisodes) * 100;
  }
  
  // Update engagement score
  this.engagement.engagementScore = this.calculateEngagementScore();
  
  next();
});

// Instance methods
seriesProgressSchema.methods.updateEpisodeProgress = function(episodeId, progress, timeSpent) {
  const episodeProgress = this.episodeProgress.find(
    ep => ep.episodeId.toString() === episodeId.toString()
  );
  
  if (episodeProgress) {
    episodeProgress.progress = progress;
    episodeProgress.timeSpent += timeSpent;
    episodeProgress.lastReadAt = new Date();
    episodeProgress.readCount += 1;
    
    // Mark as completed if progress is 100%
    if (progress >= 100 && episodeProgress.status !== 'completed') {
      episodeProgress.status = 'completed';
      episodeProgress.completedAt = new Date();
      this.overallProgress.episodesCompleted += 1;
    }
    
    // Update current episode if this is the one being read
    if (this.currentEpisode && this.currentEpisode.episodeId && this.currentEpisode.episodeId.toString() === episodeId.toString()) {
      this.currentEpisode.progress = progress;
      this.currentEpisode.timeSpent += timeSpent;
      this.currentEpisode.lastReadAt = new Date();
    }
  }
  
  return this.save();
};

seriesProgressSchema.methods.addBookmark = function(episodeId, position, note) {
  const bookmark = {
    episodeId: episodeId,
    position: position,
    note: note,
    createdAt: new Date()
  };
  
  this.bookmarks.push(bookmark);
  
  // Update episode status to bookmarked
  const episodeProgress = this.episodeProgress.find(
    ep => ep.episodeId.toString() === episodeId.toString()
  );
  
  if (episodeProgress) {
    episodeProgress.status = 'bookmarked';
    episodeProgress.bookmarkedAt = new Date();
  }
  
  return this.save();
};

seriesProgressSchema.methods.removeBookmark = function(episodeId) {
  this.bookmarks = this.bookmarks.filter(
    bookmark => bookmark.episodeId.toString() !== episodeId.toString()
  );
  
  // Update episode status
  const episodeProgress = this.episodeProgress.find(
    ep => ep.episodeId.toString() === episodeId.toString()
  );
  
  if (episodeProgress && episodeProgress.status === 'bookmarked') {
    episodeProgress.status = episodeProgress.progress > 0 ? 'in_progress' : 'not_started';
    episodeProgress.bookmarkedAt = null;
  }
  
  return this.save();
};

seriesProgressSchema.methods.addAchievement = function(type, name, description, xpReward) {
  const achievement = {
    type: type,
    name: name,
    description: description,
    earnedAt: new Date(),
    xpReward: xpReward
  };
  
  this.achievements.push(achievement);
  return this.save();
};

seriesProgressSchema.methods.updateStreak = function() {
  const today = new Date();
  const lastReadDate = this.streaks.lastReadDate;
  
  if (!lastReadDate) {
    this.streaks.current = 1;
    this.streaks.lastReadDate = today;
  } else {
    const daysDiff = Math.floor((today - lastReadDate) / (1000 * 60 * 60 * 24));
    
    if (daysDiff === 1) {
      // Consecutive day
      this.streaks.current += 1;
    } else if (daysDiff > 1) {
      // Break in streak
      this.streaks.current = 1;
    }
    
    this.streaks.lastReadDate = today;
  }
  
  if (this.streaks.current > this.streaks.longest) {
    this.streaks.longest = this.streaks.current;
  }
  
  return this.save();
};

seriesProgressSchema.methods.calculateEngagementScore = function() {
  const factors = {
    completionRate: this.overallProgress.completionPercentage * 0.3,
    timeSpent: Math.min(this.engagement.totalTimeSpent / 3600, 100) * 0.2, // hours, max 100
    sessionsCount: Math.min(this.engagement.sessionsCount, 50) * 0.15, // max 50 sessions
    commentsCount: Math.min(this.engagement.commentsCount, 20) * 0.15, // max 20 comments
    likesCount: Math.min(this.engagement.likesCount, 30) * 0.1, // max 30 likes
    sharesCount: Math.min(this.engagement.sharesCount, 10) * 0.1 // max 10 shares
  };
  
  return Object.values(factors).reduce((sum, score) => sum + score, 0);
};

seriesProgressSchema.methods.getNextEpisode = function() {
  const currentOrder = this.currentEpisode.order;
  const nextEpisode = this.episodeProgress.find(
    ep => ep.order === currentOrder + 1 && ep.status !== 'completed'
  );
  
  return nextEpisode;
};

seriesProgressSchema.methods.getRecommendedEpisodes = function(limit = 5) {
  // Return episodes that are not completed, sorted by order
  return this.episodeProgress
    .filter(ep => ep.status !== 'completed')
    .sort((a, b) => a.order - b.order)
    .slice(0, limit);
};

// Static methods
seriesProgressSchema.statics.findByUser = function(userId) {
  return this.find({ userId: userId })
    .populate('seriesId', 'title description coverImage')
    .sort({ 'overallProgress.lastActivityAt': -1 });
};

seriesProgressSchema.statics.findBySeries = function(seriesId) {
  return this.find({ seriesId: seriesId })
    .populate('userId', 'name email profilePicture')
    .sort({ 'overallProgress.completionPercentage': -1 });
};

seriesProgressSchema.statics.findActiveReaders = function(seriesId, limit = 10) {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  
  return this.find({
    seriesId: seriesId,
    'overallProgress.lastActivityAt': { $gte: thirtyDaysAgo }
  })
  .populate('userId', 'name email profilePicture')
  .sort({ 'overallProgress.lastActivityAt': -1 })
  .limit(limit);
};

seriesProgressSchema.statics.getSeriesAnalytics = function(seriesId) {
  return this.aggregate([
    { $match: { seriesId: new mongoose.Types.ObjectId(seriesId) } },
    {
      $group: {
        _id: null,
        totalReaders: { $sum: 1 },
        averageCompletion: { $avg: '$overallProgress.completionPercentage' },
        averageTimeSpent: { $avg: '$engagement.totalTimeSpent' },
        totalBookmarks: { $sum: { $size: '$bookmarks' } },
        totalComments: { $sum: '$engagement.commentsCount' },
        totalLikes: { $sum: '$engagement.likesCount' },
        totalShares: { $sum: '$engagement.sharesCount' }
      }
    }
  ]);
};

module.exports = mongoose.model('SeriesProgress', seriesProgressSchema); 