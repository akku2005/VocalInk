const { body, param, query, validationResult } = require('express-validator');
const Joi = require('joi');
const { StatusCodes } = require('http-status-codes');
const { ObjectId } = require('mongodb');

const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const { BadRequestError, ValidationError } = require('../utils/errors');
const { sanitizeInput, isDisposableEmailDomain } = require('../utils/sanitize');

// Validation Constants
const VALIDATION = {
  USER: {
    ROLES: ['user', 'admin', 'manager', 'supervisor'],
    STATUS: ['active', 'inactive', 'suspended'],
    MIN_PASSWORD_LENGTH: 8,
    MAX_NAME_LENGTH: 100,
    MIN_NAME_LENGTH: 2,
  },
  PROJECT: {
    STATUS: ['active', 'completed', 'on-hold', 'cancelled'],
    MEMBER_ROLES: ['member', 'lead', 'manager'],
  },
  TIMESHEET: {
    MAX_HOURS_PER_DAY: 24,
    MIN_TASK_LENGTH: 1,
    MAX_TASK_LENGTH: 1000,
    MAX_REJECTION_REASON_LENGTH: 1000,
    MIN_REJECTION_REASON_LENGTH: 10,
  },
  COMMON: {
    MIN_DESCRIPTION_LENGTH: 1,
    MAX_DESCRIPTION_LENGTH: 2000,
    DATE_FORMAT: 'YYYY-MM-DD',
  },
};

// Custom Validators
const customValidators = {
  password: (value) => {
    const regex =
      /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!regex.test(value)) {
      throw new Error(
        `Password must be at least ${VALIDATION.USER.MIN_PASSWORD_LENGTH} characters ` +
          'and contain at least one uppercase letter, one lowercase letter, one number, and one special character'
      );
    }
    return true;
  },
  dateRange: (endDate, { req }) => {
    const startDate = new Date(req.body.weekStartDate);
    const end = new Date(endDate);
    if (end <= startDate) {
      throw new Error('End date must be after start date');
    }
    return true;
  },
  mongoId: (value) => {
    if (!ObjectId.isValid(value)) {
      throw new Error('Invalid ID format');
    }
    return true;
  },
  futureDate: (value) => {
    const date = new Date(value);
    if (date < new Date()) {
      throw new Error('Date must be in the future');
    }
    return true;
  },
};

// Validation Error Formatter
const formatValidationErrors = (errors) => {
  return errors.array().map((error) => ({
    field: error.path,
    message: error.msg,
    value: error.value,
    location: error.location,
  }));
};

// Validation Error Handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Validation failed', {
      path: req.path,
      method: req.method,
      errors: formatValidationErrors(errors),
    });

    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: 'Validation failed',
      errors: formatValidationErrors(errors),
    });
  }
  next();
};

// Validation Middleware Wrapper
const validateExpress = (validations) => {
  return async (req, res, next) => {
    try {
      // Run all validations
      await Promise.all(validations.map((validation) => validation.run(req)));

      // Check for validation errors
      handleValidationErrors(req, res, next);
    } catch (error) {
      logger.error('Validation middleware error', {
        path: req.path,
        method: req.method,
        error: error.message,
      });
      next(
        new AppError(
          'Validation error occurred',
          StatusCodes.INTERNAL_SERVER_ERROR
        )
      );
    }
  };
};

// Joi Schema Validation
const validateSchema = (schema) => {
  return (req, res, next) => {
    const { error } = schema.validate(req.body, {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      throw new BadRequestError(errorMessage);
    }

    next();
  };
};

// Simplified Request Validation
const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const error = new AppError('Validation failed', 400);
    error.errors = errors.array();
    return next(error);
  }
  next();
};

// Add a custom sanitizer to all string fields in userValidations
const sanitizeField = (field) => body(field).customSanitizer(sanitizeInput);

