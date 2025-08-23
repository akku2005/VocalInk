const logger = require('../utils/logger');

// Production-safe logging configuration
const productionLogging = {
  // Disable debug logging in production
  debug: false,
  
  // Sensitive fields that should never be logged
  sensitiveFields: [
    'password', 'token', 'secret', 'key', 'auth', 'credential',
    'api_key', 'apikey', 'jwt_secret', 'jwt_refresh_secret',
    'database_url', 'redis_url', 'mongodb_uri', 'mongo_uri',
    'openai_api_key', 'elevenlabs_api_key', 'google_cloud_credentials'
  ],

  // Sanitize sensitive data before logging
  sanitizeData: (data) => {
    if (typeof data === 'object' && data !== null) {
      const sanitized = {};
      for (const [key, value] of Object.entries(data)) {
        const lowerKey = key.toLowerCase();
        if (productionLogging.sensitiveFields.some(field => lowerKey.includes(field))) {
          sanitized[key] = '[REDACTED]';
        } else if (typeof value === 'object' && value !== null) {
          sanitized[key] = productionLogging.sanitizeData(value);
        } else {
          sanitized[key] = value;
        }
      }
      return sanitized;
    }
    return data;
  },

  // Production-safe logging methods
  log: {
    info: (message, data = null) => {
      if (data) {
        logger.production.info(message, productionLogging.sanitizeData(data));
      } else {
        logger.production.info(message);
      }
    },

    warn: (message, data = null) => {
      if (data) {
        logger.production.warn(message, productionLogging.sanitizeData(data));
      } else {
        logger.production.warn(message);
      }
    },

    error: (message, error = null) => {
      if (error) {
        // Only log error message and stack trace, not sensitive data
        const sanitizedError = {
          message: error.message,
          name: error.name,
          stack: process.env.NODE_ENV === 'production' ? undefined : error.stack
        };
        logger.production.error(message, sanitizedError);
      } else {
        logger.production.error(message);
      }
    },

    debug: (message, data = null) => {
      // Debug logging is disabled in production
      if (process.env.NODE_ENV !== 'production') {
        if (data) {
          logger.debug(message, productionLogging.sanitizeData(data));
        } else {
          logger.debug(message);
        }
      }
    }
  },

  // Database connection logging
  database: {
    connect: (host) => {
      const sanitizedHost = host ? host.replace(/\/\/[^:]+:[^@]+@/, '//***:***@') : host;
      logger.production.info(`Database connected to ${sanitizedHost}`);
    },
    disconnect: () => {
      logger.production.info('Database connection closed');
    },
    error: (error) => {
      logger.production.error('Database error', { message: error.message, name: error.name });
    }
  },

  // Authentication logging
  auth: {
    login: (userId, success) => {
      logger.production.info(`Login attempt for user ${userId}: ${success ? 'SUCCESS' : 'FAILED'}`);
    },
    logout: (userId) => {
      logger.production.info(`User ${userId} logged out`);
    },
    token: {
      valid: (userId) => {
        // Only log in development
        if (process.env.NODE_ENV !== 'production') {
          logger.debug(`Valid token for user ${userId}`);
        }
      },
      invalid: (reason) => {
        logger.production.warn(`Invalid token: ${reason}`);
      },
      expired: (userId) => {
        logger.production.warn(`Expired token for user ${userId}`);
      }
    }
  },

  // API request logging
  api: {
    request: (method, path, statusCode, responseTime, userId = null) => {
      const logData = {
        method,
        path,
        statusCode,
        responseTime: `${responseTime}ms`,
        userId: userId || 'anonymous'
      };
      logger.production.info('API Request', logData);
    },
    error: (method, path, statusCode, error, userId = null) => {
      const logData = {
        method,
        path,
        statusCode,
        error: error.message,
        userId: userId || 'anonymous'
      };
      logger.production.error('API Error', logData);
    }
  }
};

module.exports = productionLogging; 