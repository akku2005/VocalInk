const request = require('supertest');
const app = require('../src/app');
const mongoose = require('mongoose');
const User = require('../src/user/user.model');
const { MongoMemoryServer } = require('mongodb-memory-server');

describe('Profile API', () => {
  let mongoServer;
  let token;
  let userId;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    // Create a test user
    const user = new User({
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      username: 'testuser',
      displayName: 'Test User',
    });
    await user.save();
    userId = user._id;

    // Log in to get a token
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });
    token = res.body.accessToken;
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  it('should get user settings', async () => {
    const res = await request(app)
      .get('/api/settings')
      .set('Authorization', `Bearer ${token}`);
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('profile');
    expect(res.body.profile).toHaveProperty('firstName', 'Test');
  });

  it('should update user profile', async () => {
    const res = await request(app)
      .patch('/api/settings/profile')
      .set('Authorization', `Bearer ${token}`)
      .send({
        firstName: 'Updated',
        lastName: 'User',
        bio: 'This is a test bio',
        location: 'New Location',
      });
    expect(res.statusCode).toEqual(200);
    expect(res.body).toHaveProperty('message', 'Profile updated successfully');

    // Verify the changes
    const user = await User.findById(userId);
    expect(user.firstName).toEqual('Updated');
    expect(user.bio).toEqual('This is a test bio');
    expect(user.location).toEqual('New Location');
  });
});