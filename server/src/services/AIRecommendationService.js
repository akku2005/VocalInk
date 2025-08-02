const natural = require('natural');
const logger = require('../utils/logger');
const Blog = require('../models/blog.model');
const Series = require('../models/series.model');
const User = require('../models/user.model');
const SeriesProgress = require('../models/seriesProgress.model');

class AIRecommendationService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.similarity = natural.JaroWinklerDistance;
  }

  /**
   * Get personalized recommendations for a user
   */
  async getPersonalizedRecommendations(userId, options = {}) {
    try {
      const {
        limit = 10,
        contentType = 'all', // 'blogs', 'series', 'all'
        includeTrending = true,
        excludeRead = true
      } = options;

      const user = await User.findById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Get user preferences and behavior
      const userProfile = await this.buildUserProfile(userId);
      
      // Get content recommendations
      const recommendations = {
        blogs: [],
        series: [],
        trending: [],
        similar: []
      };

      if (contentType === 'all' || contentType === 'blogs') {
        recommendations.blogs = await this.getBlogRecommendations(userProfile, limit);
      }

      if (contentType === 'all' || contentType === 'series') {
        recommendations.series = await this.getSeriesRecommendations(userProfile, limit);
      }

      if (includeTrending) {
        recommendations.trending = await this.getTrendingContent(limit);
      }

      // Get similar content based on recent activity
      recommendations.similar = await this.getSimilarContent(userId, limit);

      logger.info('Personalized recommendations generated', {
        userId,
        recommendationsCount: {
          blogs: recommendations.blogs.length,
          series: recommendations.series.length,
          trending: recommendations.trending.length,
          similar: recommendations.similar.length
        }
      });

      return recommendations;

    } catch (error) {
      logger.error('Error generating personalized recommendations:', error);
      throw error;
    }
  }

  /**
   * Build user profile based on behavior and preferences
   */
  async buildUserProfile(userId) {
    try {
      const user = await User.findById(userId);
      
      // Get user's reading history
      const readBlogs = await Blog.find({
        'likedBy': userId,
        status: 'published'
      }).select('title content tags category');

      const userProgress = await SeriesProgress.findByUser(userId);
      
      // Analyze reading preferences
      const preferences = {
        categories: this.extractCategories(readBlogs),
        tags: this.extractTags(readBlogs),
        topics: this.extractTopics(readBlogs),
        readingTime: this.calculateAverageReadingTime(userProgress),
        engagementLevel: this.calculateEngagementLevel(user),
        preferredContentType: this.determinePreferredContentType(readBlogs, userProgress)
      };

      // Build content vector
      const contentVector = this.buildContentVector(readBlogs);

      return {
        userId,
        preferences,
        contentVector,
        readingHistory: readBlogs.length,
        seriesProgress: userProgress.length
      };

    } catch (error) {
      logger.error('Error building user profile:', error);
      throw error;
    }
  }

  /**
   * Get blog recommendations based on user profile
   */
  async getBlogRecommendations(userProfile, limit = 10) {
    try {
      const { preferences, contentVector } = userProfile;

      // Build query based on user preferences
      const query = {
        status: 'published',
        author: { $ne: userProfile.userId } // Exclude user's own content
      };

      // Add category filter if user has strong preferences
      if (preferences.categories.length > 0) {
        query.category = { $in: preferences.categories.slice(0, 3) };
      }

      // Add tag filter
      if (preferences.tags.length > 0) {
        query.tags = { $in: preferences.tags.slice(0, 5) };
      }

      const blogs = await Blog.find(query)
        .populate('author', 'name avatar')
        .sort({ createdAt: -1 })
        .limit(limit * 2); // Get more to filter by similarity

      // Score and rank blogs
      const scoredBlogs = blogs.map(blog => ({
        ...blog.toObject(),
        score: this.calculateContentSimilarity(blog, contentVector, preferences)
      }));

      // Sort by score and return top results
      return scoredBlogs
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error getting blog recommendations:', error);
      throw error;
    }
  }

  /**
   * Get series recommendations based on user profile
   */
  async getSeriesRecommendations(userProfile, limit = 10) {
    try {
      const { preferences } = userProfile;

      const query = {
        status: 'active',
        visibility: 'public'
      };

      // Add category filter
      if (preferences.categories.length > 0) {
        query.category = { $in: preferences.categories.slice(0, 3) };
      }

      const series = await Series.find(query)
        .populate('authorId', 'name profilePicture')
        .sort({ 'analytics.totalViews': -1 })
        .limit(limit * 2);

      // Score series based on user preferences
      const scoredSeries = series.map(s => ({
        ...s.toObject(),
        score: this.calculateSeriesScore(s, preferences)
      }));

      return scoredSeries
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error getting series recommendations:', error);
      throw error;
    }
  }

  /**
   * Get trending content using ML-based trending detection
   */
  async getTrendingContent(limit = 10) {
    try {
      const now = new Date();
      const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Get recent content with engagement metrics
      const recentBlogs = await Blog.find({
        status: 'published',
        createdAt: { $gte: oneDayAgo }
      }).select('title content likes bookmarks createdAt');

      // Calculate trending scores
      const trendingBlogs = recentBlogs.map(blog => ({
        ...blog.toObject(),
        trendingScore: this.calculateTrendingScore(blog, now)
      }));

      // Sort by trending score
      return trendingBlogs
        .sort((a, b) => b.trendingScore - a.trendingScore)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error getting trending content:', error);
      throw error;
    }
  }

  /**
   * Get similar content based on user's recent activity
   */
  async getSimilarContent(userId, limit = 10) {
    try {
      // Get user's recently liked content
      const recentLikes = await Blog.find({
        'likedBy': userId,
        status: 'published'
      })
      .sort({ updatedAt: -1 })
      .limit(5);

      if (recentLikes.length === 0) {
        return [];
      }

      // Find similar content
      const similarContent = [];
      
      for (const likedBlog of recentLikes) {
        const similar = await this.findSimilarBlogs(likedBlog, limit / recentLikes.length);
        similarContent.push(...similar);
      }

      // Remove duplicates and sort by similarity
      const uniqueSimilar = this.removeDuplicates(similarContent);
      
      return uniqueSimilar
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error getting similar content:', error);
      throw error;
    }
  }

  /**
   * Calculate content similarity score
   */
  calculateContentSimilarity(content, userVector, preferences) {
    try {
      let score = 0;

      // Category match
      if (preferences.categories.includes(content.category)) {
        score += 0.3;
      }

      // Tag overlap
      const tagOverlap = content.tags?.filter(tag => 
        preferences.tags.includes(tag)
      ).length || 0;
      score += (tagOverlap / Math.max(content.tags?.length || 1, preferences.tags.length)) * 0.2;

      // Content similarity using TF-IDF
      const contentVector = this.buildContentVector([content]);
      const similarity = this.calculateVectorSimilarity(userVector, contentVector);
      score += similarity * 0.3;

      // Engagement potential
      const engagementScore = this.calculateEngagementPotential(content);
      score += engagementScore * 0.2;

      return Math.min(score, 1.0);

    } catch (error) {
      logger.error('Error calculating content similarity:', error);
      return 0;
    }
  }

  /**
   * Calculate trending score for content
   */
  calculateTrendingScore(content, now) {
    try {
      const timeDiff = (now - content.createdAt) / (1000 * 60 * 60); // hours
      const engagement = (content.likes || 0) + (content.bookmarks || 0) * 2;
      
      // Trending formula: engagement / (time + 2)^1.5
      const trendingScore = engagement / Math.pow(timeDiff + 2, 1.5);
      
      return trendingScore;

    } catch (error) {
      logger.error('Error calculating trending score:', error);
      return 0;
    }
  }

  /**
   * Find similar blogs based on content
   */
  async findSimilarBlogs(targetBlog, limit = 5) {
    try {
      const query = {
        status: 'published',
        _id: { $ne: targetBlog._id },
        author: { $ne: targetBlog.author }
      };

      // Add category filter
      if (targetBlog.category) {
        query.category = targetBlog.category;
      }

      const similarBlogs = await Blog.find(query)
        .populate('author', 'name avatar')
        .limit(limit * 2);

      // Calculate similarity scores
      const scoredBlogs = similarBlogs.map(blog => ({
        ...blog.toObject(),
        similarityScore: this.calculateBlogSimilarity(targetBlog, blog)
      }));

      return scoredBlogs
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error finding similar blogs:', error);
      return [];
    }
  }

  /**
   * Calculate similarity between two blogs
   */
  calculateBlogSimilarity(blog1, blog2) {
    try {
      let similarity = 0;

      // Category similarity
      if (blog1.category === blog2.category) {
        similarity += 0.3;
      }

      // Tag overlap
      const tags1 = blog1.tags || [];
      const tags2 = blog2.tags || [];
      const tagOverlap = tags1.filter(tag => tags2.includes(tag)).length;
      const tagSimilarity = tagOverlap / Math.max(tags1.length, tags2.length, 1);
      similarity += tagSimilarity * 0.3;

      // Content similarity using Jaro-Winkler
      const content1 = (blog1.title + ' ' + blog1.content).toLowerCase();
      const content2 = (blog2.title + ' ' + blog2.content).toLowerCase();
      const contentSimilarity = this.similarity(content1, content2);
      similarity += contentSimilarity * 0.4;

      return similarity;

    } catch (error) {
      logger.error('Error calculating blog similarity:', error);
      return 0;
    }
  }

  /**
   * Helper methods for user profile building
   */
  extractCategories(blogs) {
    const categories = {};
    blogs.forEach(blog => {
      if (blog.category) {
        categories[blog.category] = (categories[blog.category] || 0) + 1;
      }
    });
    return Object.keys(categories).sort((a, b) => categories[b] - categories[a]);
  }

  extractTags(blogs) {
    const tags = {};
    blogs.forEach(blog => {
      (blog.tags || []).forEach(tag => {
        tags[tag] = (tags[tag] || 0) + 1;
      });
    });
    return Object.keys(tags).sort((a, b) => tags[b] - tags[a]);
  }

  extractTopics(blogs) {
    // Extract key topics from content using TF-IDF
    const allContent = blogs.map(blog => blog.title + ' ' + blog.content).join(' ');
    this.tfidf.addDocument(allContent);
    
    const terms = this.tfidf.listTerms(0);
    return terms.slice(0, 10).map(term => term.term);
  }

  calculateAverageReadingTime(progress) {
    if (progress.length === 0) return 0;
    const totalTime = progress.reduce((sum, p) => sum + (p.engagement?.totalTimeSpent || 0), 0);
    return totalTime / progress.length;
  }

  calculateEngagementLevel(user) {
    const engagement = (user.totalLikes || 0) + (user.totalComments || 0) + (user.totalBookmarks || 0);
    if (engagement > 100) return 'high';
    if (engagement > 20) return 'medium';
    return 'low';
  }

  determinePreferredContentType(blogs, progress) {
    if (progress.length > blogs.length) return 'series';
    if (blogs.length > progress.length) return 'blogs';
    return 'mixed';
  }

  buildContentVector(blogs) {
    const content = blogs.map(blog => blog.title + ' ' + blog.content).join(' ');
    this.tfidf.addDocument(content);
    return this.tfidf.listTerms(0).slice(0, 20);
  }

  calculateVectorSimilarity(vector1, vector2) {
    // Simple cosine similarity
    const terms1 = new Set(vector1.map(term => term.term));
    const terms2 = new Set(vector2.map(term => term.term));
    const intersection = new Set([...terms1].filter(term => terms2.has(term)));
    const union = new Set([...terms1, ...terms2]);
    return intersection.size / union.size;
  }

  calculateEngagementPotential(content) {
    const likes = content.likes || 0;
    const bookmarks = content.bookmarks || 0;
    const wordCount = content.content?.split(/\s+/).length || 0;
    
    // Normalize engagement metrics
    const engagement = (likes + bookmarks * 2) / Math.max(wordCount / 100, 1);
    return Math.min(engagement / 10, 1.0); // Normalize to 0-1
  }

  calculateSeriesScore(series, preferences) {
    let score = 0;

    // Category match
    if (preferences.categories.includes(series.category)) {
      score += 0.4;
    }

    // Popularity
    const popularity = series.analytics?.totalViews || 0;
    score += Math.min(popularity / 1000, 0.3);

    // Completion rate
    const completionRate = series.analytics?.completionRate || 0;
    score += completionRate * 0.3;

    return score;
  }

  removeDuplicates(content) {
    const seen = new Set();
    return content.filter(item => {
      const key = item._id.toString();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

module.exports = new AIRecommendationService(); 