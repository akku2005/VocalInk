const { StatusCodes } = require('http-status-codes');
const AbuseReport = require('../models/abusereport.model');
const AbuseReportService = require('../services/AbuseReportService');
const { NotFoundError, ValidationError, UnauthorizedError } = require('../utils/errors');
const logger = require('../utils/logger');

// Create a new abuse report
exports.createReport = async (req, res) => {
  try {
    const {
      targetType,
      targetId,
      category,
      subcategory,
      title,
      description,
      evidence,
      severity
    } = req.body;

    // Validate required fields
    if (!targetType || !targetId || !category || !subcategory || !title || !description) {
      throw new ValidationError('Missing required fields');
    }

    // Get request information for security tracking
    const requestInfo = {
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      deviceFingerprint: req.headers['x-device-fingerprint'],
              location: req.headers['x-location'] ? require('../utils/secureParser').validateLocation(req.headers['x-location']) : null
    };

    // Create report using service
    const report = await AbuseReportService.createReport(
      {
        targetType,
        targetId,
        category,
        subcategory,
        title,
        description,
        evidence: evidence || [],
        severity
      },
      req.user.id,
      requestInfo
    );

    res.status(StatusCodes.CREATED).json({
      success: true,
      message: 'Report submitted successfully',
      data: {
        reportId: report.reportId,
        status: report.status,
        priority: report.priority,
        estimatedResponseTime: '24-48 hours'
      }
    });

  } catch (error) {
    logger.error('Error creating abuse report:', error);
    
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while submitting the report'
      });
    }
  }
};

// Get all reports (admin/moderator only)
exports.getReports = async (req, res) => {
  try {
    // Check authorization
    if (!['admin', 'moderator'].includes(req.user.role)) {
      throw new UnauthorizedError('Insufficient permissions to view reports');
    }

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
    } = req.query;

    const filters = {
      status,
      priority,
      category,
      severity,
      targetType,
      reporterId,
      page: parseInt(page),
      limit: parseInt(limit),
      sortBy,
      sortOrder
    };

    const result = await AbuseReportService.getReports(filters);

    res.status(StatusCodes.OK).json({
      success: true,
      data: result
    });

  } catch (error) {
    logger.error('Error getting reports:', error);
    
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching reports'
      });
    }
  }
};

// Get urgent reports (admin/moderator only)
exports.getUrgentReports = async (req, res) => {
  try {
    // Check authorization
    if (!['admin', 'moderator'].includes(req.user.role)) {
      throw new UnauthorizedError('Insufficient permissions to view urgent reports');
    }

    const reports = await AbuseReportService.getUrgentReports();

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        reports,
        count: reports.length
      }
    });

  } catch (error) {
    logger.error('Error getting urgent reports:', error);
    
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching urgent reports'
      });
    }
  }
};

// Get report by ID
exports.getReportById = async (req, res) => {
  try {
    const { reportId } = req.params;

    const report = await AbuseReport.findById(reportId)
      .populate('reporterId', 'name email')
      .populate('targetUser', 'name email')
      .populate('reviewedBy', 'name email');

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    // Check authorization - users can only view their own reports
    if (req.user.role !== 'admin' && req.user.role !== 'moderator' && 
        report.reporterId.toString() !== req.user.id) {
      throw new UnauthorizedError('You can only view your own reports');
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: report
    });

  } catch (error) {
    logger.error('Error getting report by ID:', error);
    
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching the report'
      });
    }
  }
};

// Update report status (admin/moderator only)
exports.updateReportStatus = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { status, notes } = req.body;

    // Check authorization
    if (!['admin', 'moderator'].includes(req.user.role)) {
      throw new UnauthorizedError('Insufficient permissions to update reports');
    }

    // Validate status
    const validStatuses = ['pending', 'under_review', 'investigating', 'resolved', 'dismissed', 'escalated'];
    if (!validStatuses.includes(status)) {
      throw new ValidationError('Invalid status');
    }

    const report = await AbuseReportService.updateReportStatus(reportId, status, notes, req.user.id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Report status updated successfully',
      data: report
    });

  } catch (error) {
    logger.error('Error updating report status:', error);
    
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while updating the report'
      });
    }
  }
};

// Resolve report (admin/moderator only)
exports.resolveReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { resolution, notes } = req.body;

    // Check authorization
    if (!['admin', 'moderator'].includes(req.user.role)) {
      throw new UnauthorizedError('Insufficient permissions to resolve reports');
    }

    // Validate resolution
    const validResolutions = ['warning_issued', 'content_removed', 'user_suspended', 'user_banned', 'no_action', 'false_report'];
    if (!validResolutions.includes(resolution)) {
      throw new ValidationError('Invalid resolution');
    }

    const report = await AbuseReportService.resolveReport(reportId, resolution, notes, req.user.id);

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Report resolved successfully',
      data: report
    });

  } catch (error) {
    logger.error('Error resolving report:', error);
    
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while resolving the report'
      });
    }
  }
};

