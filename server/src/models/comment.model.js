const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  blogId: { type: mongoose.Schema.Types.ObjectId, ref: 'Blog', required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  parentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment' },
  inlineRef: { type: String },
  status: { type: String, enum: ['active', 'deleted', 'reported'], default: 'active' },
}, { timestamps: true });

module.exports = mongoose.model('Comment', commentSchema); 