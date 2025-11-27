const logger = require('../utils/logger');
const { EventEmitter } = require('events');

/**
 * Security Monitoring Service
 * Tracks security events, validation failures, and potential threats
 */
class SecurityMonitoringService extends EventEmitter {
  constructor() {
    super();
    this.securityEvents = new Map();
    this.threatLevels = {
      LOW: 'low',
      MEDIUM: 'medium',
      HIGH: 'high',
      CRITICAL: 'critical'
    };
    this.rateLimiters = new Map();
    this.suspiciousPatterns = new Map();
    this.alertThresholds = {
      validationFailures: 10, // per minute
      suspiciousRequests: 5,   // per minute
      failedLogins: 3,         // per minute
      malformedInputs: 15      // per minute
    };

    this.initializeMonitoring();
  }

  /**
   * Initialize security monitoring
   */
  initializeMonitoring() {
    // Set up periodic security reports
    // setInterval(() => this.generateSecurityReport(), 60000); // Every minute

    // Set up threat level monitoring
    // setInterval(() => this.assessThreatLevel(), 300000); // Every 5 minutes

    // Set up cleanup of old events
    // setInterval(() => this.cleanupOldEvents(), 3600000); // Every hour

    logger.info('Security monitoring service initialized');
  }

  /**
   * Log security event
   */
  logSecurityEvent(eventType, details, threatLevel = this.threatLevels.LOW) {
    const timestamp = new Date();
    const eventId = this.generateEventId();

    const securityEvent = {
      id: eventId,
      timestamp,
      eventType,
      details,
      threatLevel,
      source: {
        ip: details.ip || 'unknown',
        userAgent: details.userAgent || 'unknown',
        userId: details.userId || 'anonymous',
        endpoint: details.endpoint || 'unknown'
      }
    };

    // Store event
    if (!this.securityEvents.has(eventType)) {
      this.securityEvents.set(eventType, []);
    }
    this.securityEvents.get(eventType).push(securityEvent);

    // Emit event for real-time monitoring
    this.emit('securityEvent', securityEvent);

    // Check if threshold exceeded
    this.checkThresholds(eventType);

    // Log to security log
    logger.warn('Security event detected', {
      eventId,
      eventType,
      threatLevel,
      source: securityEvent.source,
      details: details.message || details
    });

    return eventId;
  }

  /**
   * Log validation failure
   */
  logValidationFailure(validationType, input, reason, requestInfo) {
    const details = {
      validationType,
      input: this.sanitizeInput(input),
      reason,
      message: `Validation failed for ${validationType}: ${reason}`,
      ...requestInfo
    };

    this.logSecurityEvent('validation_failure', details, this.threatLevels.MEDIUM);
  }

  /**
   * Log suspicious request
   */
  logSuspiciousRequest(requestType, details, requestInfo) {
    const eventDetails = {
      requestType,
      details,
      message: `Suspicious ${requestType} request detected`,
      ...requestInfo
    };

    this.logSecurityEvent('suspicious_request', eventDetails, this.threatLevels.HIGH);
  }

  /**
   * Log failed authentication attempt
   */
  logFailedAuthentication(credentials, reason, requestInfo) {
    const details = {
      credentials: this.sanitizeCredentials(credentials),
      reason,
      message: `Authentication failed: ${reason}`,
      ...requestInfo
    };

    this.logSecurityEvent('auth_failure', details, this.threatLevels.MEDIUM);
  }

  /**
   * Log malformed input
   */
  logMalformedInput(inputType, input, reason, requestInfo) {
    const details = {
      inputType,
      input: this.sanitizeInput(input),
      reason,
      message: `Malformed ${inputType} input: ${reason}`,
      ...requestInfo
    };

    this.logSecurityEvent('malformed_input', details, this.threatLevels.LOW);
  }

