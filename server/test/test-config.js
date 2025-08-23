// Test configuration for VocalInk badge system
process.env.NODE_ENV = 'test';
// TODO: Use environment variables for secrets in production
process.env.JWT_SECRET = process.env.TEST_JWT_SECRET || 'test-jwt-secret-for-testing-only';
process.env.JWT_REFRESH_SECRET = process.env.TEST_JWT_REFRESH_SECRET || 'test-jwt-refresh-secret-for-testing-only';
process.env.JWT_EXPIRES_IN = '24h';
process.env.JWT_REFRESH_EXPIRES_IN = '7d';
process.env.JWT_RESET_EXPIRES_IN = '24h';
process.env.JWT_VERIFICATION_EXPIRES_IN = '24h';
process.env.JWT_ISSUER = 'akash';
process.env.JWT_AUDIENCE = 'akash';
process.env.BADGE_SECRET = process.env.TEST_BADGE_SECRET || 'test-badge-secret-for-testing-only';
process.env.REDIS_URL = 'redis://localhost:6379';
process.env.LOG_LEVEL = 'error';

module.exports = {
  jwt: {
    secret: process.env.JWT_SECRET,
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    accessExpiration: process.env.JWT_EXPIRES_IN,
    refreshExpiration: process.env.JWT_REFRESH_EXPIRES_IN,
    resetExpiration: process.env.JWT_RESET_EXPIRES_IN,
    verificationExpiration: process.env.JWT_VERIFICATION_EXPIRES_IN,
    issuer: process.env.JWT_ISSUER,
    audience: process.env.JWT_AUDIENCE,
  }
}; 