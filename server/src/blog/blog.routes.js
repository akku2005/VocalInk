const express = require('express');
const { body, param, validationResult } = require('express-validator');
const router = express.Router();
const { protect } = require('../middleware/auth');
const blogController = require('./blog.controller');
const { apiLimiter } = require('../middleware/rateLimiter');
const { 
  awardBlogCreationXP, 
  awardBlogPublishingXP, 
  awardBlogUpdateXP 
} = require('../middleware/xpMiddleware');

// Validation middleware
function validate(req, res, next) {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
}

// Apply general API rate limiting to all blog routes
router.use(apiLimiter);

router.get('/', blogController.getBlogs);
router.get('/:id', blogController.getBlogById);
router.post(
  '/',
  protect,
  [body('title').notEmpty(), body('content').notEmpty()],
  validate,
  blogController.createBlog,
  awardBlogCreationXP
);
router.put(
  '/:id',
  protect,
  [body('title').optional().notEmpty(), body('content').optional().notEmpty()],
  validate,
  blogController.updateBlog,
  awardBlogUpdateXP
);
router.delete('/:id', protect, blogController.deleteBlog);

// Advanced endpoints (with validation)
router.post(
  '/:id/tts',
  protect,
  [param('id').isMongoId()],
  validate,
  blogController.generateTTS
);
router.post(
  '/:id/translate',
  protect,
  [param('id').isMongoId(), body('targetLang').notEmpty()],
  validate,
  blogController.translateBlog
);
router.post(
  '/:id/like',
  protect,
  [param('id').isMongoId()],
  validate,
  blogController.likeBlog
);
router.post(
  '/:id/bookmark',
  protect,
  [param('id').isMongoId()],
  validate,
  blogController.bookmarkBlog
);
router.get(
  '/:id/comments',
  [param('id').isMongoId()],
  validate,
  blogController.getBlogComments
);
router.post(
  '/:id/comments',
  protect,
  [param('id').isMongoId(), body('content').notEmpty()],
  validate,
  blogController.addBlogComment
);

module.exports = router;
