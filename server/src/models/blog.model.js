const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    summary: { type: String },
    author: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    tags: [{ type: String }],
    coverImage: { type: String },
    seriesId: { type: mongoose.Schema.Types.ObjectId, ref: 'Series' },
    status: {
      type: String,
      enum: ['draft', 'published', 'private'],
      default: 'draft',
    },
    mood: { type: String },
    language: { type: String, default: 'en' },
    ttsUrl: { type: String },
    likes: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

module.exports = mongoose.model('Blog', blogSchema);
