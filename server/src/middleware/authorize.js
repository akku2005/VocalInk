const crypto = require('crypto');
const { promisify } = require('util');

const { StatusCodes } = require('http-status-codes');
const rateLimit = require('express-rate-limit');
const slowDown = require('express-slow-down');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

const AppError = require('../utils/AppError');
const AuditLog = require('../models/auditlog.model');
const User = require('../models/user.model');
const Token = require('../models/token.model');
const logger = require('../utils/logger');
const config = require('../config');
const TokenService = require('../services/TokenService');
const {
  UnauthorizedError,
  ForbiddenError,
  BadRequestError,
} = require('../utils/errors');

// Constants
const PERMISSION_LEVELS = {
  READ: 'read',
  WRITE: 'write',
  DELETE: 'delete',
  ADMIN: 'admin',
};

const RESOURCE_TYPES = {
  BLOG: 'blog',
  COMMENT: 'comment',
  USER: 'user',
  BADGE: 'badge',
  XP: 'xp',
};

// Helper function to get client IP safely
function getClientIp(req) {
  return (
    req.headers['x-forwarded-for']?.split(',').shift() ||
    req.socket?.remoteAddress ||
    req.ip ||
    'unknown'
  );
}

// Rate Limiters
const authLimiter = rateLimit({
  windowMs: config.security.rateLimits.auth.windowMs,
  max: config.security.rateLimits.auth.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    return `${ip}-${userAgent}`;
  },
  handler: (req, res) => {
    logger.warn(
      `Rate limit exceeded for IP: ${getClientIp(req)}`,
      {
        userAgent: req.headers['user-agent'],
        endpoint: `${req.method} ${req.originalUrl}`,
      }
    );
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: config.security.rateLimits.auth.message,
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
});

const sensitiveOperationLimiter = rateLimit({
  windowMs: config.security.rateLimits.sensitive.windowMs,
  max: config.security.rateLimits.sensitive.max,
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = getClientIp(req);
    const userAgent = req.headers['user-agent'] || 'unknown';
    const endpoint = req.originalUrl;
    return `${ip}-${userAgent}-${endpoint}`;
  },
  handler: (req, res) => {
    logger.warn(`Sensitive operation rate limit exceeded`, {
      ip: getClientIp(req),
      userAgent: req.headers['user-agent'],
      endpoint: `${req.method} ${req.originalUrl}`,
    });
    res.status(StatusCodes.TOO_MANY_REQUESTS).json({
      success: false,
      message: config.security.rateLimits.sensitive.message,
      retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
    });
  },
  skip: (req) => {
    // Skip rate limiting for whitelisted IPs
    const whitelistedIPs = process.env.RATE_LIMIT_WHITELIST?.split(',') || [];
    return whitelistedIPs.includes(getClientIp(req));
  },
});

// Token Utility Functions
class TokenUtils {
  static extractToken(req) {
    // Check Authorization header first (most secure)
    if (req.headers.authorization) {
      const authHeader = req.headers.authorization.trim();
      if (authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7).trim();
      }
    }

    // Check cookies for web sessions
    if (req.cookies?.accessToken) {
      return req.cookies.accessToken.trim();
    }

    // Check query parameters for specific endpoints
    if (req.query.access_token) {
      return req.query.access_token.trim();
    }

