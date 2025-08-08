# VocalInk Authentication System

## Overview

This document describes the industry-level authentication system implemented for VocalInk, featuring secure email verification, two-factor authentication, account protection, and comprehensive security measures.

## Features

### 🔐 Core Authentication Features
- **Secure Registration** with email verification
- **Enhanced Login** with progressive account lockout
- **Two-Factor Authentication (2FA)** with TOTP
- **Password Reset** with secure token-based flow
- **Session Management** with JWT tokens
- **Account Recovery** mechanisms

### 🛡️ Security Features
- **Progressive Account Lockout** (3, 6, 10 failed attempts)
- **Device Fingerprinting** for security monitoring
- **Rate Limiting** on all authentication endpoints
- **Input Sanitization** and XSS protection
- **CSRF Protection** for web forms
- **Enhanced Password Requirements** (8+ chars, uppercase, lowercase, number, special char)
- **Email Verification** with 6-digit codes
- **Audit Logging** for all authentication events

## API Endpoints

### Registration
```http
POST /api/auth/register
Content-Type: application/json

{
  "name": "John Doe",
  "email": "john@example.com",
  "password": "SecurePass123!",
  "role": "reader"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful. Please check your email for verification code.",
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "isVerified": false
}
```

### Email Verification
```http
POST /api/auth/verify-email
Content-Type: application/json

{
  "email": "john@example.com",
  "code": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "reader",
    "isVerified": true,
    "twoFactorEnabled": false
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "isVerified": true
}
```

### Login
```http
POST /api/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "SecurePass123!",
  "twoFactorToken": "123456" // Optional if 2FA is enabled
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "user": {
    "id": "507f1f77bcf86cd799439011",
    "email": "john@example.com",
    "name": "John Doe",
    "role": "reader",
    "isVerified": true,
    "twoFactorEnabled": false
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "deviceFingerprint": "abc123..."
}
```

### Resend Verification Code
```http
POST /api/auth/resend-verification
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### Password Reset
```http
POST /api/auth/forgot-password
Content-Type: application/json

{
  "email": "john@example.com"
}
```

```http
POST /api/auth/reset-password
Content-Type: application/json

{
  "token": "reset-token",
  "code": "123456",
  "newPassword": "NewSecurePass123!"
}
```

### Two-Factor Authentication

#### Setup 2FA
```http
POST /api/auth/2fa/setup
Authorization: Bearer <access-token>
```

#### Verify 2FA Setup
```http
POST /api/auth/2fa/verify
Authorization: Bearer <access-token>
Content-Type: application/json

{
  "token": "123456"
}
```

#### Disable 2FA
```http
POST /api/auth/2fa/disable
Authorization: Bearer <access-token>
```

## Security Measures

### Password Requirements
- Minimum 8 characters
- Maximum 128 characters
- Must contain uppercase letter
- Must contain lowercase letter
- Must contain number
- Must contain special character (@$!%*?&)

### Account Lockout System
1. **3 failed attempts**: 15-minute lockout
2. **6 failed attempts**: 1-hour lockout
3. **10+ failed attempts**: 24-hour lockout

### Rate Limiting
- **Authentication endpoints**: 5 attempts per 15 minutes
- **Sensitive operations**: 10 attempts per hour
- **General API**: 100 requests per 15 minutes

### Email Verification
- 6-digit numerical codes
- 10-minute expiration
- Secure token-based verification
- Automatic resend functionality

### JWT Token Security
- **Access tokens**: 15 minutes (short-lived)
- **Refresh tokens**: 7 days
- **Verification tokens**: 10 minutes
- **Reset tokens**: 1 hour
- Token blacklisting for logout

## Environment Configuration

### Required Environment Variables

```bash
# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key
JWT_REFRESH_SECRET=your-super-secret-refresh-key
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_VERIFICATION_EXPIRES_IN=10m
JWT_RESET_EXPIRES_IN=1h
JWT_ISSUER=vocalink
JWT_AUDIENCE=vocalink-users

# SMTP Configuration
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-email@gmail.com
SMTP_PASS=your-app-password

# Security Configuration
BCRYPT_ROUNDS=12
MAX_LOGIN_ATTEMPTS=10
VERIFICATION_CODE_EXPIRY=600000
PASSWORD_RESET_EXPIRY=3600000

# Rate Limiting
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=5
SENSITIVE_RATE_LIMIT_WINDOW_MS=3600000
SENSITIVE_RATE_LIMIT_MAX=10
```

## Error Handling

### Common Error Responses

#### Validation Errors (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "details": [
    "Password must be at least 8 characters long",
    "Password must contain an uppercase letter"
  ]
}
```

#### Authentication Errors (401)
```json
{
  "success": false,
  "message": "Invalid credentials"
}
```

