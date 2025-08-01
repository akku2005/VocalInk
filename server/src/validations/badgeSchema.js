const Joi = require('joi');

// Badge creation validation schema
const createBadgeSchema = Joi.object({
  badgeKey: Joi.string()
    .pattern(/^[a-z0-9_-]+$/)
    .min(3)
    .max(50)
    .required()
    .messages({
      'string.pattern.base': 'Badge key must contain only lowercase letters, numbers, hyphens, and underscores',
      'string.min': 'Badge key must be at least 3 characters long',
      'string.max': 'Badge key must not exceed 50 characters',
      'any.required': 'Badge key is required'
    }),

  name: Joi.string()
    .min(2)
    .max(100)
    .required()
    .messages({
      'string.min': 'Badge name must be at least 2 characters long',
      'string.max': 'Badge name must not exceed 100 characters',
      'any.required': 'Badge name is required'
    }),

  description: Joi.string()
    .min(10)
    .max(500)
    .required()
    .messages({
      'string.min': 'Badge description must be at least 10 characters long',
      'string.max': 'Badge description must not exceed 500 characters',
      'any.required': 'Badge description is required'
    }),

  longDescription: Joi.string()
    .max(2000)
    .optional()
    .messages({
      'string.max': 'Long description must not exceed 2000 characters'
    }),

  icon: Joi.string()
    .uri()
    .required()
    .messages({
      'string.uri': 'Icon must be a valid URL',
      'any.required': 'Icon URL is required'
    }),

  iconDark: Joi.string()
    .uri()
    .optional()
    .messages({
      'string.uri': 'Dark icon must be a valid URL'
    }),

  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Color must be a valid hex color code (e.g., #3B82F6)'
    }),

  backgroundColor: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional()
    .messages({
      'string.pattern.base': 'Background color must be a valid hex color code'
    }),

  gradient: Joi.string()
    .max(200)
    .optional()
    .messages({
      'string.max': 'Gradient must not exceed 200 characters'
    }),

  rarity: Joi.string()
    .valid('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')
    .default('common')
    .messages({
      'any.only': 'Rarity must be one of: common, uncommon, rare, epic, legendary, mythic'
    }),

  category: Joi.string()
    .valid('engagement', 'content', 'social', 'achievement', 'special', 'seasonal', 'community', 'expertise')
    .default('achievement')
    .messages({
      'any.only': 'Category must be one of: engagement, content, social, achievement, special, seasonal, community, expertise'
    }),

  subcategories: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 10 subcategories',
      'string.max': 'Subcategory must not exceed 50 characters'
    }),

  tags: Joi.array()
    .items(Joi.string().max(30))
    .max(20)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 20 tags',
      'string.max': 'Tag must not exceed 30 characters'
    }),

  themes: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional()
    .messages({
      'array.max': 'Cannot have more than 10 themes',
      'string.max': 'Theme must not exceed 50 characters'
    }),

  requirements: Joi.object({
    // Legacy requirements
    xpRequired: Joi.number()
      .min(0)
      .max(1000000)
      .default(0)
      .messages({
        'number.min': 'XP required cannot be negative',
        'number.max': 'XP required cannot exceed 1,000,000'
      }),

    blogsRequired: Joi.number()
      .min(0)
      .max(10000)
      .default(0)
      .messages({
        'number.min': 'Blogs required cannot be negative',
        'number.max': 'Blogs required cannot exceed 10,000'
      }),

    followersRequired: Joi.number()
      .min(0)
      .max(100000)
      .default(0)
      .messages({
        'number.min': 'Followers required cannot be negative',
        'number.max': 'Followers required cannot exceed 100,000'
      }),

    likesRequired: Joi.number()
      .min(0)
      .max(1000000)
      .default(0)
      .messages({
        'number.min': 'Likes required cannot be negative',
        'number.max': 'Likes required cannot exceed 1,000,000'
      }),

    commentsRequired: Joi.number()
      .min(0)
      .max(100000)
      .default(0)
      .messages({
        'number.min': 'Comments required cannot be negative',
        'number.max': 'Comments required cannot exceed 100,000'
      }),

    daysActiveRequired: Joi.number()
      .min(0)
      .max(3650)
      .default(0)
      .messages({
        'number.min': 'Days active required cannot be negative',
        'number.max': 'Days active required cannot exceed 3,650 (10 years)'
      }),

    // Advanced requirements
    logicalExpression: Joi.string()
      .max(1000)
      .optional()
      .messages({
        'string.max': 'Logical expression must not exceed 1000 characters'
      }),

    variables: Joi.object()
      .pattern(/^[A-Z_][A-Z0-9_]*$/, Joi.object({
        type: Joi.string()
          .valid('count', 'sum', 'average', 'boolean', 'date', 'string')
          .required(),
        source: Joi.string()
          .valid('user', 'blog', 'comment', 'series', 'interaction', 'system')
          .required(),
        field: Joi.string()
          .max(100)
          .required(),
        filter: Joi.object().optional(),
        aggregation: Joi.string()
          .valid('count', 'sum', 'avg', 'min', 'max', 'distinct')
          .optional(),
        timeWindow: Joi.number()
          .min(1)
          .max(365)
          .optional(),
        minimumValue: Joi.number().optional(),
        maximumValue: Joi.number().optional()
      }))
      .optional(),

    prerequisites: Joi.array()
      .items(Joi.string().hex().length(24))
      .max(10)
      .optional()
      .messages({
        'array.max': 'Cannot have more than 10 prerequisites',
        'string.hex': 'Prerequisite must be a valid ObjectId',
        'string.length': 'Prerequisite must be a valid ObjectId'
      }),

    availableFrom: Joi.date()
      .min('now')
      .optional()
      .messages({
        'date.min': 'Available from date must be in the future'
      }),

    availableUntil: Joi.date()
      .min('now')
      .optional()
      .messages({
        'date.min': 'Available until date must be in the future'
      }),

    seasonalStart: Joi.string()
      .pattern(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/)
      .optional()
      .messages({
        'string.pattern.base': 'Seasonal start must be in MM-DD format (e.g., 12-01)'
      }),

    seasonalEnd: Joi.string()
      .pattern(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/)
      .optional()
      .messages({
        'string.pattern.base': 'Seasonal end must be in MM-DD format (e.g., 12-31)'
      }),

    geographicRestrictions: Joi.object({
      countries: Joi.array()
        .items(Joi.string().length(2))
        .max(50)
        .optional(),
      regions: Joi.array()
        .items(Joi.string().max(50))
        .max(20)
        .optional(),
      excludeCountries: Joi.array()
        .items(Joi.string().length(2))
        .max(50)
        .optional()
    }).optional(),

    userCohorts: Joi.object({
      newUsers: Joi.boolean().default(false),
      veteranUsers: Joi.boolean().default(false),
      premiumUsers: Joi.boolean().default(false),
      betaTesters: Joi.boolean().default(false)
    }).optional()
  }).required(),

  rewards: Joi.object({
    xpReward: Joi.number()
      .min(0)
      .max(10000)
      .default(10)
      .messages({
        'number.min': 'XP reward cannot be negative',
        'number.max': 'XP reward cannot exceed 10,000'
      }),

    featureUnlocks: Joi.array()
      .items(Joi.string().max(100))
      .max(20)
      .optional(),

    specialPrivileges: Joi.array()
      .items(Joi.string().max(100))
      .max(20)
      .optional(),

    customEmojis: Joi.array()
      .items(Joi.string().max(50))
      .max(10)
      .optional(),

    profileBadges: Joi.array()
      .items(Joi.string().max(100))
      .max(10)
      .optional(),

    exclusiveContent: Joi.array()
      .items(Joi.string().max(200))
      .max(10)
      .optional()
  }).optional(),

  visibility: Joi.object({
    isPublic: Joi.boolean().default(true),
    showInLeaderboard: Joi.boolean().default(true),
    allowSocialSharing: Joi.boolean().default(true),
    showProgress: Joi.boolean().default(true),
    isSecret: Joi.boolean().default(false),
    revealOnEarn: Joi.boolean().default(false)
  }).optional(),

  status: Joi.string()
    .valid('active', 'inactive', 'deprecated', 'archived')
    .default('active')
    .messages({
      'any.only': 'Status must be one of: active, inactive, deprecated, archived'
    }),

  version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .default('1.0.0')
    .messages({
      'string.pattern.base': 'Version must be in semantic versioning format (e.g., 1.0.0)'
    }),

  security: Joi.object({
    requiresVerification: Joi.boolean().default(false),
    maxClaimsPerUser: Joi.number()
      .min(1)
      .max(100)
      .default(1)
      .messages({
        'number.min': 'Max claims per user must be at least 1',
        'number.max': 'Max claims per user cannot exceed 100'
      }),

    cooldownPeriod: Joi.number()
      .min(0)
      .max(86400)
      .default(0)
      .messages({
        'number.min': 'Cooldown period cannot be negative',
        'number.max': 'Cooldown period cannot exceed 86,400 seconds (24 hours)'
      }),

    fraudThreshold: Joi.number()
      .min(0)
      .max(1)
      .default(0.8)
      .messages({
        'number.min': 'Fraud threshold must be between 0 and 1',
        'number.max': 'Fraud threshold must be between 0 and 1'
      }),

    manualReviewRequired: Joi.boolean().default(false)
  }).optional(),

  metadata: Joi.object().optional()
});