// Get user's own reports
exports.getUserReports = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;

    const reports = await AbuseReport.find({ reporterId: req.user.id })
      .populate('targetUser', 'name email')
      .sort({ createdAt: -1 })
      .limit(limit * 1)
      .skip((page - 1) * limit);

    const total = await AbuseReport.countDocuments({ reporterId: req.user.id });

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        reports,
        pagination: {
          currentPage: parseInt(page),
          totalPages: Math.ceil(total / limit),
          totalReports: total,
          hasNext: page * limit < total,
          hasPrev: page > 1
        }
      }
    });

  } catch (error) {
    logger.error('Error getting user reports:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching your reports'
    });
  }
};

// Appeal report resolution
exports.appealReport = async (req, res) => {
  try {
    const { reportId } = req.params;
    const { appealNotes } = req.body;

    if (!appealNotes) {
      throw new ValidationError('Appeal notes are required');
    }

    const report = await AbuseReport.findById(reportId);

    if (!report) {
      throw new NotFoundError('Report not found');
    }

    // Check if user can appeal this report
    if (report.reporterId.toString() !== req.user.id) {
      throw new UnauthorizedError('You can only appeal your own reports');
    }

    if (report.status !== 'resolved' && report.status !== 'dismissed') {
      throw new ValidationError('Can only appeal resolved or dismissed reports');
    }

    if (report.appealStatus !== 'none') {
      throw new ValidationError('Report has already been appealed');
    }

    // Update appeal status
    report.appealStatus = 'pending';
    report.appealNotes = appealNotes;
    report.appealedAt = new Date();
    await report.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Appeal submitted successfully',
      data: {
        reportId: report.reportId,
        appealStatus: report.appealStatus
      }
    });

  } catch (error) {
    logger.error('Error appealing report:', error);
    
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while submitting the appeal'
      });
    }
  }
};

// Get report analytics (admin only)
exports.getReportAnalytics = async (req, res) => {
  try {
    // Check authorization
    if (req.user.role !== 'admin') {
      throw new UnauthorizedError('Insufficient permissions to view analytics');
    }

    const { timeframe = '30d' } = req.query;

    const analytics = await AbuseReportService.getAnalytics(timeframe);

    res.status(StatusCodes.OK).json({
      success: true,
      data: analytics
    });

  } catch (error) {
    logger.error('Error getting report analytics:', error);
    
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching analytics'
      });
    }
  }
};

// Get report categories and subcategories
exports.getReportCategories = async (req, res) => {
  try {
    const categories = {
      spam: ['commercial_spam', 'repetitive_content', 'bot_activity'],
      harassment: ['personal_harassment', 'sexual_harassment', 'cyberbullying', 'stalking'],
      hate_speech: ['racial_hate', 'religious_hate', 'gender_hate', 'ethnic_hate', 'sexual_orientation_hate'],
      violence: ['physical_threats', 'verbal_threats', 'violent_content'],
      sexual_content: ['explicit_content', 'inappropriate_sexual', 'sexual_exploitation'],
      misinformation: ['fake_news', 'conspiracy_theories', 'medical_misinformation', 'political_misinformation'],
      copyright: ['plagiarism', 'copyright_infringement', 'trademark_violation'],
      impersonation: ['fake_account', 'impersonation', 'identity_theft'],
      other: ['inappropriate_language', 'offensive_content', 'disturbing_content', 'other']
    };

    res.status(StatusCodes.OK).json({
      success: true,
      data: categories
    });

  } catch (error) {
    logger.error('Error getting report categories:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'An error occurred while fetching categories'
    });
  }
};

// Get reports by target
exports.getReportsByTarget = async (req, res) => {
  try {
    const { targetType, targetId } = req.params;

    // Check authorization
    if (!['admin', 'moderator'].includes(req.user.role)) {
      throw new UnauthorizedError('Insufficient permissions to view target reports');
    }

    const reports = await AbuseReportService.getReportsByTarget(targetType, targetId);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        reports,
        count: reports.length,
        targetType,
        targetId
      }
    });

  } catch (error) {
    logger.error('Error getting reports by target:', error);
    
    if (error.isOperational) {
      res.status(error.statusCode).json({
        success: false,
        message: error.message
      });
    } else {
      res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'An error occurred while fetching target reports'
      });
    }
  }
};
