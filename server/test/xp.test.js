const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');
const XPTransaction = require('../src/models/xpTransaction.model');
const Badge = require('../src/models/badge.model');
const XPService = require('../src/services/XPService');
const QualityService = require('../src/services/QualityService');

describe('XP System Tests', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Use shared MongoDB connection from setup.js
    // The connection is already established in setup.js
  });

  beforeEach(async () => {
    // Create test user
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'writer',
      isVerified: true // Ensure user is verified for tests
    });

    // Generate auth token directly instead of using API
    const TokenService = require('../src/services/TokenService');
    const token = await TokenService.generateAuthToken(testUser._id);
    authToken = token;
  });

  afterEach(async () => {
    // Clean up test data
    await User.deleteMany({});
    await XPTransaction.deleteMany({});
  });

  afterAll(async () => {
    // Cleanup is handled in setup.js
  });

  describe('XP Service Tests', () => {
    test('should award XP for valid action', async () => {
      const result = await XPService.awardXP(
        testUser._id,
        'daily_login',
        {},
        { ip: '127.0.0.1', userAgent: 'test', platform: 'web' }
      );

      expect(result.success).toBe(true);
      expect(result.xpAwarded).toBeGreaterThan(0);
      expect(result.newTotalXP).toBeGreaterThan(testUser.xp);
    });

    test('should respect daily limits', async () => {
      // Award XP once for daily_login (limit is 1)
      await XPService.awardXP(
        testUser._id,
        'daily_login',
        {},
        { ip: '127.0.0.1', userAgent: 'test', platform: 'web' }
      );

      // Try to award XP again (should fail due to daily limit)
      await expect(
        XPService.awardXP(
          testUser._id,
          'daily_login',
          {},
          { ip: '127.0.0.1', userAgent: 'test', platform: 'web' }
        )
      ).rejects.toThrow('Daily limit exceeded');
    });

    test('should calculate level correctly', () => {
      expect(XPService.calculateLevel(0)).toBe(1);
      expect(XPService.calculateLevel(100)).toBe(2);
      expect(XPService.calculateLevel(500)).toBe(4);
      expect(XPService.calculateLevel(1000)).toBe(5);
    });

    test('should detect fraud for suspicious activity', async () => {
      // Award XP rapidly to trigger fraud detection
      for (let i = 0; i < 20; i++) {
        await XPService.awardXP(
          testUser._id,
          'write_comment',
          { commentId: new mongoose.Types.ObjectId() },
          { ip: '127.0.0.1', userAgent: 'test', platform: 'web' }
        );
      }

      const transactions = await XPTransaction.find({ userId: testUser._id });
      const flaggedTransactions = transactions.filter(tx => tx.flags.length > 0);
      
      expect(flaggedTransactions.length).toBeGreaterThan(0);
    });
  });

  describe('Quality Service Tests', () => {
    test('should calculate quality score for content', async () => {
      const content = `
        This is a well-written blog post with proper structure and formatting.
        It contains multiple paragraphs and demonstrates good writing quality.
        The content is engaging and provides value to readers.
      `;

      const result = await QualityService.calculateContentQuality(content, {
        wordCount: content.split(/\s+/).length,
        estimatedReadingTime: 30,
      });

      expect(result.overallScore).toBeGreaterThan(0);
      expect(result.overallScore).toBeLessThanOrEqual(100);
      expect(result.grade).toBeDefined();
      expect(result.multiplier).toBeGreaterThanOrEqual(1.0);
    });

    test('should validate content quality', () => {
      const shortContent = 'Too short';
      const validation = QualityService.validateContentQuality(shortContent);

      expect(validation.isValid).toBe(false);
      expect(validation.issues.length).toBeGreaterThan(0);
    });

    test('should calculate readability score', () => {
      const content = 'This is a simple sentence. It has good readability.';
      const score = QualityService.calculateReadabilityScore(content);

      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThanOrEqual(100);
    });
  });

  describe('XP API Tests', () => {
    test('should get user XP information', async () => {
      const response = await request(app)
        .get('/api/xp/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('xp');
      expect(response.body.data).toHaveProperty('level');
      expect(response.body.data).toHaveProperty('badges');
    });

    test('should get transaction history', async () => {
      // First award some XP
      await XPService.awardXP(
        testUser._id,
        'daily_login',
        {},
        { ip: '127.0.0.1', userAgent: 'test', platform: 'web' }
      );

      const response = await request(app)
        .get('/api/xp/history')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.transactions).toBeInstanceOf(Array);
    });

    test('should get user statistics', async () => {
      const response = await request(app)
        .get('/api/xp/stats?timeframe=month')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('stats');
    });

    test('should get leaderboard', async () => {
      const response = await request(app)
        .get('/api/xp/leaderboard?type=xp&limit=10')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('leaderboard');
    });

    test('should get XP configuration', async () => {
      const response = await request(app)
        .get('/api/xp/config')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('xpConfig');
      expect(response.body.data).toHaveProperty('qualityMultipliers');
    });
  });

  describe('User Model XP Tests', () => {
    test('should update streaks correctly', async () => {
      await testUser.updateStreak('login', 'increment');
      
      expect(testUser.streaks.login.current).toBe(1);
      expect(testUser.streaks.login.longest).toBe(1);
    });

    test('should calculate level correctly', () => {
      testUser.xp = 500;
      const level = testUser.calculateLevel(testUser.xp);
      
      expect(level).toBe(4);
    });

    test('should check feature unlocks', async () => {
      testUser.level = 10;
      await testUser.checkFeatureUnlocks();
      
      const hasFeature = testUser.hasFeatureUnlocked('blog_monetization');
      expect(hasFeature).toBe(true);
    });

    test('should update quality score', async () => {
      const initialScore = testUser.qualityScore;
      await testUser.updateQualityScore(85);
      
      expect(testUser.qualityScore).toBeGreaterThan(initialScore);
    });
  });

  describe('XP Transaction Model Tests', () => {
    test('should create transaction with proper metadata', async () => {
      const transaction = new XPTransaction({
        userId: testUser._id,
        action: 'daily_login',
        baseAmount: 5,
        finalAmount: 5,
        reason: 'Daily login',
        previousXP: 0,
        newXP: 5,
        previousLevel: 1,
        newLevel: 1,
        metadata: {
          ipAddress: '127.0.0.1',
          userAgent: 'test',
          platform: 'web',
        },
      });

      await transaction.save();

      expect(transaction._id).toBeDefined();
      expect(transaction.status).toBe('approved');
      expect(transaction.metadata.platform).toBe('web');
    });

    test('should flag suspicious transactions', async () => {
      const transaction = new XPTransaction({
        userId: testUser._id,
        action: 'write_comment',
        baseAmount: 10,
        finalAmount: 10,
        reason: 'Writing comment',
        previousXP: 0,
        newXP: 10,
        previousLevel: 1,
        newLevel: 1,
      });

      await transaction.flag('velocity', 'High XP velocity detected', 'high');
      
      expect(transaction.flags.length).toBe(1);
      expect(transaction.status).toBe('under_review');
    });

    test('should get user transaction history', async () => {
      // Create some test transactions
      await XPTransaction.create([
        {
          userId: testUser._id,
          action: 'daily_login',
          baseAmount: 5,
          finalAmount: 5,
          reason: 'Daily login',
          previousXP: 0,
          newXP: 5,
          previousLevel: 1,
          newLevel: 1,
        },
        {
          userId: testUser._id,
          action: 'write_comment',
          baseAmount: 10,
          finalAmount: 10,
          reason: 'Writing comment',
          previousXP: 5,
          newXP: 15,
          previousLevel: 1,
          newLevel: 1,
        },
      ]);

      const history = await XPTransaction.getUserTransactionHistory(testUser._id, { limit: 10 });
      
      expect(history.length).toBe(2);
      // Check that both actions exist in history (order may vary)
      const actions = history.map(tx => tx.action);
      expect(actions).toContain('write_comment');
      expect(actions).toContain('daily_login');
    });
  });

  describe('Integration Tests', () => {
    test('should award XP for blog creation and publishing', async () => {
      // Create blog
      const blogResponse = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Blog',
          content: 'This is a test blog post with sufficient content to meet quality standards.',
          tags: ['test'],
        });

      expect(blogResponse.status).toBe(201);

      // Publish blog
      const publishResponse = await request(app)
        .put(`/api/blogs/${blogResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          status: 'published',
        });

      expect(publishResponse.status).toBe(200);

      // Check XP was awarded
      const xpResponse = await request(app)
        .get('/api/xp/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(xpResponse.body.data.xp).toBeGreaterThan(0);
    });

    test('should award XP for comment creation', async () => {
      // Create a blog first
      const blogResponse = await request(app)
        .post('/api/blogs')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          title: 'Test Blog',
          content: 'Test content',
          status: 'published',
        });

      // Create comment
      const commentResponse = await request(app)
        .post(`/api/comments/blog/${blogResponse.body._id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          content: 'This is a thoughtful comment that should earn XP.',
        });

      expect(commentResponse.status).toBe(201);

      // Check XP was awarded
      const xpResponse = await request(app)
        .get('/api/xp/user')
        .set('Authorization', `Bearer ${authToken}`);

      expect(xpResponse.body.data.xp).toBeGreaterThan(0);
    });
  });
}); 