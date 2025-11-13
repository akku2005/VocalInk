const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const axios = require('axios');
const textToSpeech = require('@google-cloud/text-to-speech');
const logger = require('../utils/logger');
const config = require('../config');

// Optional Backblaze B2 S3-compatible uploader (lazy-loaded)
let b2Uploader = null;
async function ensureB2Uploader() {
  if (b2Uploader) return b2Uploader;
  if (config.ttsStorage.provider === 'b2' && config.ttsStorage.b2.bucket) {
    try {
      const B2Uploader = require('./storage/B2S3Storage');
      b2Uploader = new B2Uploader({
        region: config.ttsStorage.b2.region,
        endpoint: config.ttsStorage.b2.endpoint,
        bucket: config.ttsStorage.b2.bucket,
        keyId: config.ttsStorage.b2.keyId,
        appKey: config.ttsStorage.b2.appKey,
        public: config.ttsStorage.b2.public,
        signedUrlTtlSeconds: config.ttsStorage.b2.signedUrlTtlSeconds,
      });
      logger.info('B2 uploader initialized');
    } catch (error) {
      logger.warn('B2 uploader not available. Falling back to local storage.', { message: error.message });
    }
  } else if (config.ttsStorage.provider === 'b2_native' && (config.ttsStorage.b2Native.keyId && config.ttsStorage.b2Native.appKey)) {
    try {
      const B2NativeStorage = require('./storage/B2NativeStorage');
      b2Uploader = new B2NativeStorage({
        keyId: config.ttsStorage.b2Native.keyId,
        appKey: config.ttsStorage.b2Native.appKey,
        bucketName: config.ttsStorage.b2Native.bucketName || config.ttsStorage.b2.bucket,
        bucketId: config.ttsStorage.b2Native.bucketId,
        signedUrlTtlSeconds: config.ttsStorage.b2Native.signedUrlTtlSeconds,
      });
      logger.info('B2 Native uploader initialized');
    } catch (error) {
      logger.warn('B2 Native uploader not available. Falling back to local storage.', { message: error.message });
    }
  }
  return b2Uploader;
}

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
      language = 'en',
      modelId: providedModelId
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
      // Note: eleven_monolingual_v1 and eleven_multilingual_v1 are deprecated on free tier
      // Use v2 models which are available on all tiers
      const payload = {
        text: cleanText,
        model_id: providedModelId || (language && language !== 'en' ? 'eleven_multilingual_v2' : 'eleven_multilingual_v2'),
        voice_settings: {
          stability,
          similarity_boost: similarityBoost,
          style,
          use_speaker_boost: useSpeakerBoost
        }
      };

      // Debug: Log API key info (first 10 and last 10 chars only)
      const apiKeyDebug = this.elevenlabsConfig.apiKey.length > 20 
        ? `${this.elevenlabsConfig.apiKey.substring(0, 10)}...${this.elevenlabsConfig.apiKey.substring(this.elevenlabsConfig.apiKey.length - 10)}`
        : '***';
      logger.debug(`ElevenLabs TTS Request: voiceId=${voiceId}, model=${payload.model_id}, apiKey=${apiKeyDebug}`);

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

      // Validate response is actual audio data
      if (!response.data || response.data.length === 0) {
        logger.error('ElevenLabs returned empty response', { 
          dataLength: response.data?.length,
          contentType: response.headers['content-type'],
          status: response.status
        });
        throw new Error('ElevenLabs returned empty audio data');
      }

      // Check if response looks like audio
      // MP3 files can start with:
      // - 0xFF 0xFB or 0xFF 0xFA (MP3 frame header)
      // - 0x49 0x44 0x33 (ID3 tag: "ID3")
      const firstBytes = Buffer.from(response.data).slice(0, 3);
      const firstBytesHex = firstBytes.toString('hex');
      
      // Check for MP3 frame header
      const isMP3Frame = (firstBytes[0] === 0xFF && (firstBytes[1] === 0xFB || firstBytes[1] === 0xFA));
      // Check for ID3 tag (ID3v2 metadata)
      const isID3Tag = (firstBytes[0] === 0x49 && firstBytes[1] === 0x44 && firstBytes[2] === 0x33);
      const isValidMP3 = isMP3Frame || isID3Tag;
      
      if (!isValidMP3) {
        logger.error('ElevenLabs response is not valid MP3', {
          firstBytes: firstBytesHex,
          dataLength: response.data.length,
          contentType: response.headers['content-type'],
          responseData: response.data.toString('utf-8', 0, 200) // Log first 200 chars to see if it's JSON error
        });
        throw new Error('ElevenLabs response is not valid audio data');
      }

      logger.debug('Valid MP3 audio received from ElevenLabs', {
        dataLength: response.data.length,
        firstBytes: firstBytesHex,
        hasID3: isID3Tag,
        hasFrameHeader: isMP3Frame
      });

      // Save audio file locally
      await fs.writeFile(audioPath, response.data);

      let url = `/tts/${filename}`;
      let storage = 'local';
      let authToken = null;

      // Optionally upload to B2 S3 or native
      const uploader = await ensureB2Uploader();
      if (uploader) {
        try {
          const objectKey = `tts/${filename}`;
          const uploadRes = await uploader.uploadFromFile(objectKey, audioPath, 'audio/mpeg');
          if (typeof uploadRes === 'string') {
            url = uploadRes;
          } else if (uploadRes && uploadRes.url) {
            url = uploadRes.url;
            authToken = uploadRes.token || null;
          }
          storage = 'b2';
        } catch (e) {
          logger.warn('B2 upload failed, serving locally', { message: e.message });
        }
      }

      // Verify file exists before returning
      const fileExists = await fs.access(audioPath).then(() => true).catch(() => false);
      if (!fileExists) {
        logger.error('Audio file was not created', { audioPath, filename });
        throw new Error(`Audio file was not created at ${audioPath}`);
      }

      logger.info('ElevenLabs audio generated successfully', { url, storage, voiceId, textLength: cleanText.length, audioPath, fileExists });

      return {
        url,
        path: audioPath,
        provider: 'elevenlabs',
        voiceId,
        duration: this.estimateDuration(cleanText, 150),
        metadata: { modelId: payload.model_id, stability, similarityBoost, style, useSpeakerBoost, storage, authToken }
      };
    } catch (error) {
      logger.error('ElevenLabs TTS generation failed:', { message: error.message });
      
      if (error.response) {
        logger.error('ElevenLabs API Response:', {
          status: error.response.status,
          statusText: error.response.statusText,
          data: error.response.data,
          headers: error.response.headers
        });
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
          
          (async () => {
            let audioUrl = `/audio/${filename}`;
            let storage = 'local';
            let authToken = null;

            const uploader = await ensureB2Uploader();
            if (uploader) {
              try {
                const objectKey = `audio/${filename}`;
                const uploadRes = await uploader.uploadFromFile(objectKey, audioPath, 'audio/wav');
                if (typeof uploadRes === 'string') {
                  audioUrl = uploadRes;
                } else if (uploadRes && uploadRes.url) {
                  audioUrl = uploadRes.url;
                  authToken = uploadRes.token || null;
                }
                storage = 'b2';
              } catch (e) {
                logger.warn('B2 upload failed, serving locally', { message: e.message });
              }
            }

            logger.info('eSpeak audio generated successfully', { url: audioUrl, storage });
            resolve({
              url: audioUrl,
              path: audioPath,
              provider: 'espeak',
              duration: this.estimateDuration(cleanText, speed),
              metadata: { storage, authToken }
            });
          })();
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
      const cleanText = this.sanitizeText(text, 5000);

      // gTTS hard limit; chunk into ~200-character sentences
      const chunks = this.chunkText(cleanText, 200);
      const segments = [];

      for (let i = 0; i < chunks.length; i++) {
        const chunk = chunks[i];
        const filename = `gtts-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 6)}.mp3`;
        const audioPath = path.join(this.audioDir, filename);

        const gttsUrl = `https://translate.googleapis.com/translate_tts`;
        const params = {
          ie: 'UTF-8',
          q: chunk,
          tl: language,
          client: 'tw-ob',
          total: chunks.length,
          idx: i,
          textlen: chunk.length,
          hl: language
        };

        const response = await axios({
          method: 'GET',
          url: gttsUrl,
          params,
          responseType: 'arraybuffer',
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
          timeout: 30000,
        });

        await fs.writeFile(audioPath, response.data);

        let audioUrl = `/audio/${filename}`;
        let storage = 'local';
        let authToken = null;

        const uploader = await ensureB2Uploader();
        if (uploader) {
          try {
            const objectKey = `audio/${filename}`;
            const uploadRes = await uploader.uploadFromFile(objectKey, audioPath, 'audio/mpeg');
            if (typeof uploadRes === 'string') {
              audioUrl = uploadRes;
            } else if (uploadRes && uploadRes.url) {
              audioUrl = uploadRes.url;
              authToken = uploadRes.token || null;
            }
            storage = 'b2';
          } catch (e) {
            logger.warn('B2 upload failed, serving locally', { message: e.message });
          }
        }

        segments.push({ url: audioUrl, path: audioPath, length: chunk.length, storage, authToken });
      }

      const totalDuration = this.estimateDuration(cleanText, 150);
      logger.info('gTTS audio generated successfully', { segments: segments.length });

      return {
        url: segments[0]?.url,
        path: segments[0]?.path,
        provider: 'gtts',
        duration: totalDuration,
        segments,
        metadata: { segmented: true }
      };
    } catch (error) {
      logger.error('gTTS service error:', { message: error.message });
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
      logger.error('Google Cloud TTS generation failed:', { message: error.message });
      
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
          // Try ElevenLabs first, then Google Cloud, fallback to gTTS, then eSpeak (Windows-safe)
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
                try {
                  logger.info('Google Cloud failed, falling back to gTTS');
                  result = await this.generateWithGTTS(text, { language });
                } catch (gttsError) {
                  if (process.platform === 'win32') {
                    logger.warn('Skipping eSpeak fallback on Windows');
                    throw gttsError;
                  }
                  logger.info('gTTS failed, falling back to eSpeak');
                  result = await this.generateWithESpeak(text, { voice, speed });
                }
              }
            } else {
              throw error;
            }
          }
      }

      return result;
    } catch (error) {
      logger.error(`TTS generation failed with ${provider}:`, { message: error.message });
      
      if (fallback && provider !== 'espeak') {
        try {
          logger.info('Primary provider failed, trying gTTS fallback');
          return await this.generateWithGTTS(text, { language });
        } catch (gttsError) {
          if (process.platform === 'win32') {
            logger.warn('Skipping eSpeak fallback on Windows');
            throw error;
          }
          logger.info('gTTS fallback failed, trying eSpeak');
          return await this.generateWithESpeak(text, { voice, speed });
        }
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
   * Chunk text by sentences without exceeding maxLen
   */
  chunkText(text, maxLen = 200) {
    const sentences = text.split(/([.!?])\s+/);
    const chunks = [];
    let buf = '';
    for (let i = 0; i < sentences.length; i++) {
      const part = sentences[i];
      if (!part) continue;
      const next = buf ? `${buf} ${part}` : part;
      if (next.length <= maxLen) {
        buf = next;
      } else {
        if (buf) chunks.push(buf.trim());
        buf = part;
      }
    }
    if (buf) chunks.push(buf.trim());
    return chunks.length ? chunks : [text.substring(0, Math.min(text.length, maxLen))];
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