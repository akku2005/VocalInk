const { StatusCodes } = require('http-status-codes');
const Comment = require('../models/comment.model');
const Blog = require('../models/blog.model');
const User = require('../models/user.model');
const Notification = require('../models/notification.model');
const { NotFoundError, ValidationError } = require('../utils/errors');
const logger = require('../utils/logger');

// Get all comments for a blog
exports.getComments = async (req, res) => {
  try {
    const { id: blogId } = req.params;
    const { page = 1, limit = 20, sort = 'newest' } = req.query;

    // Verify blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      throw new NotFoundError('Blog not found');
    }

    // Build query
    const query = { blogId, status: 'active' };

    // Build sort
    let sortOption = {};
    switch (sort) {
      case 'oldest':
        sortOption = { createdAt: 1 };
        break;
      case 'mostLiked':
        sortOption = { likes: -1, createdAt: -1 };
        break;
      default:
        sortOption = { createdAt: -1 };
    }

    const comments = await Comment.find(query)
      .populate('userId', 'name avatar')
      .populate('parentId', 'content userId')
      .sort(sortOption)
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .exec();

    const total = await Comment.countDocuments(query);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        comments,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalComments: total,
          hasNext: page * limit < total,
          hasPrev: page > 1,
        },
      },
    });
  } catch (error) {
    logger.error('Error in getComments:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching comments',
      });
    }
  }
};

// Add a new comment
exports.addComment = async (req, res) => {
  try {
    const { id: blogId } = req.params;
    const { content, parentId, inlineRef } = req.body;
    const userId = req.user.id;

    // Validate content
    if (!content || content.trim().length < 1) {
      throw new ValidationError('Comment content is required');
    }

    if (content.length > 1000) {
      throw new ValidationError(
        'Comment content is too long (max 1000 characters)'
      );
    }

    // Verify blog exists
    const blog = await Blog.findById(blogId);
    if (!blog) {
      throw new NotFoundError('Blog not found');
    }

    // Create comment
    const comment = new Comment({
      blogId,
      userId,
      content: content.trim(),
      parentId: parentId || null,
      inlineRef: inlineRef || null,
      status: 'active',
    });

    await comment.save();
    await comment.populate('userId', 'name avatar');

    // Update user's comment count
    await User.findByIdAndUpdate(userId, {
      $inc: { totalComments: 1 },
    });

    // Create notification for blog author (if not the same user)
    if (blog.author.toString() !== userId) {
      await Notification.create({
        userId: blog.author,
        type: 'comment',
        title: 'New Comment',
        content: `Someone commented on your blog "${blog.title}"`,
        data: {
          blogId,
          commentId: comment._id,
          fromUserId: userId,
        },
      });
    }

    // Create notification for parent comment author (if replying)
    if (parentId) {
      const parentComment = await Comment.findById(parentId).populate('userId');
      if (parentComment && parentComment.userId._id.toString() !== userId) {
        await Notification.create({
          userId: parentComment.userId._id,
          type: 'reply',
          title: 'New Reply',
          content: `Someone replied to your comment`,
          data: {
            blogId,
            commentId: comment._id,
            parentCommentId: parentId,
            fromUserId: userId,
          },
        });
      }
    }

    logger.info('Comment added', { userId, blogId, commentId: comment._id });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Comment added successfully',
      data: comment,
    });
  } catch (error) {
    logger.error('Error in addComment:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while adding comment',
      });
    }
  }
};

