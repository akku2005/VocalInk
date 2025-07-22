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
    // Support PATCH /me (no :id param)
    const userId = req.params.id || req.user.id;
    const allowedFields = [
      'bio', 'dob', 'nationality', 'mobile', 'occupation', 'gender', 'address',
      'profilePicture', 'company', 'jobTitle', 'website', 'linkedin', 'birthday',
      'name', 'avatar', 'socialLinks'
    ];
    const updates = {};
    allowedFields.forEach(field => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });
    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).select('-password');
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.promoteToAdmin = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.role = 'admin';
    await user.save();

    res.json({ success: true, message: 'User promoted to admin', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.upgradeToWriter = async (req, res) => {
  try {
    // Only allow the user themselves or an admin to upgrade
    if (req.user.id !== req.params.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ success: false, message: 'User not found' });

    user.role = 'writer';
    await user.save();

    res.json({ success: true, message: 'User upgraded to writer', user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// Stubs for additional user endpoints
exports.getUserBlogs = async (req, res) => { res.json([]); };
exports.getUserBadges = async (req, res) => { res.json([]); };
exports.getUserLeaderboard = async (req, res) => { res.json({ rank: 1, xp: 1000 }); };
exports.getUserNotifications = async (req, res) => { res.json([]); }; 