const { StatusCodes } = require('http-status-codes');

const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

// Enhanced error handler with structured logging
const errorHandler = (err, req, res, next) => {
  // Create structured error log
  const errorLog = {
    timestamp: new Date().toISOString(),
    error: {
      name: err.name,
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
      code: err.code,
      statusCode: err.statusCode,
    },
    request: {
      method: req.method,
      url: req.originalUrl,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      userId: req.user?.id || 'anonymous',
      userRole: req.user?.role || 'anonymous',
      deviceFingerprint: req.deviceFingerprint,
      headers: {
        'content-type': req.get('content-type'),
        'accept': req.get('accept'),
        'x-forwarded-for': req.get('x-forwarded-for'),
        'x-real-ip': req.get('x-real-ip'),
      },
    },
    context: {
      environment: process.env.NODE_ENV,
      version: process.env.APP_VERSION,
      userAgent: req.get('User-Agent'),
    },
  };

  // Log error with appropriate level
  if (err.statusCode >= 500) {
    logger.error('Server error:', errorLog);
  } else if (err.statusCode >= 400) {
    logger.warn('Client error:', errorLog);
  } else {
    logger.info('Application error:', errorLog);
  }

  // Default error response
  let error = {
    success: false,
    message: err.message || 'Internal server error',
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Handle specific error types
  if (err instanceof AppError) {
    logger.warn(`AppError: ${err.message} (${err.statusCode})`);
    error = {
      success: false,
      message: err.message,
      statusCode: err.statusCode,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
    };
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    logger.warn('Validation Error:', {
      ...errorLog,
      validationErrors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
        value: e.value,
      })),
    });
    
    error = {
      success: false,
      message: 'Validation Error',
      statusCode: StatusCodes.BAD_REQUEST,
      errors: Object.values(err.errors).map((e) => ({
        field: e.path,
        message: e.message,
        value: e.value,
      })),
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    };
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ID)
    logger.warn(`Cast Error: Invalid ${err.path}: ${err.value}`, errorLog);
    error = {
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      statusCode: StatusCodes.BAD_REQUEST,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    };
  } else if (err.code === 11000) {
    // Mongoose duplicate key error
    const field = Object.keys(err.keyValue)[0];
    const value = err.keyValue[field];
    logger.warn(`Duplicate key error for field: ${field}`, {
      ...errorLog,
      duplicateField: field,
      duplicateValue: value,
    });
    
    error = {
      success: false,
      message: `${field} already exists with value: ${value}`,
      statusCode: StatusCodes.CONFLICT,
      field: field,
      value: value,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    };
  } else if (err.name === 'JsonWebTokenError') {
    logger.warn('JWT Error: Invalid token', errorLog);
    error = {
      success: false,
      message: 'Invalid token. Please log in again.',
      statusCode: StatusCodes.UNAUTHORIZED,
      code: 'INVALID_TOKEN',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    };
  } else if (err.name === 'TokenExpiredError') {
    logger.warn('JWT Error: Token expired', errorLog);
    error = {
      success: false,
      message: 'Token expired. Please log in again.',
      statusCode: StatusCodes.UNAUTHORIZED,
      code: 'TOKEN_EXPIRED',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    };
  } else if (err.name === 'NotBeforeError') {
    logger.warn('JWT Error: Token not active', errorLog);
    error = {
      success: false,
      message: 'Token not active yet.',
      statusCode: StatusCodes.UNAUTHORIZED,
      code: 'TOKEN_NOT_ACTIVE',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    };
  } else if (err.name === 'MongoError') {
    // MongoDB specific errors
    logger.error('MongoDB Error:', {
      ...errorLog,
      mongoCode: err.code,
      mongoMessage: err.message,
    });
    
    error = {
      success: false,
      message: 'Database operation failed',
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      code: 'DATABASE_ERROR',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      ...(process.env.NODE_ENV === 'development' && { 
        mongoCode: err.code,
        mongoMessage: err.message 
      }),
    };
  } else if (err.name === 'SyntaxError' && err.status === 400) {
    // JSON parsing errors
    logger.warn('JSON Syntax Error:', errorLog);
    error = {
      success: false,
      message: 'Invalid JSON format',
      statusCode: StatusCodes.BAD_REQUEST,
      code: 'INVALID_JSON',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    };
  } else if (err.name === 'MulterError') {
    // File upload errors
    logger.warn('File Upload Error:', {
      ...errorLog,
      multerCode: err.code,
      multerField: err.field,
    });
    
    error = {
      success: false,
      message: `File upload error: ${err.message}`,
      statusCode: StatusCodes.BAD_REQUEST,
      code: 'FILE_UPLOAD_ERROR',
      field: err.field,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    };
  } else if (err.name === 'RateLimitError') {
    // Rate limiting errors
    logger.warn('Rate Limit Error:', errorLog);
    error = {
      success: false,
      message: 'Too many requests',
      statusCode: StatusCodes.TOO_MANY_REQUESTS,
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: err.retryAfter,
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    };
  } else if (err.name === 'TimeoutError') {
    // Request timeout errors
    logger.error('Timeout Error:', errorLog);
    error = {
      success: false,
      message: 'Request timeout',
      statusCode: StatusCodes.REQUEST_TIMEOUT,
      code: 'REQUEST_TIMEOUT',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    };
  } else if (err.name === 'NetworkError') {
    // Network errors
    logger.error('Network Error:', errorLog);
    error = {
      success: false,
      message: 'Network error occurred',
      statusCode: StatusCodes.SERVICE_UNAVAILABLE,
      code: 'NETWORK_ERROR',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
    };
  } else {
    // Generic server errors
    logger.error('Unhandled error:', errorLog);
    error = {
      success: false,
      message: process.env.NODE_ENV === 'development' ? err.message : 'Internal server error',
      statusCode: StatusCodes.INTERNAL_SERVER_ERROR,
      code: 'INTERNAL_SERVER_ERROR',
      timestamp: new Date().toISOString(),
      path: req.originalUrl,
      method: req.method,
      ...(process.env.NODE_ENV === 'development' && { 
        stack: err.stack,
        name: err.name,
        code: err.code 
      }),
    };
  }

  // Add request ID if available
  if (req.id) {
    error.requestId = req.id;
  }

  // Add correlation ID if available
  if (req.headers['x-correlation-id']) {
    error.correlationId = req.headers['x-correlation-id'];
  }

  // Send error response
  res.status(error.statusCode).json(error);
};

