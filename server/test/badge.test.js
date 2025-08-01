const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const Badge = require('../src/models/badge.model');
const BadgeClaim = require('../src/models/badgeClaim.model');
const User = require('../src/models/user.model');
const { generateToken } = require('../src/services/JWTService');

describe('Badge API', () => {
  let testUser, adminUser, testBadge, authToken, adminToken;

  beforeAll(async () => {
    // Create test users
    testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'user'
    });

    adminUser = await User.create({
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password123',
      role: 'admin'
    });

    // Generate tokens
    authToken = generateToken(testUser);
    adminToken = generateToken(adminUser);

    // Create test badge
    testBadge = await Badge.create({
      badgeKey: 'test_badge',
      name: 'Test Badge',
      description: 'A test badge for testing',
      icon: 'https://example.com/icon.png',
      rarity: 'common',
      category: 'achievement',
      requirements: {
        xpRequired: 0,
        blogsRequired: 1
      },
      rewards: {
        xpReward: 50
      }
    });
  });

  afterAll(async () => {
    await User.deleteMany({});
    await Badge.deleteMany({});
    await BadgeClaim.deleteMany({});
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    await BadgeClaim.deleteMany({});
  });

  describe('Public Endpoints', () => {
    describe('GET /api/badges', () => {
      it('should return all active badges with pagination', async () => {
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

      it('should search badges by query', async () => {
        const response = await request(app)
          .get('/api/badges?search=test')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.badges.some(badge => 
          badge.name.toLowerCase().includes('test') || 
          badge.description.toLowerCase().includes('test')
        )).toBe(true);
      });

      it('should handle pagination correctly', async () => {
        const response = await request(app)
          .get('/api/badges?limit=1&page=1')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.pagination.currentPage).toBe(1);
        expect(response.body.data.pagination.totalPages).toBeGreaterThan(0);
        expect(response.body.data.badges.length).toBeLessThanOrEqual(1);
      });
    });

    describe('GET /api/badges/search', () => {
      it('should search badges by query', async () => {
        const response = await request(app)
          .get('/api/badges/search?query=test')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('query', 'test');
        expect(response.body.data).toHaveProperty('badges');
        expect(response.body.data).toHaveProperty('count');
      });

      it('should require query parameter', async () => {
        const response = await request(app)
          .get('/api/badges/search')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('query');
      });
    });

    describe('GET /api/badges/popular', () => {
      it('should return popular badges', async () => {
        const response = await request(app)
          .get('/api/badges/popular')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('badges');
        expect(response.body.data).toHaveProperty('count');
      });
    });

    describe('GET /api/badges/rare', () => {
      it('should return rare badges', async () => {
        const response = await request(app)
          .get('/api/badges/rare')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('badges');
        expect(response.body.data).toHaveProperty('count');
      });
    });

    describe('GET /api/badges/stats', () => {
      it('should return badge statistics', async () => {
        const response = await request(app)
          .get('/api/badges/stats')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('totalBadges');
        expect(response.body.data).toHaveProperty('byCategory');
        expect(response.body.data).toHaveProperty('byRarity');
      });
    });

    describe('GET /api/badges/:id', () => {
      it('should return badge details', async () => {
        const response = await request(app)
          .get(`/api/badges/${testBadge._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('_id', testBadge._id.toString());
        expect(response.body.data).toHaveProperty('name', testBadge.name);
        expect(response.body.data).toHaveProperty('description', testBadge.description);
      });

      it('should return 404 for non-existent badge', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        const response = await request(app)
          .get(`/api/badges/${fakeId}`)
          .expect(404);

        expect(response.body.success).toBe(false);
      });

      it('should return user-specific information when authenticated', async () => {
        const response = await request(app)
          .get(`/api/badges/${testBadge._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('userHasEarned');
        expect(response.body.data).toHaveProperty('userEligible');
        expect(response.body.data).toHaveProperty('userProgress');
      });
    });
  });

  describe('User Endpoints', () => {
    describe('GET /api/badges/user/badges', () => {
      it('should require authentication', async () => {
        const response = await request(app)
          .get('/api/badges/user/badges')
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should return user badges', async () => {
        const response = await request(app)
          .get('/api/badges/user/badges')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('badges');
        expect(response.body.data).toHaveProperty('totalEarned');
        expect(response.body.data).toHaveProperty('totalAvailable');
      });
    });

    describe('GET /api/badges/user/eligible', () => {
      it('should return eligible badges for user', async () => {
        const response = await request(app)
          .get('/api/badges/user/eligible')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('eligibleBadges');
        expect(response.body.data).toHaveProperty('count');
      });
    });

    describe('POST /api/badges/:badgeId/claim', () => {
      it('should require authentication', async () => {
        const response = await request(app)
          .post(`/api/badges/${testBadge._id}/claim`)
          .expect(401);

        expect(response.body.success).toBe(false);
      });

      it('should claim badge successfully', async () => {
        // First, make user eligible by giving them a blog
        await User.findByIdAndUpdate(testUser._id, {
          $inc: { totalBlogs: 1 }
        });

        const response = await request(app)
          .post(`/api/badges/${testBadge._id}/claim`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body).toHaveProperty('claim');
        expect(response.body.claim.status).toBe('approved');
        expect(response.body).toHaveProperty('message');
      });

      it('should prevent claiming already earned badge', async () => {
        // Give user the badge first
        await User.findByIdAndUpdate(testUser._id, {
          $push: { badges: testBadge._id }
        });

        const response = await request(app)
          .post(`/api/badges/${testBadge._id}/claim`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('already have this badge');
      });

      it('should prevent claiming when not eligible', async () => {
        const response = await request(app)
          .post(`/api/badges/${testBadge._id}/claim`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('not eligible');
      });

      it('should handle rate limiting', async () => {
        // Make multiple rapid claims
        for (let i = 0; i < 12; i++) {
          const response = await request(app)
            .post(`/api/badges/${testBadge._id}/claim`)
            .set('Authorization', `Bearer ${authToken}`);

          if (i >= 10) {
            expect(response.status).toBe(429);
            expect(response.body.message).toContain('Too many badge claims');
          }
        }
      });
    });

    describe('GET /api/badges/user/claims', () => {
      it('should return user claim history', async () => {
        const response = await request(app)
          .get('/api/badges/user/claims')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('claims');
        expect(response.body.data).toHaveProperty('count');
      });
    });
  });

  describe('Admin Endpoints', () => {
    describe('POST /api/badges', () => {
      it('should require admin authentication', async () => {
        const response = await request(app)
          .post('/api/badges')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            badgeKey: 'new_badge',
            name: 'New Badge',
            description: 'A new badge'
          })
          .expect(403);

        expect(response.body.success).toBe(false);
      });

      it('should create badge successfully', async () => {
        const badgeData = {
          badgeKey: 'new_badge',
          name: 'New Badge',
          description: 'A new badge for testing',
          icon: 'https://example.com/icon.png',
          rarity: 'uncommon',
          category: 'content',
          requirements: {
            xpRequired: 100,
            blogsRequired: 2
          },
          rewards: {
            xpReward: 100
          }
        };

        const response = await request(app)
          .post('/api/badges')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(badgeData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('badgeKey', 'new_badge');
        expect(response.body.data).toHaveProperty('name', 'New Badge');
      });

      it('should validate required fields', async () => {
        const response = await request(app)
          .post('/api/badges')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            name: 'Invalid Badge'
            // Missing required fields
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('required');
      });

      it('should validate badge key format', async () => {
        const response = await request(app)
          .post('/api/badges')
          .set('Authorization', `Bearer ${adminToken}`)
          .send({
            badgeKey: 'INVALID_KEY',
            name: 'Invalid Badge',
            description: 'A badge with invalid key',
            icon: 'https://example.com/icon.png'
          })
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Badge key');
      });
    });

    describe('PUT /api/badges/:id', () => {
      it('should update badge successfully', async () => {
        const updateData = {
          name: 'Updated Badge Name',
          description: 'Updated description'
        };

        const response = await request(app)
          .put(`/api/badges/${testBadge._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('name', 'Updated Badge Name');
        expect(response.body.data).toHaveProperty('description', 'Updated description');
      });
    });

    describe('DELETE /api/badges/:id', () => {
      it('should delete badge successfully', async () => {
        // Create a badge that no one has earned
        const deleteableBadge = await Badge.create({
          badgeKey: 'deleteable_badge',
          name: 'Deleteable Badge',
          description: 'A badge that can be deleted',
          icon: 'https://example.com/icon.png',
          rarity: 'common',
          category: 'achievement'
        });

        const response = await request(app)
          .delete(`/api/badges/${deleteableBadge._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('deleted successfully');
      });

      it('should prevent deletion of badge with earners', async () => {
        // Give user the badge first
        await User.findByIdAndUpdate(testUser._id, {
          $push: { badges: testBadge._id }
        });

        const response = await request(app)
          .delete(`/api/badges/${testBadge._id}`)
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(409);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('users have earned this badge');
      });
    });

    describe('POST /api/badges/award', () => {
      it('should award badge to user', async () => {
        const awardData = {
          badgeId: testBadge._id,
          userId: testUser._id
        };

        const response = await request(app)
          .post('/api/badges/award')
          .set('Authorization', `Bearer ${adminToken}`)
          .send(awardData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('awarded to user successfully');
        expect(response.body.data).toHaveProperty('user');
        expect(response.body.data).toHaveProperty('badge');
        expect(response.body.data).toHaveProperty('xpGained');
      });
    });

    describe('GET /api/badges/admin/claims/pending', () => {
      it('should return pending claims', async () => {
        const response = await request(app)
          .get('/api/badges/admin/claims/pending')
          .set('Authorization', `Bearer ${adminToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('claims');
        expect(response.body.data).toHaveProperty('count');
      });
    });

    describe('PUT /api/badges/admin/claims/:claimId/review', () => {
      it('should review claim successfully', async () => {
        // Create a claim first
        const claim = await BadgeClaim.create({
          badgeId: testBadge._id,
          userId: testUser._id,
          status: 'under_review'
        });

        const reviewData = {
          decision: 'approve',
          notes: 'User meets requirements'
        };

        const response = await request(app)
          .put(`/api/badges/admin/claims/${claim._id}/review`)
          .set('Authorization', `Bearer ${adminToken}`)
          .send(reviewData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.message).toContain('approved successfully');
      });
    });
  });

  describe('Validation and Security', () => {
    describe('Rate Limiting', () => {
      it('should limit badge searches', async () => {
        for (let i = 0; i < 105; i++) {
          const response = await request(app)
            .get('/api/badges/search?query=test');

          if (i >= 100) {
            expect(response.status).toBe(429);
            expect(response.body.message).toContain('Too many badge searches');
          }
        }
      });

      it('should limit badge listing requests', async () => {
        for (let i = 0; i < 205; i++) {
          const response = await request(app)
            .get('/api/badges');

          if (i >= 200) {
            expect(response.status).toBe(429);
            expect(response.body.message).toContain('Too many badge listing requests');
          }
        }
      });
    });

    describe('Input Validation', () => {
      it('should validate pagination parameters', async () => {
        const response = await request(app)
          .get('/api/badges?page=0&limit=0')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Page must be a positive integer');
      });

      it('should validate badge ID format', async () => {
        const response = await request(app)
          .get('/api/badges/invalid-id')
          .expect(400);

        expect(response.body.success).toBe(false);
        expect(response.body.message).toContain('Invalid badge ID');
      });
    });

    describe('Security Headers', () => {
      it('should include security headers', async () => {
        const response = await request(app)
          .get('/api/badges')
          .expect(200);

        expect(response.headers).toHaveProperty('x-badge-system');
        expect(response.headers).toHaveProperty('x-content-type-options');
        expect(response.headers).toHaveProperty('x-frame-options');
        expect(response.headers).toHaveProperty('x-xss-protection');
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      // Mock a database error
      const originalFind = Badge.find;
      Badge.find = jest.fn().mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/badges')
        .expect(500);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('error occurred');

      // Restore original function
      Badge.find = originalFind;
    });

    it('should handle malformed JSON', async () => {
      const response = await request(app)
        .post('/api/badges')
        .set('Authorization', `Bearer ${adminToken}`)
        .set('Content-Type', 'application/json')
        .send('invalid json')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
}); 