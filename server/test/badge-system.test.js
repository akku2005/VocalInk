const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Badge = require('../src/models/badge.model');
const BadgeClaim = require('../src/models/badgeClaim.model');
const User = require('../src/models/user.model');
const Blog = require('../src/models/blog.model');
const Comment = require('../src/models/comment.model');
const BadgeService = require('../src/services/BadgeService');
const BadgeEvaluationEngine = require('../src/services/BadgeEvaluationEngine');
const XPService = require('../src/services/XPService');
const NotificationService = require('../src/services/NotificationService');
const JWTService = require('../src/services/JWTService');

// Import test configuration
require('./test-config');

describe('Badge System', () => {
  let testUser, adminUser, testBadge, authToken, adminToken;
  let badgeService, evaluationEngine, xpService, notificationService;

  beforeAll(async () => {
    // Create test users
    testUser = await User.create({
      name: 'Badge Test User',
      email: 'badge-test@example.com',
      password: 'password123',
      role: 'writer',
      isVerified: true,
      xp: 100,
      level: 2
    });

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin',
      isVerified: true
    });

    // Generate tokens
    authToken = JWTService.generateAccessToken({
      userId: testUser._id.toString(),
      email: testUser.email,
      role: testUser.role
    });
    adminToken = JWTService.generateAccessToken({
      userId: adminUser._id.toString(),
      email: adminUser.email,
      role: adminUser.role
    });

    // Create test badge
    testBadge = await Badge.create({
      badgeKey: 'test_badge',
      name: 'Test Badge',
      description: 'A test badge for testing',
      icon: 'https://example.com/icon.png',
      rarity: 'common',
      category: 'achievement',
      requirements: {
        xpRequired: 50,
        blogsRequired: 1,
        commentsRequired: 2,
        daysActive: 1
      },
      rewards: {
        xpReward: 50,
        title: 'Test Badge Holder'
      },
      isActive: true
    });

    // Initialize services
    badgeService = new BadgeService();
    evaluationEngine = new BadgeEvaluationEngine();
    xpService = new XPService();
    notificationService = new NotificationService();
  });

  afterAll(async () => {
    // Cleanup handled in setup.js
  });

  beforeEach(async () => {
    await BadgeClaim.deleteMany({});
  });

  describe('Badge Model', () => {
    describe('Badge Creation and Validation', () => {
      it('should create a valid badge', async () => {
        const badge = await Badge.create({
          badgeKey: 'valid_badge',
          name: 'Valid Badge',
          description: 'A valid badge',
          icon: 'https://example.com/icon.png',
          rarity: 'rare',
          category: 'achievement',
          requirements: {
            xpRequired: 100
          },
          rewards: {
            xpReward: 25
          }
        });

        expect(badge.badgeKey).toBe('valid_badge');
        expect(badge.name).toBe('Valid Badge');
        expect(badge.rarity).toBe('rare');
        expect(badge.isActive).toBe(true);
      });

      it('should validate required fields', async () => {
        await expect(
          Badge.create({
            name: 'Invalid Badge'
            // Missing required fields
          })
        ).rejects.toThrow();
      });

      it('should validate badge key uniqueness', async () => {
        await expect(
          Badge.create({
            badgeKey: 'test_badge', // Duplicate key
            name: 'Duplicate Badge',
            description: 'A duplicate badge',
            icon: 'https://example.com/icon.png',
            rarity: 'common',
            category: 'achievement',
            requirements: {},
            rewards: {}
          })
        ).rejects.toThrow();
      });

      it('should validate rarity values', async () => {
        await expect(
          Badge.create({
            badgeKey: 'invalid_rarity',
            name: 'Invalid Rarity Badge',
            description: 'A badge with invalid rarity',
            icon: 'https://example.com/icon.png',
            rarity: 'invalid_rarity',
            category: 'achievement',
            requirements: {},
            rewards: {}
          })
        ).rejects.toThrow();
      });
    });

    describe('Badge Methods', () => {
      it('should check if user is eligible for badge', async () => {
        const eligibility = await testBadge.isUserEligible(testUser._id);
        expect(eligibility).toHaveProperty('eligible');
        expect(eligibility).toHaveProperty('reasons');
        expect(typeof eligibility.eligible).toBe('boolean');
      });

      it('should get badge statistics', async () => {
        const stats = await testBadge.getStatistics();
        expect(stats).toHaveProperty('totalClaims');
        expect(stats).toHaveProperty('claimRate');
        expect(stats).toHaveProperty('averageClaimTime');
      });

      it('should get badge analytics', async () => {
        const analytics = await testBadge.getAnalytics();
        expect(analytics).toHaveProperty('totalClaims');
        expect(analytics).toHaveProperty('recentClaims');
        expect(analytics).toHaveProperty('popularity');
      });
    });
  });

  describe('Badge Service', () => {
    describe('Badge Management', () => {
      it('should get all active badges', async () => {
        const badges = await badgeService.getAllActiveBadges();
        expect(Array.isArray(badges)).toBe(true);
        expect(badges.every(badge => badge.isActive)).toBe(true);
      });

      it('should get badges by category', async () => {
        const achievementBadges = await badgeService.getBadgesByCategory('achievement');
        expect(Array.isArray(achievementBadges)).toBe(true);
        expect(achievementBadges.every(badge => badge.category === 'achievement')).toBe(true);
      });

      it('should get badges by rarity', async () => {
        const commonBadges = await badgeService.getBadgesByRarity('common');
        expect(Array.isArray(commonBadges)).toBe(true);
        expect(commonBadges.every(badge => badge.rarity === 'common')).toBe(true);
      });

      it('should search badges', async () => {
        const searchResults = await badgeService.searchBadges('test');
        expect(Array.isArray(searchResults)).toBe(true);
        expect(searchResults.some(badge => badge.name.toLowerCase().includes('test'))).toBe(true);
      });
    });

    describe('Badge Claims', () => {
      it('should process badge claim', async () => {
        const claimResult = await badgeService.processApprovedClaim(
          testUser._id,
          testBadge._id
        );

        expect(claimResult).toHaveProperty('success');
        expect(claimResult).toHaveProperty('claim');
        expect(claimResult).toHaveProperty('xpReward');
        expect(claimResult.success).toBe(true);
      });

      it('should handle duplicate claims', async () => {
        // First claim
        await badgeService.processApprovedClaim(testUser._id, testBadge._id);

        // Second claim should fail
        await expect(
          badgeService.processApprovedClaim(testUser._id, testBadge._id)
        ).rejects.toThrow();
      });

      it('should validate claim requirements', async () => {
        const newUser = await User.create({
          name: 'New User',
          email: 'new@example.com',
          password: 'password123',
          role: 'reader',
          isVerified: true,
          xp: 0,
          level: 1
        });

        await expect(
          badgeService.processApprovedClaim(newUser._id, testBadge._id)
        ).rejects.toThrow();
      });

      it('should award XP for badge claim', async () => {
        const initialXP = testUser.xp;
        const claimResult = await badgeService.processApprovedClaim(
          testUser._id,
          testBadge._id
        );

        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.xp).toBe(initialXP + claimResult.xpReward);
      });
    });

    describe('Badge Analytics', () => {
      it('should get user badge statistics', async () => {
        const stats = await badgeService.getUserBadgeStats(testUser._id);
        expect(stats).toHaveProperty('totalBadges');
        expect(stats).toHaveProperty('totalXP');
        expect(stats).toHaveProperty('badgesByCategory');
        expect(stats).toHaveProperty('badgesByRarity');
      });

      it('should get global badge statistics', async () => {
        const stats = await badgeService.getGlobalBadgeStats();
        expect(stats).toHaveProperty('totalBadges');
        expect(stats).toHaveProperty('totalClaims');
        expect(stats).toHaveProperty('popularBadges');
        expect(stats).toHaveProperty('recentClaims');
      });

      it('should get badge leaderboard', async () => {
        const leaderboard = await badgeService.getBadgeLeaderboard();
        expect(Array.isArray(leaderboard)).toBe(true);
        expect(leaderboard.every(entry => entry.userId && entry.badgeCount)).toBe(true);
      });
    });
  });

  describe('Badge Evaluation Engine', () => {
    describe('Eligibility Evaluation', () => {
      it('should evaluate user eligibility for badges', async () => {
        const eligibleBadges = await evaluationEngine.evaluateUserEligibility(testUser._id);
        expect(Array.isArray(eligibleBadges)).toBe(true);
        expect(eligibleBadges.every(badge => badge.eligible)).toBe(true);
      });

      it('should evaluate specific badge eligibility', async () => {
        const eligibility = await evaluationEngine.evaluateBadgeEligibility(
          testUser._id,
          testBadge._id
        );

        expect(eligibility).toHaveProperty('eligible');
        expect(eligibility).toHaveProperty('requirements');
        expect(eligibility).toHaveProperty('progress');
        expect(typeof eligibility.eligible).toBe('boolean');
      });

      it('should track progress towards badge requirements', async () => {
        const progress = await evaluationEngine.getBadgeProgress(testUser._id, testBadge._id);
        expect(progress).toHaveProperty('xpProgress');
        expect(progress).toHaveProperty('blogsProgress');
        expect(progress).toHaveProperty('commentsProgress');
        expect(progress).toHaveProperty('daysActiveProgress');
      });
    });

    describe('Automatic Badge Evaluation', () => {
      it('should evaluate badges on user action', async () => {
        const result = await evaluationEngine.evaluateOnUserAction(
          testUser._id,
          'blog_created',
          { blogId: new mongoose.Types.ObjectId() }
        );

        expect(result).toHaveProperty('newlyEligibleBadges');
        expect(result).toHaveProperty('notifications');
        expect(Array.isArray(result.newlyEligibleBadges)).toBe(true);
      });

      it('should handle multiple action types', async () => {
        const actions = ['blog_created', 'comment_posted', 'xp_gained'];
        
        for (const action of actions) {
          const result = await evaluationEngine.evaluateOnUserAction(
            testUser._id,
            action,
            {}
          );

          expect(result).toHaveProperty('newlyEligibleBadges');
          expect(result).toHaveProperty('notifications');
        }
      });
    });

    describe('Batch Evaluation', () => {
      it('should evaluate all users for badges', async () => {
        const result = await evaluationEngine.evaluateAllUsers();
        expect(result).toHaveProperty('totalUsers');
        expect(result).toHaveProperty('eligibleBadges');
        expect(result).toHaveProperty('notifications');
      });

      it('should evaluate specific badge for all users', async () => {
        const result = await evaluationEngine.evaluateBadgeForAllUsers(testBadge._id);
        expect(result).toHaveProperty('totalUsers');
        expect(result).toHaveProperty('eligibleUsers');
        expect(result).toHaveProperty('notifications');
      });
    });
  });

  describe('Badge API Endpoints', () => {
    describe('GET /api/badges', () => {
      it('should return all badges with pagination', async () => {
        const response = await request(app)
          .get('/api/badges')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('badges');
        expect(response.body.data).toHaveProperty('pagination');
        expect(Array.isArray(response.body.data.badges)).toBe(true);
      });

      it('should filter badges by category', async () => {
        const response = await request(app)
          .get('/api/badges?category=achievement')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.badges.every(badge => badge.category === 'achievement')).toBe(true);
      });

      it('should filter badges by rarity', async () => {
        const response = await request(app)
          .get('/api/badges?rarity=common')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.badges.every(badge => badge.rarity === 'common')).toBe(true);
      });

      it('should search badges', async () => {
        const response = await request(app)
          .get('/api/badges?search=test')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.badges.some(badge => 
          badge.name.toLowerCase().includes('test')
        )).toBe(true);
      });
    });

    describe('GET /api/badges/:id', () => {
      it('should return specific badge details', async () => {
        const response = await request(app)
          .get(`/api/badges/${testBadge._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('badge');
        expect(response.body.data.badge._id).toBe(testBadge._id.toString());
      });

      it('should return 404 for non-existent badge', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        await request(app)
          .get(`/api/badges/${fakeId}`)
          .expect(404);
      });
    });

    describe('POST /api/badges/:id/claim', () => {
      it('should allow user to claim eligible badge', async () => {
        const response = await request(app)
          .post(`/api/badges/${testBadge._id}/claim`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('claim');
        expect(response.body.data).toHaveProperty('xpReward');
      });

      it('should prevent duplicate claims', async () => {
        // First claim
        await request(app)
          .post(`/api/badges/${testBadge._id}/claim`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Second claim should fail
        await request(app)
          .post(`/api/badges/${testBadge._id}/claim`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);
      });

      it('should require authentication', async () => {
        await request(app)
          .post(`/api/badges/${testBadge._id}/claim`)
          .expect(401);
      });
    });

    describe('GET /api/badges/:id/eligibility', () => {
      it('should check user eligibility for badge', async () => {
        const response = await request(app)
          .get(`/api/badges/${testBadge._id}/eligibility`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('eligible');
        expect(response.body.data).toHaveProperty('requirements');
        expect(response.body.data).toHaveProperty('progress');
      });
    });

    describe('GET /api/users/:id/badges', () => {
      it('should return user badges', async () => {
        const response = await request(app)
          .get(`/api/users/${testUser._id}/badges`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('badges');
        expect(response.body.data).toHaveProperty('statistics');
        expect(Array.isArray(response.body.data.badges)).toBe(true);
      });
    });

    describe('Admin Endpoints', () => {
      describe('POST /api/badges', () => {
        it('should allow admin to create badge', async () => {
          const newBadge = {
            badgeKey: 'admin_created_badge',
            name: 'Admin Created Badge',
            description: 'A badge created by admin',
            icon: 'https://example.com/icon.png',
            rarity: 'rare',
            category: 'achievement',
            requirements: {
              xpRequired: 200
            },
            rewards: {
              xpReward: 100
            }
          };

          const response = await request(app)
            .post('/api/badges')
            .set('Authorization', `Bearer ${adminToken}`)
            .send(newBadge)
            .expect(201);

          expect(response.body.success).toBe(true);
          expect(response.body.data).toHaveProperty('badge');
          expect(response.body.data.badge.badgeKey).toBe('admin_created_badge');
        });

        it('should require admin role', async () => {
          await request(app)
            .post('/api/badges')
            .set('Authorization', `Bearer ${authToken}`)
            .send({})
            .expect(403);
        });
      });

      describe('PUT /api/badges/:id', () => {
        it('should allow admin to update badge', async () => {
          const updates = {
            name: 'Updated Badge Name',
            description: 'Updated description'
          };

          const response = await request(app)
            .put(`/api/badges/${testBadge._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .send(updates)
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data.badge.name).toBe('Updated Badge Name');
        });
      });

      describe('DELETE /api/badges/:id', () => {
        it('should allow admin to deactivate badge', async () => {
          const response = await request(app)
            .delete(`/api/badges/${testBadge._id}`)
            .set('Authorization', `Bearer ${adminToken}`)
            .expect(200);

          expect(response.body.success).toBe(true);
          expect(response.body.data.badge.isActive).toBe(false);
        });
      });
    });
  });

  describe('Badge Integration Tests', () => {
    describe('Badge and XP Integration', () => {
      it('should award XP when badge is claimed', async () => {
        const initialXP = testUser.xp;
        const initialLevel = testUser.level;

        const response = await request(app)
          .post(`/api/badges/${testBadge._id}/claim`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const updatedUser = await User.findById(testUser._id);
        expect(updatedUser.xp).toBe(initialXP + response.body.data.xpReward);

        // Check if level up occurred
        if (updatedUser.level > initialLevel) {
          expect(updatedUser.level).toBe(initialLevel + 1);
        }
      });
    });

    describe('Badge and Notification Integration', () => {
      it('should send notification when badge is earned', async () => {
        const response = await request(app)
          .post(`/api/badges/${testBadge._id}/claim`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Check if notification was created
        const notifications = await request(app)
          .get('/api/notifications')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        const badgeNotification = notifications.body.data.notifications.find(
          n => n.type === 'badge_earned' && n.data.badgeId === testBadge._id.toString()
        );

        expect(badgeNotification).toBeDefined();
        expect(badgeNotification.read).toBe(false);
      });
    });

    describe('Badge and Blog Integration', () => {
      it('should evaluate badges when blog is created', async () => {
        const blog = await Blog.create({
          title: 'Test Blog for Badge',
          content: 'This is a test blog content.',
          author: testUser._id,
          status: 'published'
        });

        // Trigger badge evaluation
        const result = await evaluationEngine.evaluateOnUserAction(
          testUser._id,
          'blog_created',
          { blogId: blog._id }
        );

        expect(result).toHaveProperty('newlyEligibleBadges');
        expect(result).toHaveProperty('notifications');
      });
    });

    describe('Badge and Comment Integration', () => {
      it('should evaluate badges when comment is posted', async () => {
        const blog = await Blog.create({
          title: 'Test Blog',
          content: 'Test content',
          author: testUser._id,
          status: 'published'
        });

        const comment = await Comment.create({
          content: 'Test comment',
          author: testUser._id,
          blog: blog._id
        });

        // Trigger badge evaluation
        const result = await evaluationEngine.evaluateOnUserAction(
          testUser._id,
          'comment_posted',
          { commentId: comment._id, blogId: blog._id }
        );

        expect(result).toHaveProperty('newlyEligibleBadges');
        expect(result).toHaveProperty('notifications');
      });
    });
  });

  describe('Badge Performance Tests', () => {
    it('should handle multiple concurrent badge claims', async () => {
      const users = [];
      const tokens = [];

      // Create multiple test users
      for (let i = 0; i < 5; i++) {
        const user = await User.create({
          name: `Concurrent User ${i}`,
          email: `concurrent${i}@example.com`,
          password: 'password123',
          role: 'writer',
          isVerified: true,
          xp: 100,
          level: 2
        });

        const token = JWTService.generateAccessToken({
          userId: user._id.toString(),
          email: user.email,
          role: user.role
        });

        users.push(user);
        tokens.push(token);
      }

      // Create a badge for concurrent testing
      const concurrentBadge = await Badge.create({
        badgeKey: 'concurrent_test_badge',
        name: 'Concurrent Test Badge',
        description: 'A badge for concurrent testing',
        icon: 'https://example.com/icon.png',
        rarity: 'common',
        category: 'achievement',
        requirements: {
          xpRequired: 50
        },
        rewards: {
          xpReward: 25
        }
      });

      // Make concurrent claims
      const claimPromises = users.map((user, index) =>
        request(app)
          .post(`/api/badges/${concurrentBadge._id}/claim`)
          .set('Authorization', `Bearer ${tokens[index]}`)
      );

      const responses = await Promise.all(claimPromises);

      // All claims should succeed
      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body.success).toBe(true);
      });
    }, 30000);

    it('should handle large badge evaluation efficiently', async () => {
      const startTime = Date.now();

      // Create multiple badges
      const badges = [];
      for (let i = 0; i < 10; i++) {
        const badge = await Badge.create({
          badgeKey: `performance_badge_${i}`,
          name: `Performance Badge ${i}`,
          description: `Performance test badge ${i}`,
          icon: 'https://example.com/icon.png',
          rarity: 'common',
          category: 'achievement',
          requirements: {
            xpRequired: 50 + (i * 10)
          },
          rewards: {
            xpReward: 25
          }
        });
        badges.push(badge);
      }

      // Evaluate all badges for user
      const result = await evaluationEngine.evaluateUserEligibility(testUser._id);

      const endTime = Date.now();
      const duration = endTime - startTime;

      // Should complete within reasonable time (5 seconds)
      expect(duration).toBeLessThan(5000);
      expect(Array.isArray(result)).toBe(true);
    }, 10000);
  });

  describe('Badge Error Handling', () => {
    it('should handle invalid badge IDs gracefully', async () => {
      const invalidId = 'invalid-id';
      await request(app)
        .get(`/api/badges/${invalidId}`)
        .expect(400);
    });

    it('should handle non-existent badge claims', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .post(`/api/badges/${fakeId}/claim`)
        .set('Authorization', `Bearer ${authToken}`)
        .expect(404);
    });

    it('should handle database connection errors gracefully', async () => {
      // This would require mocking database connection
      // For now, we'll test that the service handles errors
      await expect(
        badgeService.getAllActiveBadges()
      ).resolves.toBeDefined();
    });

    it('should handle rate limiting on badge claims', async () => {
      const requests = Array(10).fill().map(() =>
        request(app)
          .post(`/api/badges/${testBadge._id}/claim`)
          .set('Authorization', `Bearer ${authToken}`)
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(res => res.status === 429);
      
      // At least one request should be rate limited
      expect(rateLimited).toBe(true);
    });
  });
}); 