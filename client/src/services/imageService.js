class ImageService {
  constructor() {
    this.maxFileSize = 5 * 1024 * 1024; // 5MB
    this.maxImageDimension = 1024; // Max width/height
  }

  // Convert image file to base64
  async convertImageToBase64(file) {
    return new Promise((resolve, reject) => {
      try {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          reject(new Error('Please select an image file (JPEG, PNG, GIF, WebP)'));
          return;
        }

        // Validate file size
        if (file.size > this.maxFileSize) {
          reject(new Error(`File size must be less than ${this.formatFileSize(this.maxFileSize)}`));
          return;
        }

        const reader = new FileReader();
        
        reader.onload = (event) => {
          const base64String = event.target.result;
          
          // Validate the resulting base64 string
          if (!this.validateBase64Image(base64String)) {
            reject(new Error('Failed to process image - invalid format'));
            return;
          }
          
          resolve(base64String);
        };
        
        reader.onerror = () => {
          reject(new Error('Failed to read image file'));
        };
        
        reader.readAsDataURL(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Compress and resize image before converting to base64
  async compressImage(file) {
    return new Promise((resolve, reject) => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const img = new Image();
        
        img.onload = () => {
          // Calculate new dimensions while maintaining aspect ratio
          let { width, height } = img;
          
          if (width > this.maxImageDimension || height > this.maxImageDimension) {
            if (width > height) {
              height = (height * this.maxImageDimension) / width;
              width = this.maxImageDimension;
            } else {
              width = (width * this.maxImageDimension) / height;
              height = this.maxImageDimension;
            }
          }
          
          // Set canvas dimensions
          canvas.width = width;
          canvas.height = height;
          
          // Draw and compress image
          ctx.drawImage(img, 0, 0, width, height);
          
          // Convert to base64 with quality setting (0.8 = 80% quality)
          const compressedBase64 = canvas.toDataURL('image/jpeg', 0.8);
          resolve(compressedBase64);
        };
        
        img.onerror = () => {
          reject(new Error('Failed to load image'));
        };
        
        img.src = URL.createObjectURL(file);
      } catch (error) {
        reject(error);
      }
    });
  }

  // Convert image to base64 with compression
  async convertImageToBase64WithCompression(file) {
    try {
      // First try to compress the image
      const compressedBase64 = await this.compressImage(file);
      
      // Log image info for debugging
      const dimensions = await this.getImageDimensions(compressedBase64);
      const size = this.estimateFileSize(compressedBase64);
      console.log(`Image processed: ${dimensions.width}x${dimensions.height}, ~${this.formatFileSize(size)}`);
      
      return compressedBase64;
    } catch (error) {
      // If compression fails, fall back to simple conversion
      console.warn('Image compression failed, using original:', error);
      const base64 = await this.convertImageToBase64(file);
      
      // Log image info for debugging
      const dimensions = await this.getImageDimensions(base64);
      const size = this.estimateFileSize(base64);
      console.log(`Image processed (no compression): ${dimensions.width}x${dimensions.height}, ~${this.formatFileSize(size)}`);
      
      return base64;
    }
  }

  // Get image dimensions from base64
  getImageDimensions(base64String) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        reject(new Error('Failed to get image dimensions'));
      };
      img.src = base64String;
    });
  }

  // Get image dimensions from file (without loading into memory)
  getImageDimensionsFromFile(file) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        resolve({ width: img.width, height: img.height });
      };
      img.onerror = () => {
        reject(new Error('Failed to get image dimensions'));
      };
      img.src = URL.createObjectURL(file);
    });
  }

  // Check if string is already a base64 image
  isBase64Image(string) {
    return string && typeof string === 'string' && string.startsWith('data:image/');
  }

  // Validate base64 image
  validateBase64Image(base64String) {
    if (!base64String || typeof base64String !== 'string') {
      return false;
    }
    
    // Check if it's a valid data URL
    if (!base64String.startsWith('data:image/')) {
      return false;
    }
    
    // Check if it's not too long (reasonable size limit)
    // Base64 encoding increases size by ~33%, so 5MB file becomes ~6.7MB base64
    if (base64String.length > 7 * 1024 * 1024) { // 7MB base64 limit (roughly 5MB original file)
      return false;
    }
    
    return true;
  }

  // Extract file extension from base64
  getFileExtension(base64String) {
    const match = base64String.match(/^data:image\/([a-zA-Z]+);base64,/);
    return match ? match[1] : 'jpeg';
  }

  // Estimate file size from base64 (base64 is ~33% larger than original)
  estimateFileSize(base64String) {
    if (!this.validateBase64Image(base64String)) {
      return 0;
    }
    
    // Remove the data URL prefix to get just the base64 data
    const base64Data = base64String.replace(/^data:image\/[^;]+;base64,/, '');
    
    // Calculate size: base64 data length * 0.75 (to get original size)
    const estimatedSize = Math.ceil(base64Data.length * 0.75);
    
    return estimatedSize;
  }

  // Format file size for display
  formatFileSize(bytes) {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

export const imageService = new ImageService();
export default imageService; 