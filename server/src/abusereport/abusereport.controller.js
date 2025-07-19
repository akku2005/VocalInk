const AbuseReport = require('../models/abusereport.model');

exports.createReport = async (req, res) => {
  try {
    const report = new AbuseReport({ ...req.body, reporterId: req.user.id });
    await report.save();
    res.status(201).json(report);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getReports = async (req, res) => {
  try {
    const reports = await AbuseReport.find().populate('reporterId', 'name');
    res.json(reports);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}; 