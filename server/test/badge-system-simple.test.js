const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Badge = require('../src/models/badge.model');
const User = require('../src/models/user.model');
const JWTService = require('../src/services/JWTService');

// Import test configuration
require('./test-config');

describe('Badge System - Simplified Tests', () => {
  let testUser, adminUser, testBadge, authToken, adminToken;

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
        blogsRequired: 1
      },
      rewards: {
        xpReward: 50
      },
      isActive: true
    });
  });

  afterAll(async () => {
    // Cleanup handled in setup.js
  });

  beforeEach(async () => {
    // Clear badge claims before each test
    const BadgeClaim = require('../src/models/badgeClaim.model');
    await BadgeClaim.deleteMany({});
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

      it('should require authentication', async () => {
        await request(app)
          .get(`/api/badges/${testBadge._id}/eligibility`)
          .expect(401);
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

      it('should require authentication', async () => {
        await request(app)
          .get(`/api/users/${testUser._id}/badges`)
          .expect(401);
      });
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

      it('should require admin role', async () => {
        await request(app)
          .put(`/api/badges/${testBadge._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({ name: 'Test' })
          .expect(403);
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

      it('should require admin role', async () => {
        await request(app)
          .delete(`/api/badges/${testBadge._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(403);
      });
    });
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
    });
  });

  describe('Error Handling', () => {
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

    it('should handle invalid authentication', async () => {
      await request(app)
        .post(`/api/badges/${testBadge._id}/claim`)
        .expect(401);
    });
  });
}); 