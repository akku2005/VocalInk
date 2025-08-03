const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const textToSpeech = require('@google-cloud/text-to-speech');
const logger = require('../utils/logger');
const config = require('../config');

class TTSService {
  constructor() {
    this.audioDir = path.join(__dirname, '../../public/audio');
    this.ttsDir = path.join(__dirname, '../../public/tts');
    this.ensureAudioDirectories();
    this.elevenlabsConfig = config.elevenlabs;
    this.googleCloudConfig = config.googleCloud;
    
    // Initialize Google Cloud TTS client
    if (this.googleCloudConfig.credentials && this.googleCloudConfig.projectId) {
      try {
        this.googleCloudClient = new textToSpeech.TextToSpeechClient({
          projectId: this.googleCloudConfig.projectId,
          credentials: this.googleCloudConfig.credentials
        });
        logger.info('✅ Google Cloud TTS client initialized successfully');
      } catch (error) {
        logger.warn('⚠️  Failed to initialize Google Cloud TTS client:', error.message);
        this.googleCloudClient = null;
      }
    } else {
      logger.info('ℹ️  Google Cloud TTS not configured - will use fallback providers');
    }
  }

  async ensureAudioDirectories() {
    try {
      await fs.mkdir(this.audioDir, { recursive: true });
      await fs.mkdir(this.ttsDir, { recursive: true });
    } catch (error) {
      logger.error('Failed to create audio directories:', error);
    }
  }

  /**
   * Generate speech using ElevenLabs (Premium AI voices)
   */
  async generateWithElevenLabs(text, options = {}) {
    const {
      voiceId = this.elevenlabsConfig.defaultVoiceId,
      stability = this.elevenlabsConfig.defaultSettings.stability,
      similarityBoost = this.elevenlabsConfig.defaultSettings.similarityBoost,
      style = this.elevenlabsConfig.defaultSettings.style,
      useSpeakerBoost = this.elevenlabsConfig.defaultSettings.useSpeakerBoost,
      modelId = 'eleven_monolingual_v1'
    } = options;

    if (!this.elevenlabsConfig.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const filename = `elevenlabs-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`;
      const audioPath = path.join(this.ttsDir, filename);
      
      // Clean and validate text
      const cleanText = this.sanitizeText(text, 5000);
      
      if (!cleanText.trim()) {
        throw new Error('No valid text provided for TTS generation');
      }

      // Prepare request payload
      const payload = {
        text: cleanText,
        model_id: modelId,
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: useSpeakerBoost
        }
      };

      // Make API request to ElevenLabs
      const response = await axios({
        method: 'POST',
        url: `${this.elevenlabsConfig.baseUrl}/text-to-speech/${voiceId}`,
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': this.elevenlabsConfig.apiKey
        },
        data: payload,
        responseType: 'arraybuffer',
        timeout: 30000 // 30 second timeout
      });

      // Save audio file
      await fs.writeFile(audioPath, response.data);
      
      const audioUrl = `/tts/${filename}`;
      logger.info('ElevenLabs audio generated successfully', { 
        audioUrl, 
        voiceId, 
        textLength: cleanText.length 
      });
      
