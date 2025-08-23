const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const blogController = require('./blog.controller');
const { apiLimiter } = require('../middleware/rateLimiter');
const { 
  awardBlogCreationXP, 
  awardBlogPublishingXP, 
  awardBlogUpdateXP 
} = require('../middleware/xpMiddleware');
const {
  validateCreateBlog,
  validateUpdateBlog,
  validateBlogId,
  validateBlogSlug,
  validateBlogListQuery
} = require('../middleware/blogValidation');

// Apply general API rate limiting to all blog routes
// router.use(apiLimiter);

// Public routes
router.get('/tag',blogController.getBlogs);
router.get('/getBlogs',  blogController.getallBlogs);
router.get('/slug/:slug',  blogController.getBlogBySlug);
router.get('/:id', blogController.getBlogById);

// Protected routes
router.post(
  '/addBlog',
   protect,
  //validateCreateBlog,
  blogController.createBlog,
  // awardBlogCreationXP
);

router.put(
  '/:id',
  protect,
  // validateUpdateBlog,
  blogController.updateBlog,
  awardBlogUpdateXP
);

router.delete('/:id', protect, validateBlogId, blogController.deleteBlog);

// New endpoints
router.post(
  '/:id/summary',
  protect,
  validateBlogId,
  blogController.regenerateSummary
);

router.put(
  '/:id/publish',
  protect,
  validateBlogId,
  blogController.publishBlog,
  awardBlogPublishingXP
);

// Advanced endpoints (with validation)
const { param, body } = require('express-validator');

router.post(
  '/:id/tts',
  protect,
  [param('id').isMongoId()],
  validateBlogId[validateBlogId.length - 1], // Use the validation handler from validateBlogId
  blogController.generateTTS
);
router.post(
  '/:id/translate',
  protect,
  [param('id').isMongoId(), body('targetLang').notEmpty()],
  validateBlogId[validateBlogId.length - 1],
  blogController.translateBlog
);
router.post(
  '/:id/like',
  protect,
  [param('id').isMongoId()],
  validateBlogId[validateBlogId.length - 1],
  blogController.likeBlog
);
router.post(
  '/:id/bookmark',
  protect,
  [param('id').isMongoId()],
  validateBlogId[validateBlogId.length - 1],
  blogController.bookmarkBlog
);
router.get(
  '/:id/comments',
  [param('id').isMongoId()],
  validateBlogId[validateBlogId.length - 1],
  blogController.getBlogComments
);
router.post(
  '/:id/comments',
  protect,
  [param('id').isMongoId(), body('content').notEmpty()],
  validateBlogId[validateBlogId.length - 1],
  blogController.addBlogComment
);

module.exports = router;