// Async error wrapper for route handlers
const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// Error boundary for unhandled promise rejections
const handleUnhandledRejection = (reason, promise) => {
  logger.error('Unhandled Promise Rejection:', {
    timestamp: new Date().toISOString(),
    reason: reason,
    promise: promise,
    stack: reason.stack,
  });
  
  // In production, you might want to exit the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
};

// Error boundary for uncaught exceptions
const handleUncaughtException = (error) => {
  logger.error('Uncaught Exception:', {
    timestamp: new Date().toISOString(),
    error: {
      name: error.name,
      message: error.message,
      stack: error.stack,
    },
  });
  
  // In production, you might want to exit the process
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
};

// Setup global error handlers
const setupErrorHandlers = () => {
  process.on('unhandledRejection', handleUnhandledRejection);
  process.on('uncaughtException', handleUncaughtException);
};

// Error response formatter
const formatErrorResponse = (error, req) => {
  const baseError = {
    success: false,
    message: error.message || 'An error occurred',
    statusCode: error.statusCode || 500,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
  };

  // Add development-specific information
  if (process.env.NODE_ENV === 'development') {
    baseError.stack = error.stack;
    baseError.name = error.name;
    baseError.code = error.code;
  }

  return baseError;
};

// Validation error formatter
const formatValidationError = (errors) => {
  return {
    success: false,
    message: 'Validation failed',
    statusCode: 400,
    errors: errors.map(error => ({
      field: error.path || error.param,
      message: error.msg || error.message,
      value: error.value,
    })),
  };
};

module.exports = {
  errorHandler,
  asyncHandler,
  handleUnhandledRejection,
  handleUncaughtException,
  setupErrorHandlers,
  formatErrorResponse,
  formatValidationError,
};
