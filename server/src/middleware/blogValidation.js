const { body, param, query, validationResult } = require('express-validator');
const { StatusCodes } = require('http-status-codes');
const logger = require('../utils/logger');

// Validation constants
const BLOG_VALIDATION = {
  TITLE: {
    MIN_LENGTH: 1,
    MAX_LENGTH: 200
  },
  CONTENT: {
  },
  SUMMARY: {
    MAX_LENGTH: 500
  },
  TAGS: {
    MAX_COUNT: 10,
    MAX_LENGTH: 50
  },
  MOODS: ['Motivational', 'Thoughtful', 'Educational', 'Humorous', 'Inspirational', 'Technical', 'Other']
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  return errors.array().map((error) => ({
    field: error.path,
    message: error.msg,
    value: error.value,
    location: error.location,
  }));
};

// Validation error handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    logger.warn('Blog validation failed', {
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

// Blog creation validation
const validateCreateBlog = [
  body('title')
    .trim()
    .isLength({ 
      min: BLOG_VALIDATION.TITLE.MIN_LENGTH, 
      max: BLOG_VALIDATION.TITLE.MAX_LENGTH 
    })
    .withMessage(`Title must be between ${BLOG_VALIDATION.TITLE.MIN_LENGTH} and ${BLOG_VALIDATION.TITLE.MAX_LENGTH} characters`),
  
  body('content')
    .trim(),
  
  body('summary')
    .optional()
    .trim()
    .isLength({ max: BLOG_VALIDATION.SUMMARY.MAX_LENGTH })
    .withMessage(`Summary must not exceed ${BLOG_VALIDATION.SUMMARY.MAX_LENGTH} characters`),
  
  body('tags')
    .optional()
    .isArray({ max: BLOG_VALIDATION.TAGS.MAX_COUNT })
    .withMessage(`Maximum ${BLOG_VALIDATION.TAGS.MAX_COUNT} tags allowed`),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: BLOG_VALIDATION.TAGS.MAX_LENGTH })
    .withMessage(`Each tag must be between 1 and ${BLOG_VALIDATION.TAGS.MAX_LENGTH} characters`),
  
  body('mood')
    .optional()
    .isIn(BLOG_VALIDATION.MOODS)
    .withMessage(`Mood must be one of: ${BLOG_VALIDATION.MOODS.join(', ')}`),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'private'])
    .withMessage('Status must be draft, published, or private'),
  
  body('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language code must be between 2 and 5 characters'),
  
  body('coverImage')
    .optional()
    .isURL()
    .withMessage('Cover image must be a valid URL'),
  
  body('seriesId')
    .optional()
    .isMongoId()
    .withMessage('Series ID must be a valid MongoDB ObjectId'),
  
  handleValidationErrors
];

// Blog update validation
const validateUpdateBlog = [
  param('id')
    .isMongoId()
    .withMessage('Invalid blog ID format'),
  
  body('title')
    .optional()
    .trim()
    .isLength({ 
      min: BLOG_VALIDATION.TITLE.MIN_LENGTH, 
      max: BLOG_VALIDATION.TITLE.MAX_LENGTH 
    })
    .withMessage(`Title must be between ${BLOG_VALIDATION.TITLE.MIN_LENGTH} and ${BLOG_VALIDATION.TITLE.MAX_LENGTH} characters`),
  
  body('content')
    .optional()
    .trim(),
  
  body('summary')
    .optional()
    .trim()
    .isLength({ max: BLOG_VALIDATION.SUMMARY.MAX_LENGTH })
    .withMessage(`Summary must not exceed ${BLOG_VALIDATION.SUMMARY.MAX_LENGTH} characters`),
  
  body('tags')
    .optional()
    .isArray({ max: BLOG_VALIDATION.TAGS.MAX_COUNT })
    .withMessage(`Maximum ${BLOG_VALIDATION.TAGS.MAX_COUNT} tags allowed`),
  
  body('tags.*')
    .optional()
    .trim()
    .isLength({ min: 1, max: BLOG_VALIDATION.TAGS.MAX_LENGTH })
    .withMessage(`Each tag must be between 1 and ${BLOG_VALIDATION.TAGS.MAX_LENGTH} characters`),
  
  body('mood')
    .optional()
    .isIn(BLOG_VALIDATION.MOODS)
    .withMessage(`Mood must be one of: ${BLOG_VALIDATION.MOODS.join(', ')}`),
  
  body('status')
    .optional()
    .isIn(['draft', 'published', 'private'])
    .withMessage('Status must be draft, published, or private'),
  
  body('language')
    .optional()
    .isLength({ min: 2, max: 5 })
    .withMessage('Language code must be between 2 and 5 characters'),
  
  body('coverImage')
    .optional()
    .isURL()
    .withMessage('Cover image must be a valid URL'),
  
  body('seriesId')
    .optional()
    .isMongoId()
    .withMessage('Series ID must be a valid MongoDB ObjectId'),
  
  handleValidationErrors
];

// Blog ID validation
const validateBlogId = [
  param('id')
    .isMongoId()
    .withMessage('Invalid blog ID format'),
  
  handleValidationErrors
];

// Blog slug validation
const validateBlogSlug = [
  param('slug')
    .trim()
    .isLength({ min: 1, max: 200 })
    .withMessage('Slug must be between 1 and 200 characters')
    .matches(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .withMessage('Slug must contain only lowercase letters, numbers, and hyphens'),
  
  handleValidationErrors
];

// Blog list query validation
const validateBlogListQuery = [
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer'),
  
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('Limit must be between 1 and 100'),
  
  query('status')
    .optional()
    .isIn(['draft', 'published', 'private', 'all'])
    .withMessage('Status must be draft, published, private, or all'),
  
  query('mood')
    .optional()
    .isIn(BLOG_VALIDATION.MOODS)
    .withMessage(`Mood must be one of: ${BLOG_VALIDATION.MOODS.join(', ')}`),
  
  query('tags')
    .optional()
    .isString()
    .withMessage('Tags must be a string'),
  
  query('author')
    .optional()
    .isMongoId()
    .withMessage('Author must be a valid MongoDB ObjectId'),
  
  query('seriesId')
    .optional()
    .isMongoId()
    .withMessage('Series ID must be a valid MongoDB ObjectId'),
  
  query('sort')
    .optional()
    .isIn(['createdAt', 'updatedAt', 'publishedAt', 'likes', 'bookmarks', 'readingTime'])
    .withMessage('Sort must be one of: createdAt, updatedAt, publishedAt, likes, bookmarks, readingTime'),
  
  query('order')
    .optional()
    .isIn(['asc', 'desc'])
    .withMessage('Order must be asc or desc'),
  
  handleValidationErrors
];

module.exports = {
  validateCreateBlog,
  validateUpdateBlog,
  validateBlogId,
  validateBlogSlug,
  validateBlogListQuery,
  handleValidationErrors,
  BLOG_VALIDATION
};
