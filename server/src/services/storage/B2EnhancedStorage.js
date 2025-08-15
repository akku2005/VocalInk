const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand, ListObjectsV2Command, CreateMultipartUploadCommand, UploadPartCommand, CompleteMultipartUploadCommand, AbortMultipartUploadCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const logger = require('../../utils/logger');

class B2EnhancedStorage {
  constructor(config) {
    this.config = {
      region: config.region || 'us-east-005',
      endpoint: config.endpoint || 's3.us-east-005.backblazeb2.com',
      bucket: config.bucket,
      keyId: config.keyId,
      appKey: config.appKey,
      public: config.public || false,
      signedUrlTtlSeconds: config.signedUrlTtlSeconds || 3600,
      multipartThreshold: config.multipartThreshold || 5 * 1024 * 1024, // 5MB
      maxConcurrentUploads: config.maxConcurrentUploads || 3,
      retryAttempts: config.retryAttempts || 3,
      retryDelay: config.retryDelay || 1000,
      ...config
    };

    this.client = new S3Client({
      region: this.config.region,
      endpoint: `https://${this.config.endpoint}`,
      credentials: {
        accessKeyId: this.config.keyId,
        secretAccessKey: this.config.appKey
      },
      forcePathStyle: false,
      maxAttempts: this.config.retryAttempts,
    });

    this.publicBaseUrl = `https://${this.config.bucket}.${this.config.endpoint}`;
    this.uploadQueue = [];
    this.processingUploads = 0;
  }

  /**
   * Upload file with automatic multipart handling
   */
  async uploadFromFile(key, filePath, contentType = 'application/octet-stream', metadata = {}) {
    try {
      const stats = await fs.promises.stat(filePath);
      const fileSize = stats.size;

      logger.info('Starting file upload', {
        key,
        filePath,
        fileSize,
        contentType,
        multipartThreshold: this.config.multipartThreshold
      });

      // Check if multipart upload is needed
      if (fileSize > this.config.multipartThreshold) {
        return await this.multipartUpload(key, filePath, contentType, metadata);
      } else {
        return await this.singlePartUpload(key, filePath, contentType, metadata);
      }
    } catch (error) {
      logger.error('Upload failed', {
        key,
        filePath,
        error: error.message
      });
      throw error;
    }
  }

  /**
   * Single part upload for smaller files
   */
  async singlePartUpload(key, filePath, contentType, metadata) {
    const body = fs.createReadStream(filePath);
    
    const command = new PutObjectCommand({
      Bucket: this.config.bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: 'public, max-age=31536000, immutable',
      Metadata: {
        ...metadata,
        uploadedAt: new Date().toISOString(),
        uploadMethod: 'single-part'
      }
    });

    await this.client.send(command);

    logger.info('Single part upload completed', { key, filePath });

    return this.generateUrl(key);
  }

  /**
   * Multipart upload for larger files
   */
  async multipartUpload(key, filePath, contentType, metadata) {
    const fileStream = fs.createReadStream(filePath);
    const fileSize = (await fs.promises.stat(filePath)).size;
    const partSize = Math.ceil(fileSize / 10000); // B2 allows up to 10,000 parts
    const parts = [];

    try {
      // Create multipart upload
      const createCommand = new CreateMultipartUploadCommand({
        Bucket: this.config.bucket,
        Key: key,
        ContentType: contentType,
        Metadata: {
          ...metadata,
          uploadedAt: new Date().toISOString(),
          uploadMethod: 'multipart',
          totalParts: Math.ceil(fileSize / partSize)
        }
      });

      const { UploadId } = await this.client.send(createCommand);
      logger.info('Multipart upload created', { key, uploadId: UploadId });

      // Upload parts
      let partNumber = 1;
      let uploadedBytes = 0;

      for await (const chunk of this.readFileInChunks(filePath, partSize)) {
        const uploadPartCommand = new UploadPartCommand({
          Bucket: this.config.bucket,
          Key: key,
          UploadId,
          PartNumber: partNumber,
          Body: chunk
        });

        const { ETag } = await this.client.send(uploadPartCommand);
        parts.push({ ETag, PartNumber: partNumber });

        uploadedBytes += chunk.length;
        logger.info('Part uploaded', {
          key,
          partNumber,
          uploadedBytes,
          totalSize: fileSize,
          progress: Math.round((uploadedBytes / fileSize) * 100)
        });

        partNumber++;
      }

      // Complete multipart upload
      const completeCommand = new CompleteMultipartUploadCommand({
        Bucket: this.config.bucket,
        Key: key,
        UploadId,
        MultipartUpload: { Parts: parts }
      });

      await this.client.send(completeCommand);

      logger.info('Multipart upload completed', { key, uploadId: UploadId, parts: parts.length });

      return this.generateUrl(key);

    } catch (error) {
      logger.error('Multipart upload failed', { key, error: error.message });
      
      // Abort multipart upload if it exists
      if (UploadId) {
        try {
          const abortCommand = new AbortMultipartUploadCommand({
            Bucket: this.config.bucket,
            Key: key,
            UploadId
          });
          await this.client.send(abortCommand);
          logger.info('Multipart upload aborted', { key, uploadId: UploadId });
        } catch (abortError) {
          logger.error('Failed to abort multipart upload', { key, error: abortError.message });
        }
      }

      throw error;
    }
  }

  /**
   * Read file in chunks for multipart upload
   */
  async *readFileInChunks(filePath, chunkSize) {
    const stream = fs.createReadStream(filePath, { highWaterMark: chunkSize });
    
    for await (const chunk of stream) {
      yield chunk;
    }
  }

  /**
   * Generate URL for uploaded file
   */
  generateUrl(key) {
    if (this.config.public) {
      return `${this.publicBaseUrl}/${key}`;
    } else {
      // For private files, we'll need to generate a signed URL when requested
      return { key, bucket: this.config.bucket, public: false };
    }
  }