      return {
        url: audioUrl,
        path: audioPath,
        provider: 'elevenlabs',
        voiceId,
        duration: this.estimateDuration(cleanText, 150),
        metadata: {
          modelId,
          stability,
          similarityBoost,
          style,
          useSpeakerBoost
        }
      };
    } catch (error) {
      logger.error('ElevenLabs TTS generation failed:', error);
      
      if (error.response) {
        const errorMessage = this.handleElevenLabsError(error.response);
        throw new Error(`ElevenLabs API Error: ${errorMessage}`);
      }
      
      throw new Error(`ElevenLabs TTS failed: ${error.message}`);
    }
  }

  /**
   * Handle ElevenLabs API errors
   */
  handleElevenLabsError(response) {
    const status = response.status;
    const data = response.data;
    
    switch (status) {
      case 401:
        return 'Invalid API key. Please check your ElevenLabs API key.';
      case 403:
        return 'API key does not have permission to access this resource.';
      case 404:
        return 'Voice not found. Please check the voice ID.';
      case 422:
        return 'Invalid request parameters. Please check your input.';
      case 429:
        return 'Rate limit exceeded. Please try again later.';
      case 500:
        return 'ElevenLabs server error. Please try again later.';
      default:
        return `API Error (${status}): ${data?.detail || 'Unknown error'}`;
    }
  }

  /**
   * Get available voices from ElevenLabs
   */
  async getElevenLabsVoices() {
    if (!this.elevenlabsConfig.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await axios({
        method: 'GET',
        url: `${this.elevenlabsConfig.baseUrl}/voices`,
        headers: {
          'xi-api-key': this.elevenlabsConfig.apiKey
        },
        timeout: 10000
      });

      return response.data.voices.map(voice => ({
        id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.labels?.description || '',
        gender: voice.labels?.gender || 'unknown',
        accent: voice.labels?.accent || '',
        language: voice.labels?.language || 'en',
        provider: 'elevenlabs',
        previewUrl: voice.preview_url
      }));
    } catch (error) {
      logger.error('Failed to fetch ElevenLabs voices:', error);
      throw new Error('Failed to fetch available voices');
    }
  }

  /**
   * Get voice details from ElevenLabs
   */
  async getElevenLabsVoiceDetails(voiceId) {
    if (!this.elevenlabsConfig.apiKey) {
      throw new Error('ElevenLabs API key not configured');
    }

    try {
      const response = await axios({
        method: 'GET',
        url: `${this.elevenlabsConfig.baseUrl}/voices/${voiceId}`,
        headers: {
          'xi-api-key': this.elevenlabsConfig.apiKey
        },
        timeout: 10000
      });

      const voice = response.data;
      return {
        id: voice.voice_id,
        name: voice.name,
        category: voice.category,
        description: voice.labels?.description || '',
        gender: voice.labels?.gender || 'unknown',
        accent: voice.labels?.accent || '',
        language: voice.labels?.language || 'en',
        provider: 'elevenlabs',
        previewUrl: voice.preview_url,
        settings: voice.settings
      };
    } catch (error) {
      logger.error('Failed to fetch ElevenLabs voice details:', error);
      throw new Error('Failed to fetch voice details');
    }
  }

  /**
   * Generate speech using eSpeak (free, local)
   */
  async generateWithESpeak(text, options = {}) {
    const {
      voice = 'en',
      speed = 150,
      pitch = 50,
      volume = 100
    } = options;

    try {
      const filename = `espeak-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.wav`;
      const audioPath = path.join(this.audioDir, filename);
      
      // Clean text for eSpeak
      const cleanText = this.sanitizeText(text, 4000);
      
      const command = `espeak "${cleanText}" -v ${voice} -s ${speed} -p ${pitch} -a ${volume} -w "${audioPath}"`;
      
      return new Promise((resolve, reject) => {
        exec(command, (error, stdout, stderr) => {
          if (error) {
            logger.error('eSpeak generation failed:', error);
            reject(error);
            return;
          }
          
          const audioUrl = `/audio/${filename}`;
          logger.info('eSpeak audio generated successfully', { audioUrl });
          resolve({
            url: audioUrl,
            path: audioPath,
            provider: 'espeak',
            duration: this.estimateDuration(cleanText, speed)
          });
        });
      });
    } catch (error) {
      logger.error('eSpeak service error:', error);
      throw error;
    }
  }

  /**
   * Generate speech using gTTS (Google Text-to-Speech - free)
   */
  async generateWithGTTS(text, options = {}) {
    const {
      language = 'en',
      slow = false
    } = options;

    try {
      const filename = `gtts-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`;
      const audioPath = path.join(this.audioDir, filename);
      
      // Clean text for gTTS
      const cleanText = this.sanitizeText(text, 5000);
      
      // gTTS API endpoint (free tier)
      const gttsUrl = `https://translate.google.com/translate_tts`;
      const params = {
        ie: 'UTF-8',
        q: cleanText,
        tl: language,
        client: 'tw-ob',
        total: 1,
        idx: 0,
        textlen: cleanText.length
      };

      const response = await axios({
        method: 'GET',
        url: gttsUrl,
        params: params,
        responseType: 'arraybuffer',
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        },
        timeout: 30000
      });

      await fs.writeFile(audioPath, response.data);
      
      const audioUrl = `/audio/${filename}`;
      logger.info('gTTS audio generated successfully', { audioUrl });
      
      return {
        url: audioUrl,
        path: audioPath,
        provider: 'gtts',
        duration: this.estimateDuration(cleanText, slow ? 100 : 150)
      };
    } catch (error) {
      logger.error('gTTS service error:', error);
      throw error;
    }
  }

  /**
   * Generate speech using Google Cloud Text-to-Speech
   */
  async generateWithGoogleCloud(text, options = {}) {
    const {
      voiceName = this.googleCloudConfig.defaultVoice.name,
      languageCode = this.googleCloudConfig.defaultVoice.languageCode,
      ssmlGender = this.googleCloudConfig.defaultVoice.ssmlGender,
      speakingRate = this.googleCloudConfig.defaultSettings.speakingRate,
      pitch = this.googleCloudConfig.defaultSettings.pitch,
      volumeGainDb = this.googleCloudConfig.defaultSettings.volumeGainDb,
      effectsProfileId = this.googleCloudConfig.defaultSettings.effectsProfileId
    } = options;

    if (!this.googleCloudClient) {
      throw new Error('Google Cloud TTS not configured. Please set up GOOGLE_CLOUD_PROJECT_ID and GOOGLE_CLOUD_CREDENTIALS environment variables.');
    }

    try {
      const filename = `googlecloud-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.mp3`;
      const audioPath = path.join(this.ttsDir, filename);
      
      // Clean and validate text
      const cleanText = this.sanitizeText(text, 5000);
      
      if (!cleanText.trim()) {
        throw new Error('No valid text provided for TTS generation');
      }

      // Prepare request
      const request = {
        input: { text: cleanText },
        voice: {
          languageCode,
          name: voiceName,
          ssmlGender
        },
        audioConfig: {
          audioEncoding: 'MP3',
          speakingRate,
          pitch,
          volumeGainDb,
          effectsProfileId
        }
      };

      // Generate speech
      const [response] = await this.googleCloudClient.synthesizeSpeech(request);
      
      // Save audio file
      await fs.writeFile(audioPath, response.audioContent, 'binary');
      
      const audioUrl = `/tts/${filename}`;
      logger.info('Google Cloud TTS audio generated successfully', { 
        audioUrl, 
        voiceName, 
        languageCode,
        textLength: cleanText.length 
      });
      
      return {
        url: audioUrl,
        path: audioPath,
        provider: 'googlecloud',
        voiceName,
        languageCode,
        duration: this.estimateDuration(cleanText, speakingRate * 150),
        metadata: {
          speakingRate,
          pitch,
          volumeGainDb,
          effectsProfileId
        }
      };
    } catch (error) {
      logger.error('Google Cloud TTS generation failed:', error);
      
      if (error.code) {
        const errorMessage = this.handleGoogleCloudError(error);
        throw new Error(`Google Cloud TTS Error: ${errorMessage}`);
      }
      
      throw new Error(`Google Cloud TTS failed: ${error.message}`);
    }
  }

  /**
   * Handle Google Cloud TTS errors
   */
  handleGoogleCloudError(error) {
    switch (error.code) {
      case 3:
        return 'Invalid argument. Please check your request parameters.';
      case 7:
        return 'Permission denied. Please check your Google Cloud credentials.';
      case 9:
        return 'Resource exhausted. Please check your quota limits.';
      case 13:
        return 'Internal error. Please try again later.';
      case 14:
        return 'Service unavailable. Please try again later.';
      default:
        return `Google Cloud Error (${error.code}): ${error.message}`;
    }
  }

  /**
   * Get available voices from Google Cloud TTS
   */
  async getGoogleCloudVoices() {
    if (!this.googleCloudClient) {
      throw new Error('Google Cloud TTS not configured. Please set up GOOGLE_CLOUD_PROJECT_ID and GOOGLE_CLOUD_CREDENTIALS environment variables.');
    }

    try {
      const [response] = await this.googleCloudClient.listVoices({});
      const voices = response.voices || [];

      return voices.map(voice => ({
        id: voice.name,
        name: voice.name,
        languageCode: voice.languageCodes?.[0] || 'en-US',
        language: voice.languageCodes?.[0]?.split('-')[0] || 'en',
        gender: voice.ssmlGender?.toLowerCase() || 'unknown',
        provider: 'googlecloud',
        category: 'google',
        description: `Google Cloud ${voice.name}`,
        accent: voice.languageCodes?.[0]?.split('-')[1] || '',
        previewUrl: null
      }));
    } catch (error) {
      logger.error('Failed to fetch Google Cloud voices:', error);
      throw new Error('Failed to fetch available voices');
    }
  }

  /**
   * Generate speech using ResponsiveVoice (free web-based)
   */
  async generateWithResponsiveVoice(text, options = {}) {
    const {
      voice = 'US English Female',
      rate = 1.0,
      pitch = 1.0,
      volume = 1.0
    } = options;

    try {
      // ResponsiveVoice is client-side, so we return configuration
      const filename = `rv-${Date.now()}-${Math.random().toString(36).substr(2, 9)}.json`;
      const configPath = path.join(this.audioDir, filename);
      
      const config = {
        text: this.sanitizeText(text, 5000),
        voice: voice,
        rate: rate,
        pitch: pitch,
        volume: volume,
        provider: 'responsivevoice',
        timestamp: new Date().toISOString()
      };

      await fs.writeFile(configPath, JSON.stringify(config, null, 2));
      
      const configUrl = `/audio/${filename}`;
      logger.info('ResponsiveVoice config generated', { configUrl });
      
      return {
        url: configUrl,
        path: configPath,
        provider: 'responsivevoice',
        config: config,
        duration: this.estimateDuration(text, 150)
      };
    } catch (error) {
      logger.error('ResponsiveVoice service error:', error);
      throw error;
    }
  }

  /**
   * Main TTS generation method with fallback
   */
  async generateSpeech(text, options = {}) {
    const {
      provider = 'elevenlabs',
      voice = 'en',
      speed = 150,
      language = 'en',
      fallback = true,
      voiceId,
      stability,
      similarityBoost,
      style,
      useSpeakerBoost,
      voiceName,
      languageCode,
      ssmlGender,
      speakingRate,
      pitch,
      volumeGainDb,
      effectsProfileId
    } = options;

    try {
      let result;
      
      switch (provider.toLowerCase()) {
        case 'elevenlabs':
          result = await this.generateWithElevenLabs(text, {
            voiceId: voiceId || this.elevenlabsConfig.defaultVoiceId,
            stability,
            similarityBoost,
            style,
            useSpeakerBoost
          });
          break;
        case 'googlecloud':
          result = await this.generateWithGoogleCloud(text, {
            voiceName,
            languageCode,
            ssmlGender,
            speakingRate,
            pitch,
            volumeGainDb,
            effectsProfileId
          });
          break;
        case 'espeak':
          result = await this.generateWithESpeak(text, { voice, speed });
          break;
        case 'gtts':
          result = await this.generateWithGTTS(text, { language });
          break;
        case 'responsivevoice':
          result = await this.generateWithResponsiveVoice(text, { voice });
          break;
        default:
          // Try ElevenLabs first, then Google Cloud, fallback to eSpeak
          try {
            result = await this.generateWithElevenLabs(text, {
              voiceId: voiceId || this.elevenlabsConfig.defaultVoiceId,
              stability,
              similarityBoost,
              style,
              useSpeakerBoost
            });
          } catch (error) {
            if (fallback) {
              try {
                logger.info('ElevenLabs failed, trying Google Cloud');
                result = await this.generateWithGoogleCloud(text, {
                  voiceName,
                  languageCode,
                  ssmlGender,
                  speakingRate,
                  pitch,
                  volumeGainDb,
                  effectsProfileId
                });
              } catch (googleError) {
                logger.info('Google Cloud failed, falling back to eSpeak');
                result = await this.generateWithESpeak(text, { voice, speed });
              }
            } else {
              throw error;
            }
          }
      }

      return result;
    } catch (error) {
      logger.error(`TTS generation failed with ${provider}:`, error);
      
      if (fallback && provider !== 'espeak') {
        logger.info('Falling back to eSpeak');
        return await this.generateWithESpeak(text, { voice, speed });
      }
      
      throw error;
    }
  }

  /**
   * Get available voices for each provider
   */
  async getAvailableVoices(provider = 'elevenlabs') {
    try {
      switch (provider.toLowerCase()) {
        case 'elevenlabs':
          return await this.getElevenLabsVoices();
        case 'googlecloud':
          return await this.getGoogleCloudVoices();
        case 'espeak':
          return [
            { id: 'en', name: 'English', gender: 'male', provider: 'espeak' },
            { id: 'en+f2', name: 'English Female', gender: 'female', provider: 'espeak' },
            { id: 'en+m3', name: 'English Male', gender: 'male', provider: 'espeak' },
            { id: 'es', name: 'Spanish', gender: 'male', provider: 'espeak' },
            { id: 'fr', name: 'French', gender: 'male', provider: 'espeak' },
            { id: 'de', name: 'German', gender: 'male', provider: 'espeak' },
            { id: 'it', name: 'Italian', gender: 'male', provider: 'espeak' },
            { id: 'pt', name: 'Portuguese', gender: 'male', provider: 'espeak' }
          ];
        case 'gtts':
          return [
            { id: 'en', name: 'English', gender: 'female', provider: 'gtts' },
            { id: 'es', name: 'Spanish', gender: 'female', provider: 'gtts' },
            { id: 'fr', name: 'French', gender: 'female', provider: 'gtts' },
            { id: 'de', name: 'German', gender: 'female', provider: 'gtts' },
            { id: 'it', name: 'Italian', gender: 'female', provider: 'gtts' },
            { id: 'pt', name: 'Portuguese', gender: 'female', provider: 'gtts' },
            { id: 'ru', name: 'Russian', gender: 'female', provider: 'gtts' },
            { id: 'ja', name: 'Japanese', gender: 'female', provider: 'gtts' },
            { id: 'ko', name: 'Korean', gender: 'female', provider: 'gtts' },
            { id: 'zh', name: 'Chinese', gender: 'female', provider: 'gtts' }
          ];
        case 'responsivevoice':
          return [
            { id: 'US English Female', name: 'US English Female', gender: 'female', provider: 'responsivevoice' },
            { id: 'US English Male', name: 'US English Male', gender: 'male', provider: 'responsivevoice' },
            { id: 'UK English Female', name: 'UK English Female', gender: 'female', provider: 'responsivevoice' },
            { id: 'UK English Male', name: 'UK English Male', gender: 'male', provider: 'responsivevoice' },
            { id: 'Spanish Female', name: 'Spanish Female', gender: 'female', provider: 'responsivevoice' },
            { id: 'French Female', name: 'French Female', gender: 'female', provider: 'responsivevoice' },
            { id: 'German Female', name: 'German Female', gender: 'female', provider: 'responsivevoice' },
            { id: 'Italian Female', name: 'Italian Female', gender: 'female', provider: 'responsivevoice' }
          ];
        default:
          return await this.getElevenLabsVoices();
      }
    } catch (error) {
      logger.error(`Failed to get voices for provider ${provider}:`, error);
      // Return basic eSpeak voices as fallback
      return [
        { id: 'en', name: 'English', gender: 'male', provider: 'espeak' },
        { id: 'en+f2', name: 'English Female', gender: 'female', provider: 'espeak' }
      ];
    }
  }

  /**
   * Sanitize text for TTS processing
   */
  sanitizeText(text, maxLength = 5000) {
    if (!text || typeof text !== 'string') {
      return '';
    }

    // Remove HTML tags
    let cleanText = text.replace(/<[^>]*>/g, '');
    
    // Remove special characters that might cause issues
    cleanText = cleanText.replace(/[^\w\s.,!?;:'"()-]/g, ' ');
    
    // Normalize whitespace
    cleanText = cleanText.replace(/\s+/g, ' ').trim();
    
    // Truncate if too long
    if (cleanText.length > maxLength) {
      cleanText = cleanText.substring(0, maxLength).trim();
      // Try to end at a sentence
      const lastPeriod = cleanText.lastIndexOf('.');
      const lastExclamation = cleanText.lastIndexOf('!');
      const lastQuestion = cleanText.lastIndexOf('?');
      const lastEnd = Math.max(lastPeriod, lastExclamation, lastQuestion);
      
      if (lastEnd > maxLength * 0.8) {
        cleanText = cleanText.substring(0, lastEnd + 1);
      }
    }
    
    return cleanText;
  }

  /**
   * Estimate audio duration based on text length and speed
   */
  estimateDuration(text, wordsPerMinute = 150) {
    const wordCount = text.split(/\s+/).length;
    const durationInSeconds = (wordCount / wordsPerMinute) * 60;
    return Math.round(durationInSeconds);
  }

  /**
   * Clean up old audio files
   */
  async cleanupOldFiles(maxAge = 24 * 60 * 60 * 1000) { // 24 hours
    try {
      const directories = [this.audioDir, this.ttsDir];
      
      for (const dir of directories) {
        const files = await fs.readdir(dir);
        const now = Date.now();
        
        for (const file of files) {
          const filePath = path.join(dir, file);
          const stats = await fs.stat(filePath);
          
          if (now - stats.mtime.getTime() > maxAge) {
            await fs.unlink(filePath);
            logger.info('Cleaned up old audio file:', file);
          }
        }
      }
    } catch (error) {
      logger.error('Audio cleanup failed:', error);
    }
  }

  /**
   * Get TTS usage statistics
   */
  async getUsageStats() {
    try {
      const audioFiles = await fs.readdir(this.audioDir);
      const ttsFiles = await fs.readdir(this.ttsDir);
      
      const stats = {
        totalFiles: audioFiles.length + ttsFiles.length,
        audioFiles: audioFiles.length,
        ttsFiles: ttsFiles.length,
        providers: {
          espeak: audioFiles.filter(f => f.startsWith('espeak-')).length,
          gtts: audioFiles.filter(f => f.startsWith('gtts-')).length,
          responsivevoice: audioFiles.filter(f => f.startsWith('rv-')).length,
          elevenlabs: ttsFiles.filter(f => f.startsWith('elevenlabs-')).length,
          googlecloud: ttsFiles.filter(f => f.startsWith('googlecloud-')).length
        }
      };
      
      return stats;
    } catch (error) {
      logger.error('Failed to get usage stats:', error);
      return { error: 'Failed to get usage statistics' };
    }
  }
}

module.exports = TTSService; 