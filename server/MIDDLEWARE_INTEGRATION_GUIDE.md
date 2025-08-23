# Middleware Integration Guide

## 📋 Overview

This guide provides comprehensive instructions for integrating all middleware components into your Express.js application. The middleware stack includes authentication, authorization, rate limiting, security headers, audit logging, and error handling.

## 🏗️ Middleware Stack Architecture

### **Complete Middleware Stack**
```
Request → Security Headers → CORS → Request ID → IP Filter → User Agent Filter → 
Request Size Limiter → Request Logger → Performance Monitor → Rate Limiter → 
Authentication → Authorization → Route Handler → Response Logger → Error Handler
```

---

## 🔧 Integration Steps

### **1. Update App.js with Complete Middleware Stack**

```javascript
const express = require('express');
const helmet = require('helmet');
const cors = require('cors');

// Import middleware
const { securityMiddleware } = require('./src/middleware/security');
const { protect, authorize } = require('./src/middleware/auth');
const { apiLimiter, loginLimiter } = require('./src/middleware/rateLimiter');
const errorHandler = require('./src/middleware/errorHandler');
const { auditLogger } = require('./src/middleware/auditLogger');

const app = express();

// Security middleware (first)
app.use(helmet());
app.use(securityMiddleware);

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Rate limiting
app.use('/api/auth', loginLimiter);
app.use('/api', apiLimiter);

// Routes with audit logging
app.use('/api/auth', auditLogger('AUTH'), authRoutes);
app.use('/api/users', auditLogger('USER_ACCESS'), userRoutes);
app.use('/api/admin', auditLogger('ADMIN_ACTION'), adminRoutes);

// Error handling (last)
app.use(errorHandler);
```

### **2. Environment Variables**

```env
# Security
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
BLACKLISTED_IPS=192.168.1.100,10.0.0.50

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
LOGIN_RATE_LIMIT_MAX=5

# Audit Logging
AUDIT_LOG_RETENTION_DAYS=90
AUDIT_LOG_ENABLED=true

# Performance
SLOW_REQUEST_THRESHOLD=1000
VERY_SLOW_REQUEST_THRESHOLD=5000
```

### **3. Route-Specific Middleware Integration**

#### **Authentication Routes**
```javascript
const { authAuditLogger } = require('../middleware/auditLogger');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/login', 
  loginLimiter,
  authAuditLogger('LOGIN_ATTEMPT'),
  userValidations.login,
  authController.login
);

router.post('/register',
  loginLimiter,
  authAuditLogger('REGISTRATION_ATTEMPT'),
  userValidations.register,
  authController.register
);
```

#### **Protected Routes**
```javascript
const { dataAccessAuditLogger } = require('../middleware/auditLogger');
const { protect, authorize } = require('../middleware/auth');

router.get('/profile',
  protect,
  dataAccessAuditLogger('PROFILE_ACCESS', 'user'),
  userController.getProfile
);

router.put('/profile',
  protect,
  dataAccessAuditLogger('PROFILE_UPDATE', 'user'),
  userValidations.updateProfile,
  userController.updateProfile
);
```

#### **Admin Routes**
```javascript
const { adminAuditLogger } = require('../middleware/auditLogger');
const { protect, authorize } = require('../middleware/auth');

router.get('/admin/users',
  protect,
  authorize(['admin']),
  adminAuditLogger('ADMIN_USER_LIST'),
  adminController.getUsers
);

router.delete('/admin/users/:id',
  protect,
  authorize(['admin']),
  adminAuditLogger('ADMIN_USER_DELETE'),
  adminController.deleteUser
);
```

#### **Badge Routes**
```javascript
const { dataAccessAuditLogger } = require('../middleware/auditLogger');
const { protect } = require('../middleware/auth');

router.get('/badges',
  protect,
  dataAccessAuditLogger('BADGE_LIST', 'badge'),
  badgeController.getBadges
);

router.post('/badges/:id/claim',
  protect,
  dataAccessAuditLogger('BADGE_CLAIM', 'badge'),
  badgeController.claimBadge
);
```

