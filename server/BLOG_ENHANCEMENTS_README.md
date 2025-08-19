# Blog Enhancements for VocalInk

This document describes the enhanced blog functionality that has been added to the VocalInk backend, including AI-powered summaries, SEO-friendly URLs, and advanced filtering capabilities.

## 🚀 New Features

### 1. AI-Powered TL;DR Summaries
- **Automatic Generation**: AI summaries are automatically generated when creating blogs
- **OpenAI Integration**: Uses OpenAI GPT-3.5-turbo for high-quality summaries
- **Fallback Support**: Falls back to local extractive summarization if OpenAI is unavailable
- **Manual Regeneration**: Authors can regenerate summaries on demand
- **Multiple Styles**: Support for concise, engaging, detailed, and casual summary styles

### 2. SEO-Friendly URLs (Slugs)
- **Automatic Generation**: Slugs are automatically created from blog titles
- **Uniqueness**: Ensures unique slugs with automatic numbering
- **URL Optimization**: Clean, readable URLs for better SEO
- **Auto-Update**: Slugs update when titles change

### 3. Enhanced Blog Model
- **Mood Classification**: Motivational, Thoughtful, Educational, Other
- **Tag Support**: Multiple tags per blog with validation
- **Draft/Published States**: Full support for draft and published workflows
- **Published Timestamps**: Automatic tracking of publication dates
- **Series Support**: Integration with existing series functionality

### 4. Advanced Filtering & Search
- **Mood Filtering**: Filter blogs by mood classification
- **Tag Filtering**: Filter by single or multiple tags
- **Author Filtering**: Filter by specific authors
- **Series Filtering**: Filter by blog series
- **Sorting Options**: Sort by creation date, update date, publication date, likes, bookmarks, reading time
- **Pagination**: Full pagination support with customizable limits

## 📋 API Endpoints

### Public Endpoints

#### GET /api/blogs
List blogs with advanced filtering options.

**Query Parameters:**
- `page` (number): Page number (default: 1)
- `limit` (number): Items per page (default: 10, max: 100)
- `status` (string): Filter by status - 'draft', 'published', 'private', 'all' (default: 'published')
- `mood` (string): Filter by mood - 'Motivational', 'Thoughtful', 'Educational', 'Other'
- `tags` (string): Comma-separated tags to filter by
- `author` (string): MongoDB ObjectId of author
- `seriesId` (string): MongoDB ObjectId of series
- `sort` (string): Sort field - 'createdAt', 'updatedAt', 'publishedAt', 'likes', 'bookmarks', 'readingTime'
- `order` (string): Sort order - 'asc' or 'desc' (default: 'desc')

**Example:**
```bash
GET /api/blogs?mood=Educational&tags=ai,tech&limit=20&sort=publishedAt&order=desc
```

#### GET /api/blogs/slug/:slug
Get a blog by its SEO-friendly slug.

**Example:**
```bash
GET /api/blogs/slug/my-awesome-blog-post
```

#### GET /api/blogs/:id
Get a blog by its MongoDB ObjectId.

### Protected Endpoints (Require Authentication)

#### POST /api/blogs
Create a new blog with automatic slug and AI summary generation.

**Request Body:**
```json
{
  "title": "My Awesome Blog Post",
  "content": "This is the full content of my blog post...",
  "summary": "Optional manual summary (AI will generate if not provided)",
  "tags": ["technology", "ai", "programming"],
  "mood": "Educational",
  "status": "draft",
  "language": "en",
  "coverImage": "https://example.com/image.jpg",
  "seriesId": "507f1f77bcf86cd799439011"
}
```

**Response:**
```json
{
  "_id": "507f1f77bcf86cd799439011",
  "title": "My Awesome Blog Post",
  "slug": "my-awesome-blog-post",
  "summary": "AI-generated summary...",
  "tags": ["technology", "ai", "programming"],
  "mood": "Educational",
  "status": "draft",
  "author": "507f1f77bcf86cd799439012",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

#### PUT /api/blogs/:id
Update an existing blog (author only).

**Request Body:**
```json
{
  "title": "Updated Blog Title",
  "content": "Updated content...",
  "tags": ["updated", "tags"],
  "mood": "Thoughtful"
}
```

#### DELETE /api/blogs/:id
Delete a blog (author only).

#### POST /api/blogs/:id/summary
Regenerate AI summary for a blog.

**Request Body:**
```json
{
  "maxLength": 200,
  "style": "engaging"
}
```

**Response:**
```json
{
  "summary": "New AI-generated summary...",
  "provider": "openai",
  "metadata": {
    "originalWordCount": 500,
    "summaryWordCount": 45,
    "compressionRatio": 0.09,
    "style": "engaging",
    "language": "en"
  }
}
```

#### PUT /api/blogs/:id/publish
Publish a draft blog.

**Response:**
```json
{
  "message": "Blog published successfully",
  "publishedAt": "2024-01-01T00:00:00.000Z"
}
```

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# OpenAI Configuration (Optional - falls back to local summarization if not provided)
OPENAI_API_KEY=your-openai-api-key-here

# AI Rate Limits
SUMMARY_RATE_LIMIT_PER_HOUR=100
```

