const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const config = require('../config');

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
                code: mailOptions.html?.includes('verification code') ? 'Check HTML for code' : 'No code found'
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
      // throw error; 
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
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: email,
        subject: 'Verify Your Email Address',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif; }
              a { text-decoration: none; }
              .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background-color: #007bff; padding: 20px; text-align: center; }
              .header img { max-width: 150px; height: auto; }
              .content { padding: 30px; }
              .code-box { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
              .button { display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 500; }
              .button:hover { background-color: #0056b3; }
              .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
              @media only screen and (max-width: 600px) {
                .container { margin: 10px; }
                .content { padding: 20px; }
                .header img { max-width: 120px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${process.env.COMPANY_LOGO || 'https://via.placeholder.com/150x50?text=Your+Logo'}" alt="Company Logo">
              </div>
              <div class="content">
                <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px;">Email Verification</h2>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">Hello,</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">Thank you for signing up! Please use the following verification code to confirm your email address:</p>
                <div class="code-box">
                  <h3 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 2px;">${code}</h3>
                </div>
                <p style="color: #666666; font-size: 14px; line-height: 1.6;">This code will expire in 10 minutes. If you did not request this verification, please ignore this email or contact our <a href="${process.env.SUPPORT_URL || 'mailto:support@example.com'}" style="color: #007bff;">support team</a>.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify" class="button">Verify Email</a>
                </div>
              </div>
              <div class="footer">
                <p style="margin: 0;">This is an automated message. Please do not reply.</p>
                <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
                <p style="margin: 5px 0;"><a href="${process.env.PRIVACY_URL || 'https://example.com/privacy'}" style="color: #666666;">Privacy Policy</a> | <a href="${process.env.SUPPORT_URL || 'mailto:support@example.com'}" style="color: #666666;">Contact Support</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
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
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: email,
        subject: 'Password Reset Request',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif; }
              a { text-decoration: none; }
              .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background-color: #007bff; padding: 20px; text-align: center; }
              .header img { max-width: 150px; height: auto; }
              .content { padding: 30px; }
              .code-box { background-color: #f8f9fa; padding: 20px; text-align: center; border-radius: 6px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
              .button { display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 500; }
              .button:hover { background-color: #0056b3; }
              .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
              @media only screen and (max-width: 600px) {
                .container { margin: 10px; }
                .content { padding: 20px; }
                .header img { max-width: 120px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${process.env.COMPANY_LOGO || 'https://via.placeholder.com/150x50?text=Your+Logo'}" alt="Company Logo">
              </div>
              <div class="content">
                <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px;">Password Reset Request</h2>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">Hello,</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">We received a request to reset your password. Please use the following code to proceed:</p>
                <div class="code-box">
                  <h3 style="color: #007bff; margin: 0; font-size: 32px; letter-spacing: 2px;">${resetCode}</h3>
                </div>
                <p style="color: #666666; font-size: 14px; line-height: 1.6;">This code will expire in 10 minutes. To reset your password, enter this code on the password reset page.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/reset-password" class="button">Reset Password</a>
                </div>
                <p style="color: #666666; font-size: 14px; line-height: 1.6;">If you did not request this reset, please ignore this email or contact our <a href="${process.env.SUPPORT_URL || 'mailto:support@example.com'}" style="color: #007bff;">support team</a> immediately.</p>
              </div>
              <div class="footer">
                <p style="margin: 0;">This is an automated message. Please do not reply.</p>
                <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
                <p style="margin: 5px 0;"><a href="${process.env.PRIVACY_URL || 'https://example.com/privacy'}" style="color: #666666;">Privacy Policy</a> | <a href="${process.env.SUPPORT_URL || 'mailto:support@example.com'}" style="color: #666666;">Contact Support</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
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
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: email,
        subject: 'Welcome! Your Email Has Been Verified',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif; }
              a { text-decoration: none; }
              .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background-color: #28a745; padding: 20px; text-align: center; }
              .header img { max-width: 150px; height: auto; }
              .content { padding: 30px; }
              .button { display: inline-block; background-color: #28a745; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 500; }
              .button:hover { background-color: #218838; }
              .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
              @media only screen and (max-width: 600px) {
                .container { margin: 10px; }
                .content { padding: 20px; }
                .header img { max-width: 120px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${process.env.COMPANY_LOGO || 'https://via.placeholder.com/150x50?text=Your+Logo'}" alt="Company Logo">
              </div>
              <div class="content">
                <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px;">Welcome to Our Platform!</h2>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">Dear ${name},</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">Congratulations! Your email has been successfully verified. You can now enjoy full access to all features of our platform.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Your Account</a>
                </div>
                <p style="color: #666666; font-size: 14px; line-height: 1.6;">Thank you for joining us! If you have any questions, feel free to contact our <a href="${process.env.SUPPORT_URL || 'mailto:support@example.com'}" style="color: #28a745;">support team</a>.</p>
              </div>
              <div class="footer">
                <p style="margin: 0;">This is an automated message. Please do not reply.</p>
                <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
                <p style="margin: 5px 0;"><a href="${process.env.PRIVACY_URL || 'https://example.com/privacy'}" style="color: #666666;">Privacy Policy</a> | <a href="${process.env.SUPPORT_URL || 'mailto:support@example.com'}" style="color: #666666;">Contact Support</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
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

  async sendAdminCreationNotification(
    newAdminEmail,
    newAdminName,
    creatorEmail
  ) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: [newAdminEmail, creatorEmail],
        subject: 'New Admin Account Created',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif; }
              a { text-decoration: none; }
              .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background-color: #007bff; padding: 20px; text-align: center; }
              .header img { max-width: 150px; height: auto; }
              .content { padding: 30px; }
              .details-box { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
              .button { display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 500; }
              .button:hover { background-color: #0056b3; }
              .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
              @media only screen and (max-width: 600px) {
                .container { margin: 10px; }
                .content { padding: 20px; }
                .header img { max-width: 120px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${process.env.COMPANY_LOGO || 'https://via.placeholder.com/150x50?text=Your+Logo'}" alt="Company Logo">
              </div>
              <div class="content">
                <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px;">New Admin Account Created</h2>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">Hello,</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">A new admin account has been created with the following details:</p>
                <div class="details-box">
                  <p style="color: #333333; font-size: 16px; margin: 5px 0;"><strong>Name:</strong> ${newAdminName}</p>
                  <p style="color: #333333; font-size: 16px; margin: 5px 0;"><strong>Email:</strong> ${newAdminEmail}</p>
                  <p style="color: #333333; font-size: 16px; margin: 5px 0;"><strong>Role:</strong> Admin</p>
                  <p style="color: #333333; font-size: 16px; margin: 5px 0;"><strong>Created by:</strong> ${creatorEmail}</p>
                </div>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">Please ensure to:</p>
                <ul style="color: #333333; font-size: 16px; line-height: 1.6; padding-left: 20px; margin: 10px 0;">
                  <li>Verify your email address</li>
                  <li>Enable two-factor authentication if available</li>
                  <li>Review security guidelines and admin responsibilities</li>
                </ul>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" class="button">Login to Admin Dashboard</a>
                </div>
              </div>
              <div class="footer">
                <p style="margin: 0;">This is an automated message. Please do not reply.</p>
                <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
                <p style="margin: 5px 0;"><a href="${process.env.PRIVACY_URL || 'https://example.com/privacy'}" style="color: #666666;">Privacy Policy</a> | <a href="${process.env.SUPPORT_URL || 'mailto:support@example.com'}" style="color: #666666;">Contact Support</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
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
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: user.email,
        subject: 'Security Alert: Suspicious Activity Detected',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif; }
              a { text-decoration: none; }
              .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background-color: #dc3545; padding: 20px; text-align: center; }
              .header img { max-width: 150px; height: auto; }
              .content { padding: 30px; }
              .details-box { background-color: #f8f9fa; padding: 20px; border-radius: 6px; margin: 20px 0; box-shadow: 0 2px 4px rgba(0,0,0,0.05); }
              .button { display: inline-block; background-color: #dc3545; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 500; }
              .button:hover { background-color: #c82333; }
              .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
              @media only screen and (max-width: 600px) {
                .container { margin: 10px; }
                .content { padding: 20px; }
                .header img { max-width: 120px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${process.env.COMPANY_LOGO || 'https://via.placeholder.com/150x50?text=Your+Logo'}" alt="Company Logo">
              </div>
              <div class="content">
                <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px;">Security Alert</h2>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">Hello,</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">We detected a security event on your account. Please review the details below:</p>
                <div class="details-box">
                  <p style="color: #333333; font-size: 16px; margin: 5px 0;"><strong>Type:</strong> ${alert.type}</p>
                  <p style="color: #333333; font-size: 16px; margin: 5px 0;"><strong>Time:</strong> ${alert.timestamp}</p>
                  <p style="color: #333333; font-size: 16px; margin: 5px 0;"><strong>IP Address:</strong> ${alert.ipAddress || 'Unknown'}</p>
                  <p style="color: #333333; font-size: 16px; margin: 5px 0;"><strong>Device:</strong> ${alert.userAgent || 'Unknown'}</p>
                </div>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">If this activity was not initiated by you, please secure your account immediately by resetting your password and enabling two-factor authentication.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/security" class="button">Secure Your Account</a>
                </div>
              </div>
              <div class="footer">
                <p style="margin: 0;">This is an automated message. Please do not reply.</p>
                <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
                <p style="margin: 5px 0;"><a href="${process.env.PRIVACY_URL || 'https://example.com/privacy'}" style="color: #666666;">Privacy Policy</a> | <a href="${process.env.SUPPORT_URL || 'mailto:support@example.com'}" style="color: #666666;">Contact Support</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
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
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: email,
        subject: 'Your Password Has Been Changed',
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif; }
              a { text-decoration: none; }
              .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background-color: #007bff; padding: 20px; text-align: center; }
              .header img { max-width: 150px; height: auto; }
              .content { padding: 30px; }
              .button { display: inline-block; background-color: #007bff; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 500; }
              .button:hover { background-color: #0056b3; }
              .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
              @media only screen and (max-width: 600px) {
                .container { margin: 10px; }
                .content { padding: 20px; }
                .header img { max-width: 120px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${process.env.COMPANY_LOGO || 'https://via.placeholder.com/150x50?text=Your+Logo'}" alt="Company Logo">
              </div>
              <div class="content">
                <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px;">Password Change Confirmation</h2>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">Hello,</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">Your password was successfully changed. If you initiated this change, no further action is required.</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">If you did not perform this action, please contact our <a href="${process.env.SUPPORT_URL || 'mailto:support@example.com'}" style="color: #007bff;">support team</a> immediately to secure your account.</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/security" class="button">Secure Your Account</a>
                </div>
              </div>
              <div class="footer">
                <p style="margin: 0;">This is an automated message. Please do not reply.</p>
                <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
                <p style="margin: 5px 0;"><a href="${process.env.PRIVACY_URL || 'https://example.com/privacy'}" style="color: #666666;">Privacy Policy</a> | <a href="${process.env.SUPPORT_URL || 'mailto:support@example.com'}" style="color: #666666;">Contact Support</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
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
    const subject = 'Account Locked Due to Failed Login Attempts';
    const lockoutTime = new Date(lockoutUntil).toLocaleString();
    const html = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif; }
          a { text-decoration: none; }
          .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background-color: #dc3545; padding: 20px; text-align: center; }
          .header img { max-width: 150px; height: auto; }
          .content { padding: 30px; }
          .button { display: inline-block; background-color: #dc3545; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 500; }
          .button:hover { background-color: #c82333; }
          .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
          @media only screen and (max-width: 600px) {
            .container { margin: 10px; }
            .content { padding: 20px; }
            .header img { max-width: 120px; }
          }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <img src="${process.env.COMPANY_LOGO || 'https://via.placeholder.com/150x50?text=Your+Logo'}" alt="Company Logo">
          </div>
          <div class="content">
            <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px;">Account Lockout Notification</h2>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">Hello,</p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">Your account has been temporarily locked due to multiple failed login attempts.</p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">You can try logging in again after: <strong>${lockoutTime}</strong>.</p>
            <p style="color: #333333; font-size: 16px; line-height: 1.6;">If this was not you, please contact our <a href="${process.env.SUPPORT_URL || 'mailto:support@example.com'}" style="color: #dc3545;">support team</a> immediately to secure your account.</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/security" class="button">Secure Your Account</a>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0;">This is an automated message. Please do not reply.</p>
            <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
            <p style="margin: 5px 0;"><a href="${process.env.PRIVACY_URL || 'https://example.com/privacy'}" style="color: #666666;">Privacy Policy</a> | <a href="${process.env.SUPPORT_URL || 'mailto:support@example.com'}" style="color: #666666;">Contact Support</a></p>
          </div>
        </div>
      </body>
      </html>
    `;
    return this.sendNotificationEmail(email, subject, html);
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
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: email,
        subject: `Invitation to collaborate on "${seriesTitle}"`,
        html: `
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <style>
              body { margin: 0; padding: 0; background-color: #f4f4f4; font-family: 'Helvetica Neue', Arial, sans-serif; }
              a { text-decoration: none; }
              .container { max-width: 600px; margin: 20px auto; background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
              .header { background-color: #6f42c1; padding: 20px; text-align: center; }
              .header img { max-width: 150px; height: auto; }
              .content { padding: 30px; }
              .button { display: inline-block; background-color: #6f42c1; color: #ffffff; padding: 12px 24px; border-radius: 6px; font-size: 16px; font-weight: 500; }
              .button:hover { background-color: #5a32a3; }
              .footer { background-color: #f1f1f1; padding: 20px; text-align: center; font-size: 12px; color: #666666; }
              @media only screen and (max-width: 600px) {
                .container { margin: 10px; }
                .content { padding: 20px; }
                .header img { max-width: 120px; }
              }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="${process.env.COMPANY_LOGO || 'https://via.placeholder.com/150x50?text=Your+Logo'}" alt="Company Logo">
              </div>
              <div class="content">
                <h2 style="color: #333333; font-size: 24px; margin: 0 0 20px;">Collaboration Invitation</h2>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">Hello,</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;"><strong>${inviterName}</strong> has invited you to collaborate on the series <strong>"${seriesTitle}"</strong>.</p>
                <p style="color: #333333; font-size: 16px; line-height: 1.6;">Click the button below to accept the invitation and start collaborating:</p>
                <div style="text-align: center; margin: 30px 0;">
                  <a href="${inviteLink}" class="button">Accept Invitation</a>
                </div>
                <p style="color: #666666; font-size: 14px; line-height: 1.6;">This invitation will expire in 7 days.</p>
                <p style="color: #666666; font-size: 14px; line-height: 1.6;">If you do not wish to collaborate, you can ignore this email.</p>
              </div>
              <div class="footer">
                <p style="margin: 0;">This is an automated message. Please do not reply.</p>
                <p style="margin: 5px 0;">&copy; ${new Date().getFullYear()} Your Company Name. All rights reserved.</p>
                <p style="margin: 5px 0;"><a href="${process.env.PRIVACY_URL || 'https://example.com/privacy'}" style="color: #666666;">Privacy Policy</a> | <a href="${process.env.SUPPORT_URL || 'mailto:support@example.com'}" style="color: #666666;">Contact Support</a></p>
              </div>
            </div>
          </body>
          </html>
        `,
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
}

// Create singleton instance
const emailServiceInstance = new EmailService();

// Export the singleton instance instead of the class
module.exports = emailServiceInstance;