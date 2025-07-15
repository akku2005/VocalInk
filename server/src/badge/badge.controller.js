const Badge = require('../models/badge.model');

exports.getBadges = async (req, res) => {
  try {
    const badges = await Badge.find();
    res.json(badges);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.claimBadge = async (req, res) => {
  // Stub: Implement badge claiming logic
  res.json({ message: 'Badge claimed (stub)' });
}; 