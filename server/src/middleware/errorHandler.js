const { StatusCodes } = require('http-status-codes');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');

const errorHandler = (err, req, res, next) => {
  logger.error('Error:', err);

  // Default error
  let error = {
    success: false,
    message: err.message || 'Internal server error',
    statusCode: err.statusCode || StatusCodes.INTERNAL_SERVER_ERROR
  };

  // Handle specific error types
  if (err instanceof AppError) {
    error = {
      success: false,
      message: err.message,
      statusCode: err.statusCode
    };
  } else if (err.name === 'ValidationError') {
    // Mongoose validation error
    error = {
      success: false,
      message: 'Validation Error',
      errors: Object.values(err.errors).map(e => ({
        field: e.path,
        message: e.message
      })),
      statusCode: StatusCodes.BAD_REQUEST
    };
  } else if (err.name === 'CastError') {
    // Mongoose cast error (invalid ID)
    error = {
      success: false,
      message: `Invalid ${err.path}: ${err.value}`,
      statusCode: StatusCodes.BAD_REQUEST
    };
  } else if (err.code === 11000) {
    // Mongoose duplicate key error
    const field = Object.keys(err.keyValue)[0];
    error = {
      success: false,
      message: `Duplicate value for ${field}. Please use another value.`,
      statusCode: StatusCodes.CONFLICT
    };
  } else if (err.name === 'JsonWebTokenError') {
    error = {
      success: false,
      message: 'Invalid token. Please log in again.',
      statusCode: StatusCodes.UNAUTHORIZED
    };
  } else if (err.name === 'TokenExpiredError') {
    error = {
      success: false,
      message: 'Token expired. Please log in again.',
      statusCode: StatusCodes.UNAUTHORIZED
    };
  }

  // Send error response
  res.status(error.statusCode).json(error);
};

module.exports = errorHandler;
