const express = require('express');

const router = express.Router();
const { protect } = require('../middleware/auth');

const blogController = require('./blog.controller');

router.get('/', blogController.getBlogs);
router.get('/:id', blogController.getBlogById);
router.post('/', protect, blogController.createBlog);
router.put('/:id', protect, blogController.updateBlog);
router.delete('/:id', protect, blogController.deleteBlog);

// Advanced endpoints (stubs)
router.post('/:id/tts', protect, blogController.generateTTS);
router.post('/:id/translate', protect, blogController.translateBlog);
router.post('/:id/like', protect, blogController.likeBlog);
router.post('/:id/bookmark', protect, blogController.bookmarkBlog);
router.get('/:id/comments', blogController.getBlogComments);
router.post('/:id/comments', protect, blogController.addBlogComment);

module.exports = router;
