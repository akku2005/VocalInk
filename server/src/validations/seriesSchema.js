const Joi = require('joi');

// Base series schema
const baseSeriesSchema = {
  title: Joi.string().min(3).max(200).required().trim(),
  description: Joi.string().min(10).max(2000).required().trim(),
  summary: Joi.string().max(500).optional().trim(),
  coverImage: Joi.string().uri().optional(),
  bannerImage: Joi.string().uri().optional(),
  category: Joi.string().required(),
  tags: Joi.array().items(Joi.string().trim()).max(20).optional(),
  genre: Joi.string().optional(),
  topics: Joi.array().items(Joi.string().trim()).max(10).optional(),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
  template: Joi.string().valid(
    'educational_course',
    'story_arc',
    'project_chronicle',
    'interview_series',
    'research_journey',
    'product_development',
    'travel_log',
    'skill_building'
  ).optional(),
  visibility: Joi.string().valid('public', 'private', 'premium', 'subscriber_only').optional(),
  publishingSchedule: Joi.string().valid('daily', 'weekly', 'monthly', 'custom').optional(),
  customSchedule: Joi.object({
    frequency: Joi.string(),
    interval: Joi.number().min(1),
    timezone: Joi.string().default('UTC')
  }).optional(),
  monetization: Joi.object({
    model: Joi.string().valid('free', 'premium', 'subscription', 'donation').optional(),
    price: Joi.number().min(0).optional(),
    currency: Joi.string().default('USD').optional(),
    subscriptionTiers: Joi.array().items(Joi.object({
      name: Joi.string().required(),
      price: Joi.number().min(0).required(),
      benefits: Joi.array().items(Joi.string())
    })).optional(),
    earlyAccessDays: Joi.number().min(0).optional(),
    adFree: Joi.boolean().optional()
  }).optional(),
  dependencies: Joi.object({
    sequential: Joi.boolean().optional(),
    allowNonLinear: Joi.boolean().optional(),
    branchPoints: Joi.array().items(Joi.object({
      episodeOrder: Joi.number().required(),
      decisionPoints: Joi.array().items(Joi.object({
        title: Joi.string().required(),
        options: Joi.array().items(Joi.object({
          text: Joi.string().required(),
          nextEpisode: Joi.number().required()
        }))
      }))
    })).optional()
  }).optional(),
  interactionSettings: Joi.object({
    commentsEnabled: Joi.boolean().optional(),
    discussionForums: Joi.boolean().optional(),
    communityContributions: Joi.boolean().optional(),
    guestEpisodes: Joi.boolean().optional(),
    readerSubmissions: Joi.boolean().optional()
  }).optional(),
  restrictions: Joi.object({
    geographic: Joi.object({
      allowed: Joi.array().items(Joi.string().length(2)).optional(),
      blocked: Joi.array().items(Joi.string().length(2)).optional()
    }).optional(),
    age: Joi.object({
      minimum: Joi.number().min(0).optional(),
      rating: Joi.string().valid('G', 'PG', 'PG-13', 'R', 'NC-17').optional()
    }).optional()
  }).optional(),
  seo: Joi.object({
    metaTitle: Joi.string().max(60).optional(),
    metaDescription: Joi.string().max(160).optional(),
    keywords: Joi.array().items(Joi.string().trim()).max(10).optional(),
    canonicalUrl: Joi.string().uri().optional()
  }).optional(),
  timeline: Joi.object({
    startDate: Joi.date().optional(),
    endDate: Joi.date().optional(),
    estimatedDuration: Joi.number().min(1).optional()
  }).optional(),
  community: Joi.object({
    discussionSpace: Joi.string().optional(),
    hashtags: Joi.array().items(Joi.string().trim()).max(10).optional(),
    socialSharing: Joi.boolean().optional(),
    collaborativeFeatures: Joi.boolean().optional()
  }).optional(),
  features: Joi.object({
    interactiveTimeline: Joi.boolean().optional(),
    branchingNarratives: Joi.boolean().optional(),
    realTimeCollaboration: Joi.boolean().optional(),
    aiOptimization: Joi.boolean().optional(),
    crossSeriesConnections: Joi.array().items(Joi.string().hex().length(24)).optional()
  }).optional()
};

// Create series schema
const createSeriesSchema = Joi.object({
  ...baseSeriesSchema,
  collaborators: Joi.array().items(Joi.object({
    userId: Joi.string().hex().length(24).required(),
    role: Joi.string().valid('creator', 'editor', 'contributor', 'reviewer').optional(),
    permissions: Joi.array().items(Joi.string().valid('read', 'write', 'publish', 'manage', 'delete')).optional()
  })).optional()
});

