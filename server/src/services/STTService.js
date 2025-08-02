const fs = require('fs').promises;
const path = require('path');
const logger = require('../utils/logger');

class STTService {
  constructor() {
    this.audioDir = path.join(__dirname, '../../public/audio');
    this.transcriptsDir = path.join(__dirname, '../../public/transcripts');
    this.ensureDirectories();
  }

  async ensureDirectories() {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
      await fs.mkdir(this.transcriptsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create directories:', error);
    }
  }

  /**
   * Generate Web Speech API configuration for client-side STT
   */
  async generateWebSpeechConfig(options = {}) {
    const {
      language = 'en-US',
      continuous = true,
      interimResults = true,
      maxAlternatives = 3
    } = options;

    try {
      const filename = `webspeech-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`;
      const configPath = path.join(this.transcriptsDir, filename);
      
      const config = {
        language: language,
        continuous: continuous,
        interimResults: interimResults,
        maxAlternatives: maxAlternatives,
        provider: 'webspeech',
        timestamp: new Date().toISOString(),
        instructions: {
          start: 'Start recording speech',
          stop: 'Stop recording speech',
          pause: 'Pause recording',
          resume: 'Resume recording'
        }
      };

      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      
      const configUrl = `/transcripts/${filename}`;
      logger.info('Web Speech API config generated', { configUrl });
      
      return {
        url: configUrl,
        path: configPath,
        provider: 'webspeech',
        config: config
      };
    } catch (error) {
      logger.error('Web Speech API config generation failed:', error);
      throw error;
    }
  }

  /**
   * Process uploaded audio file for transcription
   */
  async processAudioFile(audioBuffer, options = {}) {
    const {
      language = 'en-US',
      format = 'wav',
      filename = null
    } = options;

    try {
      const timestamp = Date.now();
      const randomId = Math.random().toString(36).substr(2, 9);
      const audioFilename = filename || `audio-${timestamp}-${randomId}.${format}`;
      const audioPath = path.join(this.audioDir, audioFilename);
      
      // Save audio file
      await fs.writeFile(audioPath, audioBuffer);
      
      // Generate transcription config
      const transcriptFilename = `transcript-${timestamp}-${randomId}.json`;
      const transcriptPath = path.join(this.transcriptsDir, transcriptFilename);
      
      const transcriptConfig = {
        audioFile: audioFilename,
        audioPath: audioPath,
        language: language,
        format: format,
        provider: 'webspeech',
        status: 'pending',
        timestamp: new Date().toISOString(),
        metadata: {
          fileSize: audioBuffer.length,
          duration: this.estimateAudioDuration(audioBuffer, format)
        }
      };

      await fs.writeFile(transcriptPath, JSON.stringify(transcriptConfig, null, 2));
      
      const transcriptUrl = `/transcripts/${transcriptFilename}`;
      logger.info('Audio file processed for transcription', { 
        audioFile: audioFilename, 
        transcriptUrl 
      });
      
      return {
        audioUrl: `/audio/${audioFilename}`,
        transcriptUrl: transcriptUrl,
        config: transcriptConfig
      };
    } catch (error) {
      logger.error('Audio file processing failed:', error);
      throw error;
    }
  }

  /**
   * Save transcription results
   */
  async saveTranscription(transcriptId, transcriptionData) {
    try {
      const transcriptPath = path.join(this.transcriptsDir, `${transcriptId}.json`);
      
      // Read existing config
      const existingConfig = JSON.parse(await fs.readFile(transcriptPath, 'utf8'));
      
      // Update with transcription results
      const updatedConfig = {
        ...existingConfig,
        transcription: transcriptionData,
        status: 'completed',
        completedAt: new Date().toISOString(),
        confidence: transcriptionData.confidence || 0,
        alternatives: transcriptionData.alternatives || []
      };

      await fs.writeFile(transcriptPath, JSON.stringify(updatedConfig, null, 2));
      
      logger.info('Transcription saved successfully', { transcriptId });
      
      return updatedConfig;
    } catch (error) {
      logger.error('Failed to save transcription:', error);
      throw error;
    }
  }

  /**
   * Get transcription by ID
   */
  async getTranscription(transcriptId) {
    try {
      const transcriptPath = path.join(this.transcriptsDir, `${transcriptId}.json`);
      const transcriptData = JSON.parse(await fs.readFile(transcriptPath, 'utf8'));
      
      return transcriptData;
    } catch (error) {
      logger.error('Failed to get transcription:', error);
      throw error;
    }
  }

