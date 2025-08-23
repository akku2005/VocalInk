const logger = require('./src/utils/logger');

console.log('\n🎨 Testing Colorful Logger\n');

// Test basic log levels
logger.info('This is an info message');
logger.warn('This is a warning message');
logger.error('This is an error message');
logger.debug('This is a debug message (only shown in development)');
logger.success('This is a success message!');

console.log('\n📊 Testing Database Logging\n');

// Test database logging
logger.db.connect('mongodb://localhost:27017/VocalInk');
logger.db.disconnect();
logger.db.error(new Error('Connection timeout'));

console.log('\n🌐 Testing HTTP Logging\n');

// Test HTTP logging
logger.http.request('GET', '/api/users', 200, 45);
logger.http.request('POST', '/api/auth/login', 201, 120);
logger.http.request('GET', '/api/blogs', 404, 12);
logger.http.request('POST', '/api/comments', 500, 300);
logger.http.error('GET', '/api/invalid', 400, new Error('Bad Request'));

console.log('\n🔐 Testing Authentication Logging\n');

// Test authentication logging
logger.auth.login('user123', true);
logger.auth.login('user456', false);
logger.auth.logout('user123');
logger.auth.token.valid('user789');
logger.auth.token.invalid('Malformed token');
logger.auth.token.expired('user101');

console.log('\n📝 Testing Complex Objects\n');

// Test with complex objects
const userData = {
  id: 'user123',
  email: 'test@example.com',
  isActive: true,
  lastLogin: new Date(),
};

logger.info('User data:', userData);
logger.debug('Processing user:', { userId: 'user123', action: 'login' });

console.log('\n✅ Logger test completed!\n');