// Update series schema
const updateSeriesSchema = Joi.object({
  ...baseSeriesSchema,
  status: Joi.string().valid('draft', 'active', 'completed', 'archived', 'suspended').optional()
});

// Add episode schema
const addEpisodeSchema = Joi.object({
  blogId: Joi.string().hex().length(24).required(),
  order: Joi.number().min(1).required(),
  title: Joi.string().min(1).max(200).required().trim(),
  status: Joi.string().valid('draft', 'scheduled', 'published', 'archived').optional(),
  scheduledAt: Joi.date().optional(),
  prerequisites: Joi.array().items(Joi.number().min(1)).optional(),
  estimatedReadTime: Joi.number().min(1).optional(),
  isPremium: Joi.boolean().optional()
});

// Update episode schema
const updateEpisodeSchema = Joi.object({
  order: Joi.number().min(1).optional(),
  title: Joi.string().min(1).max(200).optional().trim(),
  status: Joi.string().valid('draft', 'scheduled', 'published', 'archived').optional(),
  scheduledAt: Joi.date().optional(),
  prerequisites: Joi.array().items(Joi.number().min(1)).optional(),
  estimatedReadTime: Joi.number().min(1).optional(),
  isPremium: Joi.boolean().optional()
});

// Add collaborator schema
const addCollaboratorSchema = Joi.object({
  userId: Joi.string().hex().length(24).required(),
  role: Joi.string().valid('creator', 'editor', 'contributor', 'reviewer').required(),
  permissions: Joi.array().items(Joi.string().valid('read', 'write', 'publish', 'manage', 'delete')).required()
});

// Progress tracking schema
const updateProgressSchema = Joi.object({
  episodeId: Joi.string().hex().length(24).required(),
  progress: Joi.number().min(0).max(100).required(),
  timeSpent: Joi.number().min(0).required(),
  sessionId: Joi.string().optional()
});

// Bookmark schema
const addBookmarkSchema = Joi.object({
  episodeId: Joi.string().hex().length(24).required(),
  position: Joi.number().min(0).required(),
  note: Joi.string().max(500).optional().trim()
});

// Series query schema
const seriesQuerySchema = Joi.object({
  page: Joi.number().min(1).default(1),
  limit: Joi.number().min(1).max(100).default(10),
  category: Joi.string().optional(),
  tags: Joi.string().optional(), // comma-separated
  author: Joi.string().hex().length(24).optional(),
  status: Joi.string().valid('draft', 'active', 'completed', 'archived', 'suspended').optional(),
  visibility: Joi.string().valid('public', 'private', 'premium', 'subscriber_only').optional(),
  template: Joi.string().valid(
    'educational_course',
    'story_arc',
    'project_chronicle',
    'interview_series',
    'research_journey',
    'product_development',
    'travel_log',
    'skill_building'
  ).optional(),
  difficulty: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').optional(),
  sortBy: Joi.string().valid('createdAt', 'updatedAt', 'title', 'totalViews', 'completionRate').default('createdAt'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc'),
  search: Joi.string().min(1).optional().trim()
});

// Analytics query schema
const analyticsQuerySchema = Joi.object({
  startDate: Joi.date().optional(),
  endDate: Joi.date().optional(),
  groupBy: Joi.string().valid('day', 'week', 'month').default('day'),
  metrics: Joi.array().items(Joi.string().valid(
    'views',
    'reads',
    'completion_rate',
    'revenue',
    'subscribers',
    'engagement_score'
  )).optional()
});

// Subscription schema
const subscriptionSchema = Joi.object({
  subscriptionType: Joi.string().valid('free', 'premium', 'early_access').required(),
  paymentMethod: Joi.string().optional(),
  autoRenew: Joi.boolean().default(true)
});

// Achievement schema
const achievementSchema = Joi.object({
  type: Joi.string().required(),
  name: Joi.string().required(),
  description: Joi.string().required(),
  xpReward: Joi.number().min(0).required()
});

// Series recommendation schema
const recommendationQuerySchema = Joi.object({
  userId: Joi.string().hex().length(24).optional(),
  limit: Joi.number().min(1).max(20).default(10),
  categories: Joi.array().items(Joi.string()).optional(),
  excludeCompleted: Joi.boolean().default(true),
  includePremium: Joi.boolean().default(false)
});

module.exports = {
  createSeriesSchema,
  updateSeriesSchema,
  addEpisodeSchema,
  updateEpisodeSchema,
  addCollaboratorSchema,
  updateProgressSchema,
  addBookmarkSchema,
  seriesQuerySchema,
  analyticsQuerySchema,
  subscriptionSchema,
  achievementSchema,
  recommendationQuerySchema
}; 