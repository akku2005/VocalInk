const Badge = require('../models/badge.model');
const BadgeClaim = require('../models/badgeClaim.model');
const logger = require('../utils/logger');

class BadgePerformanceMonitor {
  constructor() {
    this.metrics = {
      evaluationTimes: [],
      claimSuccessRates: [],
      fraudDetectionAccuracy: [],
      systemLoad: [],
      errorRates: []
    };
    this.alerts = [];
    this.thresholds = {
      maxEvaluationTime: 200, // ms
      minSuccessRate: 0.95, // 95%
      maxErrorRate: 0.01, // 1%
      maxSystemLoad: 0.8 // 80%
    };
  }

  /**
   * Track evaluation performance
   */
  trackEvaluationTime(userId, badgeId, evaluationTime) {
    this.metrics.evaluationTimes.push({
      userId,
      badgeId,
      evaluationTime,
      timestamp: new Date()
    });

    // Keep only last 1000 evaluations
    if (this.metrics.evaluationTimes.length > 1000) {
      this.metrics.evaluationTimes = this.metrics.evaluationTimes.slice(-1000);
    }

    // Check for performance alerts
    if (evaluationTime > this.thresholds.maxEvaluationTime) {
      this.createAlert('SLOW_EVALUATION', {
        userId,
        badgeId,
        evaluationTime,
        threshold: this.thresholds.maxEvaluationTime
      });
    }

    logger.info('Evaluation time tracked', {
      userId,
      badgeId,
      evaluationTime
    });
  }

  /**
   * Track claim success rate
   */
  async trackClaimSuccessRate() {
    try {
      const timeWindow = new Date(Date.now() - 24 * 60 * 60 * 1000); // Last 24 hours
      
      const totalClaims = await BadgeClaim.countDocuments({
        createdAt: { $gte: timeWindow }
      });

      const successfulClaims = await BadgeClaim.countDocuments({
        createdAt: { $gte: timeWindow },
        status: 'approved'
      });

      const successRate = totalClaims > 0 ? successfulClaims / totalClaims : 1;
      
      this.metrics.claimSuccessRates.push({
        successRate,
        totalClaims,
        successfulClaims,
        timestamp: new Date()
      });

      // Check for success rate alerts
      if (successRate < this.thresholds.minSuccessRate) {
        this.createAlert('LOW_SUCCESS_RATE', {
          successRate,
          threshold: this.thresholds.minSuccessRate,
          totalClaims,
          successfulClaims
        });
      }

      logger.info('Claim success rate tracked', {
        successRate,
        totalClaims,
        successfulClaims
      });

    } catch (error) {
      logger.error('Error tracking claim success rate:', error);
    }
  }

