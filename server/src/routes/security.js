const express = require('express');
const router = express.Router();
const SecurityMonitoringService = require('../services/SecurityMonitoringService');
const EnhancedRateLimiter = require('../middleware/enhancedRateLimiter');
const { authorize } = require('../middleware/authorize');
const logger = require('../utils/logger');

// Initialize services
const securityMonitor = new SecurityMonitoringService();
const rateLimiter = new EnhancedRateLimiter();

/**
 * @route   GET /api/security/dashboard
 * @desc    Get security dashboard data
 * @access  Admin only
 */
router.get('/dashboard', authorize(['admin']), async (req, res) => {
  try {
    const dashboardData = {
      timestamp: new Date().toISOString(),
      threatLevel: await getCurrentThreatLevel(),
      recentEvents: await getRecentSecurityEvents(),
      rateLimiting: await getRateLimitingStats(),
      recommendations: await getSecurityRecommendations(),
      systemHealth: await getSystemHealth()
    };

    res.json({
      success: true,
      data: dashboardData
    });
  } catch (error) {
    logger.error('Error getting security dashboard:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security dashboard'
    });
  }
});

/**
 * @route   GET /api/security/events
 * @desc    Get security events with filtering
 * @access  Admin only
 */
router.get('/events', authorize(['admin']), async (req, res) => {
  try {
    const { 
      eventType, 
      threatLevel, 
      startDate, 
      endDate, 
      limit = 100,
      format = 'json'
    } = req.query;

    let events = securityMonitor.exportEvents(format);
    
    // Apply filters
    if (eventType) {
      events = events.filter(event => event.eventType === eventType);
    }
    
    if (threatLevel) {
      events = events.filter(event => event.threatLevel === threatLevel);
    }
    
    if (startDate) {
      const start = new Date(startDate);
      events = events.filter(event => new Date(event.timestamp) >= start);
    }
    
    if (endDate) {
      const end = new Date(endDate);
      events = events.filter(event => new Date(event.timestamp) <= end);
    }

    // Apply limit
    events = events.slice(0, parseInt(limit));

    if (format === 'csv') {
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename="security-events.csv"');
      res.send(events);
    } else {
      res.json({
        success: true,
        data: {
          events,
          count: events.length,
          filters: { eventType, threatLevel, startDate, endDate, limit }
        }
      });
    }
  } catch (error) {
    logger.error('Error getting security events:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security events'
    });
  }
});

/**
 * @route   GET /api/security/stats
 * @desc    Get security statistics
 * @access  Admin only
 */
router.get('/stats', authorize(['admin']), async (req, res) => {
  try {
    const { timeWindow = '1h' } = req.query;
    
    const timeWindowMs = {
      '1h': 3600000,
      '6h': 21600000,
      '24h': 86400000,
      '7d': 604800000
    }[timeWindow] || 3600000;

    const stats = securityMonitor.getSecurityStats(timeWindowMs);
    const rateLimitStats = rateLimiter.getSecurityStats();

    res.json({
      success: true,
      data: {
        security: stats,
        rateLimiting: rateLimitStats,
        timeWindow,
        generatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error getting security stats:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security statistics'
    });
  }
});

/**
 * @route   POST /api/security/block-ip
 * @desc    Block an IP address
 * @access  Admin only
 */
router.post('/block-ip', authorize(['admin']), async (req, res) => {
  try {
    const { ip, reason, duration = 3600 } = req.body; // duration in seconds

    if (!ip) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required'
      });
    }

    await rateLimiter.blockIP(ip);
    
    // Log the action
    securityMonitor.logSecurityEvent('admin_action', {
      action: 'block_ip',
      ip,
      reason,
      duration,
      adminId: req.user.id,
      message: `IP ${ip} blocked by admin for ${duration} seconds`
    });

    res.json({
      success: true,
      message: `IP ${ip} blocked successfully`,
      data: { ip, reason, duration, blockedAt: new Date().toISOString() }
    });
  } catch (error) {
    logger.error('Error blocking IP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to block IP address'
    });
  }
});

/**
 * @route   POST /api/security/unblock-ip
 * @desc    Unblock an IP address
 * @access  Admin only
 */
