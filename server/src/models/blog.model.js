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
      enum: ['Motivational', 'Thoughtful', 'Educational', 'Humorous', 'Inspirational', 'Technical', 'Other'],
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

// Additional performance indexes
blogSchema.index({ author: 1, createdAt: -1 }); // Author's blog timeline
blogSchema.index({ category: 1, status: 1, createdAt: -1 }); // Category-based queries
blogSchema.index({ tags: 1, status: 1 }); // Tag-based filtering
blogSchema.index({ 'aiSummary': 'text' }); // AI summary text search
blogSchema.index({ language: 1, status: 1, createdAt: -1 }); // Language-based queries
blogSchema.index({ sentiment: 1, status: 1 }); // Sentiment-based filtering
blogSchema.index({ seoScore: -1, status: 1 }); // SEO-based sorting
blogSchema.index({ readingTime: 1, status: 1 }); // Reading time filtering
blogSchema.index({ 'likedBy': 1, createdAt: -1 }); // User's liked content timeline
blogSchema.index({ 'bookmarkedBy': 1, createdAt: -1 }); // User's bookmarked content timeline
blogSchema.index({ seriesId: 1, createdAt: -1 }); // Series content ordering
blogSchema.index({ mood: 1, status: 1 }); // Mood-based filtering
blogSchema.index({ 'ttsOptions.voice': 1 }); // TTS voice filtering
blogSchema.index({ 'ttsOptions.language': 1 }); // TTS language filtering
blogSchema.index({ audioDuration: 1 }); // Audio duration filtering
blogSchema.index({ audioQuality: 1 }); // Audio quality filtering

// Compound indexes for complex queries
blogSchema.index({ 
  status: 1, 
  language: 1, 
  createdAt: -1 
}); // Status + language + date

blogSchema.index({ 
  author: 1, 
  status: 1, 
  createdAt: -1 
}); // Author + status + date

blogSchema.index({ 
  category: 1, 
  status: 1, 
  language: 1 
}); // Category + status + language

blogSchema.index({ 
  tags: 1, 
  status: 1, 
  createdAt: -1 
}); // Tags + status + date

blogSchema.index({ 
  sentiment: 1, 
  status: 1, 
  createdAt: -1 
}); // Sentiment + status + date

blogSchema.index({ 
  seoScore: -1, 
  status: 1, 
  createdAt: -1 
}); // SEO + status + date

// Partial indexes for better performance
blogSchema.index({ 
  createdAt: -1 
}, { 
  partialFilterExpression: { status: 'published' } 
}); // Only published blogs by date

blogSchema.index({ 
  likes: -1 
}, { 
  partialFilterExpression: { status: 'published' } 
}); // Only published blogs by likes

blogSchema.index({ 
  bookmarks: -1 
}, { 
  partialFilterExpression: { status: 'published' } 
}); // Only published blogs by bookmarks

// Sparse indexes for optional fields
blogSchema.index({ 
  seriesId: 1 
}, { 
  sparse: true 
}); // Sparse index for seriesId (many blogs won't have this)

blogSchema.index({ 
  mood: 1 
}, { 
  sparse: true 
}); // Sparse index for mood

blogSchema.index({ 
  'ttsUrl': 1 
}, { 
  sparse: true 
}); // Sparse index for TTS URL

// Background index creation for production
if (process.env.NODE_ENV === 'production') {
  blogSchema.index({ 
    author: 1, 
    status: 1, 
    createdAt: -1 
  }, { 
    background: true 
  });
  
  blogSchema.index({ 
    category: 1, 
    status: 1, 
    createdAt: -1 
  }, { 
    background: true 
  });
}

module.exports = mongoose.model('Blog', blogSchema);
