const nodemailer = require('nodemailer');
const logger = require('../utils/logger');
const config = require('../config');

class EmailService {
  constructor() {
    this.initializeTransporter();
  }

  async initializeTransporter() {
    try {
      // Check for required environment variables
      if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        logger.warn('Email configuration is missing. Please set SMTP_USER and SMTP_PASS environment variables.');
        this.transporter = {
          sendMail: async (mailOptions) => {
            logger.warn('Email service not configured. Would have sent:', {
              to: mailOptions.to,
              subject: mailOptions.subject
            });
            return { messageId: 'dummy-id' };
          },
          verify: async () => {
            logger.warn('Email service is not configured');
            return true;
          }
        };
        return;
      }

      // Create real transporter
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'smtp.gmail.com',
        port: parseInt(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false 
        }
      });

      // Verify connection
      await this.verifyConnection();
    } catch (error) {
      logger.error('Failed to initialize email service:', error);
      throw error;
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

  static async createTransporter() {
    if (!config.smtp.host || !config.smtp.port || !config.smtp.auth.user || !config.smtp.auth.pass) {
      throw new Error('SMTP configuration is missing');
    }

    return nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure,
      auth: {
        user: config.smtp.auth.user,
        pass: config.smtp.auth.pass
      }
    });
  }

  static async sendVerificationEmail(email, code) {
    try {
      const transporter = await this.createTransporter();

      const mailOptions = {
        from: config.email.from,
        to: email,
        subject: 'Verify Your Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Email Verification</h2>
            <p style="color: #666;">Please use the following code to verify your email address:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; margin: 0; font-size: 32px;">${code}</h1>
            </div>
            <p style="color: #666;">This code will expire in 10 minutes.</p>
            <p style="color: #666;">If you didn't request this verification, please ignore this email.</p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
      logger.info('Verification email sent successfully', { email });
    } catch (error) {
      logger.error('Error sending verification email:', {
        error: error.message,
        email
      });
      throw error;
    }
  }

  async sendVerificationEmail(email, code) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: email,
        subject: 'Verify Your Email',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Email Verification</h2>
            <p style="color: #666;">Please use the following code to verify your email address:</p>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h1 style="color: #007bff; margin: 0; font-size: 32px;">${code}</h1>
            </div>
            <p style="color: #666;">This code will expire in 10 minutes.</p>
            <p style="color: #666;">If you didn't request this verification, please ignore this email.</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Verification email sent successfully', { email });
    } catch (error) {
      logger.error('Error sending verification email:', {
        error: error.message,
        email
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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Password Reset Request</h2>
            <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; text-align: center;">
              <h3 style="color: #333; margin: 0;">Your Password Reset Code</h3>
              <p style="font-size: 24px; letter-spacing: 5px; margin: 20px 0; color: #007bff; font-weight: bold;">
                ${resetCode}
              </p>
              <p style="color: #666;">This code will expire in 10 minutes.</p>
            </div>
            <p style="color: #666;">To reset your password:</p>
            <ol style="color: #666;">
              <li>Enter this code on the password reset page</li>
              <li>Create your new password</li>
              <li>Submit to complete the process</li>
            </ol>
            <div style="margin: 20px 0; padding: 20px; border-top: 1px solid #eee;">
              <p style="color: #666; font-style: italic;">
                If you didn't request this password reset, please ignore this email or contact support if you have concerns.
              </p>
            </div>
            <p style="color: #666; font-size: 12px; text-align: center;">
              This is an automated message. Please do not reply.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Password reset email sent successfully', { email });
    } catch (error) {
      logger.error('Error sending password reset email:', {
        error: error.message,
        email
      });
      throw error;
    }
  }

  async sendVerificationSuccessEmail(email, name) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: email,
        subject: 'Email Verification Successful',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Welcome to Our Platform!</h2>
            <div style="background-color: #f5f5f5; padding: 20px; text-align: center; margin: 20px 0;">
              <h3 style="color: #28a745; margin: 0;">✅ Email Verified Successfully</h3>
            </div>
            <p style="color: #666;">Dear ${name},</p>
            <p style="color: #666;">Your email has been successfully verified. You can now access all features of our platform.</p>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="background-color: #28a745; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                Login to Your Account
              </a>
            </div>
            <p style="color: #666;">Thank you for joining us!</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Verification success email sent successfully', { email });
    } catch (error) {
      logger.error('Error sending verification success email:', {
        error: error.message,
        email
      });
      throw error;
    }
  }

  async sendAdminCreationNotification(newAdminEmail, newAdminName, creatorEmail) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: [newAdminEmail, creatorEmail], // Send to both new admin and creator
        subject: 'Admin Account Created',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">New Admin Account Created</h2>
            <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0;">
              <h3 style="color: #333; margin: 0;">Account Details</h3>
              <p style="color: #666;"><strong>Name:</strong> ${newAdminName}</p>
              <p style="color: #666;"><strong>Email:</strong> ${newAdminEmail}</p>
              <p style="color: #666;"><strong>Role:</strong> Admin</p>
              <p style="color: #666;"><strong>Created by:</strong> ${creatorEmail}</p>
            </div>
            <p style="color: #666;">This account has been granted administrative privileges. Please ensure to:</p>
            <ul style="color: #666;">
              <li>Verify your email address</li>
              <li>Set up two-factor authentication if available</li>
              <li>Review security guidelines and admin responsibilities</li>
            </ul>
            <div style="text-align: center; margin: 20px 0;">
              <a href="${process.env.FRONTEND_URL || 'http://localhost:3000'}/login" 
                 style="background-color: #007bff; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px;">
                Login to Admin Dashboard
              </a>
            </div>
            <p style="color: #666; font-style: italic;">This is an automated message. Please do not reply.</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Admin creation notification sent successfully', { email: newAdminEmail });
    } catch (error) {
      logger.error('Error sending admin creation notification:', {
        error: error.message,
        email: newAdminEmail
      });
      throw error;
    }
  }

  async sendSecurityAlertEmail(user, alert) {
    try {
      const mailOptions = {
        from: process.env.SMTP_USER || 'noreply@example.com',
        to: user.email,
        subject: 'Security Alert',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Security Alert</h2>
            <p style="color: #666;">We detected a security event on your account:</p>
            <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0;">
              <p style="color: #333; margin: 0;"><strong>Type:</strong> ${alert.type}</p>
              <p style="color: #333; margin: 0;"><strong>Time:</strong> ${alert.timestamp}</p>
              <p style="color: #333; margin: 0;"><strong>IP Address:</strong> ${alert.ipAddress || 'Unknown'}</p>
              <p style="color: #333; margin: 0;"><strong>Device:</strong> ${alert.userAgent || 'Unknown'}</p>
            </div>
            <p style="color: #666;">If this wasn't you, please secure your account immediately.</p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Security alert email sent successfully', { email: user.email });
    } catch (error) {
      logger.error('Error sending security alert email:', {
        error: error.message,
        email: user.email
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
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #333; text-align: center;">Password Changed Successfully</h2>
            <div style="background-color: #f5f5f5; padding: 20px; margin: 20px 0; text-align: center;">
              <p style="color: #666;">Your password was changed. If you did not perform this action, please contact support immediately.</p>
            </div>
            <p style="color: #666; font-size: 12px; text-align: center;">
              This is an automated message. Please do not reply.
            </p>
          </div>
        `
      };

      await this.transporter.sendMail(mailOptions);
      logger.info('Password change notification sent successfully', { email });
    } catch (error) {
      logger.error('Error sending password change notification:', {
        error: error.message,
        email
      });
      throw error;
    }
  }

  async sendAccountLockoutNotification(email, lockoutUntil) {
    const subject = 'Account Locked Due to Failed Login Attempts';
    const lockoutTime = new Date(lockoutUntil).toLocaleString();
    const message = `Your account has been temporarily locked due to multiple failed login attempts.\n\nYou can try logging in again after: ${lockoutTime}.\n\nIf this wasn't you, please contact support immediately.`;
    return this.sendEmail(email, subject, message);
  }
}

module.exports = EmailService; 