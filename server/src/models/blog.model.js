const mongoose = require('mongoose');

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    content: { type: String, required: true },
    summary: { type: String },
    slug: { type: String, unique: true, sparse: true },
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
    mood: { 
      type: String, 
      enum: ['Motivational', 'Thoughtful', 'Educational', 'Other'],
      default: 'Other'
    },
    language: { type: String, default: 'en' },
    publishedAt: { type: Date },
    
    // AI-generated fields
    aiSummary: { type: String },
    keyPoints: [{ type: String }],
    readingTime: { type: Number }, // in minutes
    sentiment: { type: String, enum: ['positive', 'negative', 'neutral'] },
    topics: [{ type: String }],
    seoScore: { type: Number, min: 0, max: 100 },
    aiSuggestions: [{ type: String }],
    
    // Enhanced TTS
    ttsUrl: { type: String },
    ttsOptions: {
      voice: { type: String, default: 'default' },
      speed: { type: Number, default: 1.0 },
      pitch: { type: Number, default: 1.0 },
      language: { type: String, default: 'en' }
    },
    
    // Audio metadata
    audioDuration: { type: Number }, // in seconds
    audioQuality: { type: String, enum: ['low', 'medium', 'high'] },
    
    // Engagement metrics
    likes: { type: Number, default: 0 },
    bookmarks: { type: Number, default: 0 },
    likedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    bookmarkedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
);

// Database indexes for performance
blogSchema.index({ author: 1, status: 1 });
blogSchema.index({ status: 1, createdAt: -1 });
blogSchema.index({ tags: 1 });
blogSchema.index({ seriesId: 1 });
blogSchema.index({ language: 1 });
blogSchema.index({ sentiment: 1 });
blogSchema.index({ likes: -1 });
blogSchema.index({ bookmarks: -1 });
blogSchema.index({ readingTime: 1 });
blogSchema.index({ seoScore: -1 });
blogSchema.index({ 'likedBy': 1 });
blogSchema.index({ 'bookmarkedBy': 1 });
blogSchema.index({ slug: 1 }); // Slug index for fast lookups
blogSchema.index({ mood: 1 }); // Mood index for filtering
// createdAt index already covered by status+createdAt composite
blogSchema.index({ updatedAt: -1 });
blogSchema.index({ title: 'text', content: 'text', summary: 'text' }); // Text search index

module.exports = mongoose.model('Blog', blogSchema);
