const mongoose = require('mongoose');
const User = require('../src/models/user.model');
const Series = require('../src/models/series.model');
const Blog = require('../src/models/blog.model');
const JWTService = require('../src/services/JWTService');

class TestUtils {
  static async createTestUser(userData = {}) {
    const defaultUser = {
      name: 'Test User',
      email: `test${Date.now()}@example.com`,
      password: 'password123',
      role: 'writer'
    };

    const user = new User({ ...defaultUser, ...userData });
    await user.save();
    return user;
  }

  static async createTestBlog(userId, blogData = {}) {
    const defaultBlog = {
      title: 'Test Blog Post',
      content: 'This is a test blog post content.',
      summary: 'Test summary',
      author: userId,
      status: 'published'
    };

    const blog = new Blog({ ...defaultBlog, ...blogData });
    await blog.save();
    return blog;
  }

  static async createTestSeries(userId, seriesData = {}) {
    const defaultSeries = {
      title: 'Test Series',
      description: 'A test series for testing',
      category: 'Technology',
      authorId: userId,
      visibility: 'public',
      status: 'active'
    };

    const series = new Series({ ...defaultSeries, ...seriesData });
    await series.save();
    return series;
  }

  static async generateAuthToken(userId) {
    return await JWTService.generateAccessToken({ userId });
  }

  static async cleanupTestData() {
    await User.deleteMany({ email: { $regex: /test.*@example\.com/ } });
    await Series.deleteMany({});
    await Blog.deleteMany({});
  }

  static createValidSeriesData(overrides = {}) {
    return {
      title: 'Test Series',
      description: 'A comprehensive test series for testing purposes',
      category: 'Technology',
      template: 'educational_course',
      visibility: 'public',
      tags: ['test', 'technology'],
      monetization: {
        model: 'free'
      },
      ...overrides
    };
  }

  static createValidEpisodeData(blogId, overrides = {}) {
    return {
      blogId: blogId.toString(),
      order: 1,
      title: 'Test Episode',
      status: 'published',
      estimatedReadTime: 15,
      isPremium: false,
      ...overrides
    };
  }

  static createValidProgressData(episodeId, overrides = {}) {
    return {
      episodeId: episodeId.toString(),
      progress: 50,
      timeSpent: 300,
      ...overrides
    };
  }

  static createValidBookmarkData(episodeId, overrides = {}) {
    return {
      episodeId: episodeId.toString(),
      position: 1500,
      note: 'Test bookmark note',
      ...overrides
    };
  }

  static createValidCollaboratorData(userId, overrides = {}) {
    return {
      userId: userId.toString(),
      role: 'editor',
      permissions: ['read', 'write', 'publish'],
      ...overrides
    };
  }

  static async createCompleteTestSetup() {
    // Create test user
    const user = await this.createTestUser();
    const token = await this.generateAuthToken(user._id);

    // Create test blog
    const blog = await this.createTestBlog(user._id);

    // Create test series
    const series = await this.createTestSeries(user._id);

    return {
      user,
      blog,
      series,
      token
    };
  }

  static validateSeriesResponse(response, expectedData = {}) {
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeDefined();

    const series = response.body.data;
    expect(series.title).toBeDefined();
    expect(series.description).toBeDefined();
    expect(series.category).toBeDefined();
    expect(series.authorId).toBeDefined();

    // Check specific expected data
    Object.keys(expectedData).forEach(key => {
      expect(series[key]).toBe(expectedData[key]);
    });

    return series;
  }

  static validateErrorResponse(response, expectedStatus = 400) {
    expect(response.status).toBe(expectedStatus);
    expect(response.body.success).toBe(false);
    expect(response.body.message).toBeDefined();
  }

  static validatePaginationResponse(response, expectedPage = 1, expectedLimit = 10) {
    expect(response.body.success).toBe(true);
    expect(response.body.data).toBeInstanceOf(Array);
    expect(response.body.pagination).toBeDefined();
    expect(response.body.pagination.page).toBe(expectedPage);
    expect(response.body.pagination.limit).toBe(expectedLimit);
    expect(response.body.pagination.total).toBeDefined();
    expect(response.body.pagination.totalPages).toBeDefined();
  }
}

module.exports = TestUtils; 