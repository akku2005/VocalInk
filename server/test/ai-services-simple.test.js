const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const User = require('../src/models/user.model');
const JWTService = require('../src/services/JWTService');

// Import test configuration
require('./test-config');

describe('AI Services - Simplified Tests', () => {
  let testUser, authToken;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      name: 'AI Test User',
      email: 'ai-test@example.com',
      password: 'password123',
      role: 'writer',
      isVerified: true
    });

    // Generate auth token
    authToken = JWTService.generateAccessToken({
      userId: testUser._id.toString(),
      email: testUser.email,
      role: testUser.role
    });
  });

  afterAll(async () => {
    // Cleanup handled in setup.js
  });

  describe('AI API Endpoints', () => {
    describe('GET /api/ai/status', () => {
      it('should return AI service status', async () => {
        const response = await request(app)
          .get('/api/ai/status')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('services');
        expect(response.body.data).toHaveProperty('providers');
      });

      it('should require authentication', async () => {
        await request(app)
          .get('/api/ai/status')
          .expect(401);
      });
    });

    describe('POST /api/ai/summarize', () => {
      it('should validate input content', async () => {
        await request(app)
          .post('/api/ai/summarize')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: '',
            options: { maxLength: 100 }
          })
          .expect(400);
      });

      it('should require authentication', async () => {
        await request(app)
          .post('/api/ai/summarize')
          .send({
            content: 'Test content',
            options: { maxLength: 100 }
          })
          .expect(401);
      });
    });

    describe('POST /api/ai/analyze', () => {
      it('should validate input content', async () => {
        await request(app)
          .post('/api/ai/analyze')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: '',
            options: { includeSentiment: true }
          })
          .expect(400);
      });

      it('should require authentication', async () => {
        await request(app)
          .post('/api/ai/analyze')
          .send({
            content: 'Test content',
            options: { includeSentiment: true }
          })
          .expect(401);
      });
    });

    describe('POST /api/ai/tts', () => {
      it('should validate input text', async () => {
        await request(app)
          .post('/api/ai/tts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            text: '',
            options: { provider: 'espeak' }
          })
          .expect(400);
      });

      it('should require authentication', async () => {
        await request(app)
          .post('/api/ai/tts')
          .send({
            text: 'Hello world',
            options: { provider: 'espeak' }
          })
          .expect(401);
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid authentication', async () => {
      await request(app)
        .post('/api/ai/summarize')
        .send({
          content: 'Test content',
          options: { maxLength: 100 }
        })
        .expect(401);
    });

    it('should handle malformed requests', async () => {
      await request(app)
        .post('/api/ai/summarize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invalidField: 'invalid value'
        })
        .expect(400);
    });
  });
}); 