// User Validations
const userValidations = {
  register: validateExpress([
    sanitizeField('name')
      .notEmpty()
      .withMessage('Name is required')
      .isLength({
        min: VALIDATION.USER.MIN_NAME_LENGTH,
        max: VALIDATION.USER.MAX_NAME_LENGTH,
      })
      .withMessage(
        `Name must be between ${VALIDATION.USER.MIN_NAME_LENGTH} and ${VALIDATION.USER.MAX_NAME_LENGTH} characters`
      ),

    sanitizeField('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail()
      .custom(async (email) => {
        if (isDisposableEmailDomain(email)) {
          throw new Error(
            'Disposable/temporary email addresses are not allowed'
          );
        }
        return true;
      }),

    sanitizeField('password')
      .notEmpty()
      .withMessage('Password is required')
      .custom(customValidators.password),

    body('role')
      .optional()
      .isIn(VALIDATION.USER.ROLES)
      .withMessage(`Role must be one of: ${VALIDATION.USER.ROLES.join(', ')}`),

    body('department')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Department cannot be empty'),
  ]),

  login: validateExpress([
    sanitizeField('email')
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),

    sanitizeField('password').notEmpty().withMessage('Password is required'),
  ]),

  update: validateExpress([
    param('id').custom(customValidators.mongoId),

    body('firstName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('First name cannot be empty')
      .isLength({
        min: VALIDATION.USER.MIN_NAME_LENGTH,
        max: VALIDATION.USER.MAX_NAME_LENGTH,
      })
      .withMessage(
        `First name must be between ${VALIDATION.USER.MIN_NAME_LENGTH} and ${VALIDATION.USER.MAX_NAME_LENGTH} characters`
      ),

    body('lastName')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Last name cannot be empty')
      .isLength({
        min: VALIDATION.USER.MIN_NAME_LENGTH,
        max: VALIDATION.USER.MAX_NAME_LENGTH,
      })
      .withMessage(
        `Last name must be between ${VALIDATION.USER.MIN_NAME_LENGTH} and ${VALIDATION.USER.MAX_NAME_LENGTH} characters`
      ),

    body('email')
      .optional()
      .trim()
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),

    body('role')
      .optional()
      .isIn(VALIDATION.USER.ROLES)
      .withMessage(`Role must be one of: ${VALIDATION.USER.ROLES.join(', ')}`),

    body('status')
      .optional()
      .isIn(VALIDATION.USER.STATUS)
      .withMessage(
        `Status must be one of: ${VALIDATION.USER.STATUS.join(', ')}`
      ),

    body('isActive')
      .optional()
      .isBoolean()
      .withMessage('isActive must be a boolean value'),
  ]),

  changePassword: validateExpress([
    body('currentPassword')
      .trim()
      .notEmpty()
      .withMessage('Current password is required'),

    body('newPassword')
      .trim()
      .notEmpty()
      .withMessage('New password is required')
      .custom(customValidators.password),
  ]),

  forgotPassword: validateExpress([
    body('email')
      .trim()
      .notEmpty()
      .withMessage('Email is required')
      .isEmail()
      .withMessage('Please enter a valid email')
      .normalizeEmail(),
  ]),

  resetPassword: validateExpress([
    body('token').trim().notEmpty().withMessage('Reset token is required'),

    body('newPassword')
      .notEmpty()
      .withMessage('New password is required')
      .custom(customValidators.password),
  ]),

  verifyEmail: validateExpress([
    body('code')
      .trim()
      .notEmpty()
      .withMessage('Verification code is required')
      .isLength({ min: 6, max: 6 })
      .withMessage('Verification code must be 6 digits')
      .isNumeric()
      .withMessage('Verification code must contain only numbers'),
  ]),

  updateProfile: [
    sanitizeField('name')
      .optional()
      .isLength({
        min: VALIDATION.USER.MIN_NAME_LENGTH,
        max: VALIDATION.USER.MAX_NAME_LENGTH,
      })
      .withMessage(
        `Name must be between ${VALIDATION.USER.MIN_NAME_LENGTH} and ${VALIDATION.USER.MAX_NAME_LENGTH} characters`
      ),
    sanitizeField('mobile')
      .optional()
      .customSanitizer((value) => {
        if (!value) return value;
        // Remove all spaces and dashes
        let num = value.replace(/\s|-/g, '');
        // If already starts with +91, return as is
        if (num.startsWith('+91')) return num;
        // If starts with 91, add +
        if (num.startsWith('91')) return '+' + num;
        // If starts with 0, remove 0 and add +91
        if (num.startsWith('0')) return '+91' + num.slice(1);
        // Otherwise, add +91
        return '+91' + num;
      })
      .matches(/^\+91[6-9][0-9]{9}$/)
      .withMessage(
        'Please provide a valid Indian mobile number (10 digits, starts with 6-9)'
      ),
    body('gender')
      .optional()
      .isIn(['male', 'female', 'other', 'prefer_not_to_say'])
      .withMessage(
        'Gender must be one of: male, female, other, prefer_not_to_say'
      ),
    body('address')
      .optional()
      .isObject()
      .withMessage('Address must be an object'),
    body('address.street').optional().isString(),
    body('address.city').optional().isString(),
    body('address.state').optional().isString(),
    body('address.country').optional().isString(),
    body('address.zip').optional().isString(),
    body('profilePicture').optional().isString(),
    body('company').optional().isString(),
    body('jobTitle').optional().isString(),
    body('website').optional().isString(),
    body('linkedin').optional().isString(),
    body('bio').optional().isString(),
    body('birthday').optional().isISO8601().toDate(),
  ],
};

