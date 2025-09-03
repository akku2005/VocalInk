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
          reject(new Error('Please select an image file'));
          return;
        }

        // Validate file size
        if (file.size > this.maxFileSize) {
          reject(new Error('File size must be less than 5MB'));
          return;
        }

        const reader = new FileReader();
        
        reader.onload = (event) => {
          const base64String = event.target.result;
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
      return compressedBase64;
    } catch (error) {
      // If compression fails, fall back to simple conversion
      console.warn('Image compression failed, using original:', error);
      return await this.convertImageToBase64(file);
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
    if (base64String.length > 10 * 1024 * 1024) { // 10MB base64 limit
      return false;
    }
    
    return true;
  }

  // Extract file extension from base64
  getFileExtension(base64String) {
    const match = base64String.match(/^data:image\/([a-zA-Z]+);base64,/);
    return match ? match[1] : 'jpeg';
  }
}

export const imageService = new ImageService();
export default imageService; 