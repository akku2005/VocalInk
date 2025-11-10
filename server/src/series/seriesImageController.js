const imageStorageService = require('../services/imageStorageService');
const Series = require('../models/series.model');
const { StatusCodes } = require('http-status-codes');
const multer = require('multer');

// Configure multer for memory storage
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit for series images
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
 * Upload series cover image to Cloudinary
 */
const uploadCoverImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const seriesId = req.params.seriesId;
    const userId = req.user.id;

    // Check if Cloudinary is configured
    if (!imageStorageService.isConfigured()) {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'Image storage service not configured'
      });
    }

    // Get series to check ownership and existing image
    const series = await Series.findById(seriesId);
    if (!series) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Series not found'
      });
    }

    // Check if user is the author
    if (series.authorId.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to update this series'
      });
    }

    // Delete old cover image if exists
    if (series.coverImageKey) {
      await imageStorageService.deleteImage(series.coverImageKey);
    }

    // Upload new cover image to Cloudinary
    const uploadResult = await imageStorageService.uploadImage(
      userId,
      req.file.buffer,
      `series-cover-${seriesId}`,
      { width: 1200, height: 600, quality: 85 }
    );

    // Update series with new image URL and public ID
    series.coverImage = uploadResult.url;
    series.coverImageKey = uploadResult.publicId;
    await series.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Series cover image uploaded successfully',
      data: {
        coverImage: uploadResult.url,
        coverImageKey: uploadResult.publicId,
        size: uploadResult.size
      }
    });
  } catch (error) {
    console.error('Series cover image upload error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to upload series cover image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Upload series banner image to Cloudinary
 */
const uploadBannerImage = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        success: false,
        message: 'No image file provided'
      });
    }

    const seriesId = req.params.seriesId;
    const userId = req.user.id;

    // Check if Cloudinary is configured
    if (!imageStorageService.isConfigured()) {
      return res.status(StatusCodes.SERVICE_UNAVAILABLE).json({
        success: false,
        message: 'Image storage service not configured'
      });
    }

    // Get series to check ownership and existing image
    const series = await Series.findById(seriesId);
    if (!series) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Series not found'
      });
    }

    // Check if user is the author
    if (series.authorId.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to update this series'
      });
    }

    // Delete old banner image if exists
    if (series.bannerImageKey) {
      await imageStorageService.deleteImage(series.bannerImageKey);
    }

    // Upload new banner image to Cloudinary
    const uploadResult = await imageStorageService.uploadImage(
      userId,
      req.file.buffer,
      `series-banner-${seriesId}`,
      { width: 1920, height: 400, quality: 85 }
    );

    // Update series with new image URL and public ID
    series.bannerImage = uploadResult.url;
    series.bannerImageKey = uploadResult.publicId;
    await series.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Series banner image uploaded successfully',
      data: {
        bannerImage: uploadResult.url,
        bannerImageKey: uploadResult.publicId,
        size: uploadResult.size
      }
    });
  } catch (error) {
    console.error('Series banner image upload error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to upload series banner image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

/**
 * Delete series cover image
 */
const deleteCoverImage = async (req, res) => {
  try {
    const seriesId = req.params.seriesId;
    const userId = req.user.id;

    // Get series
    const series = await Series.findById(seriesId);
    if (!series) {
      return res.status(StatusCodes.NOT_FOUND).json({
        success: false,
        message: 'Series not found'
      });
    }

    // Check if user is the author
    if (series.authorId.toString() !== userId) {
      return res.status(StatusCodes.FORBIDDEN).json({
        success: false,
        message: 'You do not have permission to update this series'
      });
    }

    // Delete image from Cloudinary
    if (series.coverImageKey) {
      await imageStorageService.deleteImage(series.coverImageKey);
    }

    // Update series
    series.coverImage = null;
    series.coverImageKey = null;
    await series.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: 'Series cover image deleted successfully'
    });
  } catch (error) {
    console.error('Series cover image deletion error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to delete series cover image',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

module.exports = {
  upload,
  uploadCoverImage,
  uploadBannerImage,
  deleteCoverImage
};
