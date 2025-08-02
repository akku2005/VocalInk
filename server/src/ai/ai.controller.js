const TTSService = require('../services/TTSService');
const STTService = require('../services/STTService');
const AISummaryService = require('../services/AISummaryService');
const AIAnalyzerService = require('../services/AIAnalyzerService');
const Blog = require('../models/blog.model');
const logger = require('../utils/logger');

class AIController {
  constructor() {
    this.ttsService = new TTSService();
    this.sttService = new STTService();
    this.summaryService = new AISummaryService();
    this.analyzerService = new AIAnalyzerService();
  }

  // TTS Endpoints
  async generateTTS(req, res) {
    try {
      const { 
        text, 
        provider, 
        voice, 
        voiceId, 
        voiceName,
        languageCode,
        ssmlGender,
        speed, 
        speakingRate,
        language, 
        stability, 
        similarityBoost, 
        style, 
        useSpeakerBoost,
        pitch,
        volumeGainDb,
        effectsProfileId
      } = req.body;
      const { blogId } = req.params;

      if (!text && !blogId) {
        return res.status(400).json({ 
          message: 'Either text or blogId is required' 
        });
      }

      let content = text;
      let blog = null;

      // If blogId is provided, get content from blog
      if (blogId) {
        blog = await Blog.findById(blogId);
        if (!blog) {
          return res.status(404).json({ message: 'Blog not found' });
        }

        // Check authorization
        if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }

        content = blog.content;
      }

      // Generate TTS
      const ttsResult = await this.ttsService.generateSpeech(content, {
        provider: provider || 'elevenlabs',
        voice: voice || 'en',
        voiceId: voiceId,
        voiceName,
        languageCode,
        ssmlGender,
        speed: speed || 150,
        speakingRate,
        language: language || 'en',
        stability,
        similarityBoost,
        style,
        useSpeakerBoost,
        pitch,
        volumeGainDb,
        effectsProfileId
      });

      // Update blog if blogId was provided
      if (blog) {
        blog.ttsUrl = ttsResult.url;
        blog.ttsOptions = {
          provider: ttsResult.provider,
          voice: voice || 'default',
          voiceId: voiceId,
          voiceName,
          languageCode,
          ssmlGender,
          speed: speed || 1.0,
          speakingRate,
          pitch: pitch || 1.0,
          language: language || 'en',
          stability,
          similarityBoost,
          style,
          useSpeakerBoost,
          volumeGainDb,
          effectsProfileId
        };
        blog.audioDuration = ttsResult.duration;
        await blog.save();

        logger.info('TTS generated for blog', {
          userId: req.user.id,
          blogId: blog._id,
          ttsUrl: ttsResult.url,
          provider: ttsResult.provider
        });
      }

      res.json({
        success: true,
        ttsUrl: ttsResult.url,
        provider: ttsResult.provider,
        voiceId: ttsResult.voiceId,
        duration: ttsResult.duration,
        metadata: {
          contentLength: content.length,
          wordCount: content.split(/\s+/).length,
          ...ttsResult.metadata
        }
      });

    } catch (error) {
      logger.error('TTS generation failed:', error);
      res.status(500).json({ 
        message: 'TTS generation failed',
        error: error.message 
      });
    }
  }

  async getAvailableVoices(req, res) {
    try {
      const { provider = 'elevenlabs' } = req.query;
      const voices = await this.ttsService.getAvailableVoices(provider);

      res.json({
        success: true,
        provider,
        voices,
        count: voices.length
      });

    } catch (error) {
      logger.error('Failed to get available voices:', error);
      res.status(500).json({ 
        message: 'Failed to get available voices',
        error: error.message 
      });
    }
  }

  async getElevenLabsVoices(req, res) {
    try {
      const voices = await this.ttsService.getElevenLabsVoices();

      res.json({
        success: true,
        provider: 'elevenlabs',
        voices,
        count: voices.length
      });

    } catch (error) {
      logger.error('Failed to get ElevenLabs voices:', error);
      res.status(500).json({ 
        message: 'Failed to get ElevenLabs voices',
        error: error.message 
      });
    }
  }

  async getElevenLabsVoiceDetails(req, res) {
    try {
      const { voiceId } = req.params;
      const voiceDetails = await this.ttsService.getElevenLabsVoiceDetails(voiceId);

      res.json({
        success: true,
        voice: voiceDetails
      });

    } catch (error) {
      logger.error('Failed to get ElevenLabs voice details:', error);
      res.status(500).json({ 
        message: 'Failed to get voice details',
        error: error.message 
      });
    }
  }

  async getGoogleCloudVoices(req, res) {
    try {
      const voices = await this.ttsService.getGoogleCloudVoices();

      res.json({
        success: true,
        provider: 'googlecloud',
        voices,
        count: voices.length
      });

    } catch (error) {
      logger.error('Failed to get Google Cloud voices:', error);
      res.status(500).json({ 
        message: 'Failed to get Google Cloud voices',
        error: error.message 
      });
    }
  }

  async getGoogleCloudVoiceDetails(req, res) {
    try {
      const { voiceName } = req.params;
      const voices = await this.ttsService.getGoogleCloudVoices();
      const voiceDetails = voices.find(voice => voice.name === voiceName);

      if (!voiceDetails) {
        return res.status(404).json({
          message: 'Voice not found'
        });
      }

      res.json({
        success: true,
        voice: voiceDetails
      });

    } catch (error) {
      logger.error('Failed to get Google Cloud voice details:', error);
      res.status(500).json({ 
        message: 'Failed to get voice details',
        error: error.message 
      });
    }
  }

  async getTTSStats(req, res) {
    try {
      const stats = await this.ttsService.getUsageStats();

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      logger.error('Failed to get TTS stats:', error);
      res.status(500).json({ 
        message: 'Failed to get TTS statistics',
        error: error.message 
      });
    }
  }

  async customizeVoice(req, res) {
    try {
      const { voice, speed, pitch, volume, language } = req.body;
      const { blogId } = req.params;

      const blog = await Blog.findById(blogId);
      if (!blog) {
        return res.status(404).json({ message: 'Blog not found' });
      }

      // Check authorization
      if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Forbidden' });
      }

      // Update TTS options
      blog.ttsOptions = {
        voice: voice || blog.ttsOptions?.voice || 'default',
        speed: speed || blog.ttsOptions?.speed || 1.0,
        pitch: pitch || blog.ttsOptions?.pitch || 1.0,
        language: language || blog.ttsOptions?.language || 'en'
      };

      await blog.save();

      logger.info('Voice customization updated', {
        userId: req.user.id,
        blogId: blog._id,
        ttsOptions: blog.ttsOptions
      });

      res.json({
        success: true,
        message: 'Voice customization updated',
        ttsOptions: blog.ttsOptions
      });

    } catch (error) {
      logger.error('Voice customization failed:', error);
      res.status(500).json({ 
        message: 'Voice customization failed',
        error: error.message 
      });
    }
  }

  // STT Endpoints
  async transcribeAudio(req, res) {
    try {
      const { language, format } = req.body;
      const audioBuffer = req.file?.buffer;

      if (!audioBuffer) {
        return res.status(400).json({ 
          message: 'Audio file is required' 
        });
      }

      // Validate audio file
      const validation = this.sttService.validateAudioFile(audioBuffer);
      if (!validation.isValid) {
        return res.status(400).json({ 
          message: 'Invalid audio file',
          errors: validation.errors 
        });
      }

      // Process audio file
      const result = await this.sttService.processAudioFile(audioBuffer, {
        language: language || 'en-US',
        format: format || 'wav',
        userId: req.user.id
      });

      logger.info('Audio transcription initiated', {
        userId: req.user.id,
        audioFile: result.config.audioFile,
        transcriptUrl: result.transcriptUrl
      });

      res.json({
        success: true,
        message: 'Audio transcription initiated',
        audioUrl: result.audioUrl,
        transcriptUrl: result.transcriptUrl,
        config: result.config
      });

    } catch (error) {
      logger.error('Audio transcription failed:', error);
      res.status(500).json({ 
        message: 'Audio transcription failed',
        error: error.message 
      });
    }
  }

  async transcribeFile(req, res) {
    try {
      const { language, format, filename } = req.body;
      const audioBuffer = req.file?.buffer;

      if (!audioBuffer) {
        return res.status(400).json({ 
          message: 'Audio file is required' 
        });
      }

      // Process audio file
      const result = await this.sttService.processAudioFile(audioBuffer, {
        language: language || 'en-US',
        format: format || 'wav',
        filename: filename || null,
        userId: req.user.id
      });

      logger.info('File transcription processed', {
        userId: req.user.id,
        audioFile: result.config.audioFile,
        transcriptUrl: result.transcriptUrl
      });

      res.json({
        success: true,
        message: 'File transcription processed',
        audioUrl: result.audioUrl,
        transcriptUrl: result.transcriptUrl,
        config: result.config
      });

    } catch (error) {
      logger.error('File transcription failed:', error);
      res.status(500).json({ 
        message: 'File transcription failed',
        error: error.message 
      });
    }
  }

  async getTranscription(req, res) {
    try {
      const { transcriptId } = req.params;
      const transcription = await this.sttService.getTranscription(transcriptId);

      res.json({
        success: true,
        transcription
      });

    } catch (error) {
      logger.error('Failed to get transcription:', error);
      res.status(500).json({ 
        message: 'Failed to get transcription',
        error: error.message 
      });
    }
  }

  async getUserTranscriptions(req, res) {
    try {
      const { limit = 50 } = req.query;
      const transcriptions = await this.sttService.getUserTranscriptions(
        req.user.id, 
        parseInt(limit)
      );

      res.json({
        success: true,
        transcriptions,
        count: transcriptions.length
      });

    } catch (error) {
      logger.error('Failed to get user transcriptions:', error);
      res.status(500).json({ 
        message: 'Failed to get user transcriptions',
        error: error.message 
      });
    }
  }

  async getAvailableLanguages(req, res) {
    try {
      const languages = this.sttService.getAvailableLanguages();

      res.json({
        success: true,
        languages,
        count: languages.length
      });

    } catch (error) {
      logger.error('Failed to get available languages:', error);
      res.status(500).json({ 
        message: 'Failed to get available languages',
        error: error.message 
      });
    }
  }

  // Summary Endpoints
  async generateSummary(req, res) {
    try {
      const { content, maxLength, style, includeKeyPoints, language } = req.body;
      const { blogId } = req.params;

      if (!content && !blogId) {
        return res.status(400).json({ 
          message: 'Either content or blogId is required' 
        });
      }

      let blogContent = content;
      let blog = null;

      // If blogId is provided, get content from blog
      if (blogId) {
        blog = await Blog.findById(blogId);
        if (!blog) {
          return res.status(404).json({ message: 'Blog not found' });
        }

        // Check authorization
        if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }

        blogContent = blog.content;
      }

      // Generate summary
      const summary = await this.summaryService.generateSummary(blogContent, {
        maxLength: maxLength || 150,
        style: style || 'concise',
        includeKeyPoints: includeKeyPoints !== false,
        language: language || 'en'
      });

      // Update blog if blogId was provided
      if (blog) {
        blog.aiSummary = summary.summary;
        blog.keyPoints = summary.keyPoints;
        blog.readingTime = summary.readingTime;
        await blog.save();

        logger.info('AI summary generated for blog', {
          userId: req.user.id,
          blogId: blog._id,
          summaryLength: summary.summary.length,
          keyPointsCount: summary.keyPoints.length
        });
      }

      res.json({
        success: true,
        summary: summary.summary,
        keyPoints: summary.keyPoints,
        readingTime: summary.readingTime,
        confidence: summary.confidence,
        metadata: summary.metadata
      });

    } catch (error) {
      logger.error('AI summary generation failed:', error);
      res.status(500).json({ 
        message: 'AI summary generation failed',
        error: error.message 
      });
    }
  }

  async generateKeyPoints(req, res) {
    try {
      const { content, maxPoints, minLength, maxLength } = req.body;
      const { blogId } = req.params;

      if (!content && !blogId) {
        return res.status(400).json({ 
          message: 'Either content or blogId is required' 
        });
      }

      let blogContent = content;

      // If blogId is provided, get content from blog
      if (blogId) {
        const blog = await Blog.findById(blogId);
        if (!blog) {
          return res.status(404).json({ message: 'Blog not found' });
        }

        // Check authorization
        if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }

        blogContent = blog.content;
      }

      // Generate key points
      const keyPoints = await this.summaryService.generateKeyPoints(blogContent, {
        maxPoints: maxPoints || 5,
        minLength: minLength || 10,
        maxLength: maxLength || 100
      });

      res.json({
        success: true,
        keyPoints,
        count: keyPoints.length
      });

    } catch (error) {
      logger.error('Key points generation failed:', error);
      res.status(500).json({ 
        message: 'Key points generation failed',
        error: error.message 
      });
    }
  }

  async generateTLDR(req, res) {
    try {
      const { content, maxLength, style } = req.body;
      const { blogId } = req.params;

      if (!content && !blogId) {
        return res.status(400).json({ 
          message: 'Either content or blogId is required' 
        });
      }

      let blogContent = content;

      // If blogId is provided, get content from blog
      if (blogId) {
        const blog = await Blog.findById(blogId);
        if (!blog) {
          return res.status(404).json({ message: 'Blog not found' });
        }

        // Check authorization
        if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }

        blogContent = blog.content;
      }

      // Generate TL;DR
      const tldr = await this.summaryService.generateTLDR(blogContent, {
        maxLength: maxLength || 100,
        style: style || 'casual'
      });

      res.json({
        success: true,
        tldr: tldr.tldr,
        originalLength: tldr.originalLength,
        tldrLength: tldr.tldrLength,
        compressionRatio: tldr.compressionRatio
      });

    } catch (error) {
      logger.error('TL;DR generation failed:', error);
      res.status(500).json({ 
        message: 'TL;DR generation failed',
        error: error.message 
      });
    }
  }

  // Analysis Endpoints
  async analyzeContent(req, res) {
    try {
      const { content, includeSentiment, includeTopics, includeReadability, includeSEO, includeSuggestions } = req.body;
      const { blogId } = req.params;

      if (!content && !blogId) {
        return res.status(400).json({ 
          message: 'Either content or blogId is required' 
        });
      }

      let blogContent = content;
      let blog = null;

      // If blogId is provided, get content from blog
      if (blogId) {
        blog = await Blog.findById(blogId);
        if (!blog) {
          return res.status(404).json({ message: 'Blog not found' });
        }

        // Check authorization
        if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }

        blogContent = blog.content;
      }

      // Analyze content
      const analysis = await this.analyzerService.analyzeContent(blogContent, {
        includeSentiment: includeSentiment !== false,
        includeTopics: includeTopics !== false,
        includeReadability: includeReadability !== false,
        includeSEO: includeSEO !== false,
        includeSuggestions: includeSuggestions !== false
      });

      logger.info('Content analysis completed', {
        userId: req.user.id,
        blogId: blog?._id,
        analysisTypes: Object.keys(analysis).filter(key => 
          key !== 'timestamp' && key !== 'contentLength' && key !== 'wordCount'
        )
      });

      res.json({
        success: true,
        analysis
      });

    } catch (error) {
      logger.error('Content analysis failed:', error);
      res.status(500).json({ 
        message: 'Content analysis failed',
        error: error.message 
      });
    }
  }

  async analyzeSentiment(req, res) {
    try {
      const { content } = req.body;
      const { blogId } = req.params;

      if (!content && !blogId) {
        return res.status(400).json({ 
          message: 'Either content or blogId is required' 
        });
      }

      let blogContent = content;

      // If blogId is provided, get content from blog
      if (blogId) {
        const blog = await Blog.findById(blogId);
        if (!blog) {
          return res.status(404).json({ message: 'Blog not found' });
        }

        // Check authorization
        if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }

        blogContent = blog.content;
      }

      // Analyze sentiment
      const sentiment = await this.analyzerService.analyzeSentiment(blogContent);

      res.json({
        success: true,
        sentiment
      });

    } catch (error) {
      logger.error('Sentiment analysis failed:', error);
      res.status(500).json({ 
        message: 'Sentiment analysis failed',
        error: error.message 
      });
    }
  }

  async analyzeSEO(req, res) {
    try {
      const { content } = req.body;
      const { blogId } = req.params;

      if (!content && !blogId) {
        return res.status(400).json({ 
          message: 'Either content or blogId is required' 
        });
      }

      let blogContent = content;

      // If blogId is provided, get content from blog
      if (blogId) {
        const blog = await Blog.findById(blogId);
        if (!blog) {
          return res.status(404).json({ message: 'Blog not found' });
        }

        // Check authorization
        if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
          return res.status(403).json({ message: 'Forbidden' });
        }

        blogContent = blog.content;
      }

      // Analyze SEO
      const seo = await this.analyzerService.analyzeSEO(blogContent);

      res.json({
        success: true,
        seo
      });

    } catch (error) {
      logger.error('SEO analysis failed:', error);
      res.status(500).json({ 
        message: 'SEO analysis failed',
        error: error.message 
      });
    }
  }

  // Utility endpoints
  async getContentStats(req, res) {
    try {
      const { content } = req.body;
      const { blogId } = req.params;

      if (!content && !blogId) {
        return res.status(400).json({ 
          message: 'Either content or blogId is required' 
        });
      }

      let blogContent = content;

      // If blogId is provided, get content from blog
      if (blogId) {
        const blog = await Blog.findById(blogId);
        if (!blog) {
          return res.status(404).json({ message: 'Blog not found' });
        }

        blogContent = blog.content;
      }

      // Get content stats
      const stats = this.summaryService.getContentStats(blogContent);

      res.json({
        success: true,
        stats
      });

    } catch (error) {
      logger.error('Content stats failed:', error);
      res.status(500).json({ 
        message: 'Content stats failed',
        error: error.message 
      });
    }
  }
}

module.exports = new AIController(); 