const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const config = require('../config');
const { generateEmailHtml, config: emailConfig } = require('../utils/emailTemplates');

class EmailService {
  constructor() {
    // Prevent multiple instances
    if (EmailService.instance) {
      return EmailService.instance;
    }

    this.initialized = false;
    this.initializeTransporter();
    EmailService.instance = this;
  }

  async initializeTransporter() {
    // Prevent multiple initializations
    if (this.initialized) {
      return;
    }

    try {
      // Check for required environment variables
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn(
          'Email configuration is missing. Please set SMTP_USER and SMTP_PASS environment variables.'
        );

        // In development mode, create a more informative dummy transporter
        if (process.env.NODE_ENV === 'development') {
          this.transporter = {
            sendMail: async (mailOptions) => {
              logger.warn('📧 DEVELOPMENT MODE: Email would have been sent:', {
                to: mailOptions.to,
                subject: mailOptions.subject,
                code: mailOptions.html?.includes('verification-code') ? 'Check HTML for code' : 'No code found'
              });

              // Extract verification code from HTML for development
              const codeMatch = mailOptions.html?.match(/>(\d{6})</);
              if (codeMatch) {
                logger.info(`📧 DEVELOPMENT MODE: Verification code for ${mailOptions.to}: ${codeMatch[1]}`);
              }

              return { messageId: 'dev-mode-' + Date.now() };
            },
            verify: async () => {
              logger.warn('📧 Email service is in development mode - no real emails will be sent');
              return true;
            },
          };
        } else {
          // In production, throw error if email is not configured
          throw new Error('Email service not configured. SMTP_USER and SMTP_PASS are required in production.');
        }

        this.initialized = true;
        return;
      }

      // Create real transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
        tls: {
          rejectUnauthorized: false,
        },
      });

      // Verify connection
      await this.verifyConnection();
      this.initialized = true;
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      // Do not throw error to prevent server crash on startup
      this.initialized = false;
    }
  }

  async verifyConnection() {
    try {
      await this.transporter.verify();
      logger.info('Email service is ready to send messages');
    } catch (error) {
      logger.error('Failed to verify email connection:', error);
      throw error;
    }
  }

  // Static method to get singleton instance
  static getInstance() {
    if (!EmailService.instance) {
      EmailService.instance = new EmailService();
    }
    return EmailService.instance;
  }

  // Static method to create transporter (for backward compatibility)
  static async createTransporter() {
    if (
      !config.smtp.host ||
      !config.smtp.port ||
      !config.smtp.auth.user ||
      !config.smtp.auth.pass
    ) {
      throw new Error('SMTP configuration is missing');
    }

    return nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass,
      },
    });
  }

  // Static method for sending verification email (for backward compatibility)
  static async sendVerificationEmail(email, code) {
    const instance = EmailService;
    return instance.sendVerificationEmail(email, code);
  }

  async sendVerificationEmail(email, code) {
    try {
      const html = generateEmailHtml({
        title: 'Verify Your Email Address',
        content: `
          <p class="text">Hello,</p>
          <p class="text">Thank you for signing up! Please use the following verification code to confirm your email address:</p>
          <div class="code-block">
            <span class="verification-code">${code}</span>
          </div>
          <p class="text">This code will expire in 10 minutes. If you did not request this verification, please ignore this email.</p>
        `,
        actionText: 'Verify Email',
        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify`,
        previewText: `Your verification code is ${code}`,
        themeColor: emailConfig.colors.primary
      });

      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: email,
        subject: 'Verify Your Email Address',
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Verification email sent successfully', { email });
    } catch (error) {
      logger.error('Error sending verification email:', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  async sendPasswordResetEmail(email, resetCode) {
    try {
      const html = generateEmailHtml({
        title: 'Reset Your Password',
        content: `
          <p class="text">Hello,</p>
          <p class="text">We received a request to reset your password. Please use the following code to proceed:</p>
          <div class="code-block">
            <span class="verification-code">${resetCode}</span>
          </div>
          <p class="text">This code will expire in 10 minutes. If you did not request this reset, please ignore this email immediately.</p>
        `,
        actionText: 'Reset Password',
        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password`,
        previewText: `Your password reset code is ${resetCode}`,
        themeColor: emailConfig.colors.primary
      });

      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: email,
        subject: 'Password Reset Request',
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Password reset email sent successfully', { email });
    } catch (error) {
      logger.error('Error sending password reset email:', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  async sendVerificationSuccessEmail(email, name) {
    try {
      const html = generateEmailHtml({
        title: 'Welcome to VocalInk!',
        content: `
          <p class="text">Dear ${name},</p>
          <p class="text">Congratulations! Your email has been successfully verified. You can now enjoy full access to all features of our platform.</p>
          <p class="text">We're excited to have you on board.</p>
        `,
        actionText: 'Login to Your Account',
        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
        previewText: 'Your email has been verified successfully.',
        themeColor: emailConfig.colors.secondary // Green for success
      });

      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: email,
        subject: 'Welcome! Your Email Has Been Verified',
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Verification success email sent successfully', { email });
    } catch (error) {
      logger.error('Error sending verification success email:', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  async sendAdminCreationNotification(newAdminEmail, newAdminName, creatorEmail) {
    try {
      const html = generateEmailHtml({
        title: 'New Admin Account Created',
        content: `
          <p class="text">Hello,</p>
          <p class="text">A new admin account has been created with the following details:</p>
          <div class="info-box">
            <p class="text" style="margin: 5px 0;"><strong>Name:</strong> ${newAdminName}</p>
            <p class="text" style="margin: 5px 0;"><strong>Email:</strong> ${newAdminEmail}</p>
            <p class="text" style="margin: 5px 0;"><strong>Role:</strong> Admin</p>
            <p class="text" style="margin: 5px 0;"><strong>Created by:</strong> ${creatorEmail}</p>
          </div>
          <p class="text">Please ensure to verify your email address and enable two-factor authentication.</p>
        `,
        actionText: 'Login to Admin Dashboard',
        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/login`,
        previewText: 'A new admin account has been created.',
        themeColor: emailConfig.colors.primary
      });

      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: [newAdminEmail, creatorEmail],
        subject: 'New Admin Account Created',
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Admin creation notification sent successfully', {
        email: newAdminEmail,
      });
    } catch (error) {
      logger.error('Error sending admin creation notification:', {
        error: error.message,
        email: newAdminEmail,
      });
      throw error;
    }
  }

  async sendSecurityAlertEmail(user, alert) {
    try {
      const html = generateEmailHtml({
        title: 'Security Alert',
        content: `
          <p class="text">Hello,</p>
          <p class="text">We detected a security event on your account. Please review the details below:</p>
          <div class="info-box" style="border-left-color: ${emailConfig.colors.danger}; background-color: #FEF2F2;">
            <p class="text" style="margin: 5px 0; color: #991B1B;"><strong>Type:</strong> ${alert.type}</p>
            <p class="text" style="margin: 5px 0; color: #991B1B;"><strong>Time:</strong> ${alert.timestamp}</p>
            <p class="text" style="margin: 5px 0; color: #991B1B;"><strong>IP Address:</strong> ${alert.ipAddress || 'Unknown'}</p>
            <p class="text" style="margin: 5px 0; color: #991B1B;"><strong>Device:</strong> ${alert.userAgent || 'Unknown'}</p>
          </div>
          <p class="text">If this activity was not initiated by you, please secure your account immediately.</p>
        `,
        actionText: 'Secure Your Account',
        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/security`,
        previewText: 'Suspicious activity detected on your account.',
        themeColor: emailConfig.colors.danger // Red for alert
      });

      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: user.email,
        subject: 'Security Alert: Suspicious Activity Detected',
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Security alert email sent successfully', {
        email: user.email,
      });
    } catch (error) {
      logger.error('Error sending security alert email:', {
        error: error.message,
        email: user.email,
      });
      throw error;
    }
  }

  async sendPasswordChangeNotification(email) {
    try {
      const html = generateEmailHtml({
        title: 'Password Changed',
        content: `
          <p class="text">Hello,</p>
          <p class="text">Your password was successfully changed. If you initiated this change, no further action is required.</p>
          <p class="text">If you did not perform this action, please contact our support team immediately.</p>
        `,
        actionText: 'Secure Your Account',
        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/security`,
        previewText: 'Your password has been changed.',
        themeColor: emailConfig.colors.primary
      });

      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: email,
        subject: 'Your Password Has Been Changed',
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Password change notification sent successfully', { email });
    } catch (error) {
      logger.error('Error sending password change notification:', {
        error: error.message,
        email,
      });
      throw error;
    }
  }

  async sendAccountLockoutNotification(email, lockoutUntil) {
    const lockoutTime = new Date(lockoutUntil).toLocaleString();
    const html = generateEmailHtml({
      title: 'Account Locked',
      content: `
        <p class="text">Hello,</p>
        <p class="text">Your account has been temporarily locked due to multiple failed login attempts.</p>
        <div class="info-box" style="border-left-color: ${emailConfig.colors.danger}; background-color: #FEF2F2;">
          <p class="text" style="margin: 0; color: #991B1B;">You can try logging in again after: <strong>${lockoutTime}</strong></p>
        </div>
        <p class="text">If this was not you, please contact our support team immediately.</p>
      `,
      actionText: 'Secure Your Account',
      actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/security`,
      previewText: 'Your account has been temporarily locked.',
      themeColor: emailConfig.colors.danger
    });

    return this.sendNotificationEmail(email, 'Account Locked Due to Failed Login Attempts', html);
  }

  async sendNotificationEmail(email, subject, html) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: email,
        subject,
        html,
      };
      await this.transporter.sendMail(mailOptions);
      logger.info('Notification email sent successfully', { email, subject });
    } catch (error) {
      logger.error('Error sending notification email:', {
        error: error.message,
        email,
        subject,
      });
      throw error;
    }
  }

  async sendCollaborationInvitationEmail(email, inviterName, seriesTitle, inviteLink) {
    try {
      const html = generateEmailHtml({
        title: 'Collaboration Invitation',
        content: `
          <p class="text">Hello,</p>
          <p class="text"><strong>${inviterName}</strong> has invited you to collaborate on the series <strong>"${seriesTitle}"</strong>.</p>
          <p class="text">Click the button below to accept the invitation and start collaborating:</p>
        `,
        actionText: 'Accept Invitation',
        actionUrl: inviteLink,
        previewText: `${inviterName} invited you to collaborate on "${seriesTitle}"`,
        themeColor: '#2f5adbff' // Purple for collaboration
      });

      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: email,
        subject: `Invitation to collaborate on "${seriesTitle}"`,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Collaboration invitation email sent successfully', { email, seriesTitle });
    } catch (error) {
      logger.error('Error sending collaboration invitation email:', {
        error: error.message,
        email,
        seriesTitle,
      });
      throw error;
    }
  }
  /**
   * Send support email to admin
   * @param {Object} data - { name, email, subject, message }
   */
  async sendSupportEmail({ name, email, subject, message }) {
    try {
      const html = generateEmailHtml({
        title: `New Support Request: ${subject}`,
        content: `
          <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; margin-bottom: 20px;">
            <p style="margin: 0 0 10px;"><strong>From:</strong> ${name} (<a href="mailto:${email}">${email}</a>)</p>
            <p style="margin: 0;"><strong>Subject:</strong> ${subject}</p>
          </div>
          <p><strong>Message:</strong></p>
          <div style="white-space: pre-wrap; background-color: #ffffff; padding: 15px; border: 1px solid #eee; border-radius: 5px;">${message}</div>
        `,
        actionText: 'Reply to User',
        actionUrl: `mailto:${email}?subject=Re: ${subject}`,
        previewText: `New support message from ${name}`,
        themeColor: '#000000'
      });

      const mailOptions = {
        from: process.env.SMTP_USER,
        to: process.env.SMTP_USER, // Send to self/admin
        replyTo: email, // Reply to user
        subject: `[Support] ${subject}`,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Support email sent successfully', { from: email, subject });
    } catch (error) {
      logger.error('Error sending support email:', { error: error.message });
      throw error;
    }
  }
  /**
   * Send notification when someone follows a user
   */
  async sendFollowerNotificationEmail(targetEmail, targetName, followerName, followerProfileUrl) {
    try {
      const html = generateEmailHtml({
        title: 'New Follower Alert',
        content: `
          <p class="text">Hello ${targetName},</p>
          <p class="text"><strong>${followerName}</strong> just started following you on VocalInk.</p>
          <p class="text">Check out their profile to see what they're writing about.</p>
        `,
        actionText: 'View Profile',
        actionUrl: followerProfileUrl,
        previewText: `${followerName} is now following you`,
        themeColor: emailConfig.colors.primary
      });

      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: targetEmail,
        subject: `New Follower: ${followerName}`,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Follower notification email sent successfully', { email: targetEmail });
    } catch (error) {
      logger.error('Error sending follower notification email:', {
        error: error.message,
        email: targetEmail
      });
      // Don't throw - notification failure shouldn't fail the follow action
    }
  }
}

// Create singleton instance
const emailServiceInstance = new EmailService();

// Export the singleton instance instead of the class
module.exports = emailServiceInstance;