  /**
   * Track fraud detection accuracy
   */
  async trackFraudDetectionAccuracy() {
    try {
      const timeWindow = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000); // Last 7 days
      
      const reviewedClaims = await BadgeClaim.find({
        createdAt: { $gte: timeWindow },
        'fraudCheck.manualReviewRequired': true
      });

      let correctPredictions = 0;
      let totalReviewed = reviewedClaims.length;

      for (const claim of reviewedClaims) {
        const predictedRisk = claim.fraudCheck.riskLevel;
        const actualOutcome = claim.status === 'approved' ? 'legitimate' : 'fraudulent';
        
        // Simple accuracy calculation (can be enhanced)
        if ((predictedRisk === 'high' || predictedRisk === 'critical') && actualOutcome === 'fraudulent') {
          correctPredictions++;
        } else if ((predictedRisk === 'low' || predictedRisk === 'medium') && actualOutcome === 'legitimate') {
          correctPredictions++;
        }
      }

      const accuracy = totalReviewed > 0 ? correctPredictions / totalReviewed : 1;
      
      this.metrics.fraudDetectionAccuracy.push({
        accuracy,
        totalReviewed,
        correctPredictions,
        timestamp: new Date()
      });

      logger.info('Fraud detection accuracy tracked', {
        accuracy,
        totalReviewed,
        correctPredictions
      });

    } catch (error) {
      logger.error('Error tracking fraud detection accuracy:', error);
    }
  }

  /**
   * Track system load
   */
  trackSystemLoad(loadMetrics) {
    const systemLoad = {
      cpuUsage: loadMetrics.cpu || 0,
      memoryUsage: loadMetrics.memory || 0,
      databaseConnections: loadMetrics.dbConnections || 0,
      activeUsers: loadMetrics.activeUsers || 0,
      timestamp: new Date()
    };

    this.metrics.systemLoad.push(systemLoad);

    // Check for system load alerts
    if (systemLoad.cpuUsage > this.thresholds.maxSystemLoad * 100) {
      this.createAlert('HIGH_CPU_USAGE', {
        cpuUsage: systemLoad.cpuUsage,
        threshold: this.thresholds.maxSystemLoad * 100
      });
    }

    if (systemLoad.memoryUsage > this.thresholds.maxSystemLoad * 100) {
      this.createAlert('HIGH_MEMORY_USAGE', {
        memoryUsage: systemLoad.memoryUsage,
        threshold: this.thresholds.maxSystemLoad * 100
      });
    }

    logger.info('System load tracked', systemLoad);
  }

  /**
   * Track error rates
   */
  trackErrorRate(errorType, errorCount, totalRequests) {
    const errorRate = totalRequests > 0 ? errorCount / totalRequests : 0;
    
    this.metrics.errorRates.push({
      errorType,
      errorRate,
      errorCount,
      totalRequests,
      timestamp: new Date()
    });

    // Check for error rate alerts
    if (errorRate > this.thresholds.maxErrorRate) {
      this.createAlert('HIGH_ERROR_RATE', {
        errorType,
        errorRate,
        threshold: this.thresholds.maxErrorRate,
        errorCount,
        totalRequests
      });
    }

    logger.info('Error rate tracked', {
      errorType,
      errorRate,
      errorCount,
      totalRequests
    });
  }

  /**
   * Create performance alert
   */
  createAlert(type, data) {
    const alert = {
      type,
      data,
      timestamp: new Date(),
      severity: this.getAlertSeverity(type)
    };

    this.alerts.push(alert);

    // Keep only last 100 alerts
    if (this.alerts.length > 100) {
      this.alerts = this.alerts.slice(-100);
    }

    logger.warn('Performance alert created', alert);
  }

  /**
   * Get alert severity
   */
  getAlertSeverity(type) {
    const severities = {
      'SLOW_EVALUATION': 'warning',
      'LOW_SUCCESS_RATE': 'critical',
      'HIGH_CPU_USAGE': 'warning',
      'HIGH_MEMORY_USAGE': 'warning',
      'HIGH_ERROR_RATE': 'critical'
    };
    return severities[type] || 'info';
  }

  /**
   * Get performance metrics
   */
  getMetrics(timeWindow = 24) {
    const cutoffTime = new Date(Date.now() - timeWindow * 60 * 60 * 1000);
    
    const filteredMetrics = {
      evaluationTimes: this.metrics.evaluationTimes.filter(m => m.timestamp >= cutoffTime),
      claimSuccessRates: this.metrics.claimSuccessRates.filter(m => m.timestamp >= cutoffTime),
      fraudDetectionAccuracy: this.metrics.fraudDetectionAccuracy.filter(m => m.timestamp >= cutoffTime),
      systemLoad: this.metrics.systemLoad.filter(m => m.timestamp >= cutoffTime),
      errorRates: this.metrics.errorRates.filter(m => m.timestamp >= cutoffTime)
    };

    return {
      averageEvaluationTime: this.calculateAverageEvaluationTime(filteredMetrics.evaluationTimes),
      averageSuccessRate: this.calculateAverageSuccessRate(filteredMetrics.claimSuccessRates),
      averageFraudAccuracy: this.calculateAverageFraudAccuracy(filteredMetrics.fraudDetectionAccuracy),
      averageSystemLoad: this.calculateAverageSystemLoad(filteredMetrics.systemLoad),
      averageErrorRate: this.calculateAverageErrorRate(filteredMetrics.errorRates),
      alerts: this.alerts.filter(a => a.timestamp >= cutoffTime)
    };
  }

  /**
   * Calculate average evaluation time
   */
  calculateAverageEvaluationTime(evaluationTimes) {
    if (evaluationTimes.length === 0) return 0;
    const total = evaluationTimes.reduce((sum, m) => sum + m.evaluationTime, 0);
    return total / evaluationTimes.length;
  }

  /**
   * Calculate average success rate
   */
  calculateAverageSuccessRate(successRates) {
    if (successRates.length === 0) return 1;
    const total = successRates.reduce((sum, m) => sum + m.successRate, 0);
    return total / successRates.length;
  }

  /**
   * Calculate average fraud accuracy
   */
  calculateAverageFraudAccuracy(accuracyMetrics) {
    if (accuracyMetrics.length === 0) return 1;
    const total = accuracyMetrics.reduce((sum, m) => sum + m.accuracy, 0);
    return total / accuracyMetrics.length;
  }

  /**
   * Calculate average system load
   */
  calculateAverageSystemLoad(systemLoads) {
    if (systemLoads.length === 0) return { cpu: 0, memory: 0 };
    const cpuTotal = systemLoads.reduce((sum, m) => sum + m.cpuUsage, 0);
    const memoryTotal = systemLoads.reduce((sum, m) => sum + m.memoryUsage, 0);
    return {
      cpu: cpuTotal / systemLoads.length,
      memory: memoryTotal / systemLoads.length
    };
  }

  /**
   * Calculate average error rate
   */
  calculateAverageErrorRate(errorRates) {
    if (errorRates.length === 0) return 0;
    const total = errorRates.reduce((sum, m) => sum + m.errorRate, 0);
    return total / errorRates.length;
  }

  /**
   * Generate performance report
   */
  async generateReport() {
    const metrics = this.getMetrics(24); // Last 24 hours
    
    const report = {
      timestamp: new Date(),
      summary: {
        averageEvaluationTime: `${metrics.averageEvaluationTime.toFixed(2)}ms`,
        averageSuccessRate: `${(metrics.averageSuccessRate * 100).toFixed(2)}%`,
        averageFraudAccuracy: `${(metrics.averageFraudAccuracy * 100).toFixed(2)}%`,
        averageSystemLoad: `${(metrics.averageSystemLoad.cpu).toFixed(2)}% CPU, ${(metrics.averageSystemLoad.memory).toFixed(2)}% Memory`,
        averageErrorRate: `${(metrics.averageErrorRate * 100).toFixed(2)}%`,
        totalAlerts: metrics.alerts.length
      },
      alerts: metrics.alerts,
      recommendations: this.generateRecommendations(metrics)
    };

    logger.info('Performance report generated', report);
    return report;
  }

  /**
   * Generate recommendations based on metrics
   */
  generateRecommendations(metrics) {
    const recommendations = [];

    if (metrics.averageEvaluationTime > this.thresholds.maxEvaluationTime) {
      recommendations.push('Consider optimizing badge evaluation logic or adding caching');
    }

    if (metrics.averageSuccessRate < this.thresholds.minSuccessRate) {
      recommendations.push('Investigate claim rejection reasons and adjust requirements if needed');
    }

    if (metrics.averageSystemLoad.cpu > this.thresholds.maxSystemLoad * 100) {
      recommendations.push('Consider scaling up CPU resources or optimizing database queries');
    }

    if (metrics.averageErrorRate > this.thresholds.maxErrorRate) {
      recommendations.push('Investigate error patterns and implement better error handling');
    }

    return recommendations;
  }
}

module.exports = new BadgePerformanceMonitor(); 