// Badge update validation schema (all fields optional)
const updateBadgeSchema = Joi.object({
  badgeKey: Joi.string()
    .pattern(/^[a-z0-9_-]+$/)
    .min(3)
    .max(50)
    .optional(),

  name: Joi.string()
    .min(2)
    .max(100)
    .optional(),

  description: Joi.string()
    .min(10)
    .max(500)
    .optional(),

  longDescription: Joi.string()
    .max(2000)
    .optional(),

  icon: Joi.string()
    .uri()
    .optional(),

  iconDark: Joi.string()
    .uri()
    .optional(),

  color: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional(),

  backgroundColor: Joi.string()
    .pattern(/^#[0-9A-Fa-f]{6}$/)
    .optional(),

  gradient: Joi.string()
    .max(200)
    .optional(),

  rarity: Joi.string()
    .valid('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')
    .optional(),

  category: Joi.string()
    .valid('engagement', 'content', 'social', 'achievement', 'special', 'seasonal', 'community', 'expertise')
    .optional(),

  subcategories: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional(),

  tags: Joi.array()
    .items(Joi.string().max(30))
    .max(20)
    .optional(),

  themes: Joi.array()
    .items(Joi.string().max(50))
    .max(10)
    .optional(),

  requirements: Joi.object({
    xpRequired: Joi.number().min(0).max(1000000).optional(),
    blogsRequired: Joi.number().min(0).max(10000).optional(),
    followersRequired: Joi.number().min(0).max(100000).optional(),
    likesRequired: Joi.number().min(0).max(1000000).optional(),
    commentsRequired: Joi.number().min(0).max(100000).optional(),
    daysActiveRequired: Joi.number().min(0).max(3650).optional(),
    logicalExpression: Joi.string().max(1000).optional(),
    variables: Joi.object().pattern(/^[A-Z_][A-Z0-9_]*$/, Joi.object({
      type: Joi.string().valid('count', 'sum', 'average', 'boolean', 'date', 'string').required(),
      source: Joi.string().valid('user', 'blog', 'comment', 'series', 'interaction', 'system').required(),
      field: Joi.string().max(100).required(),
      filter: Joi.object().optional(),
      aggregation: Joi.string().valid('count', 'sum', 'avg', 'min', 'max', 'distinct').optional(),
      timeWindow: Joi.number().min(1).max(365).optional(),
      minimumValue: Joi.number().optional(),
      maximumValue: Joi.number().optional()
    })).optional(),
    prerequisites: Joi.array().items(Joi.string().hex().length(24)).max(10).optional(),
    availableFrom: Joi.date().min('now').optional(),
    availableUntil: Joi.date().min('now').optional(),
    seasonalStart: Joi.string().pattern(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/).optional(),
    seasonalEnd: Joi.string().pattern(/^(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])$/).optional(),
    geographicRestrictions: Joi.object({
      countries: Joi.array().items(Joi.string().length(2)).max(50).optional(),
      regions: Joi.array().items(Joi.string().max(50)).max(20).optional(),
      excludeCountries: Joi.array().items(Joi.string().length(2)).max(50).optional()
    }).optional(),
    userCohorts: Joi.object({
      newUsers: Joi.boolean().optional(),
      veteranUsers: Joi.boolean().optional(),
      premiumUsers: Joi.boolean().optional(),
      betaTesters: Joi.boolean().optional()
    }).optional()
  }).optional(),

  rewards: Joi.object({
    xpReward: Joi.number().min(0).max(10000).optional(),
    featureUnlocks: Joi.array().items(Joi.string().max(100)).max(20).optional(),
    specialPrivileges: Joi.array().items(Joi.string().max(100)).max(20).optional(),
    customEmojis: Joi.array().items(Joi.string().max(50)).max(10).optional(),
    profileBadges: Joi.array().items(Joi.string().max(100)).max(10).optional(),
    exclusiveContent: Joi.array().items(Joi.string().max(200)).max(10).optional()
  }).optional(),

  visibility: Joi.object({
    isPublic: Joi.boolean().optional(),
    showInLeaderboard: Joi.boolean().optional(),
    allowSocialSharing: Joi.boolean().optional(),
    showProgress: Joi.boolean().optional(),
    isSecret: Joi.boolean().optional(),
    revealOnEarn: Joi.boolean().optional()
  }).optional(),

  status: Joi.string()
    .valid('active', 'inactive', 'deprecated', 'archived')
    .optional(),

  version: Joi.string()
    .pattern(/^\d+\.\d+\.\d+$/)
    .optional(),

  security: Joi.object({
    requiresVerification: Joi.boolean().optional(),
    maxClaimsPerUser: Joi.number().min(1).max(100).optional(),
    cooldownPeriod: Joi.number().min(0).max(86400).optional(),
    fraudThreshold: Joi.number().min(0).max(1).optional(),
    manualReviewRequired: Joi.boolean().optional()
  }).optional(),

  metadata: Joi.object().optional()
});