    return null;
  }

  static async verifyToken(
    token,
    tokenType = config.security.token.types.ACCESS
  ) {
    if (!token || typeof token !== 'string') {
      logger.warn('Invalid token format:', {
        token: token ? 'present but invalid' : 'missing',
      });
      throw new AppError('Invalid token format', StatusCodes.UNAUTHORIZED);
    }

    if (!process.env.JWT_SECRET) {
      logger.error('JWT_SECRET environment variable is not configured');
      throw new AppError(
        'Authentication service unavailable',
        StatusCodes.SERVICE_UNAVAILABLE
      );
    }

    try {
      // Verify JWT signature and decode
      const decoded = await promisify(jwt.verify)(
        token,
        process.env.JWT_SECRET,
        {
          issuer: config.security.token.issuer,
          audience: config.security.token.audience,
          algorithms: ['HS256'],
          clockTolerance: 30,
        }
      );

      // Log decoded token for debugging
      logger.debug('Token decoded successfully:', {
        jti: decoded.jti,
        type: decoded.type,
        expectedType: tokenType,
      });

      // Validate token structure
      if (!decoded.id || !decoded.jti || decoded.type !== tokenType) {
        logger.warn('Invalid token structure:', {
          hasId: !!decoded.id,
          hasJti: !!decoded.jti,
          tokenType: decoded.type,
          expectedType: tokenType,
        });
        throw new AppError('Invalid token structure', StatusCodes.UNAUTHORIZED);
      }

      // Check token in database
      const tokenRecord = await Token.findOne({
        _id: decoded.jti,
        userId: decoded.id,
        type: tokenType,
        isActive: true,
        expiresAt: { $gt: new Date() },
      }).select('+tokenHash');

      if (!tokenRecord) {
        logger.warn('Token not found or invalid:', {
          jti: decoded.jti,
          userId: decoded.id,
          type: tokenType,
        });
        throw new AppError(
          'Invalid authentication token',
          StatusCodes.UNAUTHORIZED
        );
      }

      // Verify token hash matches
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      if (tokenRecord.tokenHash !== tokenHash) {
        logger.warn('Token hash mismatch:', {
          tokenId: decoded.jti,
          storedHash: tokenRecord.tokenHash ? 'present' : 'missing',
          computedHash: tokenHash ? 'present' : 'missing',
        });
        throw new AppError(
          'Invalid authentication token',
          StatusCodes.UNAUTHORIZED
        );
      }

      return {
        decoded,
        tokenRecord,
        userId: decoded.id,
      };
    } catch (error) {
      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
        logger.warn('Invalid JWT signature:', { error: error.message });
        throw new AppError(
          'Invalid authentication token',
          StatusCodes.UNAUTHORIZED
        );
      }
      if (error.name === 'TokenExpiredError') {
        logger.info('Token expired:', { tokenId: error.jti });
        throw new AppError(
          'Authentication token has expired',
          StatusCodes.UNAUTHORIZED
        );
      }
      if (error.name === 'NotBeforeError') {
        logger.warn('Token not active yet:', { tokenId: error.jti });
        throw new AppError(
          'Authentication token not yet active',
          StatusCodes.UNAUTHORIZED
        );
      }

      // Log unexpected errors
      logger.error('Token verification error:', {
        error: error.message,
        stack: error.stack,
        tokenType,
      });

      throw new AppError('Authentication failed', StatusCodes.UNAUTHORIZED);
    }
  }

  static async generateToken(userId, type, metadata = {}) {
    const tokenId = uuidv4();
    const expiresIn = config.security.token.expiresIn[type];

    const payload = {
      sub: userId,
      type,
      jti: tokenId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + this.getExpiryInSeconds(expiresIn),
      iss: config.security.token.issuer,
      aud: config.security.token.audience,
      ...metadata,
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, {
      algorithm: 'HS512',
    });

    // Store token in database with metadata
    const tokenRecord = await Token.create({
      _id: tokenId,
      userId,
      type,
      metadata: {
        ...metadata,
        ipAddress: metadata.ipAddress,
        userAgent: metadata.userAgent,
        issuedAt: new Date(payload.iat * 1000),
        expiresAt: new Date(payload.exp * 1000),
      },
    });

    return { token, tokenRecord };
  }

  static getExpiryInSeconds(expiry) {
    if (typeof expiry === 'number') return expiry;
    if (typeof expiry === 'string') {
      const match = expiry.match(/^(\d+)([smhd])$/);
      if (!match) throw new Error('Invalid expiry format');
      const [, value, unit] = match;
      const multipliers = { s: 1, m: 60, h: 3600, d: 86400 };
      return parseInt(value) * multipliers[unit];
    }
    throw new Error('Invalid expiry format');
  }

  static async invalidateToken(token) {
    try {
      const tokenRecord = await Token.findOneAndUpdate(
        { token },
        { isActive: false },
        { new: true }
      );
      return tokenRecord;
    } catch (error) {
      logger.error('Error invalidating token:', error);
      throw new AppError(
        'Failed to invalidate token',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  static async invalidateUserTokens(userId, excludeTokenId = null) {
    try {
      const query = { userId, isActive: true };
      if (excludeTokenId) {
        query._id = { $ne: excludeTokenId };
      }
      await Token.updateMany(query, { isActive: false });
    } catch (error) {
      logger.error('Error invalidating user tokens:', error);
      throw new AppError(
        'Failed to invalidate user tokens',
        StatusCodes.INTERNAL_SERVER_ERROR
      );
    }
  }

  static async logAuthEvent(req, event, details = {}) {
    try {
      await AuditLog.create({
        event,
        userId: req.user?._id,
        ipAddress: req.ip,
        userAgent: req.headers['user-agent'],
        details: {
          ...details,
          method: req.method,
          path: req.originalUrl,
        },
      });
    } catch (error) {
      logger.error('Failed to log auth event:', error);
    }
  }
}

// Enhanced role-based authorization with hierarchical roles
const authorize = (...allowedRoles) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(
          new AppError('Authentication required', StatusCodes.UNAUTHORIZED)
        );
      }

      const userRole = req.user.role;
      const hasRole = allowedRoles.includes(userRole);

      // Role hierarchy: admin > manager > user
      const roleHierarchy = {
        admin: 3,
        manager: 2,
        user: 1,
        guest: 0,
      };

      const userRoleLevel = roleHierarchy[userRole] || 0;
      const minRequiredLevel = Math.min(
        ...allowedRoles.map((role) => roleHierarchy[role] || 0)
      );

      const hasHierarchicalAccess = userRoleLevel >= minRequiredLevel;

      if (!hasRole && !hasHierarchicalAccess) {
        // Log authorization failure
        await TokenUtils.logAuthEvent(req, 'AUTHORIZATION_FAILED', {
          requiredRoles: allowedRoles,
          userRole,
          severity: 'medium',
        });

        return next(
          new AppError(
            'Insufficient privileges to perform this action',
            StatusCodes.FORBIDDEN
          )
        );
      }

      next();
    } catch (error) {
      logger.error('Authorization middleware error:', error);
      next(
        new AppError(
          'Authorization service error',
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }
  };
};

