const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');
const fs = require('fs');
const path = require('path');

class B2S3Storage {
	constructor({ region, endpoint, bucket, keyId, appKey, public: isPublic = false, signedUrlTtlSeconds = 3600 }) {
		this.bucket = bucket;
		this.isPublic = isPublic;
		this.signedUrlTtlSeconds = signedUrlTtlSeconds;
		this.client = new S3Client({
			region,
			endpoint: `https://${endpoint}`,
			credentials: { accessKeyId: keyId, secretAccessKey: appKey },
			forcePathStyle: false,
		});
		this.publicBaseUrl = `https://${bucket}.${endpoint}`;
	}

	async uploadFromFile(key, filePath, contentType = 'application/octet-stream') {
		const body = fs.createReadStream(filePath);
		await this.client.send(new PutObjectCommand({
			Bucket: this.bucket,
			Key: key,
			Body: body,
			ContentType: contentType,
			CacheControl: 'public, max-age=31536000, immutable',
		}));

		if (this.isPublic) {
			return `${this.publicBaseUrl}/${key}`;
		}
		// Presigned URL if not public
		const command = new GetObjectCommand({ Bucket: this.bucket, Key: key });
		return await getSignedUrl(this.client, command, { expiresIn: this.signedUrlTtlSeconds });
	}
}

module.exports = B2S3Storage; 