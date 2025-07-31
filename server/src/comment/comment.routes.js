const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const commentController = require('./comment.controller');
const { apiLimiter } = require('../middleware/rateLimiter');
const { awardCommentXP } = require('../middleware/xpMiddleware');

// Validation middleware
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// Apply rate limiting to all comment routes
router.use(apiLimiter);

// Get all comments for a blog
router.get('/blog/:id', commentController.getComments);

// Add a new comment to a blog
router.post(
  '/blog/:id',
  protect,
  [
    body('content').notEmpty().withMessage('Comment content is required'),
    body('content')
      .isLength({ max: 1000 })
      .withMessage('Comment content is too long'),
    param('id').isMongoId().withMessage('Invalid blog ID'),
  ],
  validate,
  commentController.addComment,
  awardCommentXP
);

// Get a specific comment by ID (must come before /:id/report)
router.get(
  '/:id',
  [param('id').isMongoId().withMessage('Invalid comment ID')],
  validate,
  commentController.getCommentById
);

// Reply to a comment
router.post(
  '/:id/reply',
  protect,
  [
    body('content').notEmpty().withMessage('Reply content is required'),
    body('content')
      .isLength({ max: 1000 })
      .withMessage('Reply content is too long'),
    param('id').isMongoId().withMessage('Invalid comment ID'),
  ],
  validate,
  commentController.replyToComment
);

// Report a comment
router.post(
  '/:id/report',
  protect,
  [
    body('reason').optional().isString().withMessage('Reason must be a string'),
    param('id').isMongoId().withMessage('Invalid comment ID'),
  ],
  validate,
  commentController.reportComment
);

// Update a comment (author only)
router.put(
  '/:id',
  protect,
  [
    body('content').notEmpty().withMessage('Comment content is required'),
    body('content')
      .isLength({ max: 1000 })
      .withMessage('Comment content is too long'),
    param('id').isMongoId().withMessage('Invalid comment ID'),
  ],
  validate,
  commentController.updateComment
);

// Delete a comment (author only)
router.delete(
  '/:id',
  protect,
  [param('id').isMongoId().withMessage('Invalid comment ID')],
  validate,
  commentController.deleteComment
);

module.exports = router;