// Enhanced resource ownership check WITHOUT Redis caching
const checkOwnership = (Model, options = {}) => {
  const {
    allowedRoles = ['admin'],
    resourceField = 'user',
    cacheTimeout = 300000, // 5 minutes
    populateFields = '',
  } = options;

  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(
          new AppError('Authentication required', StatusCodes.UNAUTHORIZED)
        );
      }

      const resourceId = req.params.id;
      if (!resourceId) {
        return next(
          new AppError('Resource ID required', StatusCodes.BAD_REQUEST)
        );
      }

      // Fetch from database only (no Redis)
      const query = Model.findById(resourceId);
      if (populateFields) {
        query.populate(populateFields);
      }
      const resource = await query.lean();

      if (!resource) {
        return next(new AppError('Resource not found', StatusCodes.NOT_FOUND));
      }

      // Check if user has admin role
      if (allowedRoles.includes(req.user.role)) {
        req.resource = resource;
        return next();
      }

      // Check ownership
      const resourceOwner = resource[resourceField];
      if (!resourceOwner) {
        return next(
          new AppError(
            'Resource ownership information not available',
            StatusCodes.FORBIDDEN
          )
        );
      }

      const ownerId = resourceOwner._id || resourceOwner;
      if (ownerId.toString() !== req.user.id.toString()) {
        await TokenUtils.logAuthEvent(req, 'UNAUTHORIZED_RESOURCE_ACCESS', {
          resourceId,
          resourceType: Model.modelName,
          attemptedBy: req.user.id,
          severity: 'high',
        });
        return next(
          new AppError(
            'Access denied: You do not own this resource',
            StatusCodes.FORBIDDEN
          )
        );
      }

      req.resource = resource;
      next();
    } catch (error) {
      logger.error('Ownership check error:', error);
      next(
        new AppError(
          'Resource access verification failed',
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }
  };
};

// Blog ownership check middleware
const checkBlogOwnership = () => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return next(
          new AppError('Authentication required', StatusCodes.UNAUTHORIZED)
        );
      }

      // Admin bypass
      if (req.user.role === 'admin') {
        return next();
      }

      const blogId = req.params.id || req.params.blogId;
      if (!blogId) {
        return next(); // No blog to check
      }

      // Import Blog model dynamically to avoid circular dependencies
      const Blog = require('../models/blog.model');
      const blog = await Blog.findById(blogId).lean();

      if (!blog) {
        return next(
          new AppError('Blog not found', StatusCodes.NOT_FOUND)
        );
      }

      // Check if user is blog author
      if (blog.author.toString() !== req.user.id) {
        await TokenUtils.logAuthEvent(req, 'BLOG_ACCESS_DENIED', {
          blogId,
          attemptedBy: req.user.id,
          severity: 'medium',
        });

        return next(
          new AppError('You can only modify your own blogs', StatusCodes.FORBIDDEN)
        );
      }

      next();
    } catch (error) {
      logger.error('Blog ownership check error:', error);
      next(
        new AppError(
          'Blog access verification failed',
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }
  };
};

