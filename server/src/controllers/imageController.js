const imageStorageService = require('../services/imageStorageService');
const User = require('../models/user.model');
const { StatusCodes } = require('http-status-codes');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'), false);
    }
  }
});

/**
 * Upload profile avatar image
 */
const uploadAvatar = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const userId = req.user.id;
    const imageBuffer = req.file.buffer;

    // Check if Cloudinary is configured
    if (!imageStorageService.isConfigured()) {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'Image storage service not configured'
      });
    }

    // Get current user to check for existing avatar
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old image if exists
    if (user.avatarKey) {
      await imageStorageService.deleteImage(user.avatarKey);
    }

    // Upload new image to Cloudinary
    const uploadResult = await imageStorageService.uploadImage(
      userId,
      req.file.buffer,
      'avatar'
    );

    // Update user with new image URL and public ID
    user.avatar = uploadResult.url;
    user.avatarKey = uploadResult.publicId;
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Avatar uploaded successfully',
      data: {
        avatar: uploadResult.url,
        size: uploadResult.size
      }
    });
  } catch (error) {
    console.error('Avatar upload error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to upload avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Upload cover image
 */
const uploadCoverImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const userId = req.user.id;
    const imageBuffer = req.file.buffer;

    // Check if Cloudinary is configured
    if (!imageStorageService.isConfigured()) {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'Image storage service not configured'
      });
    }

    // Get current user to check for existing cover image
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete old cover image if exists
    if (user.coverImage && user.coverImageKey) {
      await imageStorageService.deleteImage(user.coverImageKey);
    }

    // Upload new cover image
    const uploadResult = await imageStorageService.uploadImage(
      userId,
      imageBuffer,
      'cover',
      { width: 1200, height: 400, quality: 85 }
    );

    // Update user record with new cover image URL and public ID
    user.coverImage = uploadResult.url;
    user.coverImageKey = uploadResult.publicId;
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cover image uploaded successfully',
      data: {
        coverImage: uploadResult.url,
        size: uploadResult.size
      }
    });
  } catch (error) {
    console.error('Cover image upload error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to upload cover image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Remove profile avatar
 */
const removeAvatar = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete avatar from Cloudinary if exists
    if (user.avatarKey) {
      await imageStorageService.deleteImage(user.avatarKey);
    }

    // Remove avatar from user record
    user.avatar = null;
    user.avatarKey = null;
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Avatar removed successfully'
    });
  } catch (error) {
    console.error('Avatar removal error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to remove avatar',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Remove cover image
 */
const removeCoverImage = async (req, res) => {
  try {
    const userId = req.user.id;

    // Get current user
    const user = await User.findById(userId);
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'User not found'
      });
    }

    // Delete cover image from Cloudinary if exists
    if (user.coverImageKey) {
      await imageStorageService.deleteImage(user.coverImageKey);
    }

    // Remove cover image from user record
    user.coverImage = null;
    user.coverImageKey = null;
    await user.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Cover image removed successfully'
    });
  } catch (error) {
    console.error('Cover image removal error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to remove cover image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  upload,
  uploadAvatar,
  uploadCoverImage,
  removeAvatar,
  removeCoverImage,
  /**
   * Generic content image upload (Cloudinary)
   * Returns secure URL without modifying user records
   */
  uploadGenericImage: async (req, res) => {
    try {
      if (!req.file) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          success: false,
          message: 'No image file provided'
        });
      }

      if (!imageStorageService.isConfigured()) {
        return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
          success: false,
          message: 'Image storage service not configured'
        });
      }

      const userId = req.user?.id || 'anonymous';

      // Upload without enforced cropping; let Cloudinary keep original aspect
      const uploadResult = await imageStorageService.uploadImage(
        userId,
        req.file.buffer,
        'content',
        { transformation: undefined, quality: 'auto' }
      );

      return res.status(StatusCodes.OK).json({
        success: true,
        message: 'Image uploaded successfully',
        url: uploadResult.url,
        data: {
          url: uploadResult.url,
          publicId: uploadResult.publicId,
          size: uploadResult.size,
        }
      });
    } catch (error) {
      console.error('Generic image upload error:', error);
      return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Failed to upload image',
      });
    }
  }
};
