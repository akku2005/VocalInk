
const request = require('supertest');
const app = require('../src/app');
const User = require('../src/models/user.model');
const { generateToken } = require('../src/utils/auth');

describe('Settings API', () => {
  let user;
  let token;

  beforeAll(async () => {
    // Create a user with login history for testing
    user = await User.create({
      username: 'testuser',
      email: 'testuser@example.com',
      password: 'password123',
      loginHistory: [
        {
          device: 'Chrome on Windows',
          location: {
            city: 'New York',
            region: 'NY',
            country: 'USA',
          },
          date: new Date(),
        },
      ],
    });
    token = generateToken(user._id);
  });

  afterAll(async () => {
    await User.deleteMany({});
  });

  it('should return all settings with login history containing location object', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${token}`);

    expect(res.statusCode).toEqual(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.security.loginHistory).toBeInstanceOf(Array);
    expect(res.body.data.security.loginHistory[0].location).toBeInstanceOf(Object);
    expect(res.body.data.security.loginHistory[0].location).toHaveProperty('city', 'New York');
  });
});
