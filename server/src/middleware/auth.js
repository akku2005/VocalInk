const { StatusCodes } = require('http-status-codes');

const { UnauthorizedError, ForbiddenError, BadRequestError } = require('../utils/errors');
const JWTService = require('../services/JWTService');
const User = require('../models/user.model');
const Token = require('../models/token.model');
const crypto = require('crypto');
const logger = require('../utils/logger');

// Protect routes with enhanced security
const protect = async (req, res, next) => {
  logger.debug('Protect route accessed');
  try {
    // Development-only authentication bypass
    logger.debug('Protect route processing');

    if (process.env.DEV_AUTH_BYPASS === 'true') {
      const devUserId = process.env.DEV_AUTH_USER_ID || '000000000000000000000001';
      const devUserRole = process.env.DEV_AUTH_ROLE || req.headers['x-dev-user-role'] || 'admin';
      const devUserEmail = process.env.DEV_AUTH_EMAIL || 'devuser@example.com';

      req.user = {
        _id: devUserId,
        id: devUserId,
        email: devUserEmail,
        role: devUserRole,
        isVerified: true,
      };

      logger.warn('DEV_AUTH_BYPASS enabled - request authenticated as dev user', {
        userId: devUserId,
        email: devUserEmail,
        role: devUserRole,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
      });

      return next();
    }

    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      throw new UnauthorizedError('Not authorized to access this route');
    }

    // Check if token is blacklisted
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const isBlacklisted = await Token.isAccessTokenBlacklisted(tokenHash);
    
    if (isBlacklisted) {
      logger.warn('Blacklisted token access attempt', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
        deviceFingerprint: req.deviceFingerprint,
      });
      throw new UnauthorizedError('Token has been revoked');
    }

    // Verify token with device/IP binding validation
    const decoded = await JWTService.verifyAccessToken(token, req);
    
    // Check if user still exists and is active
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      logger.warn('Token verification failed - user not found', {
        userId: decoded.userId,
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      throw new UnauthorizedError('User not found');
    }

    // Check if user account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      logger.warn('Locked account access attempt', {
        userId: user._id,
        email: user.email,
        ip: req.ip,
        lockoutUntil: user.lockoutUntil,
      });
      throw new UnauthorizedError('Account is temporarily locked');
    }

    // Check if user is verified (skip in test environment)
    if (!user.isVerified && process.env.NODE_ENV !== 'test') {
      logger.warn('Unverified user access attempt', {
        userId: user._id,
        email: user.email,
        ip: req.ip,
      });
      throw new UnauthorizedError('Please verify your email before accessing this resource');
    }

    // Update user's last active timestamp
    user.lastActiveAt = new Date();
    await user.save().catch(error => {
      logger.error('Failed to update user last active timestamp:', error);
    });

    // Add user to request object
    req.user = user;
    
    // Log successful authentication
    logger.info('User authenticated successfully', {
      userId: user._id,
      email: user.email,
      role: user.role,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      deviceFingerprint: req.deviceFingerprint,
    });

    next();
  } catch (error) {
    logger.warn('Authentication failed', {
      error: error.message,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      deviceFingerprint: req.deviceFingerprint,
    });
    next(error);
  }
};

// Grant access to specific roles with enhanced logging
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Not authorized to access this route');
    }

    if (!roles.includes(req.user.role)) {
      logger.warn('Unauthorized role access attempt', {
        userId: req.user._id,
        email: req.user.email,
        userRole: req.user.role,
        requiredRoles: roles,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
      });
      throw new ForbiddenError('Not authorized to access this route');
    }

    logger.info('Role-based access granted', {
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });

    next();
  };
};

// Optional authentication with enhanced security
const optionalAuth = async (req, res, next) => {
  try {
    if (process.env.DEV_AUTH_BYPASS === 'true') {
      const devUserId = process.env.DEV_AUTH_USER_ID || '000000000000000000000001';
      const devUserRole = process.env.DEV_AUTH_ROLE || req.headers['x-dev-user-role'] || 'admin';
      const devUserEmail = process.env.DEV_AUTH_EMAIL || 'devuser@example.com';

      req.user = {
        _id: devUserId,
        id: devUserId,
        email: devUserEmail,
        role: devUserRole,
        isVerified: true,
      };

      logger.warn('DEV_AUTH_BYPASS enabled - optionalAuth attached dev user', {
        userId: devUserId,
        email: devUserEmail,
        role: devUserRole,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
      });

      return next();
    }

    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    // Check if token is blacklisted
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
    const isBlacklisted = await Token.isAccessTokenBlacklisted(tokenHash);
    
    if (isBlacklisted) {
      logger.warn('Optional auth - blacklisted token', {
        ip: req.ip,
        userAgent: req.headers['user-agent'],
      });
      return next();
    }

    const decoded = await JWTService.verifyAccessToken(token, req);
    const user = await User.findById(decoded.userId).select('-password');

    if (user && (!user.lockoutUntil || user.lockoutUntil <= new Date())) {
      req.user = user;
      
      // Update user's last active timestamp
      user.lastActiveAt = new Date();
      await user.save().catch(error => {
        logger.error('Failed to update user last active timestamp:', error);
      });
    }

    next();
  } catch (error) {
    // For optional auth, just continue without user
    logger.debug('Optional authentication failed, continuing without user', {
      error: error.message,
      ip: req.ip,
    });
    next();
  }
};

