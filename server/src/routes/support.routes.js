const express = require('express');
const router = express.Router();
const { StatusCodes } = require('http-status-codes');
const EmailService = require('../services/EmailService');
const { rateLimit } = require('express-rate-limit');

// Rate limiter for support form (prevent spam)
const supportLimiter = rateLimit({
    windowMs: 60 * 60 * 1000, // 1 hour
    max: 100, 
    message: {
        success: false,
        message: 'Too many support requests, please try again later.'
    }
});

/**
 * @route POST /api/support
 * @desc Send a support message
 * @access Public
 */
router.post('/', supportLimiter, async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;

        if (!name || !email || !subject || !message) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Please provide all required fields'
            });
        }

        await EmailService.sendSupportEmail({ name, email, subject, message });

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Support message sent successfully'
        });
    } catch (error) {
        console.error('Support route error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to send message'
        });
    }
});

module.exports = router;
