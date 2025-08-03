const AbuseReport = require('../models/abusereport.model');
const User = require('../models/user.model');
const NotificationService = require('./NotificationService');
const EmailService = require('./EmailService');
const logger = require('../utils/logger');

class AbuseReportService {
  constructor() {
    this.emailService = EmailService.getInstance();
    this.fraudThresholds = {
      low: 0.3,
      medium: 0.6,
      high: 0.8,
      critical: 0.9
    };
  }

  /**
   * Create a new abuse report with comprehensive validation
   */
  async createReport(reportData, reporterId, requestInfo = {}) {
    try {
      // Validate target exists
      await this.validateTarget(reportData.targetType, reportData.targetId);

      // Get target user if applicable
      const targetUser = await this.getTargetUser(reportData.targetType, reportData.targetId);

      // Create report with security information
      const report = new AbuseReport({
        ...reportData,
        reporterId,
        targetUser: targetUser?._id,
        security: {
          ipAddress: requestInfo.ipAddress,
          userAgent: requestInfo.userAgent,
          deviceFingerprint: requestInfo.deviceFingerprint,
          location: requestInfo.location
        }
      });

      // Perform fraud detection
      const fraudAnalysis = await this.analyzeFraud(report, reporterId);
      report.fraudCheck = fraudAnalysis;

      // Set severity based on category and fraud analysis
      report.severity = this.calculateSeverity(report.category, report.subcategory, fraudAnalysis.score);

      // Save the report
      await report.save();

      // Send notifications
      await this.sendReportNotifications(report);

      // Check for related reports
      await this.findRelatedReports(report);

      logger.info('Abuse report created successfully', {
        reportId: report.reportId,
        reporterId,
        targetType: report.targetType,
        category: report.category,
        severity: report.severity
      });

      return report;

    } catch (error) {
      logger.error('Error creating abuse report:', error);
      throw error;
    }
  }

  /**
   * Validate that the target exists and is valid
   */
  async validateTarget(targetType, targetId) {
    try {
      let target;
      
      switch (targetType) {
        case 'user':
          target = await User.findById(targetId);
          break;
        case 'blog':
          target = await this.model('Blog').findById(targetId);
          break;
        case 'comment':
          target = await this.model('Comment').findById(targetId);
          break;
        case 'series':
          target = await this.model('Series').findById(targetId);
          break;
        default:
          throw new Error(`Invalid target type: ${targetType}`);
      }

      if (!target) {
        throw new Error(`Target ${targetType} with ID ${targetId} not found`);
      }

      return target;

    } catch (error) {
      logger.error('Error validating target:', error);
      throw error;
    }
  }

  /**
   * Get target user for user-related reports
   */
  async getTargetUser(targetType, targetId) {
    try {
      if (targetType === 'user') {
        return await User.findById(targetId);
      } else if (targetType === 'blog') {
        const blog = await this.model('Blog').findById(targetId).populate('author');
        return blog?.author;
      } else if (targetType === 'comment') {
        const comment = await this.model('Comment').findById(targetId).populate('author');
        return comment?.author;
      }
      return null;
    } catch (error) {
      logger.error('Error getting target user:', error);
      return null;
    }
  }

  /**
   * Analyze report for potential fraud
   */
  async analyzeFraud(report, reporterId) {
    const analysis = {
      score: 0,
      flags: [],
      riskLevel: 'low',
      automatedDecision: true,
      manualReviewRequired: false
    };

    try {
      // Check reporter history
      const reporterHistory = await this.analyzeReporterHistory(reporterId);
      analysis.score += reporterHistory.score;
      analysis.flags.push(...reporterHistory.flags);

      // Check for duplicate reports
      const duplicateCheck = await this.checkDuplicateReports(report);
      analysis.score += duplicateCheck.score;
      analysis.flags.push(...duplicateCheck.flags);

      // Check for suspicious patterns
      const patternCheck = await this.analyzeSuspiciousPatterns(report);
      analysis.score += patternCheck.score;
      analysis.flags.push(...patternCheck.flags);

      // Determine risk level
      analysis.riskLevel = this.determineRiskLevel(analysis.score);
      analysis.automatedDecision = analysis.riskLevel === 'low' || analysis.riskLevel === 'medium';
      analysis.manualReviewRequired = analysis.riskLevel === 'high' || analysis.riskLevel === 'critical';

      return analysis;

    } catch (error) {
      logger.error('Error in fraud analysis:', error);
      return analysis;
    }
  }

