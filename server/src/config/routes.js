// API Routes Configuration
// Centralizes all route definitions for easy maintenance and deployment

const API_ROUTES = {
  // Base paths
  BASE: '/api',
  VERSION: '/v1',

  // Route prefixes
  AUTH: '/auth',
  USERS: '/users',
  BLOGS: '/blogs',
  COMMENTS: '/comments',
  SERIES: '/series',
  BADGES: '/badges',
  NOTIFICATIONS: '/notifications',
  ABUSE_REPORTS: '/abusereports',
  AI: '/ai',
  TTS: '/tts',
  XP: '/xp',
  UPLOADS: '/uploads',
  IMAGES: '/images',
  SETTINGS: '/settings',
  SECURITY: '/security',

  // Complete route definitions
  ROUTES: {
    // Authentication routes
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      REFRESH: '/auth/refresh',
      VERIFY_EMAIL: '/auth/verify-email',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      VERIFY_2FA: '/auth/verify-2fa',
      SETUP_2FA: '/auth/setup-2fa',
      DISABLE_2FA: '/auth/disable-2fa',
    },

    // User routes
    USERS: {
      PROFILE: '/users/profile',
      UPDATE_PROFILE: '/users/profile',
      CHANGE_PASSWORD: '/users/change-password',
      UPLOAD_AVATAR: '/users/avatar',
      DELETE_ACCOUNT: '/users/delete',
      PREFERENCES: '/users/preferences',
      GET_BY_ID: '/users/:id',
      SEARCH: '/users/search',
    },

    // Blog routes
    BLOGS: {
      LIST: '/blogs',
      CREATE: '/blogs',
      GET_BY_ID: '/blogs/:id',
      UPDATE: '/blogs/:id',
      DELETE: '/blogs/:id',
      PUBLISH: '/blogs/:id/publish',
      UNPUBLISH: '/blogs/:id/unpublish',
      LIKE: '/blogs/:id/like',
      UNLIKE: '/blogs/:id/unlike',
      BOOKMARK: '/blogs/:id/bookmark',
      UNBOOKMARK: '/blogs/:id/unbookmark',
      SEARCH: '/blogs/search',
      TRENDING: '/blogs/trending',
      RECOMMENDED: '/blogs/recommended',
      USER_BLOGS: '/blogs/user/:userId',
      DRAFTS: '/blogs/drafts',
    },

    // Comment routes
    COMMENTS: {
      LIST: '/comments',
      CREATE: '/comments',
      UPDATE: '/comments/:id',
      DELETE: '/comments/:id',
      LIKE: '/comments/:id/like',
      UNLIKE: '/comments/:id/unlike',
      BLOG_COMMENTS: '/comments/blog/:blogId',
      USER_COMMENTS: '/comments/user/:userId',
    },

    // Series routes
    SERIES: {
      LIST: '/series',
      CREATE: '/series',
      GET_BY_ID: '/series/:id',
      UPDATE: '/series/:id',
      DELETE: '/series/:id',
      ADD_BLOG: '/series/:id/add-blog',
      REMOVE_BLOG: '/series/:id/remove-blog',
      USER_SERIES: '/series/user/:userId',
    },

    // Badge routes
    BADGES: {
      LIST: '/badges',
      GET_BY_ID: '/badges/:id',
      USER_BADGES: '/badges/user/:userId',
      AWARD_BADGE: '/badges/award',
      CREATE_BADGE: '/badges',
      UPDATE_BADGE: '/badges/:id',
      DELETE_BADGE: '/badges/:id',
    },

    // XP routes
    XP: {
      GET_XP: '/xp/:userId',
      AWARD_XP: '/xp/award',
      LEADERBOARD: '/xp/leaderboard',
      USER_STATS: '/xp/stats/:userId',
      RECENT_ACTIVITY: '/xp/activity/:userId',
    },

    // AI routes
    AI: {
      SUMMARIZE: '/ai/summarize',
      ANALYZE: '/ai/analyze',
      GENERATE_TAGS: '/ai/generate-tags',
      TTS: '/ai/tts',
      STT: '/ai/stt',
      HEALTH_CHECK: '/ai/health',
    },

    // Upload routes
    UPLOADS: {
      IMAGE: '/uploads/image',
      AUDIO: '/uploads/audio',
      DOCUMENT: '/uploads/document',
      MULTIPLE: '/uploads/multiple',
    },

    // Image routes
    IMAGES: {
      UPLOAD: '/images/upload',
      GET_BY_ID: '/images/:id',
      DELETE: '/images/:id',
      RESIZE: '/images/:id/resize',
    },

    // Notification routes
    NOTIFICATIONS: {
      LIST: '/notifications',
      GET_BY_ID: '/notifications/:id',
      MARK_READ: '/notifications/:id/read',
      MARK_ALL_READ: '/notifications/read-all',
      DELETE: '/notifications/:id',
      USER_NOTIFICATIONS: '/notifications/user/:userId',
    },

    // Settings routes
    SETTINGS: {
      GET: '/settings',
      UPDATE: '/settings',
      PASSWORD_POLICY: '/settings/password-policy',
      SYSTEM_SETTINGS: '/settings/system',
    },

    // Security routes
    SECURITY: {
      REPORT_ABUSE: '/security/report-abuse',
      GET_REPORTS: '/security/reports',
      BLOCK_USER: '/security/block',
      UNBLOCK_USER: '/security/unblock',
      SECURITY_LOGS: '/security/logs',
      AUDIT_TRAIL: '/security/audit',
    },

    // TTS routes
    TTS: {
      GENERATE: '/tts/generate',
      GET_AUDIO: '/tts/audio/:id',
      VOICES: '/tts/voices',
      QUEUE_STATUS: '/tts/queue/:id',
      HEALTH_CHECK: '/tts/health',
    },

    // Health and monitoring
    HEALTH: '/health',
    METRICS: '/metrics',
    STATUS: '/status',
  },

  // HTTP Methods
  METHODS: {
    GET: 'GET',
    POST: 'POST',
    PUT: 'PUT',
    DELETE: 'DELETE',
    PATCH: 'PATCH',
    OPTIONS: 'OPTIONS',
  },

  // Content Types
  CONTENT_TYPES: {
    JSON: 'application/json',
    FORM_DATA: 'multipart/form-data',
    URL_ENCODED: 'application/x-www-form-urlencoded',
    TEXT: 'text/plain',
  },

  // Rate limiting configurations
  RATE_LIMITS: {
    AUTH: { windowMs: 15 * 60 * 1000, max: 5 }, // 5 attempts per 15 minutes
    GENERAL: { windowMs: 15 * 60 * 1000, max: 100 }, // 100 requests per 15 minutes
    API: { windowMs: 15 * 60 * 1000, max: 200 }, // 200 requests per 15 minutes
    UPLOAD: { windowMs: 60 * 60 * 1000, max: 20 }, // 20 uploads per hour
  },
};

// Helper functions
const getRoute = (routeKey) => {
  const keys = routeKey.split('.');
  let current = API_ROUTES.ROUTES;

  for (const key of keys) {
    if (current && typeof current === 'object') {
      current = current[key];
    } else {
      throw new Error(`Invalid route key: ${routeKey}`);
    }
  }

  return current || null;
};

const getFullRoute = (routeKey) => {
  const route = getRoute(routeKey);
  return route ? `${API_ROUTES.BASE}${route}` : null;
};

const buildRoute = (baseRoute, params = {}) => {
  let route = baseRoute;
  Object.keys(params).forEach(key => {
    route = route.replace(`:${key}`, params[key]);
  });
  return route;
};

module.exports = {
  API_ROUTES,
  getRoute,
  getFullRoute,
  buildRoute,
};