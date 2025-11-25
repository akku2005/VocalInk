const { StatusCodes } = require('http-status-codes');
const { body, validationResult } = require('express-validator');

const User = require('../models/User');
const AppError = require('../utils/AppError');
const EmailService = require('../services/EmailService');
const logger = require('../utils/logger');

// Get singleton email service instance
const emailService = EmailService;

const updateUserValidators = [
  body('name')
    .optional()
    .trim()
    .escape()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('role')
    .optional()
    .isIn(['reader', 'writer', 'admin'])
    .withMessage('Invalid role'),
];

const updateProfileValidators = [
  body('name')
    .optional()
    .trim()
    .escape()
    .isLength({ min: 2, max: 50 })
    .withMessage('Name must be 2-50 characters'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('Invalid email address')
    .normalizeEmail(),
  body('mobile')
    .optional()
    .trim()
    .escape()
    .isLength({ min: 7, max: 20 })
    .withMessage('Mobile must be 7-20 characters'),
  body('gender')
    .optional()
    .isIn(['male', 'female', 'other'])
    .withMessage('Invalid gender'),
  body('address')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 100 })
    .withMessage('Address too long'),
  body('profilePicture')
    .optional()
    .trim()
    .escape()
    .isURL()
    .withMessage('Invalid profile picture URL'),
  body('company')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 50 })
    .withMessage('Company name too long'),
  body('jobTitle')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 50 })
    .withMessage('Job title too long'),
  body('website')
    .optional()
    .trim()
    .escape()
    .isURL()
    .withMessage('Invalid website URL'),
  body('linkedin')
    .optional()
    .trim()
    .escape()
    .isURL()
    .withMessage('Invalid LinkedIn URL'),
  body('bio')
    .optional()
    .trim()
    .escape()
    .isLength({ max: 500 })
    .withMessage('Bio too long'),
  body('birthday').optional().isISO8601().withMessage('Invalid birthday date'),
  body('role')
    .optional()
    .isIn(['reader', 'writer'])
    .withMessage('Invalid role'),
];

// Get all users
const getAllUsers = async (req, res, next) => {
  try {
    const {
      role,
      search,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = -1,
    } = req.query;
    const query = {};

    if (role) query.role = role;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
      ];
    }

    // Pagination limit cap
    const safeLimit = Math.min(parseInt(limit), 100);

    // Parallel queries
    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort({ [sortBy]: sortOrder })
        .skip((page - 1) * safeLimit)
        .limit(safeLimit)
        .lean(),
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: { users },
      pagination: {
        total,
        page: parseInt(page),
        pages: Math.ceil(total / safeLimit),
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get user by ID
const getUserById = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password');

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// Update user
const updateUser = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const { name, email, role } = req.body;
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is authorized to update
    if (req.user.role !== 'admin' && req.user.id !== user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to update this user',
      });
    }

    // Only admin can update role
    if (role && req.user.role !== 'admin') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to update user role',
      });
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(
      req.params.id,
      { name, email, ...(role && { role }) },
      { new: true, runValidators: true }
    ).select('-password');

    res.status(StatusCodes.OK).json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

// Delete user
const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is authorized to delete
    if (req.user.role !== 'admin' && req.user.id !== user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to delete this user',
      });
    }

    await user.deleteOne();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Get user profile
const getProfile = async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-password');

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      data: { user },
    });
  } catch (error) {
    next(error);
  }
};

// Update user profile
const updateProfile = async (req, res, next) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array(),
      });
    }

    const {
      name,
      email,
      mobile,
      gender,
      address,
      profilePicture,
      company,
      jobTitle,
      website,
      linkedin,
      bio,
      birthday,
      role,
    } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    // Build update object
    const updateObj = {};
    if (name !== undefined) updateObj.name = name;
    if (email !== undefined) updateObj.email = email;
    if (mobile !== undefined) updateObj.mobile = mobile;
    if (gender !== undefined) updateObj.gender = gender;
    if (address !== undefined) updateObj.address = address;
    if (profilePicture !== undefined) updateObj.profilePicture = profilePicture;
    if (company !== undefined) updateObj.company = company;
    if (jobTitle !== undefined) updateObj.jobTitle = jobTitle;
    if (website !== undefined) updateObj.website = website;
    if (linkedin !== undefined) updateObj.linkedin = linkedin;
    if (bio !== undefined) updateObj.bio = bio;
    if (birthday !== undefined) updateObj.birthday = birthday;
    if (role !== undefined) {
      if (['reader', 'writer'].includes(role)) {
        updateObj.role = role;
      }
    }

    // Update user
    const updatedUser = await User.findByIdAndUpdate(req.user.id, updateObj, {
      new: true,
      runValidators: true,
    }).select('-password');

    res.status(StatusCodes.OK).json({
      success: true,
      data: { user: updatedUser },
    });
  } catch (error) {
    next(error);
  }
};

// Deactivate user
const deactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    // Check if user is authorized to deactivate
    if (req.user.role !== 'admin' && req.user.id !== user._id.toString()) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to deactivate this user',
      });
    }

    user.isActive = false;
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User deactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Reactivate user
const reactivateUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found',
      });
    }

    // Only admin can reactivate users
    if (req.user.role !== 'admin') {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'Not authorized to reactivate users',
      });
    }

    user.isActive = true;
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'User reactivated successfully',
    });
  } catch (error) {
    next(error);
  }
};

// Change password
const changePassword = async (req, res, next) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.id) {
      return res.status(401).json({
        success: false,
        message: 'Authentication required or invalid token',
        statusCode: 401,
      });
    }

    const { currentPassword, newPassword } = req.body;

    // Validate required fields
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Please provide current and new password',
        statusCode: 400,
      });
    }

    // Get user with password
    const user = await User.findById(req.user.id).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
        statusCode: 404,
      });
    }

    // Check if current password is correct
    const isPasswordCorrect = await user.comparePassword(currentPassword);
    if (!isPasswordCorrect) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect',
        statusCode: 401,
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    // Send password changed email (optional)
    try {
      await emailService.sendPasswordChangeNotification(user.email);
    } catch (e) {
      console.error('Password change email failed:', e.message);
    }

    res.status(200).json({
      success: true,
      message: 'Password updated successfully',
    });
  } catch (error) {
    console.error('Change password error:', error); // Improved error logging
    res.status(500).json({
      success: false,
      message: error.message || 'Error changing password',
      statusCode: 500,
    });
  }
};

// Get user statistics
const getUserStats = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin') {
      throw new AppError(
        'Not authorized to view user statistics',
        StatusCodes.FORBIDDEN
      );
    }
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const adminUsers = await User.countDocuments({ role: 'admin' });
    const usersByDepartment = await User.aggregate([
      {
        $group: {
          _id: '$department',
          count: { $sum: 1 },
        },
      },
    ]);

    res.status(StatusCodes.OK).json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        adminUsers,
        usersByDepartment,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getProfile,
  updateProfile,
  deactivateUser,
  reactivateUser,
  changePassword,
  getUserStats,
};
