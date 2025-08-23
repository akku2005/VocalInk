const request = require('supertest');
const app = require('./src/app');
const User = require('./src/models/user.model');
const Badge = require('./src/models/badge.model');
const JWTService = require('./src/services/JWTService');

// Import test configuration
require('./test/test-config');

async function testBadgeSystem() {
  console.log('🧪 Testing Badge System...');
  
  try {
    // Create a test user
    const testUser = await User.create({
      name: 'Test User',
      email: 'test@example.com',
      password: 'password123',
      role: 'reader',
      isVerified: true
    });
    
    console.log('✅ Test user created:', testUser.email);

    // Create a test badge
    const testBadge = await Badge.create({
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
    
    console.log('✅ Test badge created:', testBadge.name);

    // Generate JWT token
    const authToken = JWTService.generateAccessToken({ 
      userId: testUser._id.toString(),
      email: testUser.email,
      role: testUser.role
    });
    
    console.log('✅ JWT token generated');

    // Test public badge endpoint
    const publicResponse = await request(app)
      .get('/api/badges')
      .expect(200);
    
    console.log('✅ Public badges endpoint working');

    // Test authenticated badge endpoint
    const authResponse = await request(app)
      .get('/api/badges/user/badges')
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    console.log('✅ Authenticated badge endpoint working');

    // Test badge claiming
    const claimResponse = await request(app)
      .post(`/api/badges/${testBadge._id}/claim`)
      .set('Authorization', `Bearer ${authToken}`)
      .expect(200);
    
    console.log('✅ Badge claiming working');

    console.log('🎉 All badge system tests passed!');
    
    // Cleanup
    await User.findByIdAndDelete(testUser._id);
    await Badge.findByIdAndDelete(testBadge._id);
    
  } catch (error) {
    console.error('❌ Badge system test failed:', error.message);
    console.error('Stack:', error.stack);
  }
}

testBadgeSystem(); 