#### **Abuse Report Routes**
```javascript
const { securityAuditLogger } = require('../middleware/auditLogger');
const { protect, authorize } = require('../middleware/auth');

router.post('/abusereports',
  protect,
  securityAuditLogger('ABUSE_REPORT_SUBMITTED'),
  abuseReportController.createReport
);

router.get('/abusereports',
  protect,
  authorize(['admin', 'moderator']),
  securityAuditLogger('ABUSE_REPORT_ACCESS'),
  abuseReportController.getReports
);
```

---

## 🛡️ Security Middleware Configuration

### **Security Headers**
```javascript
// Custom security headers for your app
const customSecurityHeaders = (req, res, next) => {
  // Content Security Policy for your specific needs
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' https://cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; " +
    "font-src 'self' https://fonts.gstatic.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' https://api.example.com; " +
    "frame-ancestors 'none';"
  );
  
  next();
};

app.use(customSecurityHeaders);
```

### **CORS Configuration**
```javascript
const corsOptions = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || ['http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Request-ID'],
  exposedHeaders: ['X-Total-Count', 'X-Request-ID', 'X-Rate-Limit-Remaining'],
  maxAge: 86400
};

app.use(cors(corsOptions));
```

---

## 📊 Audit Logging Configuration

### **Audit Log Categories**
```javascript
// Authentication events
app.use('/api/auth', authAuditLogger('AUTH_EVENT'));

// Authorization events
app.use('/api/admin', authorizationAuditLogger('AUTHORIZATION_CHECK'));

// Data access events
app.use('/api/users', dataAccessAuditLogger('USER_DATA_ACCESS', 'user'));
app.use('/api/badges', dataAccessAuditLogger('BADGE_DATA_ACCESS', 'badge'));

// Admin actions
app.use('/api/admin', adminAuditLogger('ADMIN_ACTION'));

// Security events
app.use('/api/abusereports', securityAuditLogger('SECURITY_EVENT'));

// Compliance events
app.use('/api/compliance', complianceAuditLogger('COMPLIANCE_EVENT'));
```

### **Audit Log Retrieval**
```javascript
// Get audit logs with filtering
const { getAuditLogs } = require('../middleware/auditLogger');

const auditController = {
  getLogs: async (req, res) => {
    const filters = {
      userId: req.query.userId,
      event: req.query.event,
      startDate: req.query.startDate,
      endDate: req.query.endDate,
      page: parseInt(req.query.page) || 1,
      limit: parseInt(req.query.limit) || 50
    };

    const result = await getAuditLogs(filters);
    res.json(result);
  },

  exportLogs: async (req, res) => {
    const filters = {
      startDate: req.query.startDate,
      endDate: req.query.endDate
    };

    const format = req.query.format || 'json';
    const logs = await exportAuditLogs(filters, format);

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    }

    res.send(logs);
  }
};
```

---

## 🚀 Performance Monitoring

### **Performance Thresholds**
```javascript
// Configure performance monitoring
const performanceConfig = {
  slowRequestThreshold: 1000, // 1 second
  verySlowRequestThreshold: 5000, // 5 seconds
  logSlowRequests: true,
  logVerySlowRequests: true
};

// Apply to specific routes
app.use('/api/admin', performanceMonitor);
app.use('/api/reports', performanceMonitor);
```

### **Performance Analytics**
```javascript
// Performance monitoring controller
const performanceController = {
  getMetrics: async (req, res) => {
    const metrics = {
      averageResponseTime: await getAverageResponseTime(),
      slowRequests: await getSlowRequestCount(),
      errorRate: await getErrorRate(),
      throughput: await getThroughput()
    };

    res.json(metrics);
  }
};
```

---

## 🔍 Error Handling Enhancement

