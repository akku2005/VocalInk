const cloudinary = require('cloudinary').v2;
const crypto = require('crypto');

class ImageStorageService {
  constructor() {
    // Cloudinary configuration
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    });
    
    // Debug logging (remove in production)
    console.log('Cloudinary Config:', {
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY ? `${process.env.CLOUDINARY_API_KEY.substring(0, 6)}...` : 'undefined',
      api_secret: process.env.CLOUDINARY_API_SECRET ? 'configured' : 'undefined'
    });
  }

  /**
   * Generate a unique public ID for Cloudinary
   * @param {string} userId - User ID
   * @param {string} imageType - Type of image (avatar, cover)
   * @returns {string} Unique public ID
   */
  generatePublicId(userId, imageType) {
    const timestamp = Date.now();
    const randomId = crypto.randomBytes(8).toString('hex');
    return `vocalink/users/${userId}/${imageType}/${timestamp}-${randomId}`;
  }

  /**
   * Upload image to Cloudinary
   * @param {string} userId - User ID
   * @param {Buffer} imageBuffer - Image buffer
   * @param {string} imageType - Type of image (avatar, cover)
   * @param {Object} options - Upload options
   * @returns {Object} Upload result with URL and public_id
   */
  async uploadImage(userId, imageBuffer, imageType, options = {}) {
    try {
      const {
        width = imageType === 'avatar' ? 400 : 1200,
        height = imageType === 'avatar' ? 400 : 400,
        quality = 85
      } = options;

      // Generate unique public ID
      const publicId = this.generatePublicId(userId, imageType);

      // Convert buffer to base64 for Cloudinary
      const base64Image = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

      // Upload to Cloudinary with transformations
      const result = await cloudinary.uploader.upload(base64Image, {
        public_id: publicId,
        folder: `vocalink/users/${userId}`,
        transformation: [
          {
            width: width,
            height: height,
            crop: 'fill',
            gravity: 'face',
            quality: quality,
            format: 'jpg'
          }
        ],
        tags: [userId, imageType, 'vocalink'],
        context: {
          userId: userId,
          imageType: imageType,
          uploadedAt: new Date().toISOString()
        }
      });

      return {
        success: true,
        url: result.secure_url,
        publicId: result.public_id,
        size: result.bytes
      };
    } catch (error) {
      console.error('Cloudinary upload error:', error);
      throw new Error(`Failed to upload image: ${error.message}`);
    }
  }

  /**
   * Delete image from Cloudinary
   * @param {string} publicId - Cloudinary public ID
   * @returns {boolean} Success status
   */
  async deleteImage(publicId) {
    try {
      if (!publicId) {
        return true; // Nothing to delete
      }

      const result = await cloudinary.uploader.destroy(publicId);
      return result.result === 'ok';
    } catch (error) {
      console.error('Cloudinary deletion error:', error);
      return false;
    }
  }

  /**
   * Get optimized image URL with transformations
   * @param {string} publicId - Cloudinary public ID
   * @param {Object} transformations - Image transformations
   * @returns {string} Optimized image URL
   */
  getOptimizedUrl(publicId, transformations = {}) {
    if (!publicId) return null;

    const {
      width = 400,
      height = 400,
      quality = 'auto',
      format = 'auto'
    } = transformations;

    return cloudinary.url(publicId, {
      width: width,
      height: height,
      crop: 'fill',
      gravity: 'face',
      quality: quality,
      format: format,
      secure: true
    });
  }

  /**
   * Extract public ID from Cloudinary URL
   * @param {string} imageUrl - Cloudinary URL
   * @returns {string|null} Public ID or null if invalid
   */
  extractPublicId(imageUrl) {
    if (!imageUrl || !imageUrl.includes('cloudinary.com')) {
      return null;
    }

    try {
      // Extract public ID from Cloudinary URL
      const matches = imageUrl.match(/\/v\d+\/(.+)\.(jpg|jpeg|png|gif|webp)/i);
      return matches ? matches[1] : null;
    } catch (error) {
      console.error('Error extracting public ID:', error);
      return null;
    }
  }

  /**
   * Check if Cloudinary is properly configured
   * @returns {boolean} Configuration status
   */
  isConfigured() {
    return !!(
      process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
    );
  }
}

module.exports = new ImageStorageService();
