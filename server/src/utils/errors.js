const AppError = require('./AppError');

class ValidationError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'ValidationError';
  }
}

class UnauthorizedError extends AppError {
  constructor(message) {
    super(message, 401);
    this.name = 'UnauthorizedError';
  }
}

class ConflictError extends AppError {
  constructor(message) {
    super(message, 409);
    this.name = 'ConflictError';
  }
}

class BadRequestError extends AppError {
  constructor(message) {
    super(message, 400);
    this.name = 'BadRequestError';
  }
}

module.exports = {
  ValidationError,
  UnauthorizedError,
  ConflictError,
  BadRequestError,
};
