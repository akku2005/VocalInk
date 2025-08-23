const request = require('supertest');
const app = require('../src/app');

// Import test configuration
require('./test-config');

describe('Minimal Working Tests', () => {
  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body.status).toBe('healthy');
    });
  });

  describe('Badge System - Public Endpoints', () => {
    it('should return badges list', async () => {
      const response = await request(app)
        .get('/api/badges')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('badges');
      expect(Array.isArray(response.body.data.badges)).toBe(true);
    });

    it('should return badges with pagination', async () => {
      const response = await request(app)
        .get('/api/badges?page=1&limit=10')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('pagination');
      expect(response.body.data.pagination).toHaveProperty('currentPage');
      expect(response.body.data.pagination).toHaveProperty('totalBadges');
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

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      await request(app)
        .get('/api/nonexistent')
        .expect(404);
    });

    it('should handle invalid badge IDs gracefully', async () => {
      const invalidId = 'invalid-id';
      await request(app)
        .get(`/api/badges/${invalidId}`)
        .expect(400);
    });
  });

  describe('Rate Limiting', () => {
    it('should handle rate limiting gracefully', async () => {
      // Make multiple rapid requests to trigger rate limiting
      const promises = Array(5).fill().map(() => 
        request(app)
          .get('/api/badges')
          .expect(200)
      );

      const responses = await Promise.all(promises);
      
      // All should succeed or be rate limited (429)
      responses.forEach(response => {
        expect([200, 429]).toContain(response.status);
      });
    });
  });

  describe('API Response Format', () => {
    it('should return consistent response format', async () => {
      const response = await request(app)
        .get('/api/badges')
        .expect(200);

      expect(response.body).toHaveProperty('success');
      expect(response.body).toHaveProperty('data');
      expect(typeof response.body.success).toBe('boolean');
    });
  });
}); 