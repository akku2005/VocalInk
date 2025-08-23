const natural = require('natural');
const logger = require('../utils/logger');
const Blog = require('../models/blog.model');
const Series = require('../models/series.model');
const User = require('../models/user.model');

class AISearchService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.similarity = natural.JaroWinklerDistance;
    this.stemmer = natural.PorterStemmer;
    
    // Search index cache
    this.searchIndex = new Map();
    this.lastIndexUpdate = null;
  }

  /**
   * Perform semantic search across content
   */
  async semanticSearch(query, options = {}) {
    try {
      const {
        contentType = 'all', // 'blogs', 'series', 'users', 'all'
        limit = 20,
        filters = {},
        includeSimilar = true
      } = options;

      // Preprocess query
      const processedQuery = this.preprocessQuery(query);
      
      // Build search index if needed
      await this.buildSearchIndex();

      const results = {
        blogs: [],
        series: [],
        users: [],
        similar: [],
        suggestions: []
      };

      // Search blogs
      if (contentType === 'all' || contentType === 'blogs') {
        results.blogs = await this.searchBlogs(processedQuery, limit, filters);
      }

      // Search series
      if (contentType === 'all' || contentType === 'series') {
        results.series = await this.searchSeries(processedQuery, limit, filters);
      }

      // Search users
      if (contentType === 'all' || contentType === 'users') {
        results.users = await this.searchUsers(processedQuery, limit, filters);
      }

      // Get similar content
      if (includeSimilar) {
        results.similar = await this.findSimilarContent(processedQuery, limit);
      }

      // Generate search suggestions
      results.suggestions = this.generateSearchSuggestions(processedQuery, results);

      logger.info('Semantic search completed', {
        query: processedQuery.original,
        resultsCount: {
          blogs: results.blogs.length,
          series: results.series.length,
          users: results.users.length,
          similar: results.similar.length
        }
      });

      return results;

    } catch (error) {
      logger.error('Error performing semantic search:', error);
      throw error;
    }
  }

  /**
   * Search blogs with semantic understanding
   */
  async searchBlogs(query, limit = 20, filters = {}) {
    try {
      const { keywords, categories, tags, dateRange } = filters;

      // Build base query
      const baseQuery = {
        status: 'published'
      };

      // Add filters
      if (categories && categories.length > 0) {
        baseQuery.category = { $in: categories };
      }

      if (tags && tags.length > 0) {
        baseQuery.tags = { $in: tags };
      }

      if (dateRange) {
        baseQuery.createdAt = {
          $gte: dateRange.start,
          $lte: dateRange.end
        };
      }

      // Get blogs
      const blogs = await Blog.find(baseQuery)
        .populate('author', 'name avatar')
        .limit(limit * 2); // Get more to filter by relevance

      // Score blogs based on semantic similarity
      const scoredBlogs = blogs.map(blog => ({
        ...blog.toObject(),
        relevanceScore: this.calculateBlogRelevance(blog, query),
        semanticScore: this.calculateSemanticSimilarity(blog, query)
      }));

      // Sort by combined score
      const sortedBlogs = scoredBlogs
        .sort((a, b) => {
          const scoreA = a.relevanceScore * 0.6 + a.semanticScore * 0.4;
          const scoreB = b.relevanceScore * 0.6 + b.semanticScore * 0.4;
          return scoreB - scoreA;
        })
        .slice(0, limit);

      return sortedBlogs;

    } catch (error) {
      logger.error('Error searching blogs:', error);
      return [];
    }
  }

  /**
   * Search series with semantic understanding
   */
  async searchSeries(query, limit = 20, filters = {}) {
    try {
      const { categories, difficulty, status } = filters;

      const baseQuery = {
        visibility: 'public'
      };

      if (categories && categories.length > 0) {
        baseQuery.category = { $in: categories };
      }

      if (difficulty) {
        baseQuery.difficulty = difficulty;
      }

      if (status) {
        baseQuery.status = status;
      }

      const series = await Series.find(baseQuery)
        .populate('authorId', 'name profilePicture')
        .limit(limit * 2);

      const scoredSeries = series.map(s => ({
        ...s.toObject(),
        relevanceScore: this.calculateSeriesRelevance(s, query),
        semanticScore: this.calculateSemanticSimilarity(s, query)
      }));

      return scoredSeries
        .sort((a, b) => {
          const scoreA = a.relevanceScore * 0.6 + a.semanticScore * 0.4;
          const scoreB = b.relevanceScore * 0.6 + b.semanticScore * 0.4;
          return scoreB - scoreA;
        })
        .slice(0, limit);

    } catch (error) {
      logger.error('Error searching series:', error);
      return [];
    }
  }

  /**
   * Search users with semantic understanding
   */
  async searchUsers(query, limit = 20, filters = {}) {
    try {
      const { role, hasContent } = filters;

      const baseQuery = {};

      if (role) {
        baseQuery.role = role;
      }

      const users = await User.find(baseQuery)
        .select('-password -resetPasswordToken -resetPasswordCode')
        .populate('badges', 'name icon')
        .limit(limit * 2);

      const scoredUsers = users.map(user => ({
        ...user.toObject(),
        relevanceScore: this.calculateUserRelevance(user, query),
        semanticScore: this.calculateSemanticSimilarity(user, query)
      }));

      return scoredUsers
        .sort((a, b) => {
          const scoreA = a.relevanceScore * 0.6 + a.semanticScore * 0.4;
          const scoreB = b.relevanceScore * 0.6 + b.semanticScore * 0.4;
          return scoreB - scoreA;
        })
        .slice(0, limit);

    } catch (error) {
      logger.error('Error searching users:', error);
      return [];
    }
  }

  /**
   * Auto-generate tags for content
   */
  async autoTagContent(content, contentType = 'blog') {
    try {
      const tags = [];

      // Extract keywords using TF-IDF
      const keywords = this.extractKeywords(content);
      tags.push(...keywords.slice(0, 5));

      // Extract named entities
      const entities = this.extractNamedEntities(content);
      tags.push(...entities.slice(0, 3));

      // Extract topics
      const topics = this.extractTopics(content);
      tags.push(...topics.slice(0, 3));

      // Extract sentiment-based tags
      const sentimentTags = this.extractSentimentTags(content);
      tags.push(...sentimentTags.slice(0, 2));

      // Remove duplicates and normalize
      const uniqueTags = [...new Set(tags)]
        .map(tag => tag.toLowerCase().trim())
        .filter(tag => tag.length > 2 && tag.length < 20)
        .slice(0, 10);

      logger.info('Auto-generated tags', {
        contentType,
        tagCount: uniqueTags.length,
        tags: uniqueTags
      });

      return uniqueTags;

    } catch (error) {
      logger.error('Error auto-generating tags:', error);
      return [];
    }
  }

  /**
   * Find similar content
   */
  async findSimilarContent(query, limit = 10) {
    try {
      const processedQuery = this.preprocessQuery(query);
      
      // Get recent content
      const recentBlogs = await Blog.find({
        status: 'published',
        createdAt: { $gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) }
      })
      .populate('author', 'name avatar')
      .limit(50);

      // Calculate similarity scores
      const similarContent = recentBlogs.map(blog => ({
        ...blog.toObject(),
        similarityScore: this.calculateContentSimilarity(blog, processedQuery)
      }));

      return similarContent
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, limit);

    } catch (error) {
      logger.error('Error finding similar content:', error);
      return [];
    }
  }

  /**
   * Cluster content by similarity
   */
  async clusterContent(contentType = 'blogs', options = {}) {
    try {
      const { limit = 100, minClusterSize = 3 } = options;

      let content;
      if (contentType === 'blogs') {
        content = await Blog.find({ status: 'published' })
          .populate('author', 'name avatar')
          .limit(limit);
      } else if (contentType === 'series') {
        content = await Series.find({ visibility: 'public' })
          .populate('authorId', 'name profilePicture')
          .limit(limit);
      }

      // Build similarity matrix
      const similarityMatrix = this.buildSimilarityMatrix(content);

      // Perform clustering
      const clusters = this.performClustering(similarityMatrix, minClusterSize);

      // Format results
      const clusterResults = clusters.map((cluster, index) => ({
        clusterId: index,
        size: cluster.length,
        items: cluster.map(itemIndex => content[itemIndex]),
        centroid: this.calculateClusterCentroid(cluster.map(itemIndex => content[itemIndex])),
        keywords: this.extractClusterKeywords(cluster.map(itemIndex => content[itemIndex]))
      }));

      logger.info('Content clustering completed', {
        contentType,
        totalItems: content.length,
        clusterCount: clusterResults.length
      });

      return clusterResults;

    } catch (error) {
      logger.error('Error clustering content:', error);
      return [];
    }
  }

  /**
   * Generate search suggestions
   */
  generateSearchSuggestions(query, searchResults) {
    try {
      const suggestions = [];

      // Extract popular tags from results
      const allTags = [];
      searchResults.blogs.forEach(blog => {
        allTags.push(...(blog.tags || []));
      });
      searchResults.series.forEach(series => {
        allTags.push(...(series.tags || []));
      });

      const tagFrequency = {};
      allTags.forEach(tag => {
        tagFrequency[tag] = (tagFrequency[tag] || 0) + 1;
      });

      const popularTags = Object.entries(tagFrequency)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([tag]) => tag);

      suggestions.push(...popularTags);

      // Generate related queries
      const relatedQueries = this.generateRelatedQueries(query);
      suggestions.push(...relatedQueries);

      // Add trending topics
      const trendingTopics = this.getTrendingTopics();
      suggestions.push(...trendingTopics);

      return [...new Set(suggestions)].slice(0, 10);

    } catch (error) {
      logger.error('Error generating search suggestions:', error);
      return [];
    }
  }

  /**
   * Helper methods
   */
  preprocessQuery(query) {
    const original = query;
    const normalized = query.toLowerCase().trim();
    const tokens = this.tokenizer.tokenize(normalized);
    const stems = tokens.map(token => this.stemmer.stem(token));
    const keywords = this.extractKeywords(query);

    return {
      original,
      normalized,
      tokens,
      stems,
      keywords
    };
  }

  async buildSearchIndex() {
    try {
      const now = Date.now();
      
      // Rebuild index every hour
      if (this.lastIndexUpdate && (now - this.lastIndexUpdate) < 60 * 60 * 1000) {
        return;
      }

      // Clear existing index
      this.searchIndex.clear();

      // Index blogs
      const blogs = await Blog.find({ status: 'published' })
        .select('title content tags category author')
        .limit(1000);

      blogs.forEach(blog => {
        const content = `${blog.title} ${blog.content}`;
        this.tfidf.addDocument(content);
        this.searchIndex.set(blog._id.toString(), {
          type: 'blog',
          content,
          tags: blog.tags || [],
          category: blog.category
        });
      });

      this.lastIndexUpdate = now;
      logger.info('Search index rebuilt', { documentCount: blogs.length });

    } catch (error) {
      logger.error('Error building search index:', error);
    }
  }

  calculateBlogRelevance(blog, query) {
    let score = 0;

    // Title match
    const titleMatch = this.calculateTextSimilarity(blog.title, query.original);
    score += titleMatch * 0.4;

    // Content match
    const contentMatch = this.calculateTextSimilarity(blog.content, query.original);
    score += contentMatch * 0.3;

    // Tag match
    const tagMatch = this.calculateTagSimilarity(blog.tags || [], query.keywords);
    score += tagMatch * 0.2;

    // Category match
    if (blog.category && query.keywords.includes(blog.category.toLowerCase())) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  calculateSeriesRelevance(series, query) {
    let score = 0;

    // Title match
    const titleMatch = this.calculateTextSimilarity(series.title, query.original);
    score += titleMatch * 0.4;

    // Description match
    const descMatch = this.calculateTextSimilarity(series.description, query.original);
    score += descMatch * 0.3;

    // Tag match
    const tagMatch = this.calculateTagSimilarity(series.tags || [], query.keywords);
    score += tagMatch * 0.2;

    // Category match
    if (series.category && query.keywords.includes(series.category.toLowerCase())) {
      score += 0.1;
    }

    return Math.min(score, 1.0);
  }

  calculateUserRelevance(user, query) {
    let score = 0;

    // Name match
    const nameMatch = this.calculateTextSimilarity(user.name, query.original);
    score += nameMatch * 0.5;

    // Bio match
    if (user.bio) {
      const bioMatch = this.calculateTextSimilarity(user.bio, query.original);
      score += bioMatch * 0.3;
    }

    // Occupation match
    if (user.occupation) {
      const occupationMatch = this.calculateTextSimilarity(user.occupation, query.original);
      score += occupationMatch * 0.2;
    }

    return Math.min(score, 1.0);
  }

  calculateSemanticSimilarity(content, query) {
    try {
      const contentText = this.extractContentText(content);
      const queryText = query.original;

      // Use TF-IDF for semantic similarity
      this.tfidf.addDocument(contentText);
      this.tfidf.addDocument(queryText);

      const contentTerms = this.tfidf.listTerms(0);
      const queryTerms = this.tfidf.listTerms(1);

      // Calculate cosine similarity
      const similarity = this.calculateCosineSimilarity(contentTerms, queryTerms);
      return similarity;

    } catch (error) {
      logger.error('Error calculating semantic similarity:', error);
      return 0;
    }
  }

  calculateTextSimilarity(text1, text2) {
    if (!text1 || !text2) return 0;
    return this.similarity(text1.toLowerCase(), text2.toLowerCase());
  }

  calculateTagSimilarity(tags1, tags2) {
    if (!tags1.length || !tags2.length) return 0;
    
    const set1 = new Set(tags1.map(t => t.toLowerCase()));
    const set2 = new Set(tags2.map(t => t.toLowerCase()));
    
    const intersection = new Set([...set1].filter(t => set2.has(t)));
    const union = new Set([...set1, ...set2]);
    
    return intersection.size / union.size;
  }

  calculateCosineSimilarity(terms1, terms2) {
    const vector1 = new Map(terms1.map(t => [t.term, t.score]));
    const vector2 = new Map(terms2.map(t => [t.term, t.score]));

    let dotProduct = 0;
    let norm1 = 0;
    let norm2 = 0;

    const allTerms = new Set([...vector1.keys(), ...vector2.keys()]);

    allTerms.forEach(term => {
      const val1 = vector1.get(term) || 0;
      const val2 = vector2.get(term) || 0;
      
      dotProduct += val1 * val2;
      norm1 += val1 * val1;
      norm2 += val2 * val2;
    });

    if (norm1 === 0 || norm2 === 0) return 0;
    return dotProduct / (Math.sqrt(norm1) * Math.sqrt(norm2));
  }

  extractKeywords(content) {
    const text = typeof content === 'string' ? content : this.extractContentText(content);
    const words = this.tokenizer.tokenize(text.toLowerCase());
    
    // Filter out common words
    const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by']);
    const filteredWords = words.filter(word => 
      word.length > 3 && !stopWords.has(word) && /^[a-zA-Z]+$/.test(word)
    );

    // Count frequency
    const frequency = {};
    filteredWords.forEach(word => {
      frequency[word] = (frequency[word] || 0) + 1;
    });

    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word]) => word);
  }

  extractNamedEntities(content) {
    // Simple named entity extraction
    const text = typeof content === 'string' ? content : this.extractContentText(content);
    const entities = [];

    // Extract capitalized words (potential names)
    const capitalizedWords = text.match(/\b[A-Z][a-z]+\b/g) || [];
    entities.push(...capitalizedWords.slice(0, 5));

    // Extract technical terms
    const technicalTerms = text.match(/\b[A-Z]{2,}\b/g) || [];
    entities.push(...technicalTerms.slice(0, 3));

    return [...new Set(entities)];
  }

  extractTopics(content) {
    const text = typeof content === 'string' ? content : this.extractContentText(content);
    const topics = [];

    // Extract topic patterns
    const topicPatterns = [
      /\b(technology|tech|software|programming|coding)\b/gi,
      /\b(business|entrepreneur|startup|marketing)\b/gi,
      /\b(health|fitness|wellness|nutrition)\b/gi,
      /\b(travel|adventure|exploration)\b/gi,
      /\b(education|learning|teaching|study)\b/gi
    ];

    topicPatterns.forEach(pattern => {
      const matches = text.match(pattern);
      if (matches) {
        topics.push(...matches.map(m => m.toLowerCase()));
      }
    });

    return [...new Set(topics)];
  }

  extractSentimentTags(content) {
    const text = typeof content === 'string' ? content : this.extractContentText(content);
    const tags = [];

    // Positive sentiment words
    const positiveWords = ['amazing', 'awesome', 'great', 'excellent', 'wonderful', 'fantastic'];
    const negativeWords = ['terrible', 'awful', 'horrible', 'bad', 'worst', 'disappointing'];

    positiveWords.forEach(word => {
      if (text.toLowerCase().includes(word)) {
        tags.push('positive');
      }
    });

    negativeWords.forEach(word => {
      if (text.toLowerCase().includes(word)) {
        tags.push('negative');
      }
    });

    return [...new Set(tags)];
  }

  extractContentText(content) {
    if (typeof content === 'string') return content;
    
    if (content.title && content.content) {
      return `${content.title} ${content.content}`;
    }
    
    if (content.title) return content.title;
    if (content.content) return content.content;
    if (content.description) return content.description;
    if (content.name) return content.name;
    
    return '';
  }

  calculateContentSimilarity(content1, query) {
    const text1 = this.extractContentText(content1);
    const text2 = query.original;
    
    return this.calculateTextSimilarity(text1, text2);
  }

  buildSimilarityMatrix(content) {
    const matrix = [];
    
    for (let i = 0; i < content.length; i++) {
      matrix[i] = [];
      for (let j = 0; j < content.length; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          matrix[i][j] = this.calculateContentSimilarity(content[i], { original: this.extractContentText(content[j]) });
        }
      }
    }
    
    return matrix;
  }

  performClustering(similarityMatrix, minClusterSize) {
    const clusters = [];
    const visited = new Set();

    for (let i = 0; i < similarityMatrix.length; i++) {
      if (visited.has(i)) continue;

      const cluster = [i];
      visited.add(i);

      for (let j = i + 1; j < similarityMatrix.length; j++) {
        if (visited.has(j)) continue;

        if (similarityMatrix[i][j] > 0.7) { // Similarity threshold
          cluster.push(j);
          visited.add(j);
        }
      }

      if (cluster.length >= minClusterSize) {
        clusters.push(cluster);
      }
    }

    return clusters;
  }

  calculateClusterCentroid(clusterItems) {
    // Calculate average position of cluster items
    const totalSimilarity = clusterItems.reduce((sum, item, index) => {
      return sum + (index + 1) / clusterItems.length;
    }, 0);
    
    return totalSimilarity / clusterItems.length;
  }

  extractClusterKeywords(clusterItems) {
    const allText = clusterItems.map(item => this.extractContentText(item)).join(' ');
    return this.extractKeywords(allText);
  }

  generateRelatedQueries(query) {
    const related = [];
    
    // Add synonyms
    const synonyms = {
      'technology': ['tech', 'software', 'programming'],
      'business': ['entrepreneur', 'startup', 'marketing'],
      'health': ['fitness', 'wellness', 'nutrition'],
      'travel': ['adventure', 'exploration', 'tourism']
    };

    query.keywords.forEach(keyword => {
      if (synonyms[keyword]) {
        related.push(...synonyms[keyword]);
      }
    });

    return related.slice(0, 5);
  }

  getTrendingTopics() {
    // This would typically query analytics data
    // For now, return common topics
    return ['technology', 'business', 'health', 'travel', 'education'];
  }
}

module.exports = new AISearchService(); 