// Project Validations
const projectValidations = {
  create: validateExpress([
    body('name')
      .trim()
      .notEmpty()
      .withMessage('Project name is required')
      .isLength({ min: 3, max: 100 })
      .withMessage('Project name must be between 3 and 100 characters'),

    body('description')
      .optional()
      .trim()
      .isLength({
        min: VALIDATION.COMMON.MIN_DESCRIPTION_LENGTH,
        max: VALIDATION.COMMON.MAX_DESCRIPTION_LENGTH,
      })
      .withMessage(
        `Description must be between ${VALIDATION.COMMON.MIN_DESCRIPTION_LENGTH} and ${VALIDATION.COMMON.MAX_DESCRIPTION_LENGTH} characters`
      ),

    body('status')
      .optional()
      .isIn(VALIDATION.PROJECT.STATUS)
      .withMessage(
        `Status must be one of: ${VALIDATION.PROJECT.STATUS.join(', ')}`
      ),

    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),

    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom(customValidators.dateRange),
  ]),

  update: validateExpress([
    param('id').custom(customValidators.mongoId),

    body('name')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Project name cannot be empty')
      .isLength({ min: 3, max: 100 })
      .withMessage('Project name must be between 3 and 100 characters'),

    body('description')
      .optional()
      .trim()
      .isLength({
        min: VALIDATION.COMMON.MIN_DESCRIPTION_LENGTH,
        max: VALIDATION.COMMON.MAX_DESCRIPTION_LENGTH,
      })
      .withMessage(
        `Description must be between ${VALIDATION.COMMON.MIN_DESCRIPTION_LENGTH} and ${VALIDATION.COMMON.MAX_DESCRIPTION_LENGTH} characters`
      ),

    body('status')
      .optional()
      .isIn(VALIDATION.PROJECT.STATUS)
      .withMessage(
        `Status must be one of: ${VALIDATION.PROJECT.STATUS.join(', ')}`
      ),

    body('startDate')
      .optional()
      .isISO8601()
      .withMessage('Start date must be a valid date'),

    body('endDate')
      .optional()
      .isISO8601()
      .withMessage('End date must be a valid date')
      .custom(customValidators.dateRange),
  ]),

  addMember: validateExpress([
    param('id').custom(customValidators.mongoId),

    body('userId')
      .custom(customValidators.mongoId)
      .withMessage('Invalid user ID'),

    body('role')
      .isIn(VALIDATION.PROJECT.MEMBER_ROLES)
      .withMessage(
        `Role must be one of: ${VALIDATION.PROJECT.MEMBER_ROLES.join(', ')}`
      ),
  ]),

  removeMember: validateExpress([
    param('id').custom(customValidators.mongoId),

    param('userId')
      .custom(customValidators.mongoId)
      .withMessage('Invalid user ID'),
  ]),
};

