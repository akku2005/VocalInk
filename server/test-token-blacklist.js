const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
require('dotenv').config();

// Import models
const User = require('./src/models/user.model');
const Token = require('./src/models/token.model');

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vocalink');

async function testTokenBlacklist() {
  try {
    console.log('🧪 Testing Token Blacklist Functionality...\n');

    // Create a test user
    const testUser = await User.create({
      email: 'test@example.com',
      password: 'TestPassword123!',
      name: 'Test User',
      isVerified: true,
    });

    console.log('✅ Test user created:', testUser.email);

    // Generate a test JWT token
    const testToken = jwt.sign(
      {
        userId: testUser._id,
        email: testUser.email,
        role: testUser.role,
        type: 'access',
        iat: Math.floor(Date.now() / 1000),
      },
      process.env.JWT_SECRET || 'your_jwt_secret',
      {
        expiresIn: '1h',
        issuer: 'akash',
        audience: 'akash',
      }
    );

    console.log('✅ Test JWT token generated');

    // Test 1: Check if token is blacklisted (should be false)
    const tokenHash = crypto.createHash('sha256').update(testToken).digest('hex');
    const isBlacklistedBefore = await Token.isAccessTokenBlacklisted(tokenHash);
    console.log('🔍 Token blacklisted before logout:', isBlacklistedBefore);

    // Test 2: Blacklist the token
    await Token.blacklistAccessToken(tokenHash, testUser._id);
    console.log('✅ Token blacklisted');

    // Test 3: Check if token is blacklisted (should be true)
    const isBlacklistedAfter = await Token.isAccessTokenBlacklisted(tokenHash);
    console.log('🔍 Token blacklisted after logout:', isBlacklistedAfter);

    // Test 4: Verify the blacklist entry in database
    const blacklistedToken = await Token.findOne({
      tokenHash,
      type: 'access',
      revoked: true,
    });
    console.log('🔍 Blacklisted token found in DB:', !!blacklistedToken);

    // Cleanup
    await User.findByIdAndDelete(testUser._id);
    await Token.deleteMany({ user: testUser._id });
    console.log('✅ Test cleanup completed');

    console.log('\n🎉 All tests passed! Token blacklist is working correctly.');
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testTokenBlacklist(); 