const request = require('supertest');
const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const app = require('../src/app');
const User = require('../src/models/user.model');
const Series = require('../src/models/series.model');
const SeriesProgress = require('../src/models/seriesProgress.model');
const Blog = require('../src/models/blog.model');
const JWTService = require('../src/services/JWTService');

let mongoServer;
let testUser;
let testUser2;
let testBlog;
let testSeries;
let authToken;

describe('Blog Series Management API', () => {
  beforeAll(async () => {
    // Use shared MongoDB connection from setup.js
    // The connection is already established in setup.js

    // Create test users
    testUser = new User({
      name: 'Test Author',
      email: 'author@test.com',
      password: 'password123',
      role: 'writer',
      isVerified: true // Ensure user is verified for tests
    });
    await testUser.save();

    testUser2 = new User({
      name: 'Test Collaborator',
      email: 'collaborator@test.com',
      password: 'password123',
      role: 'writer',
      isVerified: true // Ensure user is verified for tests
    });
    await testUser2.save();

    // Create test blog
    testBlog = new Blog({
      title: 'Test Blog Post',
      content: 'This is a test blog post content.',
      summary: 'Test summary',
      author: testUser._id,
      status: 'published'
    });
    await testBlog.save();

    // Generate auth token
    authToken = await JWTService.generateAccessToken({ userId: testUser._id });
  });

  afterAll(async () => {
    // Cleanup is handled in setup.js
  });

  beforeEach(async () => {
    // Clear test data
    await Series.deleteMany({});
    await SeriesProgress.deleteMany({});
  });

  describe('Series Management', () => {
    describe('POST /api/series', () => {
      it('should create a new series successfully', async () => {
        const seriesData = {
          title: 'JavaScript Mastery',
          description: 'Complete guide to modern JavaScript development',
          category: 'Programming',
          template: 'educational_course',
          visibility: 'public',
          tags: ['javascript', 'programming', 'web-development'],
          monetization: {
            model: 'free'
          }
        };

        const response = await request(app)
          .post('/api/series')
          .set('Authorization', `Bearer ${authToken}`)
          .send(seriesData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(seriesData.title);
        expect(response.body.data.authorId).toBe(testUser._id.toString());
        expect(response.body.data.category).toBe(seriesData.category);
        expect(response.body.data.template).toBe(seriesData.template);
        expect(response.body.data.visibility).toBe(seriesData.visibility);
        expect(response.body.data.tags).toEqual(seriesData.tags);
        expect(response.body.data.monetization.model).toBe(seriesData.monetization.model);
      });

      it('should reject series creation without authentication', async () => {
        const seriesData = {
          title: 'Unauthorized Series',
          description: 'This should fail',
          category: 'Programming'
        };

        await request(app)
          .post('/api/series')
          .send(seriesData)
          .expect(401);
      });

      it('should validate required fields', async () => {
        const invalidData = {
          title: 'JS', // Too short
          description: 'Short', // Too short
          // Missing category
        };

        const response = await request(app)
          .post('/api/series')
          .set('Authorization', `Bearer ${authToken}`)
          .send(invalidData)
          .expect(400);

        expect(response.body.message).toContain('Validation failed');
      });
    });

    describe('GET /api/series', () => {
      beforeEach(async () => {
        // Create test series
        testSeries = new Series({
          title: 'Test Series',
          description: 'A test series for testing',
          category: 'Technology',
          authorId: testUser._id,
          visibility: 'public',
          status: 'active'
        });
        await testSeries.save();
      });

      it('should return list of series with pagination', async () => {
        const response = await request(app)
          .get('/api/series?page=1&limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.pagination).toBeDefined();
        expect(response.body.pagination.page).toBe(1);
        expect(response.body.pagination.limit).toBe(10);
      });

      it('should filter series by category', async () => {
        const response = await request(app)
          .get('/api/series?category=Technology')
          .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
        response.body.data.forEach(series => {
          expect(series.category).toBe('Technology');
        });
      });

      it('should search series by title', async () => {
        const response = await request(app)
          .get('/api/series?search=Test')
          .expect(200);

        expect(response.body.data.length).toBeGreaterThan(0);
        response.body.data.forEach(series => {
          expect(series.title.toLowerCase()).toContain('test');
        });
      });
    });

    describe('GET /api/series/:id', () => {
      beforeEach(async () => {
        testSeries = new Series({
          title: 'Test Series',
          description: 'A test series for testing',
          category: 'Technology',
          authorId: testUser._id,
          visibility: 'public',
          status: 'active'
        });
        await testSeries.save();
      });

      it('should return series details', async () => {
        const response = await request(app)
          .get(`/api/series/${testSeries._id}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.series.title).toBe(testSeries.title);
        expect(response.body.data.series.description).toBe(testSeries.description);
      });

      it('should include user progress when authenticated', async () => {
        const response = await request(app)
          .get(`/api/series/${testSeries._id}?includeProgress=true`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.data.userProgress).toBeDefined();
      });

      it('should return 404 for non-existent series', async () => {
        const fakeId = new mongoose.Types.ObjectId();
        await request(app)
          .get(`/api/series/${fakeId}`)
          .expect(404);
      });
    });

    describe('PUT /api/series/:id', () => {
      beforeEach(async () => {
        testSeries = new Series({
          title: 'Original Title',
          description: 'Original description',
          category: 'Technology',
          authorId: testUser._id,
          visibility: 'public',
          status: 'active'
        });
        await testSeries.save();
      });

      it('should update series successfully', async () => {
        const updateData = {
          title: 'Updated Title',
          description: 'Updated description',
          status: 'completed'
        };

        const response = await request(app)
          .put(`/api/series/${testSeries._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.title).toBe(updateData.title);
        expect(response.body.data.description).toBe(updateData.description);
        expect(response.body.data.status).toBe(updateData.status);
      });

      it('should reject updates from non-authorized users', async () => {
        const otherUser = new User({
          name: 'Other User',
          email: 'other@test.com',
          password: 'password123',
          role: 'writer'
        });
        await otherUser.save();

        const otherToken = await JWTService.generateAccessToken({ userId: otherUser._id });

        const updateData = {
          title: 'Unauthorized Update'
        };

        await request(app)
          .put(`/api/series/${testSeries._id}`)
          .set('Authorization', `Bearer ${otherToken}`)
          .send(updateData)
          .expect(403);
      });
    });

    describe('DELETE /api/series/:id', () => {
      beforeEach(async () => {
        testSeries = new Series({
          title: 'Series to Delete',
          description: 'This series will be deleted',
          category: 'Technology',
          authorId: testUser._id,
          visibility: 'public',
          status: 'active'
        });
        await testSeries.save();
      });

      it('should delete series successfully', async () => {
        await request(app)
          .delete(`/api/series/${testSeries._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Verify series is deleted
        const deletedSeries = await Series.findById(testSeries._id);
        expect(deletedSeries).toBeNull();
      });
    });
  });

  describe('Episode Management', () => {
    beforeEach(async () => {
      testSeries = new Series({
        title: 'Test Series',
        description: 'A test series for testing',
        category: 'Technology',
        authorId: testUser._id,
        visibility: 'public',
        status: 'active'
      });
      await testSeries.save();
    });

    describe('POST /api/series/:id/episodes', () => {
      it('should add episode to series successfully', async () => {
        const episodeData = {
          blogId: testBlog._id.toString(),
          order: 1,
          title: 'Episode 1: Introduction',
          status: 'published',
          estimatedReadTime: 15,
          isPremium: false
        };

        const response = await request(app)
          .post(`/api/series/${testSeries._id}/episodes`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(episodeData)
          .expect(201);

        expect(response.body.success).toBe(true);
        expect(response.body.data.episodes).toHaveLength(1);
        expect(response.body.data.episodes[0].title).toBe(episodeData.title);
        expect(response.body.data.episodes[0].order).toBe(episodeData.order);
      });

      it('should reject adding duplicate episode', async () => {
        // Add episode first time
        const episodeData = {
          blogId: testBlog._id.toString(),
          order: 1,
          title: 'Episode 1'
        };

        await request(app)
          .post(`/api/series/${testSeries._id}/episodes`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(episodeData)
          .expect(201);

        // Try to add same episode again
        await request(app)
          .post(`/api/series/${testSeries._id}/episodes`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(episodeData)
          .expect(400);
      });
    });

    describe('PUT /api/series/:id/episodes/:episodeId', () => {
      beforeEach(async () => {
        // Add episode to series
        await testSeries.addEpisode(testBlog._id, 1, 'Original Episode');
      });

      it('should update episode successfully', async () => {
        const updateData = {
          title: 'Updated Episode Title',
          order: 2,
          status: 'scheduled'
        };

        const response = await request(app)
          .put(`/api/series/${testSeries._id}/episodes/${testBlog._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(updateData)
          .expect(200);

        expect(response.body.success).toBe(true);
        const updatedEpisode = response.body.data.episodes.find(ep => ep.episodeId === testBlog._id.toString());
        expect(updatedEpisode.title).toBe(updateData.title);
        expect(updatedEpisode.order).toBe(updateData.order);
      });
    });

    describe('DELETE /api/series/:id/episodes/:episodeId', () => {
      beforeEach(async () => {
        await testSeries.addEpisode(testBlog._id, 1, 'Episode to Remove');
      });

      it('should remove episode from series', async () => {
        await request(app)
          .delete(`/api/series/${testSeries._id}/episodes/${testBlog._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Verify episode is removed
        const updatedSeries = await Series.findById(testSeries._id);
        expect(updatedSeries.episodes).toHaveLength(0);
      });
    });
  });

  describe('Collaboration Management', () => {
    beforeEach(async () => {
      testSeries = new Series({
        title: 'Collaborative Series',
        description: 'A series for collaboration testing',
        category: 'Technology',
        authorId: testUser._id,
        visibility: 'public',
        status: 'active'
      });
      await testSeries.save();
    });

    describe('POST /api/series/:id/collaborators', () => {
      it('should add collaborator successfully', async () => {
        const collaboratorData = {
          userId: testUser2._id.toString(),
          role: 'editor',
          permissions: ['read', 'write', 'publish']
        };

        const response = await request(app)
          .post(`/api/series/${testSeries._id}/collaborators`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(collaboratorData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.collaborators).toHaveLength(1);
        expect(response.body.data.collaborators[0].role).toBe(collaboratorData.role);
      });
    });

    describe('DELETE /api/series/:id/collaborators/:userId', () => {
      beforeEach(async () => {
        await testSeries.addCollaborator(testUser2._id, 'editor', ['read', 'write']);
      });

      it('should remove collaborator successfully', async () => {
        await request(app)
          .delete(`/api/series/${testSeries._id}/collaborators/${testUser2._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Verify collaborator is removed
        const updatedSeries = await Series.findById(testSeries._id);
        expect(updatedSeries.collaborators).toHaveLength(0);
      });
    });
  });

  describe('Progress Tracking', () => {
    beforeEach(async () => {
      testSeries = new Series({
        title: 'Progress Test Series',
        description: 'Series for testing progress tracking',
        category: 'Technology',
        authorId: testUser._id,
        visibility: 'public',
        status: 'active'
      });
      await testSeries.addEpisode(testBlog._id, 1, 'Test Episode');
      await testSeries.save();
    });

    describe('POST /api/series/:id/progress', () => {
      it('should update reading progress successfully', async () => {
        const progressData = {
          episodeId: testBlog._id.toString(),
          progress: 75,
          timeSpent: 300
        };

        const response = await request(app)
          .post(`/api/series/${testSeries._id}/progress`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(progressData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.overallProgress.episodesCompleted).toBe(0); // Not 100% yet
        expect(response.body.data.engagement.totalTimeSpent).toBe(300);
      });

      it('should mark episode as completed when progress reaches 100%', async () => {
        const progressData = {
          episodeId: testBlog._id.toString(),
          progress: 100,
          timeSpent: 600
        };

        const response = await request(app)
          .post(`/api/series/${testSeries._id}/progress`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(progressData)
          .expect(200);

        expect(response.body.data.overallProgress.episodesCompleted).toBe(1);
        expect(response.body.data.overallProgress.completionPercentage).toBe(100);
      });
    });

    describe('GET /api/series/:id/progress', () => {
      it('should return user progress', async () => {
        // First create some progress
        await request(app)
          .post(`/api/series/${testSeries._id}/progress`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            episodeId: testBlog._id.toString(),
            progress: 50,
            timeSpent: 200
          });

        const response = await request(app)
          .get(`/api/series/${testSeries._id}/progress`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeDefined();
        expect(response.body.data.overallProgress.episodesCompleted).toBe(0);
        expect(response.body.data.engagement.totalTimeSpent).toBe(200);
      });
    });
  });

  describe('Bookmark Management', () => {
    beforeEach(async () => {
      testSeries = new Series({
        title: 'Bookmark Test Series',
        description: 'Series for testing bookmarks',
        category: 'Technology',
        authorId: testUser._id,
        visibility: 'public',
        status: 'active'
      });
      await testSeries.addEpisode(testBlog._id, 1, 'Test Episode');
      await testSeries.save();
    });

    describe('POST /api/series/:id/bookmarks', () => {
      it('should add bookmark successfully', async () => {
        const bookmarkData = {
          episodeId: testBlog._id.toString(),
          position: 1500,
          note: 'Important point about JavaScript'
        };

        const response = await request(app)
          .post(`/api/series/${testSeries._id}/bookmarks`)
          .set('Authorization', `Bearer ${authToken}`)
          .send(bookmarkData)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.bookmarks).toHaveLength(1);
        expect(response.body.data.bookmarks[0].note).toBe(bookmarkData.note);
        expect(response.body.data.bookmarks[0].position).toBe(bookmarkData.position);
      });
    });

    describe('DELETE /api/series/:id/bookmarks/:episodeId', () => {
      beforeEach(async () => {
        // Add bookmark first
        await request(app)
          .post(`/api/series/${testSeries._id}/bookmarks`)
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            episodeId: testBlog._id.toString(),
            position: 1500,
            note: 'Test bookmark'
          });
      });

      it('should remove bookmark successfully', async () => {
        await request(app)
          .delete(`/api/series/${testSeries._id}/bookmarks/${testBlog._id}`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        // Verify bookmark is removed
        const progressRecord = await SeriesProgress.findOne({
          userId: testUser._id,
          seriesId: testSeries._id
        });
        expect(progressRecord.bookmarks).toHaveLength(0);
      });
    });
  });

  describe('Analytics & Discovery', () => {
    beforeEach(async () => {
      testSeries = new Series({
        title: 'Analytics Test Series',
        description: 'Series for testing analytics',
        category: 'Technology',
        authorId: testUser._id,
        visibility: 'public',
        status: 'active'
      });
      await testSeries.save();
    });

    describe('GET /api/series/:id/analytics', () => {
      it('should return series analytics', async () => {
        const response = await request(app)
          .get(`/api/series/${testSeries._id}/analytics`)
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data.series).toBeDefined();
        expect(response.body.data.readers).toBeDefined();
        expect(response.body.data.analytics).toBeDefined();
      });
    });

    describe('GET /api/series/trending', () => {
      it('should return trending series', async () => {
        const response = await request(app)
          .get('/api/series/trending?limit=5')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
        expect(response.body.data.length).toBeLessThanOrEqual(5);
      });
    });

    describe('GET /api/series/recommendations', () => {
      it('should return series recommendations', async () => {
        const response = await request(app)
          .get('/api/series/recommendations?limit=10')
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toBeInstanceOf(Array);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid series ID format', async () => {
      await request(app)
        .get('/api/series/invalid-id')
        .expect(400);
    });

    it('should handle non-existent series', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      await request(app)
        .get(`/api/series/${fakeId}`)
        .expect(404);
    });

    it('should handle unauthorized access', async () => {
      const privateSeries = new Series({
        title: 'Private Series',
        description: 'This is private',
        category: 'Technology',
        authorId: testUser._id,
        visibility: 'private',
        status: 'active'
      });
      await privateSeries.save();

      // Try to access without authentication
      await request(app)
        .get(`/api/series/${privateSeries._id}`)
        .expect(403);
    });
  });
}); 