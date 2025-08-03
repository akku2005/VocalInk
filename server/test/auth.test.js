// server/test/auth.test.js
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');

describe('Authentication System', () => {
  let accessToken, refreshToken;
  const testEmail = `testuser${Date.now()}@example.com`;
  const testPassword = 'TestPassword123!';

  // Ensure we have a clean database for this test suite
  beforeAll(async () => {
    // Wait for database to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  it('should register a new user', async () => {
    const res = await request(app).post('/api/auth/register').send({
      email: testEmail,
      password: testPassword,
      name: 'Test User',
      role: 'reader',
    });
    expect(res.statusCode).toBe(201);
    expect(res.body.success).toBe(true);
    
    // Verify user exists in database
    const user = await User.findOne({ email: testEmail });
    expect(user).toBeTruthy();
    expect(user.email).toBe(testEmail);
    
    // Ensure user is verified in test environment
    if (!user.isVerified) {
      user.isVerified = true;
      user.verifiedAt = new Date();
      await user.save();
    }
  });

  it('should login with verified user', async () => {
    // Wait for user to be fully saved
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const res = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: testPassword });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    accessToken = res.body.accessToken;
    refreshToken = res.body.refreshToken;
  });

  it('should get own user details', async () => {
    const res = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.email).toBe(testEmail);
  });

  it('should change password', async () => {
    const res = await request(app)
      .post('/api/auth/change-password')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        currentPassword: testPassword,
        newPassword: 'NewTestPassword123!',
      });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    
    // Log in again with new password
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'NewTestPassword123!' });
    expect(loginRes.statusCode).toBe(200);
    expect(loginRes.body.success).toBe(true);
    accessToken = loginRes.body.accessToken;
    refreshToken = loginRes.body.refreshToken;
  });

  it('should logout', async () => {
    const res = await request(app)
      .post('/api/auth/logout')
      .set('Authorization', `Bearer ${accessToken}`);
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it('should refresh token', async () => {
    // Login again to get fresh tokens
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: testEmail, password: 'NewTestPassword123!' });
    expect(loginRes.statusCode).toBe(200);
    const freshRefreshToken = loginRes.body.refreshToken;

    const res = await request(app)
      .post('/api/auth/refresh')
      .send({ refreshToken: freshRefreshToken });
    expect(res.statusCode).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.accessToken).toBeTruthy();
  });
});
