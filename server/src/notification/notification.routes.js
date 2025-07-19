const express = require('express');
const router = express.Router();
const notificationController = require('./notification.controller');
const { protect } = require('../middleware/auth');

router.get('/', protect, notificationController.getNotifications);
router.put('/:id/read', protect, notificationController.markAsRead);

module.exports = router; 