const UsageLog = require('../models/usageLog.model');

const USAGE_TYPES = {
  SUMMARY: 'summary',
  AUDIO: 'audio',
  AI_BLOG_GENERATION: 'ai_blog_generation',
};

const USAGE_LIMITS = {
  [USAGE_TYPES.SUMMARY]: {
    limit: 15,
    windowMs: 24 * 60 * 60 * 1000,
  },
  [USAGE_TYPES.AUDIO]: {
    limit: 10,
    windowMs: 24 * 60 * 60 * 1000,
  },
  [USAGE_TYPES.AI_BLOG_GENERATION]: {
    limit: 2,
    windowMs: 24 * 60 * 60 * 1000,
  },
};

// Higher limits for premium users
const PREMIUM_USAGE_LIMITS = {
  [USAGE_TYPES.SUMMARY]: {
    limit: 50,
    windowMs: 24 * 60 * 60 * 1000,
  },
  [USAGE_TYPES.AUDIO]: {
    limit: 50,
    windowMs: 24 * 60 * 60 * 1000,
  },
  [USAGE_TYPES.AI_BLOG_GENERATION]: {
    limit: 25,
    windowMs: 24 * 60 * 60 * 1000,
  },
};

class UsageLimitError extends Error {
  constructor(type, usage) {
    super(`${type} usage limit reached`);
    this.name = 'UsageLimitError';
    this.type = type;
    this.usage = usage;
  }
}

const getLimitConfig = (type) => {
  const config = USAGE_LIMITS[type];
  if (!config) {
    throw new Error(`Unknown usage type: ${type}`);
  }
  return config;
};

const getPremiumLimitConfig = (type) => {
  const config = PREMIUM_USAGE_LIMITS[type];
  if (!config) {
    throw new Error(`Unknown usage type: ${type}`);
  }
  return config;
};

class UsageService {
  static async getUsageStatus(userId, type, userRole = null) {
    // Use premium limits for admin, author, and premium users
    const isPremiumUser = userRole && ['admin', 'author', 'premium'].includes(userRole);
    const config = isPremiumUser ? getPremiumLimitConfig(type) : getLimitConfig(type);

    const windowStart = new Date(Date.now() - config.windowMs);
    const query = {
      user: userId,
      type,
      createdAt: { $gte: windowStart },
    };

    const [used, oldest] = await Promise.all([
      UsageLog.countDocuments(query),
      UsageLog.findOne(query).sort({ createdAt: 1 }).lean(),
    ]);

    const nextReset = oldest ? new Date(oldest.createdAt.getTime() + config.windowMs) : null;

    return {
      type,
      limit: config.limit,
      windowMs: config.windowMs,
      used,
      remaining: Math.max(config.limit - used, 0),
      nextReset: nextReset ? nextReset.toISOString() : null,
      isPremium: isPremiumUser,
    };
  }

  static async ensureWithinLimit(userId, type, userRole = null) {
    const usage = await this.getUsageStatus(userId, type, userRole);
    if (usage.used >= usage.limit) {
      throw new UsageLimitError(type, usage);
    }

    return usage;
  }

  static async recordUsage(userId, type) {
    await UsageLog.create({ user: userId, type });
    return this.getUsageStatus(userId, type);
  }
}

module.exports = {
  UsageService,
  UsageLimitError,
  USAGE_TYPES,
};