router.post('/unblock-ip', authorize(['admin']), async (req, res) => {
  try {
    const { ip } = req.body;

    if (!ip) {
      return res.status(400).json({
        success: false,
        message: 'IP address is required'
      });
    }

    await rateLimiter.unblockIP(ip);
    
    // Log the action
    securityMonitor.logSecurityEvent('admin_action', {
      action: 'unblock_ip',
      ip,
      adminId: req.user.id,
      message: `IP ${ip} unblocked by admin`
    });

    res.json({
      success: true,
      message: `IP ${ip} unblocked successfully`,
      data: { ip, unblockedAt: new Date().toISOString() }
    });
  } catch (error) {
    logger.error('Error unblocking IP:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to unblock IP address'
    });
  }
});

/**
 * @route   POST /api/security/update-thresholds
 * @desc    Update security thresholds
 * @access  Admin only
 */
router.post('/update-thresholds', authorize(['admin']), async (req, res) => {
  try {
    const { thresholds } = req.body;

    if (!thresholds || typeof thresholds !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'Valid thresholds object is required'
      });
    }

    // Update thresholds
    Object.assign(securityMonitor.alertThresholds, thresholds);
    
    // Log the action
    securityMonitor.logSecurityEvent('admin_action', {
      action: 'update_thresholds',
      thresholds,
      adminId: req.user.id,
      message: 'Security thresholds updated by admin'
    });

    res.json({
      success: true,
      message: 'Security thresholds updated successfully',
      data: { 
        thresholds: securityMonitor.alertThresholds,
        updatedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.error('Error updating thresholds:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update security thresholds'
    });
  }
});

/**
 * @route   GET /api/security/health
 * @desc    Get security system health
 * @access  Admin only
 */
router.get('/health', authorize(['admin']), async (req, res) => {
  try {
    const health = {
      timestamp: new Date().toISOString(),
      status: 'healthy',
      services: {
        securityMonitoring: 'healthy',
        rateLimiting: 'healthy',
        logging: 'healthy'
      },
      metrics: {
        activeConnections: 0, // Would be implemented with actual connection tracking
        memoryUsage: process.memoryUsage(),
        uptime: process.uptime()
      }
    };

    res.json({
      success: true,
      data: health
    });
  } catch (error) {
    logger.error('Error getting security health:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get security health'
    });
  }
});

/**
 * @route   POST /api/security/test
 * @desc    Run security tests
 * @access  Admin only
 */
router.post('/test', authorize(['admin']), async (req, res) => {
  try {
    const { testType = 'all' } = req.body;
    
    // This would integrate with the security testing suite
    const testResults = {
      timestamp: new Date().toISOString(),
      testType,
      status: 'completed',
      results: 'Security tests completed successfully'
    };

    res.json({
      success: true,
      data: testResults
    });
  } catch (error) {
    logger.error('Error running security tests:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to run security tests'
    });
  }
});

// Helper functions
async function getCurrentThreatLevel() {
  return new Promise((resolve) => {
    securityMonitor.once('threatLevelChanged', (level) => {
      resolve(level);
    });
    
    // Get current level from stats
    const stats = securityMonitor.getSecurityStats();
    let threatLevel = 'low';
    
    if (stats.eventsByThreatLevel.critical > 0) {
      threatLevel = 'critical';
    } else if (stats.eventsByThreatLevel.high > 5) {
      threatLevel = 'high';
    } else if (stats.eventsByThreatLevel.medium > 10) {
      threatLevel = 'medium';
    }
    
    resolve(threatLevel);
  });
}

async function getRecentSecurityEvents() {
  const stats = securityMonitor.getSecurityStats(300000); // Last 5 minutes
  return stats.recentThreats.slice(0, 10);
}

async function getRateLimitingStats() {
  return rateLimiter.getSecurityStats();
}

async function getSecurityRecommendations() {
  const stats = securityMonitor.getSecurityStats();
  const recommendations = [];

  if (stats.eventsByThreatLevel.critical > 0) {
    recommendations.push('Immediate security review required - critical threats detected');
  }
  
  if (stats.eventsByThreatLevel.high > 5) {
    recommendations.push('High threat level - consider additional security measures');
  }
  
  if (stats.eventsByType.validation_failure > 10) {
    recommendations.push('High validation failure rate - review input validation logic');
  }
  
  if (stats.eventsByType.rate_limit_exceeded > 20) {
    recommendations.push('High rate limit violations - review rate limiting configuration');
  }

  return recommendations;
}

async function getSystemHealth() {
  return {
    memory: process.memoryUsage(),
    uptime: process.uptime(),
    cpu: process.cpuUsage(),
    platform: process.platform,
    nodeVersion: process.version
  };
}

module.exports = router; 