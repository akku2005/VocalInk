// API Configuration
// Centralizes all API endpoints for easy deployment configuration

const API_CONFIG = {
  // Base API URL - can be overridden by environment variables
  BASE_URL: import.meta.env.VITE_API_URL || '/api',

  // API Endpoints
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: '/auth/login',
      REGISTER: '/auth/register',
      LOGOUT: '/auth/logout',
      LOGOUT_ALL: '/auth/logout-all',
      REFRESH: '/auth/refresh-token',
      VERIFY_EMAIL: '/auth/verify-email',
      RESEND_VERIFICATION: '/auth/resend-verification',
      FORGOT_PASSWORD: '/auth/forgot-password',
      RESET_PASSWORD: '/auth/reset-password',
      CHANGE_PASSWORD: '/auth/change-password',
      VERIFY_2FA: '/auth/2fa/verify',
      SETUP_2FA: '/auth/2fa/setup',
      DISABLE_2FA: '/auth/2fa/disable',
      ME: '/auth/me',
      SESSIONS: '/auth/sessions',
    },

    // User Management
    USERS: {
      PROFILE: '/users/profile',
      UPDATE_PROFILE: '/users/profile',
      CHANGE_PASSWORD: '/users/change-password',
      UPLOAD_AVATAR: '/users/avatar',
      DELETE_ACCOUNT: '/users/delete',
      PREFERENCES: '/users/preferences',
    },

    // Blog Management
    BLOGS: {
      LIST: '/blogs',
      CREATE: '/blogs',
      GET_BY_ID: '/blogs/:id',
      UPDATE: '/blogs/:id',
      DELETE: '/blogs/:id',
      PUBLISH: '/blogs/:id/publish',
      LIKE: '/blogs/:id/like',
      BOOKMARK: '/blogs/:id/bookmark',
      SEARCH: '/blogs/search',
      TRENDING: '/blogs/trending',
      RECOMMENDED: '/blogs/recommended',
    },

    // Comments
    COMMENTS: {
      LIST: '/comments',
      CREATE: '/comments',
      UPDATE: '/comments',
      DELETE: '/comments',
      LIKE: '/comments/like',
      UNLIKE: '/comments/unlike',
    },

    // Series
    SERIES: {
      LIST: '/series',
      CREATE: '/series',
      GET_BY_ID: '/series',
      UPDATE: '/series',
      DELETE: '/series',
      ADD_BLOG: '/series/add-blog',
      REMOVE_BLOG: '/series/remove-blog',
    },

    // Badges & XP
    BADGES: {
      LIST: '/badges',
      USER_BADGES: '/badges/user',
      AWARD_BADGE: '/badges/award',
    },

    XP: {
      GET_XP: '/xp',
      AWARD_XP: '/xp/award',
      LEADERBOARD: '/xp/leaderboard',
    },

    // AI Features
    AI: {
      SUMMARIZE: '/ai/summarize',
      ANALYZE: '/ai/analyze',
      GENERATE_TAGS: '/ai/generate-tags',
      TTS: '/ai/tts',
      STT: '/ai/stt',
    },

    // File Uploads
    UPLOADS: {
      IMAGE: '/uploads/image',
      AUDIO: '/uploads/audio',
      DOCUMENT: '/uploads/document',
    },

    // Images
    IMAGES: {
      UPLOAD: '/images/upload',
      GET_BY_ID: '/images',
      DELETE: '/images',
    },

    // Notifications
    NOTIFICATIONS: {
      LIST: '/notifications',
      MARK_READ: '/notifications/read',
      MARK_ALL_READ: '/notifications/read-all',
      DELETE: '/notifications',
    },

    // Settings
    SETTINGS: {
      GET: '/settings',
      UPDATE: '/settings',
      PASSWORD_POLICY: '/settings/password-policy',
    },

    // Security
    SECURITY: {
      REPORT_ABUSE: '/security/report-abuse',
      GET_REPORTS: '/security/reports',
      BLOCK_USER: '/security/block',
      UNBLOCK_USER: '/security/unblock',
    },

    // TTS (Text-to-Speech)
    TTS: {
      GENERATE: '/tts/generate',
      GET_AUDIO: '/tts/audio',
      VOICES: '/tts/voices',
    },
  },

  // HTTP Status Codes
  STATUS: {
    OK: 200,
    CREATED: 201,
    NO_CONTENT: 204,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    CONFLICT: 409,
    UNPROCESSABLE_ENTITY: 422,
    INTERNAL_SERVER_ERROR: 500,
  },

  // Request/Response configuration
  TIMEOUT: 30000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,

  // Helper methods - FIXED: Added as methods to API_CONFIG object
  getFullUrl(endpointKey, params = {}) {
    let endpoint = '';

    // Navigate through nested object structure
    const keys = endpointKey.split('.');
    let current = this.ENDPOINTS;

    for (const key of keys) {
      if (current && typeof current === 'object') {
        current = current[key];
      } else {
        throw new Error(`Invalid endpoint key: ${endpointKey}`);
      }
    }

    if (typeof current === 'string') {
      endpoint = current;
    } else {
      throw new Error(`Endpoint not found: ${endpointKey}`);
    }

    // Replace parameters in endpoint
    let url = `${this.BASE_URL}${endpoint}`;
    Object.keys(params).forEach(key => {
      url = url.replace(`:${key}`, params[key]);
    });

    return url;
  },

  getApiUrl(endpoint) {
    return `${this.BASE_URL}${endpoint}`;
  }
};

// Export helper functions for backward compatibility
export const getApiUrl = (endpoint) => {
  return API_CONFIG.getApiUrl(endpoint);
};

export const getFullUrl = (endpointKey, params = {}) => {
  return API_CONFIG.getFullUrl(endpointKey, params);
};

// Resolve asset URLs to work across dev/prod and Cloudinary/local
export const getAssetBase = () => {
  const base = API_CONFIG.BASE_URL;
  try {
    const url = new URL(base, window.location.origin);
    return url.origin;
  } catch {
    return '';
  }
};

export const resolveAssetUrl = (url) => {
  if (!url) return '';
  if (/^https?:\/\//i.test(url)) return url;
  if (url.startsWith('/api/uploads')) return url.replace('/api/uploads', '/uploads');
  if (url.startsWith('/uploads')) {
    const origin = getAssetBase();
    return origin ? `${origin}${url}` : url;
  }
  return url;
};

export default API_CONFIG;