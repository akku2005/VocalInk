/**
 * AudioStorageService - Manages TTS audio storage in browser's IndexedDB
 * 
 * This service provides persistent audio storage in the browser, allowing users to:
 * - Store generated TTS audio locally (no server storage needed)
 * - Access audio across page refreshes
 * - Clear audio data anytime via browser settings
 * - Reduce server bandwidth and storage costs
 */

const DB_NAME = 'VocalInkAudio';
const STORE_NAME = 'audioFiles';
const DB_VERSION = 1;

// Audio cache version - increment when segment structure changes
// Version 1: Original format
// Version 2: Added 'id' field to segments for TTS highlighting
const AUDIO_CACHE_VERSION = 2;

class AudioStorageService {
    constructor() {
        this.db = null;
    }

    /**
     * Open IndexedDB connection
     * @returns {Promise<IDBDatabase>}
     */
    async openDB() {
        if (this.db) {
            return this.db;
        }

        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, DB_VERSION);

            request.onerror = () => {
                console.error('Failed to open IndexedDB:', request.error);
                reject(request.error);
            };

            request.onsuccess = () => {
                this.db = request.result;
                console.log('✅ IndexedDB opened successfully');
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;

                // Create object store if it doesn't exist
                if (!db.objectStoreNames.contains(STORE_NAME)) {
                    const objectStore = db.createObjectStore(STORE_NAME, { keyPath: 'blogId' });

                    // Create indexes for faster queries
                    objectStore.createIndex('timestamp', 'timestamp', { unique: false });
                    objectStore.createIndex('blogId', 'blogId', { unique: true });

                    console.log('✅ IndexedDB object store created');
                }
            };
        });
    }

    /**
     * Save audio data to IndexedDB
     * @param {string} blogId - Blog post ID
     * @param {ArrayBuffer} audioData - Audio buffer data
     * @param {Array} segments - Audio segments metadata
     * @param {number} duration - Total audio duration
     * @returns {Promise<void>}
     */
    async saveAudio(blogId, audioData, segments = [], duration = 0) {
        try {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);

                const data = {
                    blogId,
                    audioData, // Store as ArrayBuffer
                    segments,
                    duration,
                    timestamp: Date.now(),
                    size: audioData.byteLength,
                    version: AUDIO_CACHE_VERSION // Track version for invalidation
                };

                const request = store.put(data);

                request.onsuccess = () => {
                    console.log(`✅ Audio saved to IndexedDB for blog: ${blogId}`, {
                        size: `${(audioData.byteLength / 1024).toFixed(2)} KB`,
                        segments: segments.length,
                        duration: `${duration}s`
                    });
                    resolve();
                };

                request.onerror = () => {
                    console.error('Failed to save audio to IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error saving audio:', error);
            throw error;
        }
    }

    /**
     * Get audio data from IndexedDB
     * @param {string} blogId - Blog post ID
     * @returns {Promise<Object|null>} Audio data object or null if not found
     */
    async getAudio(blogId) {
        try {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.get(blogId);

                request.onsuccess = () => {
                    const result = request.result;
                    if (result) {
                        // Check version - invalidate old cached audio without segment IDs
                        if (!result.version || result.version < AUDIO_CACHE_VERSION) {
                            console.warn(`⚠️ Old audio cache version detected for blog: ${blogId}`, {
                                cachedVersion: result.version || 1,
                                currentVersion: AUDIO_CACHE_VERSION,
                                reason: 'Missing segment IDs for highlighting'
                            });
                            // Delete old cache and return null to force regeneration
                            this.deleteAudio(blogId).catch(err =>
                                console.error('Failed to delete old cache:', err)
                            );
                            console.log('💡 Please regenerate TTS audio to enable highlighting');
                            resolve(null);
                            return;
                        }

                        console.log(`✅ Audio loaded from IndexedDB for blog: ${blogId}`, {
                            size: `${(result.size / 1024).toFixed(2)} KB`,
                            segments: result.segments?.length || 0,
                            version: result.version
                        });
                    } else {
                        console.log(`⚠️ No audio found in IndexedDB for blog: ${blogId}`);
                    }
                    resolve(result || null);
                };

                request.onerror = () => {
                    console.error('Failed to get audio from IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error getting audio:', error);
            return null;
        }
    }

    /**
     * Check if audio exists in IndexedDB
     * @param {string} blogId - Blog post ID
     * @returns {Promise<boolean>}
     */
    async hasAudio(blogId) {
        const audio = await this.getAudio(blogId);
        return audio !== null;
    }

    /**
     * Delete audio from IndexedDB
     * @param {string} blogId - Blog post ID
     * @returns {Promise<void>}
     */
    async deleteAudio(blogId) {
        try {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.delete(blogId);

                request.onsuccess = () => {
                    console.log(`🗑️ Audio deleted from IndexedDB for blog: ${blogId}`);
                    resolve();
                };

                request.onerror = () => {
                    console.error('Failed to delete audio from IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error deleting audio:', error);
            throw error;
        }
    }

    /**
     * Clear all audio from IndexedDB
     * @returns {Promise<void>}
     */
    async clearAll() {
        try {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readwrite');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.clear();

                request.onsuccess = () => {
                    console.log('🗑️ All audio cleared from IndexedDB');
                    resolve();
                };

                request.onerror = () => {
                    console.error('Failed to clear IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error clearing audio:', error);
            throw error;
        }
    }

    /**
     * Get all stored audio metadata
     * @returns {Promise<Array>}
     */
    async getAllMetadata() {
        try {
            const db = await this.openDB();

            return new Promise((resolve, reject) => {
                const transaction = db.transaction([STORE_NAME], 'readonly');
                const store = transaction.objectStore(STORE_NAME);
                const request = store.getAllKeys();

                request.onsuccess = async () => {
                    const keys = request.result;
                    const metadata = [];

                    for (const key of keys) {
                        const audio = await this.getAudio(key);
                        if (audio) {
                            metadata.push({
                                blogId: audio.blogId,
                                size: audio.size,
                                duration: audio.duration,
                                segments: audio.segments?.length || 0,
                                timestamp: audio.timestamp,
                                date: new Date(audio.timestamp).toLocaleString()
                            });
                        }
                    }

                    resolve(metadata);
                };

                request.onerror = () => {
                    console.error('Failed to get metadata from IndexedDB:', request.error);
                    reject(request.error);
                };
            });
        } catch (error) {
            console.error('Error getting metadata:', error);
            return [];
        }
    }

    /**
     * Get total storage size used
     * @returns {Promise<number>} Size in bytes
     */
    async getStorageSize() {
        try {
            const metadata = await this.getAllMetadata();
            return metadata.reduce((total, item) => total + (item.size || 0), 0);
        } catch (error) {
            console.error('Error calculating storage size:', error);
            return 0;
        }
    }

    /**
     * Create a blob URL from audio data
     * @param {ArrayBuffer} audioData - Audio buffer
     * @returns {string} Blob URL
     */
    createBlobUrl(audioData) {
        const blob = new Blob([audioData], { type: 'audio/mpeg' });
        return URL.createObjectURL(blob);
    }

    /**
     * Revoke a blob URL to free memory
     * @param {string} blobUrl - Blob URL to revoke
     */
    revokeBlobUrl(blobUrl) {
        if (blobUrl && blobUrl.startsWith('blob:')) {
            URL.revokeObjectURL(blobUrl);
        }
    }

    /**
     * Check if IndexedDB is supported
     * @returns {boolean}
     */
    isSupported() {
        return typeof indexedDB !== 'undefined';
    }

    /**
     * Get storage quota information
     * @returns {Promise<Object>}
     */
    async getQuotaInfo() {
        if (!navigator.storage || !navigator.storage.estimate) {
            return { supported: false };
        }

        try {
            const estimate = await navigator.storage.estimate();
            return {
                supported: true,
                usage: estimate.usage || 0,
                quota: estimate.quota || 0,
                usagePercent: ((estimate.usage / estimate.quota) * 100).toFixed(2),
                usageMB: ((estimate.usage || 0) / (1024 * 1024)).toFixed(2),
                quotaMB: ((estimate.quota || 0) / (1024 * 1024)).toFixed(2)
            };
        } catch (error) {
            console.error('Error getting quota info:', error);
            return { supported: false };
        }
    }
}

// Export singleton instance
export default new AudioStorageService();
