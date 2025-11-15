const mongoose = require('mongoose');

const seriesSchema = new mongoose.Schema(
  {
    // Basic Information
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    summary: { type: String },
    coverImage: { type: String }, // Cloudinary URL
    coverImageKey: { type: String }, // Cloudinary public ID for cover image
    bannerImage: { type: String },
    bannerImageKey: { type: String }, // Cloudinary public ID for banner image
    
    // Author and Ownership
    authorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    collaborators: [{
      userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      role: {
        type: String,
        enum: ['creator', 'editor', 'contributor', 'reviewer'],
        default: 'contributor'
      },
      permissions: [{
        type: String,
        enum: ['read', 'write', 'publish', 'manage', 'delete']
      }],
      addedAt: { type: Date, default: Date.now }
    }],
    
    // Series Classification
    category: { type: String, required: true },
    tags: [{ type: String, trim: true }],
    genre: { type: String },
    topics: [{ type: String }],
    difficulty: {
      type: String,
      enum: ['beginner', 'intermediate', 'advanced', 'expert'],
      default: 'intermediate'
    },
    
    // Series Configuration
    template: {
      type: String,
      enum: [
        'educational_course',
        'story_arc',
        'project_chronicle',
        'interview_series',
        'research_journey',
        'product_development',
        'travel_log',
        'skill_building'
      ],
      default: 'story_arc'
    },
    
    // Publishing Settings
    status: {
      type: String,
      enum: ['draft', 'active', 'completed', 'archived', 'suspended'],
      default: 'draft'
    },
    visibility: {
      type: String,
      enum: ['public', 'private', 'premium', 'subscriber_only'],
      default: 'public'
    },
    publishingSchedule: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'custom'],
      default: 'weekly'
    },
    customSchedule: {
      frequency: { type: String },
      interval: { type: Number },
      timezone: { type: String, default: 'UTC' }
    },
    
    // Monetization Settings
    monetization: {
      model: {
        type: String,
        enum: ['free', 'premium', 'subscription', 'donation'],
        default: 'free'
      },
      price: { type: Number, min: 0 },
      currency: { type: String, default: 'USD' },
      subscriptionTiers: [{
        name: { type: String },
        price: { type: Number },
        benefits: [{ type: String }]
      }],
      earlyAccessDays: { type: Number, default: 0 },
      adFree: { type: Boolean, default: false }
    },
    
    // Content Structure
    episodes: [{
      episodeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
      order: { type: Number, required: true },
      title: { type: String },
      status: {
        type: String,
        enum: ['draft', 'scheduled', 'published', 'archived'],
        default: 'draft'
      },
      scheduledAt: { type: Date },
      publishedAt: { type: Date },
      prerequisites: [{ type: Number }], // Episode order numbers that must be completed first
      estimatedReadTime: { type: Number }, // in minutes
      isPremium: { type: Boolean, default: false }
    }],
    
    // Seasons (for complex series)
    seasons: [{
      seasonNumber: { type: Number, required: true },
      title: { type: String },
      description: { type: String },
      episodeRange: {
        start: { type: Number },
        end: { type: Number }
      }
    }],
    
    // Dependencies and Navigation
    dependencies: {
      sequential: { type: Boolean, default: true },
      allowNonLinear: { type: Boolean, default: false },
      branchPoints: [{
        episodeOrder: { type: Number },
        decisionPoints: [{
          title: { type: String },
          options: [{
            text: { type: String },
            nextEpisode: { type: Number }
          }]
        }]
      }]
    },
    
    // Interaction Settings
    interactionSettings: {
      commentsEnabled: { type: Boolean, default: true },
      discussionForums: { type: Boolean, default: false },
      communityContributions: { type: Boolean, default: false },
      guestEpisodes: { type: Boolean, default: false },
      readerSubmissions: { type: Boolean, default: false }
    },
    
    // Geographic and Age Restrictions
    restrictions: {
      geographic: {
        allowed: [{ type: String }], // Country codes
        blocked: [{ type: String }]
      },
      age: {
        minimum: { type: Number, min: 0 },
        rating: {
          type: String,
          enum: ['G', 'PG', 'PG-13', 'R', 'NC-17'],
          default: 'PG'
        }
      }
    },
    
    // Analytics and Performance
    analytics: {
      totalViews: { type: Number, default: 0 },
      totalReads: { type: Number, default: 0 },
      completionRate: { type: Number, default: 0 },
      averageReadTime: { type: Number, default: 0 },
      likes: { type: Number, default: 0 },
      bookmarks: { type: Number, default: 0 },
      comments: { type: Number, default: 0 },
      dropOffPoints: [{
        episodeOrder: { type: Number },
        dropOffRate: { type: Number }
      }],
      revenue: { type: Number, default: 0 },
      subscribers: { type: Number, default: 0 }
    },
    
    // SEO and Discovery
    seo: {
      metaTitle: { type: String },
      metaDescription: { type: String },
      keywords: [{ type: String }],
      canonicalUrl: { type: String }
    },
    
    // Timeline and Progress
    timeline: {
      startDate: { type: Date },
      endDate: { type: Date },
      estimatedDuration: { type: Number }, // in days
      currentEpisode: { type: Number, default: 0 },
      totalEpisodes: { type: Number, default: 0 },
      publishedEpisodes: { type: Number, default: 0 }
    },
    
    // Community and Social
    community: {
      discussionSpace: { type: String },
      hashtags: [{ type: String }],
      socialSharing: { type: Boolean, default: true },
      collaborativeFeatures: { type: Boolean, default: false }
    },
    
    // Advanced Features
    features: {
      interactiveTimeline: { type: Boolean, default: false },
      branchingNarratives: { type: Boolean, default: false },
      realTimeCollaboration: { type: Boolean, default: false },
      aiOptimization: { type: Boolean, default: false },
      crossSeriesConnections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Series' }]
    },
    
    // Version Control
    version: { type: Number, default: 1 },
    changeHistory: [{
      version: { type: Number },
      changes: { type: String },
      changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      changedAt: { type: Date, default: Date.now }
    }]
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes for performance
seriesSchema.index({ authorId: 1, status: 1 });
seriesSchema.index({ category: 1, status: 1 });
seriesSchema.index({ tags: 1 });
seriesSchema.index({ 'analytics.totalViews': -1 });
seriesSchema.index({ createdAt: -1 });
seriesSchema.index({ 'timeline.startDate': 1 });
seriesSchema.index({ visibility: 1, status: 1 });