  /**
   * Analyze reporter's history
   */
  async analyzeReporterHistory(reporterId) {
    const result = { score: 0, flags: [] };

    try {
      const userReports = await AbuseReport.find({ reporterId });
      
      // Check for excessive reporting
      if (userReports.length > 10) {
        result.score += 0.3;
        result.flags.push('excessive_reporting');
      }

      // Check for false reports
      const falseReports = userReports.filter(r => r.resolution === 'false_report').length;
      if (falseReports > 2) {
        result.score += 0.4;
        result.flags.push('history_of_false_reports');
      }

      // Check for recent reports
      const recentReports = userReports.filter(r => 
        (Date.now() - r.createdAt) < 24 * 60 * 60 * 1000
      ).length;
      if (recentReports > 3) {
        result.score += 0.2;
        result.flags.push('recent_reporting_spree');
      }

    } catch (error) {
      logger.error('Error analyzing reporter history:', error);
    }

    return result;
  }

  /**
   * Check for duplicate reports
   */
  async checkDuplicateReports(report) {
    const result = { score: 0, flags: [] };

    try {
      const similarReports = await AbuseReport.find({
        targetType: report.targetType,
        targetId: report.targetId,
        reporterId: report.reporterId,
        createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      });

      if (similarReports.length > 0) {
        result.score += 0.5;
        result.flags.push('duplicate_report');
      }

    } catch (error) {
      logger.error('Error checking duplicate reports:', error);
    }

    return result;
  }

  /**
   * Analyze suspicious patterns
   */
  async analyzeSuspiciousPatterns(report) {
    const result = { score: 0, flags: [] };

    try {
      // Check for suspicious timing
      const hour = new Date().getHours();
      if (hour < 6 || hour > 23) {
        result.score += 0.1;
        result.flags.push('unusual_timing');
      }

      // Check for suspicious content patterns
      const suspiciousKeywords = ['test', 'spam', 'fake', 'report'];
      const content = `${report.title} ${report.description}`.toLowerCase();
      
      if (suspiciousKeywords.some(keyword => content.includes(keyword))) {
        result.score += 0.2;
        result.flags.push('suspicious_content');
      }

    } catch (error) {
      logger.error('Error analyzing suspicious patterns:', error);
    }

    return result;
  }

  /**
   * Calculate severity based on category and fraud score
   */
  calculateSeverity(category, subcategory, fraudScore) {
    const categorySeverity = {
      'violence': 'high',
      'hate_speech': 'high',
      'sexual_content': 'high',
      'threats': 'critical',
      'harassment': 'medium',
      'spam': 'low',
      'copyright': 'medium',
      'misinformation': 'medium',
      'other': 'low'
    };

    let severity = categorySeverity[category] || 'medium';

    // Adjust based on fraud score
    if (fraudScore > 0.7) {
      severity = 'low'; // Likely false report
    } else if (fraudScore < 0.2 && severity === 'high') {
      severity = 'critical'; // High confidence in serious report
    }

    return severity;
  }

  /**
   * Determine risk level based on fraud score
   */
  determineRiskLevel(score) {
    if (score >= this.fraudThresholds.critical) return 'critical';
    if (score >= this.fraudThresholds.high) return 'high';
    if (score >= this.fraudThresholds.medium) return 'medium';
    return 'low';
  }

  /**
   * Send notifications for new reports
   */
  async sendReportNotifications(report) {
    try {
      // Send notification to admins for urgent reports
      if (report.isUrgent) {
        await this.sendUrgentReportNotification(report);
      }

      // Send confirmation to reporter
      await this.sendReportConfirmation(report);

      // Send notification to target user (if applicable and not urgent)
      if (report.targetUser && !report.isUrgent) {
        await this.sendTargetNotification(report);
      }

    } catch (error) {
      logger.error('Error sending report notifications:', error);
    }
  }

