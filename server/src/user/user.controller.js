const User = require('../models/user.model');

exports.getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateProfile = async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findByIdAndUpdate(req.params.id, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Stubs for additional user endpoints
exports.getUserBlogs = async (req, res) => { res.json([]); };
exports.getUserBadges = async (req, res) => { res.json([]); };
exports.getUserLeaderboard = async (req, res) => { res.json({ rank: 1, xp: 1000 }); };
exports.getUserNotifications = async (req, res) => { res.json([]); }; 