const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { 
    type: String, 
    enum: [
      'follow', 'unfollow', 'like', 'comment', 'reply', 'mention', 
      'badge_earned', 'level_up', 'blog_published', 'blog_featured',
      'comment_liked', 'comment_replied', 'system', 'achievement'
    ], 
    required: true 
  },
  title: { type: String, required: true },
  content: { type: String, required: true },
  data: {
    // Flexible data object for different notification types
    blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog' },
    commentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
    badgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Badge' },
    fromUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    xpGained: { type: Number },
    level: { type: Number },
    actionUrl: { type: String }, // URL to navigate to when notification is clicked
    metadata: { type: mongoose.Schema.Types.Mixed } // Additional flexible data
  },
  read: { type: Boolean, default: false },
  readAt: { type: Date },
  priority: { 
    type: String, 
    enum: ['low', 'normal', 'high', 'urgent'], 
    default: 'normal' 
  },
  expiresAt: { type: Date }, // Optional expiration
  isDeleted: { type: Boolean, default: false }
}, { 
  timestamps: true,
  indexes: [
    { userId: 1, read: 1 },
    { userId: 1, createdAt: -1 },
    { type: 1 },
    { expiresAt: 1, expireAfterSeconds: 0 } // TTL index for expired notifications
  ]
});

// Pre-save middleware to set default title based on type
notificationSchema.pre('save', function(next) {
  if (!this.title) {
    switch (this.type) {
      case 'follow':
        this.title = 'New Follower';
        break;
      case 'like':
        this.title = 'New Like';
        break;
      case 'comment':
        this.title = 'New Comment';
        break;
      case 'reply':
        this.title = 'New Reply';
        break;
      case 'badge_earned':
        this.title = 'Badge Earned!';
        break;
      case 'level_up':
        this.title = 'Level Up!';
        break;
      case 'blog_published':
        this.title = 'Blog Published';
        break;
      case 'system':
        this.title = 'System Notification';
        break;
      default:
        this.title = 'Notification';
    }
  }
  next();
});

// Instance methods
notificationSchema.methods.markAsRead = function() {
  this.read = true;
  this.readAt = new Date();
  return this.save();
};

notificationSchema.methods.markAsUnread = function() {
  this.read = false;
  this.readAt = undefined;
  return this.save();
};

// Static methods
notificationSchema.statics.createFollowNotification = async function(userId, fromUserId) {
  const fromUser = await this.model('User').findById(fromUserId);
  return this.create({
    userId,
    type: 'follow',
    title: 'New Follower',
    content: `${fromUser.name} started following you`,
    data: {
      fromUserId,
      actionUrl: `/users/${fromUserId}`
    }
  });
};

notificationSchema.statics.createLikeNotification = async function(userId, fromUserId, blogId) {
  const fromUser = await this.model('User').findById(fromUserId);
  const blog = await this.model('Blog').findById(blogId);
  return this.create({
    userId,
    type: 'like',
    title: 'New Like',
    content: `${fromUser.name} liked your blog "${blog.title}"`,
    data: {
      fromUserId,
      blogId,
      actionUrl: `/blogs/${blogId}`
    }
  });
};

notificationSchema.statics.createCommentNotification = async function(userId, fromUserId, blogId, commentId) {
  const fromUser = await this.model('User').findById(fromUserId);
  const blog = await this.model('Blog').findById(blogId);
  return this.create({
    userId,
    type: 'comment',
    title: 'New Comment',
    content: `${fromUser.name} commented on your blog "${blog.title}"`,
    data: {
      fromUserId,
      blogId,
      commentId,
      actionUrl: `/blogs/${blogId}#comment-${commentId}`
    }
  });
};

notificationSchema.statics.createBadgeNotification = async function(userId, badgeId) {
  const badge = await this.model('Badge').findById(badgeId);
  return this.create({
    userId,
    type: 'badge_earned',
    title: 'Badge Earned!',
    content: `Congratulations! You earned the "${badge.name}" badge!`,
    data: {
      badgeId,
      actionUrl: `/users/${userId}/badges`
    },
    priority: 'high'
  });
};

notificationSchema.statics.createLevelUpNotification = async function(userId, newLevel, xpGained) {
  return this.create({
    userId,
    type: 'level_up',
    title: 'Level Up!',
    content: `Congratulations! You reached level ${newLevel}!`,
    data: {
      level: newLevel,
      xpGained,
      actionUrl: `/users/${userId}/profile`
    },
    priority: 'high'
  });
};

// Get unread count for a user
notificationSchema.statics.getUnreadCount = function(userId) {
  return this.countDocuments({ userId, read: false, isDeleted: false });
};

// Mark all notifications as read for a user
notificationSchema.statics.markAllAsRead = function(userId) {
  return this.updateMany(
    { userId, read: false, isDeleted: false },
    { read: true, readAt: new Date() }
  );
};

// Delete old notifications (cleanup)
notificationSchema.statics.cleanupOldNotifications = function(daysOld = 30) {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);
  
  return this.updateMany(
    { 
      createdAt: { $lt: cutoffDate },
      read: true,
      isDeleted: false
    },
    { isDeleted: true }
  );
};

module.exports = mongoose.model('Notification', notificationSchema); 