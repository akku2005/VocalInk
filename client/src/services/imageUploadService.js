import api from './api';

class ImageUploadService {
  /**
   * Upload avatar image to Cloudinary
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadAvatar(file) {
    try {
      const formData = new FormData();
      formData.append('avatar', file);

      console.log('🔄 Uploading avatar to Cloudinary...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const response = await api.post('/images/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Avatar uploaded successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Avatar upload failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload avatar');
    }
  }

  /**
   * Upload cover image to Cloudinary
   * @param {File} file - Image file to upload
   * @returns {Promise<Object>} Upload result
   */
  async uploadCoverImage(file) {
    try {
      const formData = new FormData();
      formData.append('coverImage', file);

      console.log('🔄 Uploading cover image to Cloudinary...', {
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type
      });

      const response = await api.post('/images/cover', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      console.log('✅ Cover image uploaded successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Cover image upload failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to upload cover image');
    }
  }

  /**
   * Remove avatar image
   * @returns {Promise<Object>} Removal result
   */
  async removeAvatar() {
    try {
      console.log('🗑️ Removing avatar from Cloudinary...');

      const response = await api.delete('/images/avatar');

      console.log('✅ Avatar removed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Avatar removal failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove avatar');
    }
  }

  /**
   * Remove cover image
   * @returns {Promise<Object>} Removal result
   */
  async removeCoverImage() {
    try {
      console.log('🗑️ Removing cover image from Cloudinary...');

      const response = await api.delete('/images/cover');

      console.log('✅ Cover image removed successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('❌ Cover image removal failed:', error);
      throw new Error(error.response?.data?.message || 'Failed to remove cover image');
    }
  }

  /**
   * Validate image file before upload
   * @param {File} file - Image file to validate
   * @returns {Object} Validation result
   */
  validateImageFile(file) {
    const maxSize = 5 * 1024 * 1024; // 5MB
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];

    if (!file) {
      return { valid: false, error: 'No file selected' };
    }

    if (file.size > maxSize) {
      return { valid: false, error: 'File size must be less than 5MB' };
    }

    if (!allowedTypes.includes(file.type)) {
      return { valid: false, error: 'File must be an image (JPEG, PNG, GIF, or WebP)' };
    }

    return { valid: true };
  }

  /**
   * Create preview URL for image file
   * @param {File} file - Image file
   * @returns {string} Preview URL
   */
  createPreviewUrl(file) {
    return URL.createObjectURL(file);
  }

  /**
   * Revoke preview URL to free memory
   * @param {string} url - Preview URL to revoke
   */
  revokePreviewUrl(url) {
    if (url && url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}

export default new ImageUploadService();