// Virtuals
seriesSchema.virtual('episodeCount').get(function() {
  return this.episodes ? this.episodes.length : 0;
});

seriesSchema.virtual('publishedEpisodeCount').get(function() {
  return this.episodes ? this.episodes.filter(ep => ep.status === 'published').length : 0;
});

seriesSchema.virtual('collaboratorCount').get(function() {
  return this.collaborators ? this.collaborators.length : 0;
});

seriesSchema.virtual('isCompleted').get(function() {
  return this.status === 'completed';
});

seriesSchema.virtual('isActive').get(function() {
  return this.status === 'active';
});

seriesSchema.virtual('isPremium').get(function() {
  return this.monetization.model !== 'free';
});

// Pre-save middleware
seriesSchema.pre('save', function(next) {
  // Update total episodes count
  this.timeline.totalEpisodes = this.episodes ? this.episodes.length : 0;
  this.timeline.publishedEpisodes = this.episodes ? 
    this.episodes.filter(ep => ep.status === 'published').length : 0;
  
  // Update completion rate if there are views
  if (this.analytics.totalViews > 0) {
    this.analytics.completionRate = (this.analytics.totalReads / this.analytics.totalViews) * 100;
  }
  
  next();
});

// Instance methods
seriesSchema.methods.addEpisode = function(blogId, order, title) {
  const episode = {
    episodeId: blogId,
    order: order,
    title: title,
    status: 'draft'
  };
  
  this.episodes.push(episode);
  this.episodes.sort((a, b) => a.order - b.order);
  
  return this.save();
};

seriesSchema.methods.removeEpisode = function(episodeId) {
  this.episodes = this.episodes.filter(ep => ep.episodeId.toString() !== episodeId.toString());
  return this.save();
};

seriesSchema.methods.updateEpisodeOrder = function(episodeId, newOrder) {
  const episode = this.episodes.find(ep => ep.episodeId.toString() === episodeId.toString());
  if (episode) {
    episode.order = newOrder;
    this.episodes.sort((a, b) => a.order - b.order);
    return this.save();
  }
  throw new Error('Episode not found');
};

seriesSchema.methods.addCollaborator = function(userId, role, permissions) {
  const existingCollaborator = this.collaborators.find(
    col => col.userId.toString() === userId.toString()
  );
  
  if (existingCollaborator) {
    existingCollaborator.role = role;
    existingCollaborator.permissions = permissions;
  } else {
    this.collaborators.push({
      userId: userId,
      role: role,
      permissions: permissions
    });
  }
  
  return this.save();
};

seriesSchema.methods.removeCollaborator = function(userId) {
  this.collaborators = this.collaborators.filter(
    col => col.userId.toString() !== userId.toString()
  );
  return this.save();
};

seriesSchema.methods.hasPermission = function(userId, permission) {
  // Author has all permissions
  if (this.authorId.toString() === userId.toString()) {
    return true;
  }
  
  const collaborator = this.collaborators.find(
    col => col.userId.toString() === userId.toString()
  );
  
  return collaborator && collaborator.permissions.includes(permission);
};

seriesSchema.methods.incrementViews = function() {
  this.analytics.totalViews += 1;
  return this.save();
};

seriesSchema.methods.incrementReads = function() {
  this.analytics.totalReads += 1;
  return this.save();
};

seriesSchema.methods.updateRevenue = function(amount) {
  this.analytics.revenue += amount;
  return this.save();
};

seriesSchema.methods.addChangeHistory = function(changes, changedBy) {
  this.version += 1;
  this.changeHistory.push({
    version: this.version,
    changes: changes,
    changedBy: changedBy
  });
  
  return this.save();
};

// Static methods
seriesSchema.statics.findByAuthor = function(authorId) {
  return this.find({ authorId: authorId }).sort({ createdAt: -1 });
};

seriesSchema.statics.findPublic = function() {
  return this.find({ 
    visibility: 'public', 
    status: { $in: ['active', 'completed'] } 
  }).sort({ 'analytics.totalViews': -1 });
};

seriesSchema.statics.findByCategory = function(category) {
  return this.find({ 
    category: category,
    visibility: 'public',
    status: { $in: ['active', 'completed'] }
  }).sort({ 'analytics.totalViews': -1 });
};

seriesSchema.statics.findTrending = function(limit = 10) {
  return this.find({
    visibility: 'public',
    status: { $in: ['active', 'completed'] }
  })
  .sort({ 'analytics.totalViews': -1 })
  .limit(limit);
};

seriesSchema.statics.findByTags = function(tags) {
  return this.find({
    tags: { $in: tags },
    visibility: 'public',
    status: { $in: ['active', 'completed'] }
  }).sort({ 'analytics.totalViews': -1 });
};

module.exports = mongoose.model('Series', seriesSchema);
