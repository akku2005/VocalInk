const AuditLog = require('../models/auditlog.model');
const logger = require('../utils/logger');

/**
 * Enhanced Audit Logger Middleware
 * Provides comprehensive audit logging with database storage
 */
const auditLogger = (event, options = {}) => {
  return async (req, res, next) => {
    const startTime = Date.now();
    
    // Capture request details
    const auditData = {
      userId: req.user?.id,
      event: event,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      method: req.method,
      path: req.path,
      query: options.logQuery ? req.query : undefined,
      body: options.logBody ? sanitizeBody(req.body) : undefined,
      headers: options.logHeaders ? sanitizeHeaders(req.headers) : undefined,
      timestamp: new Date(),
      sessionId: req.session?.id,
      requestId: req.requestId,
      userRole: req.user?.role,
      userEmail: req.user?.email,
      targetResource: options.targetResource,
      targetId: options.targetId,
      metadata: options.metadata || {}
    };

    // Override response.json to capture response
    const originalJson = res.json;
    res.json = function(data) {
      auditData.responseStatus = res.statusCode;
      auditData.responseData = options.logResponse ? sanitizeResponse(data) : undefined;
      auditData.duration = Date.now() - startTime;
      auditData.success = data?.success || false;
      
      // Store audit log asynchronously
      storeAuditLog(auditData).catch(err => {
        logger.error('Audit logging failed:', err);
      });
      
      return originalJson.call(this, data);
    };

    // Override response.send for non-JSON responses
    const originalSend = res.send;
    res.send = function(data) {
      auditData.responseStatus = res.statusCode;
      auditData.responseData = options.logResponse ? String(data).substring(0, 1000) : undefined;
      auditData.duration = Date.now() - startTime;
      
      storeAuditLog(auditData).catch(err => {
        logger.error('Audit logging failed:', err);
      });
      
      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Store audit log in database
 */
const storeAuditLog = async (auditData) => {
  try {
    await AuditLog.create({
      userId: auditData.userId,
      event: auditData.event,
      ipAddress: auditData.ipAddress,
      userAgent: auditData.userAgent,
      method: auditData.method,
      path: auditData.path,
      query: auditData.query,
      body: auditData.body,
      headers: auditData.headers,
      responseStatus: auditData.responseStatus,
      responseData: auditData.responseData,
      duration: auditData.duration,
      success: auditData.success,
      sessionId: auditData.sessionId,
      requestId: auditData.requestId,
      userRole: auditData.userRole,
      userEmail: auditData.userEmail,
      targetResource: auditData.targetResource,
      targetId: auditData.targetId,
      metadata: auditData.metadata,
      timestamp: auditData.timestamp
    });

    logger.debug('Audit log stored successfully', {
      event: auditData.event,
      userId: auditData.userId,
      path: auditData.path,
      duration: auditData.duration
    });

  } catch (error) {
    logger.error('Failed to store audit log:', error);
    // Don't throw error to avoid breaking the request
  }
};

/**
 * Sanitize request body for logging
 */
const sanitizeBody = (body) => {
  if (!body) return undefined;
  
  const sanitized = { ...body };
  
  // Remove sensitive fields
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization'];
  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Sanitize headers for logging
 */
const sanitizeHeaders = (headers) => {
  if (!headers) return undefined;
  
  const sanitized = { ...headers };
  
  // Remove sensitive headers
  const sensitiveHeaders = ['authorization', 'cookie', 'x-api-key'];
  sensitiveHeaders.forEach(header => {
    if (sanitized[header]) {
      sanitized[header] = '[REDACTED]';
    }
  });
  
  return sanitized;
};

/**
 * Sanitize response data for logging
 */
const sanitizeResponse = (data) => {
  if (!data) return undefined;
  
  // Limit response size
  const responseStr = JSON.stringify(data);
  if (responseStr.length > 1000) {
    return responseStr.substring(0, 1000) + '...';
  }
  
  return data;
};

/**
 * Authentication Audit Logger
 * Specialized for authentication events
 */
const authAuditLogger = (event) => {
  return auditLogger(event, {
    logBody: true,
    logHeaders: false,
    logResponse: false,
    targetResource: 'auth',
    metadata: { type: 'authentication' }
  });
};

/**
 * Authorization Audit Logger
 * Specialized for authorization events
 */
const authorizationAuditLogger = (event) => {
  return auditLogger(event, {
    logBody: false,
    logHeaders: false,
    logResponse: false,
    targetResource: 'authorization',
    metadata: { type: 'authorization' }
  });
};

/**
 * Data Access Audit Logger
 * Specialized for data access events
 */
const dataAccessAuditLogger = (event, resource) => {
  return auditLogger(event, {
    logBody: false,
    logHeaders: false,
    logResponse: false,
    targetResource: resource,
    metadata: { type: 'data_access' }
  });
};

/**
 * Admin Action Audit Logger
 * Specialized for admin actions
 */
const adminAuditLogger = (event) => {
  return auditLogger(event, {
    logBody: true,
    logHeaders: false,
    logResponse: true,
    targetResource: 'admin',
    metadata: { type: 'admin_action' }
  });
};

/**
 * Security Event Audit Logger
 * Specialized for security events
 */
const securityAuditLogger = (event) => {
  return auditLogger(event, {
    logBody: true,
    logHeaders: true,
    logResponse: false,
    targetResource: 'security',
    metadata: { type: 'security_event' }
  });
};

/**
 * Compliance Audit Logger
 * Specialized for compliance events
 */
const complianceAuditLogger = (event) => {
  return auditLogger(event, {
    logBody: true,
    logHeaders: true,
    logResponse: true,
    targetResource: 'compliance',
    metadata: { type: 'compliance' }
  });
};

/**
 * Get audit logs with filtering
 */
const getAuditLogs = async (filters = {}) => {
  try {
    const {
      userId,
      event,
      startDate,
      endDate,
      ipAddress,
      method,
      path,
      page = 1,
      limit = 50
    } = filters;

    const query = {};

    if (userId) query.userId = userId;
    if (event) query.event = event;
    if (ipAddress) query.ipAddress = ipAddress;
    if (method) query.method = method;
    if (path) query.path = { $regex: path, $options: 'i' };
    if (startDate || endDate) {
      query.timestamp = {};
      if (startDate) query.timestamp.$gte = new Date(startDate);
      if (endDate) query.timestamp.$lte = new Date(endDate);
    }

    const logs = await AuditLog.find(query)
      .sort({ timestamp: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit)
      .populate('userId', 'name email');

    const total = await AuditLog.countDocuments(query);

    return {
      logs,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalLogs: total,
        hasNext: page * limit < total,
        hasPrev: page > 1
      }
    };

  } catch (error) {
    logger.error('Error getting audit logs:', error);
    throw error;
  }
};

/**
 * Export audit logs for compliance
 */
const exportAuditLogs = async (filters = {}, format = 'json') => {
  try {
    const { logs } = await getAuditLogs({ ...filters, limit: 10000 });

    if (format === 'csv') {
      return convertToCSV(logs);
    }

    return logs;

  } catch (error) {
    logger.error('Error exporting audit logs:', error);
    throw error;
  }
};

/**
 * Convert audit logs to CSV
 */
const convertToCSV = (logs) => {
  const headers = [
    'Timestamp',
    'Event',
    'User ID',
    'User Email',
    'IP Address',
    'Method',
    'Path',
    'Status',
    'Duration',
    'Success'
  ];

  const rows = logs.map(log => [
    log.timestamp,
    log.event,
    log.userId?.id || '',
    log.userEmail || '',
    log.ipAddress,
    log.method,
    log.path,
    log.responseStatus,
    log.duration,
    log.success
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(','))
    .join('\n');

  return csv;
};

/**
 * Clean up old audit logs
 */
const cleanupAuditLogs = async (daysOld = 90) => {
  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await AuditLog.deleteMany({
      timestamp: { $lt: cutoffDate }
    });

    logger.info(`Cleaned up ${result.deletedCount} old audit logs`);

    return result.deletedCount;

  } catch (error) {
    logger.error('Error cleaning up audit logs:', error);
    throw error;
  }
};

module.exports = {
  auditLogger,
  authAuditLogger,
  authorizationAuditLogger,
  dataAccessAuditLogger,
  adminAuditLogger,
  securityAuditLogger,
  complianceAuditLogger,
  getAuditLogs,
  exportAuditLogs,
  cleanupAuditLogs
};
