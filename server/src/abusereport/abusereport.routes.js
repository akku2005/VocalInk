const express = require('express');

const router = express.Router();
const { protect } = require('../middleware/auth');

const abuseReportController = require('./abusereport.controller');

router.post('/', protect, abuseReportController.createReport);
router.get('/', abuseReportController.getReports);

module.exports = router;