  /**
   * Generate signed URL for private files
   */
  async generateSignedUrl(key, expiresIn = this.config.signedUrlTtlSeconds) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      });

      const signedUrl = await getSignedUrl(this.client, command, { expiresIn });
      
      logger.info('Signed URL generated', { key, expiresIn });
      
      return {
        url: signedUrl,
        expiresAt: new Date(Date.now() + expiresIn * 1000),
        key,
        bucket: this.config.bucket
      };
    } catch (error) {
      logger.error('Failed to generate signed URL', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Delete file from storage
   */
  async deleteFile(key) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      });

      await this.client.send(command);
      
      logger.info('File deleted', { key });
      
      return { success: true, key };
    } catch (error) {
      logger.error('Failed to delete file', { key, error: error.message });
      throw error;
    }
  }

  /**
   * List files in bucket with pagination
   */
  async listFiles(prefix = '', maxKeys = 1000, continuationToken = null) {
    try {
      const command = new ListObjectsV2Command({
        Bucket: this.config.bucket,
        Prefix: prefix,
        MaxKeys: maxKeys,
        ContinuationToken: continuationToken
      });

      const response = await this.client.send(command);
      
      const files = (response.Contents || []).map(obj => ({
        key: obj.Key,
        size: obj.Size,
        lastModified: obj.LastModified,
        etag: obj.ETag
      }));

      return {
        files,
        isTruncated: response.IsTruncated,
        nextContinuationToken: response.NextContinuationToken,
        keyCount: response.KeyCount
      };
    } catch (error) {
      logger.error('Failed to list files', { prefix, error: error.message });
      throw error;
    }
  }

  /**
   * Get file metadata
   */
  async getFileMetadata(key) {
    try {
      const command = new GetObjectCommand({
        Bucket: this.config.bucket,
        Key: key
      });

      const response = await this.client.send(command);
      
      return {
        key,
        size: response.ContentLength,
        contentType: response.ContentType,
        lastModified: response.LastModified,
        etag: response.ETag,
        metadata: response.Metadata || {}
      };
    } catch (error) {
      logger.error('Failed to get file metadata', { key, error: error.message });
      throw error;
    }
  }

  /**
   * Upload with retry logic
   */
  async uploadWithRetry(key, filePath, contentType, metadata, maxRetries = this.config.retryAttempts) {
    let lastError;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await this.uploadFromFile(key, filePath, contentType, metadata);
      } catch (error) {
        lastError = error;
        logger.warn('Upload attempt failed', {
          key,
          attempt,
          maxRetries,
          error: error.message
        });

        if (attempt < maxRetries) {
          await this.delay(this.config.retryDelay * attempt);
        }
      }
    }

    throw lastError;
  }

  /**
   * Batch upload multiple files
   */
  async batchUpload(files, concurrency = this.config.maxConcurrentUploads) {
    const results = [];
    const errors = [];

    // Process files in batches
    for (let i = 0; i < files.length; i += concurrency) {
      const batch = files.slice(i, i + concurrency);
      const batchPromises = batch.map(async (file) => {
        try {
          const result = await this.uploadFromFile(
            file.key,
            file.filePath,
            file.contentType,
            file.metadata
          );
          return { success: true, file: file.key, result };
        } catch (error) {
          return { success: false, file: file.key, error: error.message };
        }
      });

      const batchResults = await Promise.all(batchPromises);
      
      batchResults.forEach(result => {
        if (result.success) {
          results.push(result);
        } else {
          errors.push(result);
        }
      });
    }

    return {
      successful: results.length,
      failed: errors.length,
      results,
      errors
    };
  }

  /**
   * Clean up old files based on lifecycle rules
   */
  async cleanupOldFiles(prefix = '', maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      const cutoffTime = new Date(Date.now() - maxAge);
      let deletedCount = 0;
      let continuationToken = null;

      do {
        const listResult = await this.listFiles(prefix, 1000, continuationToken);
        
        for (const file of listResult.files) {
          if (file.lastModified < cutoffTime) {
            try {
              await this.deleteFile(file.key);
              deletedCount++;
            } catch (error) {
              logger.error('Failed to delete old file', { key: file.key, error: error.message });
            }
          }
        }

        continuationToken = listResult.nextContinuationToken;
      } while (continuationToken);

      logger.info('Cleanup completed', { deletedCount, prefix, maxAge });
      return { deletedCount };
    } catch (error) {
      logger.error('Cleanup failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Get storage statistics
   */
  async getStorageStats(prefix = '') {
    try {
      let totalSize = 0;
      let fileCount = 0;
      let continuationToken = null;

      do {
        const listResult = await this.listFiles(prefix, 1000, continuationToken);
        
        for (const file of listResult.files) {
          totalSize += file.size;
          fileCount++;
        }

        continuationToken = listResult.nextContinuationToken;
      } while (continuationToken);

      return {
        totalSize,
        fileCount,
        averageFileSize: fileCount > 0 ? totalSize / fileCount : 0,
        prefix
      };
    } catch (error) {
      logger.error('Failed to get storage stats', { error: error.message });
      throw error;
    }
  }

  /**
   * Health check for storage service
   */
  async healthCheck() {
    try {
      // Try to list files to verify connectivity
      await this.listFiles('', 1);
      
      return {
        healthy: true,
        bucket: this.config.bucket,
        endpoint: this.config.endpoint,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        healthy: false,
        error: error.message,
        bucket: this.config.bucket,
        endpoint: this.config.endpoint,
        timestamp: new Date()
      };
    }
  }

  /**
   * Utility function for delays
   */
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = B2EnhancedStorage; 