  /**
   * Get all transcriptions for a user
   */
  async getUserTranscriptions(userId, limit = 50) {
    try {
      const files = await fs.readdir(this.transcriptsDir);
      const userTranscriptions = [];
      
      for (const file of files) {
        if (file.endsWith('.json')) {
          const filePath = path.join(this.transcriptsDir, file);
          const transcriptData = JSON.parse(await fs.readFile(filePath, 'utf8'));
          
          if (transcriptData.userId === userId) {
            userTranscriptions.push({
              id: file.replace('.json', ''),
              ...transcriptData
            });
          }
        }
      }
      
      // Sort by timestamp and limit results
      return userTranscriptions
        .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
        .slice(0, limit);
    } catch (error) {
      logger.error('Failed to get user transcriptions:', error);
      throw error;
    }
  }

  /**
   * Get available languages for speech recognition
   */
  getAvailableLanguages() {
    return [
      { code: 'en-US', name: 'English (US)', country: 'United States' },
      { code: 'en-GB', name: 'English (UK)', country: 'United Kingdom' },
      { code: 'en-AU', name: 'English (Australia)', country: 'Australia' },
      { code: 'en-CA', name: 'English (Canada)', country: 'Canada' },
      { code: 'es-ES', name: 'Spanish (Spain)', country: 'Spain' },
      { code: 'es-MX', name: 'Spanish (Mexico)', country: 'Mexico' },
      { code: 'fr-FR', name: 'French (France)', country: 'France' },
      { code: 'fr-CA', name: 'French (Canada)', country: 'Canada' },
      { code: 'de-DE', name: 'German (Germany)', country: 'Germany' },
      { code: 'it-IT', name: 'Italian (Italy)', country: 'Italy' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)', country: 'Brazil' },
      { code: 'pt-PT', name: 'Portuguese (Portugal)', country: 'Portugal' },
      { code: 'ru-RU', name: 'Russian (Russia)', country: 'Russia' },
      { code: 'ja-JP', name: 'Japanese (Japan)', country: 'Japan' },
      { code: 'ko-KR', name: 'Korean (South Korea)', country: 'South Korea' },
      { code: 'zh-CN', name: 'Chinese (China)', country: 'China' },
      { code: 'zh-TW', name: 'Chinese (Taiwan)', country: 'Taiwan' },
      { code: 'hi-IN', name: 'Hindi (India)', country: 'India' },
      { code: 'ar-SA', name: 'Arabic (Saudi Arabia)', country: 'Saudi Arabia' }
    ];
  }

  /**
   * Estimate audio duration based on file size and format
   */
  estimateAudioDuration(audioBuffer, format = 'wav') {
    // Rough estimation based on file size and format
    const bytesPerSecond = {
      'wav': 176400, // 44.1kHz, 16-bit, stereo
      'mp3': 32000,  // 128kbps
      'ogg': 32000,  // 128kbps
      'm4a': 32000   // 128kbps
    };
    
    const bytesPerSec = bytesPerSecond[format] || bytesPerSecond['wav'];
    return Math.round(audioBuffer.length / bytesPerSec);
  }

  /**
   * Clean up old transcription files
   */
  async cleanupOldFiles(maxAge = 7 * 24 * 60 * 60 * 1000) { // 7 days
    try {
      const files = await fs.readdir(this.transcriptsDir);
      const now = Date.now();
      
      for (const file of files) {
        const filePath = path.join(this.transcriptsDir, file);
        const stats = await fs.stat(filePath);
        
        if (now - stats.mtime.getTime() > maxAge) {
          await fs.unlink(filePath);
          logger.info('Cleaned up old transcription file:', file);
        }
      }
    } catch (error) {
      logger.error('Transcription cleanup failed:', error);
    }
  }

  /**
   * Validate audio file format and size
   */
  validateAudioFile(audioBuffer, maxSize = 10 * 1024 * 1024) { // 10MB
    const errors = [];
    
    if (audioBuffer.length > maxSize) {
      errors.push(`File size exceeds maximum allowed size of ${maxSize / (1024 * 1024)}MB`);
    }
    
    if (audioBuffer.length === 0) {
      errors.push('Audio file is empty');
    }
    
    return {
      isValid: errors.length === 0,
      errors: errors
    };
  }
}

module.exports = STTService; 