  /**
   * Send urgent report notification to admins
   */
  async sendUrgentReportNotification(report) {
    try {
      const admins = await User.find({ role: { $in: ['admin', 'moderator'] } });
      
      for (const admin of admins) {
        await NotificationService.sendBulkNotifications([admin._id], {
          title: '🚨 Urgent Abuse Report',
          content: `New urgent report: ${report.category} - ${report.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
              <h2 style="color: #dc3545;">🚨 Urgent Abuse Report</h2>
              <div style="background-color: #f8d7da; padding: 15px; border-radius: 5px; margin: 20px 0;">
                <p><strong>Report ID:</strong> ${report.reportId}</p>
                <p><strong>Category:</strong> ${report.category}</p>
                <p><strong>Severity:</strong> ${report.severity}</p>
                <p><strong>Target:</strong> ${report.targetType} - ${report.targetId}</p>
                <p><strong>Description:</strong> ${report.description}</p>
              </div>
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/admin/reports/${report.reportId}" 
                 style="background-color: #dc3545; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                Review Report
              </a>
            </div>
          `
        });
      }

      logger.info('Urgent report notification sent to admins', {
        reportId: report.reportId,
        adminCount: admins.length
      });

    } catch (error) {
      logger.error('Error sending urgent report notification:', error);
    }
  }

  /**
   * Send confirmation to reporter
   */
  async sendReportConfirmation(report) {
    try {
      const reporter = await User.findById(report.reporterId);
      
      await NotificationService.sendBulkNotifications([reporter._id], {
        title: 'Report Submitted Successfully',
        content: `Your report has been submitted and is under review.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #28a745;">✅ Report Submitted</h2>
            <p>Thank you for your report. We take all reports seriously and will review this matter promptly.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Report ID:</strong> ${report.reportId}</p>
              <p><strong>Category:</strong> ${report.category}</p>
              <p><strong>Status:</strong> ${report.status}</p>
            </div>
            <p>You will be notified when your report has been reviewed.</p>
          </div>
        `
      });

      logger.info('Report confirmation sent to reporter', {
        reportId: report.reportId,
        reporterId: report.reporterId
      });

    } catch (error) {
      logger.error('Error sending report confirmation:', error);
    }
  }

  /**
   * Send notification to target user
   */
  async sendTargetNotification(report) {
    try {
      const targetUser = await User.findById(report.targetUser);
      
      await NotificationService.sendBulkNotifications([targetUser._id], {
        title: 'Content Report Received',
        content: `A report has been filed regarding your content.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #ffc107;">⚠️ Content Report</h2>
            <p>A report has been filed regarding your content. Our team will review this matter.</p>
            <div style="background-color: #fff3cd; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Report Category:</strong> ${report.category}</p>
              <p><strong>Content Type:</strong> ${report.targetType}</p>
            </div>
            <p>If you believe this report is incorrect, you may appeal the decision once it is made.</p>
          </div>
        `
      });

      logger.info('Target notification sent', {
        reportId: report.reportId,
        targetUserId: report.targetUser
      });

    } catch (error) {
      logger.error('Error sending target notification:', error);
    }
  }

  /**
   * Find related reports
   */
  async findRelatedReports(report) {
    try {
      const relatedReports = await AbuseReport.find({
        targetType: report.targetType,
        targetId: report.targetId,
        _id: { $ne: report._id }
      }).limit(5);

      if (relatedReports.length > 0) {
        report.analytics.relatedReports = relatedReports.map(r => r._id);
        await report.save();

        logger.info('Related reports found', {
          reportId: report.reportId,
          relatedCount: relatedReports.length
        });
      }

    } catch (error) {
      logger.error('Error finding related reports:', error);
    }
  }

