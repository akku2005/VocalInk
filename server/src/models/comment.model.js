const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema(
  {
    blogId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Blog',
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    content: {
      type: String,
      required: true,
      maxlength: 1000,
    },
    parentId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Comment',
    },
    // Inline comment reference (for comments on specific text/sentences)
    inlineRef: {
      type: String,
      // Format: "paragraph:1:sentence:2" or "line:10:word:5"
    },
    // Comment position in the blog content
    position: {
      start: { type: Number },
      end: { type: Number },
    },
    status: {
      type: String,
      enum: ['active', 'deleted', 'reported', 'hidden'],
      default: 'active',
    },
    // Engagement metrics
    likes: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    // Moderation
    reportedBy: [
      {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        reason: { type: String },
        reportedAt: { type: Date, default: Date.now },
      },
    ],
    // Edit tracking
    editedAt: { type: Date },
    editCount: { type: Number, default: 0 },
    // Spam detection
    spamScore: { type: Number, default: 0 },
    // Thread depth for nested replies
    depth: { type: Number, default: 0 },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Virtual for reply count
commentSchema.virtual('replyCount').get(function () {
  return this.replies ? this.replies.length : 0;
});

// Virtual for isEdited
commentSchema.virtual('isEdited').get(function () {
  return this.editedAt && this.editedAt > this.createdAt;
});

// Indexes for performance
commentSchema.index({ blogId: 1, status: 1, createdAt: -1 });
commentSchema.index({ parentId: 1, status: 1 });
commentSchema.index({ userId: 1, createdAt: -1 });
commentSchema.index({ 'reportedBy.userId': 1 });

// Pre-save middleware to calculate depth
commentSchema.pre('save', async function (next) {
  if (this.parentId) {
    const parent = await this.constructor.findById(this.parentId);
    if (parent) {
      this.depth = parent.depth + 1;
    }
  }
  next();
});

// Instance methods
commentSchema.methods.like = function (userId) {
  if (!this.likedBy.includes(userId)) {
    this.likedBy.push(userId);
    this.likes += 1;
  }
  return this.save();
};

commentSchema.methods.unlike = function (userId) {
  const index = this.likedBy.indexOf(userId);
  if (index > -1) {
    this.likedBy.splice(index, 1);
    this.likes = Math.max(0, this.likes - 1);
  }
  return this.save();
};

commentSchema.methods.isLikedBy = function (userId) {
  return this.likedBy.includes(userId);
};

commentSchema.methods.report = function (userId, reason) {
  const existingReport = this.reportedBy.find(
    (report) => report.userId.toString() === userId.toString()
  );

  if (!existingReport) {
    this.reportedBy.push({
      userId,
      reason: reason || 'Inappropriate content',
      reportedAt: new Date(),
    });
  }

  return this.save();
};

commentSchema.methods.softDelete = function () {
  this.status = 'deleted';
  return this.save();
};

// Static methods
commentSchema.statics.getThreadedComments = function (blogId, options = {}) {
  const query = { blogId, status: 'active' };

  return this.find(query)
    .populate('userId', 'name avatar')
    .populate('parentId', 'content userId')
    .sort({ createdAt: 1 })
    .exec();
};

commentSchema.statics.getReplies = function (commentId) {
  return this.find({ parentId: commentId, status: 'active' })
    .populate('userId', 'name avatar')
    .sort({ createdAt: 1 })
    .exec();
};

commentSchema.statics.getReportedComments = function () {
  return this.find({ status: 'reported' })
    .populate('userId', 'name avatar')
    .populate('blogId', 'title')
    .sort({ 'reportedBy.reportedAt': -1 })
    .exec();
};

module.exports = mongoose.model('Comment', commentSchema);
