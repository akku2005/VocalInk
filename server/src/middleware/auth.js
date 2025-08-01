const { StatusCodes } = require('http-status-codes');

const { UnauthorizedError, ForbiddenError } = require('../utils/errors');
const JWTService = require('../services/JWTService');
const User = require('../models/user.model');
const Token = require('../models/token.model');
const crypto = require('crypto');

// Protect routes
const protect = async (req, res, next) => {
  try {
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
      throw new UnauthorizedError('Token has been revoked');
    }

    const decoded = await JWTService.verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (!user) {
      throw new UnauthorizedError('Not authorized to access this route');
    }

    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Grant access to specific roles
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      throw new ForbiddenError('Not authorized to access this route');
    }
    next();
  };
};

// Optional authentication
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next();
    }

    const decoded = await JWTService.verifyAccessToken(token);
    const user = await User.findById(decoded.userId);

    if (user) {
      req.user = user;
    }

    next();
  } catch (error) {
    next();
  }
};

// Admin middleware
const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'admin') {
    throw new ForbiddenError('Not authorized to access this route');
  }
  next();
};

// Owner or Admin middleware
const requireOwnerOrAdmin = async (req, res, next) => {
  if (!req.user) {
    throw new UnauthorizedError('Not authorized to access this route');
  }

  if (req.user.role === 'admin') {
    return next();
  }

  if (req.user.id !== req.params.id) {
    throw new ForbiddenError('Not authorized to access this route');
  }

  next();
};

// Permission middleware
const requirePermission = (permission) => {
  return (req, res, next) => {
    if (!req.user) {
      throw new UnauthorizedError('Not authorized to access this route');
    }

    if (req.user.role === 'admin') {
      return next();
    }

    if (!req.user.permissions?.includes(permission)) {
      throw new ForbiddenError('Not authorized to access this route');
    }

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
};
