// const AuditLog = require('../models/AuditLog');
const logger = require('../utils/logger');

// Audit Logger Middleware
const auditLogger = (event) => {
  return async (req, res, next) => {
    const originalJson = res.json;
    res.json = function(data) {
      // Store the response data
      res.locals.responseData = data;
      // Call the original json method
      return originalJson.call(this, data);
    };

    try {
      // Get user ID if available
      const userId = req.user?.id;

      // Get user agent
      const userAgent = req.headers['user-agent'];

      // Create audit log entry
      // await AuditLog.create({
      //   userId,
      //   event: event.startsWith('AUTH_') ? event : `AUTH_${event}`,
      //   ipAddress: req.ip || req.connection.remoteAddress,
      //   userAgent,
      //   details: {
      //     path: req.path,
      //     method: req.method,
      //     statusCode: res.statusCode,
      //     responseSuccess: res.locals.responseData?.success,
      //     errorMessage: res.locals.responseData?.message
      //   }
      // });
    } catch (error) {
      logger.error('Audit logging error:', error);
      // Don't block the request if logging fails
    }

    next();
  };
};

module.exports = {
  auditLogger
}; 