  /**
   * Log potential attack
   */
  logPotentialAttack(attackType, payload, indicators, requestInfo) {
    const details = {
      attackType,
      payload: this.sanitizeInput(payload),
      indicators,
      message: `Potential ${attackType} attack detected`,
      ...requestInfo
    };

    this.logSecurityEvent('potential_attack', details, this.threatLevels.CRITICAL);

    // Emit immediate alert
    this.emit('attackDetected', details);
  }

  /**
   * Check if thresholds are exceeded
   */
  checkThresholds(eventType) {
    const events = this.securityEvents.get(eventType) || [];
    const recentEvents = events.filter(event =>
      Date.now() - event.timestamp.getTime() < 60000 // Last minute
    );

    const threshold = this.alertThresholds[eventType] || 10;

    if (recentEvents.length >= threshold) {
      this.emit('thresholdExceeded', {
        eventType,
        count: recentEvents.length,
        threshold,
        events: recentEvents
      });

      logger.error(`Security threshold exceeded for ${eventType}`, {
        count: recentEvents.length,
        threshold,
        timeWindow: '1 minute'
      });
    }
  }

  /**
   * Assess current threat level
   */
  assessThreatLevel() {
    const threatScores = {
      [this.threatLevels.LOW]: 0,
      [this.threatLevels.MEDIUM]: 0,
      [this.threatLevels.HIGH]: 0,
      [this.threatLevels.CRITICAL]: 0
    };

    // Calculate threat scores based on recent events
    for (const [eventType, events] of this.securityEvents) {
      const recentEvents = events.filter(event =>
        Date.now() - event.timestamp.getTime() < 300000 // Last 5 minutes
      );

      for (const event of recentEvents) {
        threatScores[event.threatLevel]++;
      }
    }

    // Determine overall threat level
    let overallThreatLevel = this.threatLevels.LOW;
    if (threatScores[this.threatLevels.CRITICAL] > 0) {
      overallThreatLevel = this.threatLevels.CRITICAL;
    } else if (threatScores[this.threatLevels.HIGH] > 5) {
      overallThreatLevel = this.threatLevels.HIGH;
    } else if (threatScores[this.threatLevels.MEDIUM] > 10) {
      overallThreatLevel = this.threatLevels.MEDIUM;
    }

    // Emit threat level change
    this.emit('threatLevelChanged', overallThreatLevel);

    logger.info('Threat level assessment', {
      threatLevel: overallThreatLevel,
      scores: threatScores
    });
  }

  /**
   * Generate security report
   */
  generateSecurityReport() {
    const report = {
      timestamp: new Date(),
      summary: {
        totalEvents: 0,
        eventsByType: {},
        eventsByThreatLevel: {},
        recentActivity: []
      },
      recommendations: []
    };

    // Aggregate event data
    for (const [eventType, events] of this.securityEvents) {
      const recentEvents = events.filter(event =>
        Date.now() - event.timestamp.getTime() < 60000 // Last minute
      );

      report.summary.totalEvents += recentEvents.length;
      report.summary.eventsByType[eventType] = recentEvents.length;

      for (const event of recentEvents) {
        if (!report.summary.eventsByThreatLevel[event.threatLevel]) {
          report.summary.eventsByThreatLevel[event.threatLevel] = 0;
        }
        report.summary.eventsByThreatLevel[event.threatLevel]++;
      }
    }

    // Generate recommendations
    if (report.summary.eventsByThreatLevel[this.threatLevels.CRITICAL] > 0) {
      report.recommendations.push('Immediate security review required - critical threats detected');
    }
    if (report.summary.eventsByThreatLevel[this.threatLevels.HIGH] > 5) {
      report.recommendments.push('High threat level - consider additional security measures');
    }
    if (report.summary.eventsByType.validation_failure > 10) {
      report.recommendations.push('High validation failure rate - review input validation logic');
    }

    // Log report
    logger.debug('Security report generated', report);

    // Emit report
    this.emit('securityReport', report);

    return report;
  }