// Timesheet Validations
const timesheetValidations = {
  create: validateExpress([
    body('weekStartDate')
      .isISO8601()
      .withMessage('Week start date must be a valid date'),

    body('entries')
      .isArray({ min: 1 })
      .withMessage('Entries must be a non-empty array'),

    body('entries.*.date')
      .isISO8601()
      .withMessage('Entry date must be a valid date'),

    body('entries.*.hours')
      .isFloat({ min: 0, max: VALIDATION.TIMESHEET.MAX_HOURS_PER_DAY })
      .withMessage(
        `Entry hours must be between 0 and ${VALIDATION.TIMESHEET.MAX_HOURS_PER_DAY}`
      ),

    body('entries.*.project')
      .custom(customValidators.mongoId)
      .withMessage('Entry project ID is invalid'),

    body('entries.*.task')
      .trim()
      .notEmpty()
      .withMessage('Entry task description is required')
      .isLength({
        min: VALIDATION.TIMESHEET.MIN_TASK_LENGTH,
        max: VALIDATION.TIMESHEET.MAX_TASK_LENGTH,
      })
      .withMessage(
        `Entry task description must be between ${VALIDATION.TIMESHEET.MIN_TASK_LENGTH} and ${VALIDATION.TIMESHEET.MAX_TASK_LENGTH} characters`
      ),

    body('entries.*.description')
      .optional()
      .trim()
      .isLength({ max: VALIDATION.COMMON.MAX_DESCRIPTION_LENGTH })
      .withMessage(
        `Entry description must be at most ${VALIDATION.COMMON.MAX_DESCRIPTION_LENGTH} characters`
      ),
  ]),

  update: validateExpress([
    param('id').custom(customValidators.mongoId),

    body('entries')
      .optional()
      .isArray({ min: 1 })
      .withMessage('Entries must be a non-empty array'),

    body('entries.*.date')
      .optional()
      .isISO8601()
      .withMessage('Entry date must be a valid date'),

    body('entries.*.hours')
      .optional()
      .isFloat({ min: 0, max: VALIDATION.TIMESHEET.MAX_HOURS_PER_DAY })
      .withMessage(
        `Entry hours must be between 0 and ${VALIDATION.TIMESHEET.MAX_HOURS_PER_DAY}`
      ),

    body('entries.*.project')
      .optional()
      .custom(customValidators.mongoId)
      .withMessage('Entry project ID is invalid'),

    body('entries.*.task')
      .optional()
      .trim()
      .notEmpty()
      .withMessage('Entry task description cannot be empty')
      .isLength({
        min: VALIDATION.TIMESHEET.MIN_TASK_LENGTH,
        max: VALIDATION.TIMESHEET.MAX_TASK_LENGTH,
      })
      .withMessage(
        `Entry task description must be between ${VALIDATION.TIMESHEET.MIN_TASK_LENGTH} and ${VALIDATION.TIMESHEET.MAX_TASK_LENGTH} characters`
      ),

    body('entries.*.description')
      .optional()
      .trim()
      .isLength({ max: VALIDATION.COMMON.MAX_DESCRIPTION_LENGTH })
      .withMessage(
        `Entry description must be at most ${VALIDATION.COMMON.MAX_DESCRIPTION_LENGTH} characters`
      ),

    body('status')
      .optional()
      .isIn(['pending', 'approved', 'rejected'])
      .withMessage('Status must be one of: pending, approved, rejected'),

    body('rejectionReason')
      .optional()
      .trim()
      .isLength({
        min: VALIDATION.TIMESHEET.MIN_REJECTION_REASON_LENGTH,
        max: VALIDATION.TIMESHEET.MAX_REJECTION_REASON_LENGTH,
      })
      .withMessage(
        `Rejection reason must be between ${VALIDATION.TIMESHEET.MIN_REJECTION_REASON_LENGTH} and ${VALIDATION.TIMESHEET.MAX_REJECTION_REASON_LENGTH} characters`
      ),
  ]),

  approve: validateExpress([param('id').custom(customValidators.mongoId)]),

  reject: validateExpress([
    param('id').custom(customValidators.mongoId),

    body('reason')
      .trim()
      .notEmpty()
      .withMessage('Rejection reason is required')
      .isLength({
        min: VALIDATION.TIMESHEET.MIN_REJECTION_REASON_LENGTH,
        max: VALIDATION.TIMESHEET.MAX_REJECTION_REASON_LENGTH,
      })
      .withMessage(
        `Rejection reason must be between ${VALIDATION.TIMESHEET.MIN_REJECTION_REASON_LENGTH} and ${VALIDATION.TIMESHEET.MAX_REJECTION_REASON_LENGTH} characters`
      ),
  ]),
};

const validate = (schema, property = 'body') => {
  return (req, res, next) => {
    const data = req[property];
    const { error, value } = schema.validate(data, {
      abortEarly: false,
      stripUnknown: true,
      convert: true
    });

    if (error) {
      const errorMessage = error.details
        .map(detail => detail.message)
        .join(', ');
      
      return next(new ValidationError(errorMessage));
    }

    // Replace the request data with validated data
    req[property] = value;
    next();
  };
};

// Export all validation functions and constants
module.exports = {
  VALIDATION,
  customValidators,
  validate,
  validateExpress,
  validateSchema,
  validateRequest,
  formatValidationErrors,
  handleValidationErrors,
  userValidations,
  projectValidations,
  timesheetValidations
};
