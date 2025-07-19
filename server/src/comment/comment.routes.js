const express = require('express');
const router = express.Router();
const commentController = require('./comment.controller');
const { protect } = require('../middleware/auth');

// Get comments for a blog
router.get('/blog/:id', commentController.getComments);
router.post('/blog/:id', protect, commentController.addComment);
router.post('/:id/reply', protect, commentController.replyToComment);
router.post('/:id/report', protect, commentController.reportComment);

module.exports = router; 