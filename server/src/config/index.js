const dotenv = require('dotenv');
dotenv.config();

module.exports = {
  email: {
    host: process.env.EMAIL_HOST || 'smtp.example.com',
    port: process.env.EMAIL_PORT || 587,
    user: process.env.EMAIL_USER || 'user@example.com',
    pass: process.env.EMAIL_PASS || 'password',
    from: process.env.EMAIL_FROM || 'no-reply@example.com',
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'your_jwt_secret',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_jwt_refresh_secret',
    accessExpiration: process.env.JWT_ACCESS_EXPIRATION || '15m',
    refreshExpiration: process.env.JWT_REFRESH_EXPIRATION || '7d',
    issuer: process.env.JWT_ISSUER || 'vocalink',
    audience: process.env.JWT_AUDIENCE || 'vocalink_users',
  },
  security: {
    login: { maxAttempts: 10 },
    passwordReset: { maxAttempts: 5 },
    verification: { maxAttempts: 5 },
    resetToken: { length: 32 },
    rateLimits: {
      auth: {
        windowMs: 15 * 60 * 1000, // 15 minutes
        max: 5,
        message: 'Too many authentication attempts, please try again later',
      },
      sensitive: {
        windowMs: 60 * 60 * 1000, // 1 hour
        max: 10,
        message: 'Too many sensitive operations, please try again later',
      },
    },
    token: {
      types: {
        ACCESS: 'access',
        REFRESH: 'refresh',
        RESET: 'reset',
        VERIFICATION: 'verification',
      },
      expiresIn: {
        access: '15m',
        refresh: '7d',
        reset: '1h',
        verification: '10m',
      },
      issuer: process.env.JWT_ISSUER || 'vocalink',
      audience: process.env.JWT_AUDIENCE || 'vocalink_users',
    },
  },
};