// Department-based authorization with hierarchical structure
const authorizeDepartment = (allowedDepartments, options = {}) => {
  const { allowCrossDepartment = false, managerOverride = true } = options;

  return async (req, res, next) => {
    try {
      if (!req.user.department) {
        return next(
          new AppError('User department not set', StatusCodes.FORBIDDEN)
        );
      }

      const userDepartment = req.user.department;
      const isAllowed = allowedDepartments.includes(userDepartment);

      if (!isAllowed && !allowCrossDepartment) {
        await TokenUtils.logAuthEvent(req, 'DEPARTMENT_ACCESS_DENIED', {
          userDepartment,
          allowedDepartments,
          severity: 'medium',
        });

        return next(
          new AppError(
            'Access denied: Insufficient department privileges',
            StatusCodes.FORBIDDEN
          )
        );
      }

      // Allow managers to access cross-department resources if managerOverride is true
      if (
        !isAllowed &&
        allowCrossDepartment &&
        managerOverride &&
        req.user.role === 'manager'
      ) {
        return next();
      }

      next();
    } catch (error) {
      logger.error('Department authorization error:', error);
      next(
        new AppError(
          'Department access verification failed',
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }
  };
};

// Time-based access control
const timeBasedAccess = (config) => {
  const {
    allowedDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
    startTime = '09:00',
    endTime = '17:00',
    timezone = 'UTC',
    message = 'Access not allowed at this time',
  } = config;

  return async (req, res, next) => {
    try {
      const now = new Date();
      const currentDay = now
        .toLocaleDateString('en-US', { weekday: 'long' })
        .toLowerCase();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();

      // Check if current day is allowed
      if (!allowedDays.includes(currentDay)) {
        await TokenUtils.logAuthEvent(req, 'TIME_BASED_ACCESS_DENIED', {
          currentDay,
          allowedDays,
          timezone,
        });

        return next(
          new AppError('Access not allowed on this day', StatusCodes.FORBIDDEN)
        );
      }

      // Parse time range
      const [startHour, startMinute] = startTime.split(':').map(Number);
      const [endHour, endMinute] = endTime.split(':').map(Number);

      // Convert current time to minutes since midnight
      const currentTimeInMinutes = currentHour * 60 + currentMinute;
      const startTimeInMinutes = startHour * 60 + startMinute;
      const endTimeInMinutes = endHour * 60 + endMinute;

      // Check if current time is within allowed range
      if (
        currentTimeInMinutes < startTimeInMinutes ||
        currentTimeInMinutes > endTimeInMinutes
      ) {
        await TokenUtils.logAuthEvent(req, 'TIME_BASED_ACCESS_DENIED', {
          currentTime: `${currentHour}:${currentMinute}`,
          allowedRange: `${startTime}-${endTime}`,
          timezone,
        });

        return next(new AppError(message, StatusCodes.FORBIDDEN));
      }

      next();
    } catch (error) {
      logger.error('Time-based access check error:', error);
      next(
        new AppError(
          'Time access verification failed',
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }
  };
};

// IP-based access control
const ipBasedAccess = (config) => {
  const {
    allowedIPs = [],
    allowedRanges = [],
    message = 'Access not allowed from this IP',
  } = config;

  return async (req, res, next) => {
    try {
      const clientIP =
        req.ip ||
        req.headers['x-forwarded-for'] ||
        req.connection.remoteAddress;

      // Check if IP is in allowed list
      if (allowedIPs.includes(clientIP)) {
        return next();
      }

      // Check if IP is in allowed ranges
      const isInRange = allowedRanges.some((range) => {
        const [start, end] = range.split('-').map((ip) => ip.trim());
        return isIPInRange(clientIP, start, end);
      });

      if (!isInRange) {
        await TokenUtils.logAuthEvent(req, 'IP_BASED_ACCESS_DENIED', {
          clientIP,
          allowedIPs,
          allowedRanges,
        });

        return next(new AppError(message, StatusCodes.FORBIDDEN));
      }

      next();
    } catch (error) {
      logger.error('IP-based access check error:', error);
      next(
        new AppError(
          'IP access verification failed',
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }
  };
};

// Helper function to check if IP is in range
const isIPInRange = (ip, start, end) => {
  const ipToLong = (ip) => {
    return (
      ip.split('.').reduce((acc, octet) => (acc << 8) + parseInt(octet), 0) >>>
      0
    );
  };

  const ipLong = ipToLong(ip);
  const startLong = ipToLong(start);
  const endLong = ipToLong(end);

  return ipLong >= startLong && ipLong <= endLong;
};

// Create rate limiter with custom options
const createRateLimit = (options) => {
  const {
    windowMs = 15 * 60 * 1000, // 15 minutes
    max = 100,
    message = 'Too many requests from this IP, please try again later',
    keyGenerator = (req) => req.ip,
    skip = (req) => false,
    handler = (req, res) => {
      res.status(StatusCodes.TOO_MANY_REQUESTS).json({
        success: false,
        message,
        retryAfter: Math.ceil(req.rateLimit.resetTime / 1000),
      });
    },
  } = options;

  return rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator,
    skip,
    handler: (req, res) => {
      logger.warn('Rate limit exceeded:', {
        ip: req.ip,
        endpoint: `${req.method} ${req.originalUrl}`,
        key: keyGenerator(req),
      });
      handler(req, res);
    },
  });
};

// Feature flag middleware
const featureFlag = (featureName, options = {}) => {
  const {
    enabled = true,
    message = 'This feature is currently disabled',
    bypassRoles = ['admin'],
  } = options;

  return async (req, res, next) => {
    try {
      // Allow bypass for specified roles
      if (req.user && bypassRoles.includes(req.user.role)) {
        return next();
      }

      // Check if feature is enabled
      if (!enabled) {
        await TokenUtils.logAuthEvent(req, 'FEATURE_ACCESS_DENIED', {
          feature: featureName,
          userRole: req.user?.role,
        });

        return next(new AppError(message, StatusCodes.FORBIDDEN));
      }

      next();
    } catch (error) {
      logger.error('Feature flag check error:', error);
      next(
        new AppError(
          'Feature access verification failed',
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }
  };
};

// Helper function to check permission levels
const hasPermissionLevel = (userRole, requiredPermission) => {
  const permissionLevels = {
    admin: 4,
    manager: 3,
    supervisor: 2,
    user: 1,
  };

  const userLevel = permissionLevels[userRole] || 0;
  const requiredLevel = permissionLevels[requiredPermission] || 0;

  return userLevel >= requiredLevel;
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
  // Set security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader(
    'Strict-Transport-Security',
    'max-age=31536000; includeSubDomains'
  );
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader(
    'Permissions-Policy',
    'geolocation=(), microphone=(), camera=()'
  );

  next();
};

// Admin check middleware
const isAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    return next(new AppError('Admin access required', StatusCodes.FORBIDDEN));
  }
  next();
};

// Owner or admin check middleware
const isOwnerOrAdmin = (req, res, next) => {
  if (!req.user) {
    return next(
      new AppError('Authentication required', StatusCodes.UNAUTHORIZED)
    );
  }
  if (req.user.role === 'admin' || req.user._id?.toString() === req.params.id) {
    return next();
  }
  return next(new AppError('Not authorized', StatusCodes.FORBIDDEN));
};

/**
 * Middleware to check if user has required permissions
 * @param {string|string[]} requiredPermissions - Single permission or array of permissions
 * @param {Object} options - Options object
 * @param {boolean} options.requireAll - If true, user must have all permissions. If false, any one permission is sufficient
 * @returns {Function} Express middleware
 */
const checkPermissions = (
  requiredPermissions,
  options = { requireAll: false }
) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        throw new UnauthorizedError('Authentication required');
      }

      const permissions = Array.isArray(requiredPermissions)
        ? requiredPermissions
        : [requiredPermissions];

      const hasPermission = options.requireAll
        ? req.user.hasAllPermissions(permissions)
        : req.user.hasAnyPermission(permissions);

      if (!hasPermission) {
        throw new UnauthorizedError('Insufficient permissions');
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Middleware to check if user has admin role
 */
const requireAdmin = (req, res, next) => {
  try {
    if (!req.user) {
      throw new UnauthorizedError('Authentication required');
    }

    if (req.user.role !== 'admin') {
      throw new UnauthorizedError('Admin access required');
    }

    next();
  } catch (error) {
    next(error);
  }
};

// Export all middleware functions
module.exports = {
  TokenUtils,
  authorize,
  checkOwnership,
  checkBlogOwnership,
  authorizeDepartment,
  timeBasedAccess,
  ipBasedAccess,
  createRateLimit,
  featureFlag,
  securityHeaders,
  authLimiter,
  sensitiveOperationLimiter,
  PERMISSION_LEVELS,
  RESOURCE_TYPES,
  isAdmin,
  isOwnerOrAdmin,
  checkPermissions,
  requireAdmin,
};