#### Account Locked (423)
```json
{
  "success": false,
  "message": "Account temporarily locked. Please try again in 15 minute(s).",
  "lockoutUntil": "2024-01-01T12:00:00.000Z"
}
```

#### Rate Limit Exceeded (429)
```json
{
  "success": false,
  "message": "Too many requests from this IP, please try again later.",
  "retryAfter": 900
}
```

## Best Practices

### For Frontend Implementation

1. **Store tokens securely**:
   - Access tokens in memory only
   - Refresh tokens in httpOnly cookies
   - Never store in localStorage

2. **Handle token refresh**:
   - Implement automatic token refresh
   - Handle 401 responses by refreshing tokens
   - Redirect to login on refresh failure

3. **Implement proper error handling**:
   - Show user-friendly error messages
   - Handle rate limiting gracefully
   - Provide clear feedback for validation errors

4. **Security considerations**:
   - Implement CSRF protection
   - Use HTTPS in production
   - Sanitize user inputs
   - Implement proper logout

### For Production Deployment

1. **Environment variables**:
   - Use strong, unique JWT secrets
   - Configure proper SMTP settings
   - Set appropriate rate limits

2. **Database security**:
   - Use connection pooling
   - Implement proper indexing
   - Regular backups

3. **Monitoring and logging**:
   - Monitor authentication events
   - Set up alerts for suspicious activity
   - Regular security audits

## Testing

### Test Environment
In test environment (`NODE_ENV=test`):
- Users are auto-verified
- Email sending is disabled
- Rate limiting is relaxed

### Manual Testing
```bash
# Test registration
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"TestPass123!"}'

# Test login
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"TestPass123!"}'
```

## Troubleshooting

### Common Issues

1. **Email not received**:
   - Check SMTP configuration
   - Verify email address
   - Check spam folder

2. **Verification code expired**:
   - Request new verification code
   - Check email for new code

3. **Account locked**:
   - Wait for lockout period to expire
   - Contact support if needed

4. **Rate limit exceeded**:
   - Wait for rate limit window to reset
   - Reduce request frequency

## Security Checklist

- [ ] JWT secrets are strong and unique
- [ ] SMTP credentials are properly configured
- [ ] Rate limiting is enabled
- [ ] Account lockout is working
- [ ] Email verification is functional
- [ ] 2FA is properly implemented
- [ ] Audit logging is enabled
- [ ] HTTPS is enabled in production
- [ ] Security headers are configured
- [ ] Input validation is working
- [ ] Error messages don't leak information
- [ ] Tokens are properly blacklisted on logout

## Support

For authentication-related issues:
1. Check the logs for detailed error information
2. Verify environment configuration
3. Test with the provided curl commands
4. Contact the development team with specific error messages 

## 🎉 Industry-Level Authentication Implementation Complete!

I've successfully analyzed and enhanced your authentication system to meet industry standards. Here's what we've implemented:

### ✅ **Enhanced Security Features**

1. **🔐 Improved Registration Flow**
   - Secure email verification with 6-digit codes
   - Enhanced password validation (8+ chars, uppercase, lowercase, number, special char)
   - Input sanitization and XSS protection
   - Disposable email domain detection

2. **🛡️ Advanced Login Security**
   - Progressive account lockout (3, 6, 10 failed attempts)
   - Device fingerprinting for security monitoring
   - Enhanced rate limiting (5 attempts per 15 minutes)
   - Better error handling without information leakage

3. **📧 Secure Email Verification**
   - 10-minute expiration for verification codes
   - Secure token-based verification
   - Automatic resend functionality
   - Enhanced email templates

4. **🔒 Two-Factor Authentication**
   - TOTP-based 2FA with speakeasy
   - QR code generation for easy setup
   - Secure verification process

### ✅ **Security Middleware Enhancements**

1. **🛡️ Comprehensive Security Headers**
   - Helmet.js with enhanced CSP
   - XSS protection
   - CSRF protection
   - HSTS enforcement

2. **⚡ Rate Limiting & Speed Limiting**
   - Different limits for different endpoints
   - Progressive delays for brute force protection
   - IP + User-Agent based rate limiting

3. **🔍 Security Monitoring**
   - Suspicious request detection
   - Input sanitization
   - Device fingerprinting
   - Comprehensive audit logging

### ✅ **Enhanced Validation & Error Handling**

1. **📋 Industry-Standard Validation**
   - Joi schemas with detailed error messages
   - Password strength requirements
   - Email format validation
   - Input sanitization

2. **🚨 Better Error Responses**
   - User-friendly error messages
   - Detailed validation feedback
   - Security-conscious error handling

### 📋 **Updated Environment Configuration**

Here's your enhanced `.env` file configuration (you can copy this):