// Reply to a comment
exports.replyToComment = async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const { content, inlineRef } = req.body;
    const userId = req.user.id;

    // Validate content
    if (!content || content.trim().length < 1) {
      throw new ValidationError('Reply content is required');
    }

    if (content.length > 1000) {
      throw new ValidationError(
        'Reply content is too long (max 1000 characters)'
      );
    }

    // Verify parent comment exists
    const parentComment = await Comment.findById(commentId);
    if (!parentComment) {
      throw new NotFoundError('Parent comment not found');
    }

    if (parentComment.status !== 'active') {
      throw new ValidationError('Cannot reply to deleted or reported comment');
    }

    // Create reply
    const reply = new Comment({
      blogId: parentComment.blogId,
      userId,
      content: content.trim(),
      parentId: commentId,
      inlineRef: inlineRef || null,
      status: 'active',
    });

    await reply.save();
    await reply.populate('userId', 'name avatar');

    // Update user's comment count
    await User.findByIdAndUpdate(userId, {
      $inc: { totalComments: 1 },
    });

    // Create notification for parent comment author
    if (parentComment.userId.toString() !== userId) {
      await Notification.create({
        userId: parentComment.userId,
        type: 'reply',
        title: 'New Reply',
        content: `Someone replied to your comment`,
        data: {
          blogId: parentComment.blogId,
          commentId: reply._id,
          parentCommentId: commentId,
          fromUserId: userId,
        },
      });
    }

    logger.info('Reply added', {
      userId,
      parentCommentId: commentId,
      replyId: reply._id,
    });

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Reply added successfully',
      data: reply,
    });
  } catch (error) {
    logger.error('Error in replyToComment:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while adding reply',
      });
    }
  }
};

// Report a comment
exports.reportComment = async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const { reason } = req.body;
    const userId = req.user.id;

    // Verify comment exists
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Check if user has already reported this comment
    const existingReport = comment.reportedBy.find(
      (report) => report.userId.toString() === userId
    );

    if (existingReport) {
      return res.status(StatusCodes.CONFLICT).json({
        success: false,
        message: 'You have already reported this comment',
      });
    }

    // Add report to reportedBy array
    comment.reportedBy.push({
      userId: userId,
      reason: reason || 'Inappropriate content',
      reportedAt: new Date(),
    });

    // Update comment status to reported
    comment.status = 'reported';
    await comment.save();

    logger.info('Comment reported', { userId, commentId, reason });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Comment reported successfully',
    });
  } catch (error) {
    logger.error('Error in reportComment:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while reporting comment',
      });
    }
  }
};

// Update a comment (author only)
exports.updateComment = async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const { content } = req.body;
    const userId = req.user.id;

    // Validate content
    if (!content || content.trim().length < 1) {
      throw new ValidationError('Comment content is required');
    }

    if (content.length > 1000) {
      throw new ValidationError(
        'Comment content is too long (max 1000 characters)'
      );
    }

    // Find and verify comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Verify ownership
    if (comment.userId.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You can only edit your own comments',
      });
    }

    if (comment.status !== 'active') {
      throw new ValidationError('Cannot edit deleted or reported comment');
    }

    // Update comment
    comment.content = content.trim();
    comment.editedAt = new Date();
    await comment.save();
    await comment.populate('userId', 'name avatar');

    logger.info('Comment updated', { userId, commentId });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Comment updated successfully',
      data: comment,
    });
  } catch (error) {
    logger.error('Error in updateComment:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while updating comment',
      });
    }
  }
};

// Delete a comment (author only)
exports.deleteComment = async (req, res) => {
  try {
    const { id: commentId } = req.params;
    const userId = req.user.id;

    // Find and verify comment
    const comment = await Comment.findById(commentId);
    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    // Verify ownership
    if (comment.userId.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You can only delete your own comments',
      });
    }

    // Soft delete comment
    comment.status = 'deleted';
    await comment.save();

    // Update user's comment count
    await User.findByIdAndUpdate(userId, {
      $inc: { totalComments: -1 },
    });

    logger.info('Comment deleted', { userId, commentId });

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Comment deleted successfully',
    });
  } catch (error) {
    logger.error('Error in deleteComment:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while deleting comment',
      });
    }
  }
};

// Get comment by ID
exports.getCommentById = async (req, res) => {
  try {
    const { id: commentId } = req.params;

    const comment = await Comment.findById(commentId)
      .populate('userId', 'name avatar')
      .populate('parentId', 'content userId')
      .populate('blogId', 'title');

    if (!comment) {
      throw new NotFoundError('Comment not found');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: comment,
    });
  } catch (error) {
    logger.error('Error in getCommentById:', error);
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching comment',
      });
    }
  }
};
