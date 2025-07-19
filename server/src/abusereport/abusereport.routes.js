const express = require('express');
const router = express.Router();
const abuseReportController = require('./abusereport.controller');
const { protect } = require('../middleware/auth');

router.post('/', protect, abuseReportController.createReport);
router.get('/', abuseReportController.getReports);

module.exports = router; 