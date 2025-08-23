const request = require('supertest');
const app = require('./src/app');
const User = require('./src/models/user.model');
const JWTService = require('./src/services/JWTService');

async function debugAuth() {
  console.log('🔍 Debugging Authentication Issues...\n');

  try {
    // 1. Test user creation
    console.log('1. Creating test user...');
    const testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'writer',
      isVerified: true
    });
    await testUser.save();
    console.log('✅ Test user created:', testUser._id);

    // 2. Generate token
    console.log('2. Generating JWT token...');
    const token = JWTService.generateAccessToken({
      userId: testUser._id.toString(),
      email: testUser.email,
      role: testUser.role
    });
    console.log('✅ Token generated:', token.substring(0, 50) + '...');

    // 3. Test protected route
    console.log('3. Testing protected route...');
    const response = await request(app)
      .get('/api/badges')
      .set('Authorization', `Bearer ${token}`);

    console.log('Response status:', response.status);
    console.log('Response body:', response.body);

    // 4. Test without token
    console.log('4. Testing without token...');
    const response2 = await request(app)
      .get('/api/badges');

    console.log('Response status:', response2.status);
    console.log('Response body:', response2.body);

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

debugAuth(); 