  /**
   * Get security statistics
   */
  getSecurityStats(timeWindow = 3600000) { // Default: 1 hour
    const stats = {
      totalEvents: 0,
      eventsByType: {},
      eventsByThreatLevel: {},
      topSources: new Map(),
      recentThreats: []
    };

    const cutoffTime = Date.now() - timeWindow;

    for (const [eventType, events] of this.securityEvents) {
      const recentEvents = events.filter(event =>
        event.timestamp.getTime() > cutoffTime
      );

      stats.totalEvents += recentEvents.length;
      stats.eventsByType[eventType] = recentEvents.length;

      for (const event of recentEvents) {
        // Count by threat level
        if (!stats.eventsByThreatLevel[event.threatLevel]) {
          stats.eventsByThreatLevel[event.threatLevel] = 0;
        }
        stats.eventsByThreatLevel[event.threatLevel]++;

        // Track sources
        const sourceKey = `${event.source.ip}-${event.source.userId}`;
        if (!stats.topSources.has(sourceKey)) {
          stats.topSources.set(sourceKey, { count: 0, source: event.source });
        }
        stats.topSources.get(sourceKey).count++;

        // Track high-level threats
        if (event.threatLevel === this.threatLevels.HIGH ||
          event.threatLevel === this.threatLevels.CRITICAL) {
          stats.recentThreats.push({
            timestamp: event.timestamp,
            eventType: event.eventType,
            threatLevel: event.threatLevel,
            source: event.source
          });
        }
      }
    }

    // Sort sources by count
    stats.topSources = Array.from(stats.topSources.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    // Sort threats by timestamp
    stats.recentThreats.sort((a, b) => b.timestamp - a.timestamp);

    return stats;
  }

  /**
   * Clean up old events
   */
  cleanupOldEvents() {
    const cutoffTime = Date.now() - 86400000; // 24 hours ago

    for (const [eventType, events] of this.securityEvents) {
      const recentEvents = events.filter(event =>
        event.timestamp.getTime() > cutoffTime
      );
      this.securityEvents.set(eventType, recentEvents);
    }

    logger.debug('Cleaned up old security events');
  }

  /**
   * Sanitize input for logging
   */
  sanitizeInput(input) {
    if (typeof input === 'string') {
      // Truncate long inputs and remove sensitive data
      return input.length > 200 ? input.substring(0, 200) + '...' : input;
    }
    if (typeof input === 'object') {
      // Remove sensitive fields and truncate
      const sanitized = { ...input };
      delete sanitized.password;
      delete sanitized.token;
      delete sanitized.secret;
      return JSON.stringify(sanitized).substring(0, 500);
    }
    return String(input);
  }

  /**
   * Sanitize credentials for logging
   */
  sanitizeCredentials(credentials) {
    if (typeof credentials === 'object') {
      const sanitized = { ...credentials };
      if (sanitized.password) sanitized.password = '[REDACTED]';
      if (sanitized.token) sanitized.token = '[REDACTED]';
      if (sanitized.secret) sanitized.secret = '[REDACTED]';
      return sanitized;
    }
    return '[REDACTED]';
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Export events for analysis
   */
  exportEvents(format = 'json', timeWindow = 86400000) {
    const events = [];
    const cutoffTime = Date.now() - timeWindow;

    for (const [eventType, eventList] of this.securityEvents) {
      for (const event of eventList) {
        if (event.timestamp.getTime() > cutoffTime) {
          events.push({
            ...event,
            timestamp: event.timestamp.toISOString()
          });
        }
      }
    }

    if (format === 'csv') {
      return this.convertToCSV(events);
    }

    return events;
  }

  /**
   * Convert events to CSV format
   */
  convertToCSV(events) {
    if (events.length === 0) return '';

    const headers = Object.keys(events[0]);
    const csvRows = [headers.join(',')];

    for (const event of events) {
      const row = headers.map(header => {
        const value = event[header];
        if (typeof value === 'object') {
          return `"${JSON.stringify(value).replace(/"/g, '""')}"`;
        }
        return `"${String(value).replace(/"/g, '""')}"`;
      });
      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }
}

module.exports = SecurityMonitoringService; 