  /**
   * Get reports with filtering and pagination
   */
  async getReports(filters = {}, options = {}) {
    try {
      const {
        status,
        priority,
        category,
        severity,
        targetType,
        reporterId,
        page = 1,
        limit = 20,
        sortBy = 'createdAt',
        sortOrder = 'desc'
      } = filters;

      const query = {};

      if (status) query.status = status;
      if (priority) query.priority = priority;
      if (category) query.category = category;
      if (severity) query.severity = severity;
      if (targetType) query.targetType = targetType;
      if (reporterId) query.reporterId = reporterId;

      const sort = {};
      sort[sortBy] = sortOrder === 'desc' ? -1 : 1;

      const reports = await AbuseReport.find(query)
        .populate('reporterId', 'name email')
        .populate('targetUser', 'name email')
        .populate('reviewedBy', 'name email')
        .sort(sort)
        .limit(limit * 1)
        .skip((page - 1) * limit);

      const total = await AbuseReport.countDocuments(query);

      return {
        reports,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalReports: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      };

    } catch (error) {
      logger.error('Error getting reports:', error);
      throw error;
    }
  }

  /**
   * Get urgent reports
   */
  async getUrgentReports() {
    try {
      return await AbuseReport.getUrgentReports()
        .populate('reporterId', 'name email')
        .populate('targetUser', 'name email');
    } catch (error) {
      logger.error('Error getting urgent reports:', error);
      throw error;
    }
  }

  /**
   * Update report status
   */
  async updateReportStatus(reportId, status, notes, updatedBy) {
    try {
      const report = await AbuseReport.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      report.status = status;
      report.reviewNotes = notes;
      report.reviewedBy = updatedBy;
      report.reviewedAt = new Date();

      await report.save();

      // Send status update notifications
      await this.sendStatusUpdateNotification(report);

      logger.info('Report status updated', {
        reportId,
        status,
        updatedBy
      });

      return report;

    } catch (error) {
      logger.error('Error updating report status:', error);
      throw error;
    }
  }

  /**
   * Resolve report
   */
  async resolveReport(reportId, resolution, notes, resolvedBy) {
    try {
      const report = await AbuseReport.findById(reportId);
      if (!report) {
        throw new Error('Report not found');
      }

      await report.resolve(resolution, notes, resolvedBy);

      // Send resolution notifications
      await this.sendResolutionNotification(report);

      logger.info('Report resolved', {
        reportId,
        resolution,
        resolvedBy
      });

      return report;

    } catch (error) {
      logger.error('Error resolving report:', error);
      throw error;
    }
  }

  /**
   * Send status update notification
   */
  async sendStatusUpdateNotification(report) {
    try {
      const reporter = await User.findById(report.reporterId);
      
      await NotificationService.sendBulkNotifications([reporter._id], {
        title: 'Report Status Updated',
        content: `Your report status has been updated to: ${report.status}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #007bff;">📋 Report Status Update</h2>
            <p>Your report has been updated.</p>
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Report ID:</strong> ${report.reportId}</p>
              <p><strong>New Status:</strong> ${report.status}</p>
              ${report.reviewNotes ? `<p><strong>Notes:</strong> ${report.reviewNotes}</p>` : ''}
            </div>
          </div>
        `
      });

    } catch (error) {
      logger.error('Error sending status update notification:', error);
    }
  }

  /**
   * Send resolution notification
   */
  async sendResolutionNotification(report) {
    try {
      const reporter = await User.findById(report.reporterId);
      
      await NotificationService.sendBulkNotifications([reporter._id], {
        title: 'Report Resolved',
        content: `Your report has been resolved: ${report.resolution}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #28a745;">✅ Report Resolved</h2>
            <p>Your report has been reviewed and resolved.</p>
            <div style="background-color: #d4edda; padding: 15px; border-radius: 5px; margin: 20px 0;">
              <p><strong>Report ID:</strong> ${report.reportId}</p>
              <p><strong>Resolution:</strong> ${report.resolution}</p>
              ${report.resolutionNotes ? `<p><strong>Notes:</strong> ${report.resolutionNotes}</p>` : ''}
            </div>
          </div>
        `
      });

    } catch (error) {
      logger.error('Error sending resolution notification:', error);
    }
  }

  /**
   * Get analytics
   */
  async getAnalytics(timeframe = '30d') {
    try {
      return await AbuseReport.getAnalytics(timeframe);
    } catch (error) {
      logger.error('Error getting analytics:', error);
      throw error;
    }
  }
}

module.exports = new AbuseReportService(); 