// Admin middleware with enhanced security
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Not authorized to access this route');
  }

  if (req.user.role !== 'admin') {
    logger.warn('Non-admin access attempt to admin route', {
      userId: req.user._id,
      email: req.user.email,
      role: req.user.role,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });
    throw new ForbiddenError('Admin access required');
  }

  logger.info('Admin access granted', {
    userId: req.user._id,
    email: req.user.email,
    ip: req.ip,
    url: req.originalUrl,
    method: req.method,
  });

  next();
};

// Owner or Admin middleware with enhanced security
const requireOwnerOrAdmin = async (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Not authorized to access this route');
  }

  if (req.user.role === 'admin') {
    logger.info('Admin access granted for owner/admin route', {
      userId: req.user._id,
      email: req.user.email,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });
    return next();
  }

  const resourceId = req.params.id || req.params.userId || req.body.userId;
  
  if (!resourceId) {
    logger.warn('Owner/admin check failed - no resource ID provided', {
      userId: req.user._id,
      email: req.user.email,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });
    throw new BadRequestError('Resource ID is required');
  }

  if (req.user.id !== resourceId) {
    logger.warn('Unauthorized access attempt to another user\'s resource', {
      userId: req.user._id,
      email: req.user.email,
      requestedResourceId: resourceId,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });
    throw new ForbiddenError('Not authorized to access this resource');
  }

  logger.info('Owner access granted', {
    userId: req.user._id,
    email: req.user.email,
    resourceId: resourceId,
    ip: req.ip,
    url: req.originalUrl,
    method: req.method,
  });

  next();
};

// Permission middleware with enhanced security
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Not authorized to access this route');
    }

    if (req.user.role === 'admin') {
      logger.info('Admin access granted for permission-based route', {
        userId: req.user._id,
        email: req.user.email,
        permission: permission,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
      });
      return next();
    }

    if (!req.user.permissions?.includes(permission)) {
      logger.warn('Insufficient permissions access attempt', {
        userId: req.user._id,
        email: req.user.email,
        userPermissions: req.user.permissions || [],
        requiredPermission: permission,
        ip: req.ip,
        url: req.originalUrl,
        method: req.method,
      });
      throw new ForbiddenError('Insufficient permissions');
    }

    logger.info('Permission-based access granted', {
      userId: req.user._id,
      email: req.user.email,
      permission: permission,
      ip: req.ip,
      url: req.originalUrl,
      method: req.method,
    });

    next();
  };
};

// Enhanced rate limiting middleware for authentication
const authRateLimit = (req, res, next) => {
  // This would integrate with your rate limiting system
  // For now, we'll just pass through
  next();
};

// Device fingerprint validation middleware
const validateDeviceFingerprint = (req, res, next) => {
  if (process.env.ENABLE_DEVICE_FINGERPRINTING !== 'true') {
    return next();
  }

  if (!req.deviceFingerprint) {
    logger.warn('Missing device fingerprint', {
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      url: req.originalUrl,
      method: req.method,
    });
    
    // In strict mode, reject requests without device fingerprint
    if (process.env.STRICT_DEVICE_FINGERPRINTING === 'true') {
      return res.status(400).json({
        success: false,
        message: 'Device fingerprint required',
        code: 'DEVICE_FINGERPRINT_REQUIRED',
      });
    }
  }

  next();
};

// Session validation middleware
const validateSession = async (req, res, next) => {
  if (!req.user) {
    return next();
  }

  try {
    // Check if user session is still valid
    const user = await User.findById(req.user._id);
    
    if (!user) {
      throw new UnauthorizedError('User session invalid');
    }

    // Check if user account is locked
    if (user.lockoutUntil && user.lockoutUntil > new Date()) {
      throw new UnauthorizedError('Account is temporarily locked');
    }

    // Check if user is still verified (skip in test environment)
    if (!user.isVerified && process.env.NODE_ENV !== 'test') {
      throw new UnauthorizedError('Email verification required');
    }

    // Update last active timestamp
    user.lastActiveAt = new Date();
    await user.save().catch(error => {
      logger.error('Failed to update user last active timestamp:', error);
    });

    next();
  } catch (error) {
    logger.warn('Session validation failed', {
      userId: req.user._id,
      error: error.message,
      ip: req.ip,
    });
    next(error);
  }
};

// Enhanced security middleware for sensitive operations
const requireSecureConnection = (req, res, next) => {
  if (process.env.NODE_ENV === 'production' && process.env.FORCE_HTTPS === 'true') {
    if (req.headers['x-forwarded-proto'] !== 'https' && req.protocol !== 'https') {
      logger.warn('Insecure connection attempt to secure endpoint', {
        ip: req.ip,
        protocol: req.protocol,
        xForwardedProto: req.headers['x-forwarded-proto'],
        url: req.originalUrl,
        method: req.method,
      });
      
      return res.status(403).json({
        success: false,
        message: 'HTTPS connection required',
        code: 'HTTPS_REQUIRED',
      });
    }
  }

  next();
};

// Enhanced logging middleware for authentication events
const logAuthEvent = (eventType) => {
  return (req, res, next) => {
    const logData = {
      event: eventType,
      userId: req.user?.id || 'anonymous',
      email: req.user?.email || 'anonymous',
      role: req.user?.role || 'anonymous',
      ip: req.ip,
      userAgent: req.headers['user-agent'],
      deviceFingerprint: req.deviceFingerprint,
      url: req.originalUrl,
      method: req.method,
      timestamp: new Date().toISOString(),
    };

    logger.info('Authentication event', logData);
    next();
  };
};

module.exports = {
  protect,
  authorize,
  optionalAuth,
  requireAdmin,
  requireOwnerOrAdmin,
  requirePermission,
  authRateLimit,
  validateDeviceFingerprint,
  validateSession,
  requireSecureConnection,
  logAuthEvent,
};
