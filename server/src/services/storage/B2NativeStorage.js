const axios = require('axios');
const fs = require('fs');
const path = require('path');

class B2NativeStorage {
	constructor({ keyId, appKey, bucketName, bucketId, signedUrlTtlSeconds = 3600 }) {
		this.keyId = keyId;
		this.appKey = appKey;
		this.bucketName = bucketName;
		this.bucketId = bucketId || null;
		this.accountId = null;
		this.apiUrl = null;
		this.downloadUrl = null;
		this.authToken = null;
		this.signedUrlTtlSeconds = signedUrlTtlSeconds;
	}

	async authorize() {
		const res = await axios.get('https://api.backblazeb2.com/b2api/v2/b2_authorize_account', {
			headers: {
				Authorization: 'Basic ' + Buffer.from(`${this.keyId}:${this.appKey}`).toString('base64')
			}
		});
		this.apiUrl = res.data.apiUrl;
		this.downloadUrl = res.data.downloadUrl;
		this.authToken = res.data.authorizationToken;
		this.accountId = res.data.accountId;
		return res.data;
	}

	async ensureAuthorized() {
		if (!this.authToken) {
			await this.authorize();
		}
	}

	async ensureBucketId() {
		await this.ensureAuthorized();
		if (this.bucketId) return this.bucketId;
		const res = await axios.post(`${this.apiUrl}/b2api/v2/b2_list_buckets`, {
			accountId: this.accountId,
			bucketName: this.bucketName,
		}, { headers: { Authorization: this.authToken } });
		const bucket = (res.data.buckets || []).find(b => b.bucketName === this.bucketName);
		if (!bucket) throw new Error(`Bucket not found: ${this.bucketName}`);
		this.bucketId = bucket.bucketId;
		return this.bucketId;
	}

	async getUploadUrl() {
		await this.ensureBucketId();
		const res = await axios.post(`${this.apiUrl}/b2api/v2/b2_get_upload_url`, {
			bucketId: this.bucketId,
		}, { headers: { Authorization: this.authToken } });
		return res.data; // { uploadUrl, authorizationToken }
	}

	async uploadFromFile(key, filePath, contentType = 'application/octet-stream') {
		await this.ensureAuthorized();
		const { uploadUrl, authorizationToken } = await this.getUploadUrl();
		const data = fs.readFileSync(filePath);
		const sha1 = require('crypto').createHash('sha1').update(data).digest('hex');
		try {
			await axios.post(uploadUrl, data, {
				headers: {
					Authorization: authorizationToken,
					// Use encodeURI to keep forward slashes unescaped per B2 spec
					'X-Bz-File-Name': encodeURI(key),
					'Content-Type': contentType,
					'Content-Length': data.length,
					'X-Bz-Content-Sha1': sha1,
				}
			});
		} catch (err) {
			const details = err?.response?.data || err.message;
			throw new Error(typeof details === 'string' ? details : JSON.stringify(details));
		}
		// For private buckets, generate a download authorization (short-lived path token)
		const authRes = await axios.post(`${this.apiUrl}/b2api/v2/b2_get_download_authorization`, {
			bucketId: this.bucketId,
			fileNamePrefix: key,
			expirationSeconds: this.signedUrlTtlSeconds,
		}, { headers: { Authorization: this.authToken } });
		const token = authRes.data.authorizationToken;
		const url = `${this.downloadUrl}/file/${this.bucketName}/${key}`;
		return { url, token };
	}
}

module.exports = B2NativeStorage; 