### **Enhanced Error Handler**
```javascript
const enhancedErrorHandler = (err, req, res, next) => {
  // Log error with context
  logger.error('Error occurred', {
    requestId: req.requestId,
    userId: req.user?.id,
    path: req.path,
    method: req.method,
    error: err.message,
    stack: err.stack
  });

  // Send appropriate error response
  const errorResponse = {
    success: false,
    message: err.message || 'Internal server error',
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  };

  // Add error details in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(err.statusCode || 500).json(errorResponse);
};
```

---

## 📈 Monitoring and Analytics

### **Middleware Analytics Dashboard**
```javascript
const middlewareAnalytics = {
  getRateLimitStats: async () => {
    // Get rate limiting statistics
    return {
      totalRequests: await getTotalRequests(),
      blockedRequests: await getBlockedRequests(),
      averageResponseTime: await getAverageResponseTime()
    };
  },

  getSecurityStats: async () => {
    // Get security statistics
    return {
      suspiciousIPs: await getSuspiciousIPs(),
      blockedUserAgents: await getBlockedUserAgents(),
      securityEvents: await getSecurityEvents()
    };
  },

  getAuditStats: async () => {
    // Get audit logging statistics
    return {
      totalAuditLogs: await getTotalAuditLogs(),
      eventsByType: await getEventsByType(),
      userActivity: await getUserActivity()
    };
  }
};
```

---

## 🧪 Testing Middleware

### **Middleware Testing Suite**
```javascript
const testMiddleware = async () => {
  // Test security headers
  const response = await request(app)
    .get('/api/test')
    .expect('X-Content-Type-Options', 'nosniff')
    .expect('X-Frame-Options', 'DENY');

  // Test rate limiting
  for (let i = 0; i < 6; i++) {
    await request(app)
      .post('/api/auth/login')
      .send({ email: 'test@example.com', password: 'password' });
  }

  // Test authentication
  await request(app)
    .get('/api/protected')
    .expect(401);

  // Test authorization
  const token = await getAuthToken('user');
  await request(app)
    .get('/api/admin')
    .set('Authorization', `Bearer ${token}`)
    .expect(403);
};
```

---

## 📋 Implementation Checklist

### **✅ Phase 1: Core Security**
- [x] Security headers middleware
- [x] CORS configuration
- [x] Request ID generation
- [x] IP filtering
- [x] User agent filtering

### **✅ Phase 2: Authentication & Authorization**
- [x] JWT authentication
- [x] Role-based authorization
- [x] Permission-based access control
- [x] Token blacklisting

### **✅ Phase 3: Rate Limiting & Performance**
- [x] API rate limiting
- [x] Login rate limiting
- [x] Performance monitoring
- [x] Request/response logging

### **✅ Phase 4: Audit Logging**
- [x] Database audit logging
- [x] Specialized audit loggers
- [x] Audit log retrieval
- [x] Compliance reporting

### **✅ Phase 5: Error Handling**
- [x] Comprehensive error handling
- [x] Error logging
- [x] Error tracking
- [x] Error reporting

---

## 🎯 Best Practices

### **Security**
1. **Always use HTTPS** in production
2. **Implement proper CORS** configuration
3. **Use security headers** consistently
4. **Monitor suspicious activity** with audit logs
5. **Rate limit sensitive endpoints**

### **Performance**
1. **Monitor response times** for all endpoints
2. **Log slow requests** for optimization
3. **Use appropriate rate limits** for different endpoints
4. **Cache frequently accessed data**

### **Compliance**
1. **Log all authentication events**
2. **Track data access patterns**
3. **Maintain audit logs** for required retention period
4. **Export audit logs** for compliance reporting

### **Monitoring**
1. **Set up alerts** for security events
2. **Monitor rate limiting** effectiveness
3. **Track error rates** and patterns
4. **Analyze performance** metrics

This comprehensive middleware integration ensures your application meets enterprise-level security, performance, and compliance standards! 