// Badge claim validation schema
const claimBadgeSchema = Joi.object({
  badgeId: Joi.string()
    .hex()
    .length(24)
    .required()
    .messages({
      'string.hex': 'Badge ID must be a valid ObjectId',
      'string.length': 'Badge ID must be a valid ObjectId',
      'any.required': 'Badge ID is required'
    })
});

// Badge search validation schema
const searchBadgesSchema = Joi.object({
  query: Joi.string()
    .min(1)
    .max(100)
    .required()
    .messages({
      'string.min': 'Search query must be at least 1 character long',
      'string.max': 'Search query must not exceed 100 characters',
      'any.required': 'Search query is required'
    }),

  category: Joi.string()
    .valid('engagement', 'content', 'social', 'achievement', 'special', 'seasonal', 'community', 'expertise')
    .optional(),

  rarity: Joi.string()
    .valid('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')
    .optional(),

  limit: Joi.number()
    .min(1)
    .max(100)
    .default(20)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    })
});

// Badge filter validation schema
const filterBadgesSchema = Joi.object({
  category: Joi.string()
    .valid('engagement', 'content', 'social', 'achievement', 'special', 'seasonal', 'community', 'expertise')
    .optional(),

  rarity: Joi.string()
    .valid('common', 'uncommon', 'rare', 'epic', 'legendary', 'mythic')
    .optional(),

  status: Joi.string()
    .valid('active', 'inactive', 'deprecated', 'archived')
    .default('active'),

  search: Joi.string()
    .max(100)
    .optional(),

  tags: Joi.array()
    .items(Joi.string().max(30))
    .max(10)
    .optional(),

  limit: Joi.number()
    .min(1)
    .max(100)
    .default(50)
    .messages({
      'number.min': 'Limit must be at least 1',
      'number.max': 'Limit must not exceed 100'
    }),

  page: Joi.number()
    .min(1)
    .default(1)
    .messages({
      'number.min': 'Page must be at least 1'
    }),

  sortBy: Joi.string()
    .valid('createdAt', 'name', 'rarity', 'analytics.totalEarned', 'analytics.popularityScore')
    .default('createdAt')
    .messages({
      'any.only': 'Sort by must be one of: createdAt, name, rarity, analytics.totalEarned, analytics.popularityScore'
    }),

  sortOrder: Joi.string()
    .valid('asc', 'desc')
    .default('desc')
    .messages({
      'any.only': 'Sort order must be either asc or desc'
    })
});

// Claim review validation schema
const reviewClaimSchema = Joi.object({
  decision: Joi.string()
    .valid('approve', 'reject')
    .required()
    .messages({
      'any.only': 'Decision must be either approve or reject',
      'any.required': 'Decision is required'
    }),

  notes: Joi.string()
    .max(1000)
    .optional()
    .messages({
      'string.max': 'Notes must not exceed 1000 characters'
    })
});

module.exports = {
  createBadgeSchema,
  updateBadgeSchema,
  claimBadgeSchema,
  searchBadgesSchema,
  filterBadgesSchema,
  reviewClaimSchema
}; 