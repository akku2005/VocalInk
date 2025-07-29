const express = require('express');

const router = express.Router();
const { protect } = require('../middleware/auth');

const commentController = require('./comment.controller');

// Get comments for a blog
router.get('/blog/:id', commentController.getComments);
router.post('/blog/:id', protect, commentController.addComment);
router.post('/:id/reply', protect, commentController.replyToComment);
router.post('/:id/report', protect, commentController.reportComment);

module.exports = router;