```bash
# Application environment
NODE_ENV=development

# Server configuration
PORT=3000
HOST=localhost

# Database connection
MONGO_URI=mongodb://localhost:27017/vocalink

# JWT Configuration - Enhanced Security
JWT_SECRET=yhbjhwebuy6487hr4fhuy4brug74y5g87bu4ebrub4er
JWT_REFRESH_SECRET=yhbjhwebuy6487hr4fhuy4brug74y5g87bu4ebrub4er_refresh
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
JWT_RESET_EXPIRES_IN=1h
JWT_VERIFICATION_EXPIRES_IN=10m
JWT_ISSUER=vocalink
JWT_AUDIENCE=vocalink-users

# SMTP Configuration for Email
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=asakashsahu20@gmail.com
SMTP_PASS=nufghyxbcuryogln

# Email Configuration
EMAIL_FROM=noreply@vocalink.com
EMAIL_SUPPORT=support@vocalink.com
COMPANY_NAME=VocalInk
COMPANY_LOGO=https://your-domain.com/logo.png
FRONTEND_URL=http://localhost:5173
SUPPORT_URL=https://your-domain.com/support
PRIVACY_URL=https://your-domain.com/privacy

# CORS Configuration
CORS_ORIGIN=http://localhost:5173

# Security Configuration
BCRYPT_ROUNDS=12
PASSWORD_MIN_LENGTH=8
PASSWORD_MAX_LENGTH=128
SESSION_SECRET=yhbjhwebuy6487hr4fhuy4brug74y5g87bu4ebrub4er_session
COOKIE_SECRET=yhbjhwebuy6487hr4fhuy4brug74y5g87bu4ebrub4er_cookie

# Rate Limiting - Enhanced Security
AUTH_RATE_LIMIT_WINDOW_MS=900000
AUTH_RATE_LIMIT_MAX=5
SENSITIVE_RATE_LIMIT_WINDOW_MS=3600000
SENSITIVE_RATE_LIMIT_MAX=10
GENERAL_RATE_LIMIT_WINDOW_MS=900000
GENERAL_RATE_LIMIT_MAX=100

# Account Security
MAX_LOGIN_ATTEMPTS=10
LOCKOUT_DURATION_15MIN=900000
LOCKOUT_DURATION_1HOUR=3600000
LOCKOUT_DURATION_24HOURS=86400000
VERIFICATION_CODE_EXPIRY=600000
PASSWORD_RESET_EXPIRY=3600000

# Logging Configuration
LOG_LEVEL=info
LOG_FORMAT=combined
LOG_FILE=logs/app.log

# Monitoring and Analytics
ENABLE_MONITORING=true
ENABLE_ANALYTICS=false
SENTRY_DSN=

# AI Services Configuration
ELEVENLABS_API_KEY=sk_7d748c6c0c21972ba2b0f552d173b4b97e237f8308cd1f32
GOOGLE_CLOUD_PROJECT_ID=lyrical-tooling-467821-b9
GOOGLE_CLOUD_CREDENTIALS=959228681927-na9r579c40hcf5s12ble3chdd7t259gd.apps.googleusercontent.com

# Redis Configuration (for session storage and caching)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=
REDIS_DB=0

# File Upload Configuration
MAX_FILE_SIZE=10485760
ALLOWED_FILE_TYPES=image/jpeg,image/png,image/gif,application/pdf
UPLOAD_PATH=uploads

# Development Settings
ENABLE_DEBUG_MODE=false
ENABLE_TEST_MODE=false
AUTO_VERIFY_USERS=false

# Production Settings (override in production)
ENABLE_HTTPS=false
FORCE_HTTPS=false
ENABLE_COMPRESSION=true
ENABLE_CACHING=true
```

###  **Key Improvements Made**

1. **🔐 Token Security**: Short-lived access tokens (15m) with longer refresh tokens (7d)
2. **🛡️ Account Protection**: Progressive lockout system prevents brute force attacks
3. **📧 Email Security**: Secure verification flow with proper token management
4. **⚡ Performance**: Enhanced rate limiting and speed limiting
5. **🔍 Monitoring**: Comprehensive audit logging and security monitoring
6. **📋 Validation**: Industry-standard input validation with detailed error messages

### 📖 **Documentation Created**

I've created a comprehensive `AUTHENTICATION_README.md` file that includes:
- Complete API documentation
- Security best practices
- Testing instructions
- Troubleshooting guide
- Security checklist

### 🧪 **Testing Your Enhanced Authentication**

You can now test the improved authentication system:

```bash
# Test registration with enhanced security
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"SecurePass123!"}'

# Test login with enhanced security
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"SecurePass123!"}'
```

###  **Next Steps**

1. **Update your `.env` file** with the enhanced configuration above
2. **Test the authentication flow** using the provided curl commands
3. **Review the documentation** in `AUTHENTICATION_README.md`
4. **Implement frontend integration** following the best practices in the documentation

Your authentication system now meets industry standards with enterprise-level security features! 🚀 