### Dependencies

The following packages have been added:

```bash
npm install slugify openai
```

## 🧪 Testing

Run the comprehensive test script to verify all features:

```bash
cd server
node test-blog-enhancements.js
```

The test script will:
1. Create a test blog with AI summary generation
2. Test filtering and pagination
3. Test slug-based retrieval
4. Test summary regeneration
5. Test blog publishing
6. Test blog updates
7. Clean up test data

## 📊 Database Schema Changes

### Blog Model Enhancements

```javascript
{
  // New fields
  slug: { type: String, unique: true, sparse: true },
  publishedAt: { type: Date },
  
  // Enhanced mood field
  mood: { 
    type: String, 
    enum: ['Motivational', 'Thoughtful', 'Educational', 'Other'],
    default: 'Other'
  },
  
  // Existing fields remain unchanged
  title: { type: String, required: true },
  content: { type: String, required: true },
  summary: { type: String },
  tags: [{ type: String }],
  status: {
    type: String,
    enum: ['draft', 'published', 'private'],
    default: 'draft',
  },
  // ... other existing fields
}
```

### New Database Indexes

```javascript
blogSchema.index({ slug: 1 }); // Fast slug lookups
blogSchema.index({ mood: 1 }); // Mood filtering
```

## 🔒 Security & Validation

### Input Validation

All endpoints include comprehensive validation:

- **Title**: 1-200 characters, required
- **Content**: 10-50,000 characters, required
- **Summary**: Max 500 characters, optional
- **Tags**: Max 10 tags, each 1-50 characters
- **Mood**: Must be one of the predefined values
- **Slug**: Auto-generated, URL-safe format
- **Status**: Must be draft, published, or private

### Authorization

- **Create/Update/Delete**: Only blog authors and admins
- **Summary Regeneration**: Only blog authors and admins
- **Publishing**: Only blog authors and admins
- **Public Access**: Only published blogs are publicly accessible

### Rate Limiting

All endpoints are protected by rate limiting:
- General API rate limiting
- AI-specific rate limiting for summary generation
- Per-user limits to prevent abuse

## 🚀 Performance Optimizations

### Caching

- **Blog Lists**: 5-minute cache for filtered blog lists
- **Individual Blogs**: 10-minute cache for blog details
- **Slug Lookups**: 10-minute cache for slug-based retrieval

### Database Optimization

- **Indexed Fields**: All filterable fields are indexed
- **Compound Indexes**: Optimized for common query patterns
- **Text Search**: Full-text search on title, content, and summary

## 🔄 Migration Guide

### For Existing Blogs

Existing blogs will work without modification. New fields will be populated as follows:

1. **Slugs**: Will be generated when blogs are updated
2. **Mood**: Will default to 'Other'
3. **PublishedAt**: Will be set to creation date for published blogs
4. **AI Summaries**: Can be generated manually using the regenerate endpoint

### Database Migration Script

```javascript
// Optional migration script for existing blogs
const migrateExistingBlogs = async () => {
  const blogs = await Blog.find({ slug: { $exists: false } });
  
  for (const blog of blogs) {
    // Generate slug
    const baseSlug = slugify(blog.title, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    let slug = baseSlug;
    let counter = 1;
    while (await Blog.findOne({ slug, _id: { $ne: blog._id } })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }
    
    // Set publishedAt for published blogs
    const publishedAt = blog.status === 'published' ? blog.createdAt : null;
    
    await Blog.findByIdAndUpdate(blog._id, {
      slug,
      publishedAt,
      mood: blog.mood || 'Other'
    });
  }
};
```

## 🐛 Troubleshooting

### Common Issues

1. **OpenAI API Errors**
   - Check your API key is valid
   - Verify rate limits haven't been exceeded
   - System will fall back to local summarization

2. **Slug Conflicts**
   - System automatically handles conflicts with numbering
   - Check for duplicate titles in your content

3. **Validation Errors**
   - Ensure all required fields are provided
   - Check field length limits
   - Verify mood values are from the allowed enum

4. **Authorization Errors**
   - Ensure user is authenticated
   - Verify user is the blog author or an admin
   - Check JWT token is valid

### Debug Mode

Enable debug logging by setting:

```bash
NODE_ENV=development
DEBUG=blog:*
```

## 📈 Future Enhancements

Potential future improvements:

1. **Advanced AI Features**
   - Content suggestions
   - SEO optimization recommendations
   - Automatic tagging

2. **Enhanced Filtering**
   - Full-text search
   - Semantic search
   - Advanced date ranges

3. **Performance**
   - Redis caching
   - Database query optimization
   - CDN integration for images

4. **Analytics**
   - Read time estimation
   - Engagement metrics
   - Popular content tracking

## 🤝 Contributing

When contributing to blog functionality:

1. Follow existing code patterns
2. Add comprehensive validation
3. Include error handling
4. Write tests for new features
5. Update documentation
6. Consider performance implications

## 📄 License

This enhancement is part of the VocalInk project and follows the same licensing terms.
