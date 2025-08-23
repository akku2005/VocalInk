const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../src/app');
const TTSService = require('../src/services/TTSService');
const AISummaryService = require('../src/services/AISummaryService');
const AIAnalyzerService = require('../src/services/AIAnalyzerService');
// const AINotificationService = require('../src/services/AINotificationService');
const TTSQueueService = require('../src/services/TTSQueueService');
const TTSWorkerService = require('../src/services/TTSWorkerService');
const User = require('../src/models/user.model');
const JWTService = require('../src/services/JWTService');

// Import test configuration
require('./test-config');

describe('AI Services', () => {
  let testUser, authToken, ttsService, summaryService, analyzerService, notificationService;

  const sampleContent = `
    Artificial Intelligence (AI) is transforming the way we live and work. From virtual assistants to autonomous vehicles, AI technologies are becoming increasingly integrated into our daily lives.

    Machine learning, a subset of AI, enables computers to learn and improve from experience without being explicitly programmed. This technology powers recommendation systems, fraud detection, and natural language processing.

    Deep learning, a more advanced form of machine learning, uses neural networks with multiple layers to process complex patterns. It has revolutionized fields like computer vision, speech recognition, and natural language understanding.

    The future of AI holds tremendous potential. As these technologies continue to evolve, they will create new opportunities and challenges for society. It's crucial that we develop AI responsibly, ensuring it benefits humanity while addressing potential risks.

    Companies worldwide are investing heavily in AI research and development. From tech giants to startups, organizations are leveraging AI to improve efficiency, enhance customer experiences, and drive innovation.
  `;

  beforeAll(async () => {
    // Create test user
    testUser = await User.create({
      name: 'AI Test User',
      email: 'ai-test@example.com',
      password: 'password123',
      role: 'writer',
      isVerified: true
    });

    // Generate auth token
    authToken = JWTService.generateAccessToken({
      userId: testUser._id.toString(),
      email: testUser.email,
      role: testUser.role
    });

    // Initialize services
    ttsService = new TTSService();
    summaryService = new AISummaryService();
    analyzerService = new AIAnalyzerService();
    // notificationService = new AINotificationService();
  });

  afterAll(async () => {
    // Cleanup handled in setup.js
  });

  describe('TTS Service', () => {
    describe('Direct TTS Generation', () => {
      it('should generate speech with eSpeak provider', async () => {
        const result = await ttsService.generateSpeech('Hello, this is a test.', {
          provider: 'espeak',
          voice: 'en',
          speed: 150
        });

        expect(result).toHaveProperty('url');
        expect(result).toHaveProperty('provider');
        expect(result).toHaveProperty('duration');
        expect(result.provider).toBe('espeak');
        expect(result.url).toMatch(/\.(mp3|wav|ogg)$/);
      }, 30000);

      it('should handle TTS generation errors gracefully', async () => {
        await expect(
          ttsService.generateSpeech('', { provider: 'espeak' })
        ).rejects.toThrow();
      });

      it('should validate input parameters', async () => {
        await expect(
          ttsService.generateSpeech(null, { provider: 'espeak' })
        ).rejects.toThrow();
      });
    });

    describe('TTS Queue System', () => {
      let queueService;

      beforeAll(async () => {
        queueService = new TTSQueueService();
        await queueService.initialize();
      });

      afterAll(async () => {
        if (queueService) {
          await queueService.shutdown();
        }
      });

      it('should add TTS job to queue', async () => {
        const jobResult = await queueService.addTTSJob(
          'Test text for queue processing',
          { provider: 'espeak', voice: 'en' },
          testUser._id.toString()
        );

        expect(jobResult).toHaveProperty('jobId');
        expect(jobResult).toHaveProperty('idempotencyKey');
        expect(jobResult).toHaveProperty('status');
        expect(jobResult.status).toBe('queued');
      });

      it('should handle duplicate requests with idempotency', async () => {
        const text = 'Duplicate test text';
        const options = { provider: 'espeak', voice: 'en' };
        const userId = testUser._id.toString();

        const job1 = await queueService.addTTSJob(text, options, userId);
        const job2 = await queueService.addTTSJob(text, options, userId);

        expect(job1.jobId).toBe(job2.jobId);
        expect(job2.status).toBe('duplicate');
      });

      it('should get job status', async () => {
        const jobResult = await queueService.addTTSJob(
          'Status test text',
          { provider: 'espeak' },
          testUser._id.toString()
        );

        const status = await queueService.getJobStatus(jobResult.jobId);
        expect(status).toHaveProperty('jobId');
        expect(status).toHaveProperty('status');
      });

      it('should get queue statistics', async () => {
        const stats = await queueService.getQueueStats();
        expect(stats).toHaveProperty('waiting');
        expect(stats).toHaveProperty('active');
        expect(stats).toHaveProperty('completed');
        expect(stats).toHaveProperty('failed');
        expect(stats).toHaveProperty('total');
      });
    });

    describe('TTS Worker Service', () => {
      let workerService, queueService;

      beforeAll(async () => {
        queueService = new TTSQueueService();
        await queueService.initialize();
        workerService = new TTSWorkerService(queueService);
        await workerService.start();
      });

      afterAll(async () => {
        if (workerService) {
          await workerService.stop();
        }
        if (queueService) {
          await queueService.shutdown();
        }
      });

      it('should process TTS jobs', async () => {
        const jobResult = await queueService.addTTSJob(
          'Worker test text',
          { provider: 'espeak', voice: 'en' },
          testUser._id.toString()
        );

        // Wait for job to be processed
        await new Promise(resolve => setTimeout(resolve, 5000));

        const status = await queueService.getJobStatus(jobResult.jobId);
        expect(['completed', 'failed', 'active']).toContain(status.status);
      }, 15000);

      it('should handle worker statistics', () => {
        const stats = workerService.getWorkerStats();
        expect(stats).toHaveProperty('processingJobs');
        expect(stats).toHaveProperty('maxConcurrentJobs');
        expect(stats).toHaveProperty('activeJobs');
      });
    });
  });

  describe('AI Summary Service', () => {
    describe('Summary Generation', () => {
      it('should generate summary with key points', async () => {
        const result = await summaryService.generateSummary(sampleContent, {
          maxLength: 150,
          style: 'concise',
          includeKeyPoints: true
        });

        expect(result).toHaveProperty('summary');
        expect(result).toHaveProperty('keyPoints');
        expect(result).toHaveProperty('readingTime');
        expect(result).toHaveProperty('confidence');
        expect(result.summary.length).toBeLessThanOrEqual(150);
        expect(Array.isArray(result.keyPoints)).toBe(true);
        expect(result.keyPoints.length).toBeGreaterThan(0);
      }, 30000);

      it('should generate TL;DR version', async () => {
        const result = await summaryService.generateTLDR(sampleContent, {
          maxLength: 100,
          style: 'casual'
        });

        expect(result).toHaveProperty('tldr');
        expect(result).toHaveProperty('compressionRatio');
        expect(result.tldr.length).toBeLessThanOrEqual(100);
        expect(result.compressionRatio).toBeGreaterThan(0);
      }, 30000);

      it('should handle different summary styles', async () => {
        const styles = ['concise', 'detailed', 'casual', 'professional'];
        
        for (const style of styles) {
          const result = await summaryService.generateSummary(sampleContent, {
            maxLength: 200,
            style: style
          });

          expect(result).toHaveProperty('summary');
          expect(result.summary.length).toBeGreaterThan(0);
        }
      }, 60000);

      it('should handle empty content', async () => {
        await expect(
          summaryService.generateSummary('', { maxLength: 100 })
        ).rejects.toThrow();
      });
    });

    describe('Smart Summaries', () => {
      it('should generate smart summaries with different types', async () => {
        const result = await summaryService.generateSmartSummaries(sampleContent, {
          includeExecutive: true,
          includeTechnical: true,
          includeActionItems: true
        });

        expect(result).toHaveProperty('executive');
        expect(result).toHaveProperty('technical');
        expect(result).toHaveProperty('actionItems');
        expect(result.executive.length).toBeGreaterThan(0);
        expect(result.technical.length).toBeGreaterThan(0);
        expect(Array.isArray(result.actionItems)).toBe(true);
      }, 30000);
    });
  });

  describe('AI Analyzer Service', () => {
    describe('Content Analysis', () => {
      it('should perform comprehensive content analysis', async () => {
        const result = await analyzerService.analyzeContent(sampleContent, {
          includeSentiment: true,
          includeTopics: true,
          includeReadability: true,
          includeSEO: true,
          includeSuggestions: true
        });

        expect(result).toHaveProperty('sentiment');
        expect(result).toHaveProperty('topics');
        expect(result).toHaveProperty('readability');
        expect(result).toHaveProperty('seo');
        expect(result).toHaveProperty('suggestions');

        expect(result.sentiment).toHaveProperty('sentiment');
        expect(result.sentiment).toHaveProperty('intensity');
        expect(result.sentiment).toHaveProperty('confidence');

        expect(result.readability).toHaveProperty('readabilityLevel');
        expect(result.readability).toHaveProperty('score');

        expect(result.seo).toHaveProperty('seoScore');
        expect(result.seo).toHaveProperty('keywords');

        expect(Array.isArray(result.suggestions)).toBe(true);
      }, 30000);

      it('should analyze sentiment correctly', async () => {
        const positiveText = 'This is amazing! I love this technology.';
        const negativeText = 'This is terrible. I hate this.';

        const positiveResult = await analyzerService.analyzeSentiment(positiveText);
        const negativeResult = await analyzerService.analyzeSentiment(negativeText);

        expect(positiveResult.sentiment).toBe('positive');
        expect(negativeResult.sentiment).toBe('negative');
      }, 30000);

      it('should extract topics from content', async () => {
        const result = await analyzerService.extractTopics(sampleContent, {
          maxTopics: 5,
          minConfidence: 0.5
        });

        expect(Array.isArray(result.topics)).toBe(true);
        expect(result.topics.length).toBeLessThanOrEqual(5);
        expect(result.topics.every(topic => topic.confidence >= 0.5)).toBe(true);
      }, 30000);

      it('should calculate readability metrics', async () => {
        const result = await analyzerService.calculateReadability(sampleContent);

        expect(result).toHaveProperty('readabilityLevel');
        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('metrics');
        expect(result.metrics).toHaveProperty('words');
        expect(result.metrics).toHaveProperty('sentences');
        expect(result.metrics).toHaveProperty('syllables');
      });

      it('should generate SEO analysis', async () => {
        const result = await analyzerService.analyzeSEO(sampleContent, {
          targetKeywords: ['AI', 'machine learning'],
          includeSuggestions: true
        });

        expect(result).toHaveProperty('seoScore');
        expect(result).toHaveProperty('keywords');
        expect(result).toHaveProperty('suggestions');
        expect(result.seoScore).toBeGreaterThanOrEqual(0);
        expect(result.seoScore).toBeLessThanOrEqual(100);
      }, 30000);
    });

    describe('Content Quality Assessment', () => {
      it('should assess content quality', async () => {
        const result = await analyzerService.assessContentQuality(sampleContent, {
          includeMetrics: true,
          includeSuggestions: true
        });

        expect(result).toHaveProperty('qualityScore');
        expect(result).toHaveProperty('metrics');
        expect(result).toHaveProperty('suggestions');
        expect(result.qualityScore).toBeGreaterThanOrEqual(0);
        expect(result.qualityScore).toBeLessThanOrEqual(100);
      }, 30000);
    });
  });

  describe('AI Notification Service', () => {
    describe('Intelligent Notifications', () => {
      it('should predict optimal notification timing', async () => {
        const result = await notificationService.predictOptimalTiming(
          testUser._id.toString(),
          'badge_earned',
          {
            timezone: 'UTC',
            urgency: 'normal'
          }
        );

        expect(result).toHaveProperty('optimalTime');
        expect(result).toHaveProperty('confidence');
        expect(result).toHaveProperty('reasoning');
        expect(result.optimalTime instanceof Date).toBe(true);
      }, 30000);

      it('should personalize notification content', async () => {
        const notificationData = {
          title: 'Congratulations!',
          content: 'You have earned a new badge.',
          type: 'badge_earned'
        };

        const result = await notificationService.personalizeNotification(
          testUser._id.toString(),
          notificationData,
          {
            includePersonalization: true,
            includeRecommendations: true
          }
        );

        expect(result).toHaveProperty('personalizedTitle');
        expect(result).toHaveProperty('personalizedContent');
        expect(result).toHaveProperty('recommendations');
        expect(result.personalizedTitle).not.toBe(notificationData.title);
      }, 30000);

      it('should predict notification engagement', async () => {
        const notificationData = {
          title: 'Test notification',
          content: 'This is a test notification.',
          type: 'system'
        };

        const result = await notificationService.predictEngagement(
          testUser._id.toString(),
          notificationData
        );

        expect(result).toHaveProperty('score');
        expect(result).toHaveProperty('factors');
        expect(result.score).toBeGreaterThanOrEqual(0);
        expect(result.score).toBeLessThanOrEqual(1);
      }, 30000);

      it('should send intelligent notification', async () => {
        const notificationData = {
          title: 'Intelligent Test',
          content: 'This is an intelligent notification test.',
          type: 'system'
        };

        const result = await notificationService.sendIntelligentNotification(
          testUser._id.toString(),
          notificationData,
          {
            predictTiming: true,
            personalize: true,
            predictEngagement: true,
            includeSummary: true
          }
        );

        expect(result).toHaveProperty('notification');
        expect(result).toHaveProperty('timing');
        expect(result).toHaveProperty('engagementPrediction');
      }, 30000);
    });
  });

  describe('AI API Endpoints', () => {
    describe('POST /api/ai/summarize', () => {
      it('should generate summary via API', async () => {
        const response = await request(app)
          .post('/api/ai/summarize')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: sampleContent,
            options: {
              maxLength: 150,
              style: 'concise',
              includeKeyPoints: true
            }
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('summary');
        expect(response.body.data).toHaveProperty('keyPoints');
      });

      it('should validate input content', async () => {
        await request(app)
          .post('/api/ai/summarize')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: '',
            options: { maxLength: 100 }
          })
          .expect(400);
      });
    });

    describe('POST /api/ai/analyze', () => {
      it('should analyze content via API', async () => {
        const response = await request(app)
          .post('/api/ai/analyze')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: sampleContent,
            options: {
              includeSentiment: true,
              includeTopics: true,
              includeReadability: true
            }
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('sentiment');
        expect(response.body.data).toHaveProperty('topics');
        expect(response.body.data).toHaveProperty('readability');
      });
    });

    describe('POST /api/ai/tts', () => {
      it('should generate TTS via API', async () => {
        const response = await request(app)
          .post('/api/ai/tts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            text: 'Hello, this is a TTS test.',
            options: {
              provider: 'espeak',
              voice: 'en',
              speed: 150
            }
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('url');
        expect(response.body.data).toHaveProperty('provider');
      }, 30000);

      it('should handle TTS queue when enabled', async () => {
        const response = await request(app)
          .post('/api/ai/tts')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            text: 'Queue test text',
            options: {
              provider: 'espeak',
              useQueue: true
            }
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('jobId');
        expect(response.body.data).toHaveProperty('status');
      });
    });

    describe('POST /api/ai/notifications/predict-timing', () => {
      it('should predict notification timing via API', async () => {
        const response = await request(app)
          .post('/api/ai/notifications/predict-timing')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            notificationType: 'badge_earned',
            timezone: 'UTC',
            urgency: 'normal'
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('optimalTime');
        expect(response.body.data).toHaveProperty('confidence');
      });
    });

    describe('POST /api/ai/notifications/personalize', () => {
      it('should personalize notification via API', async () => {
        const response = await request(app)
          .post('/api/ai/notifications/personalize')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            template: {
              title: 'Test notification',
              content: 'This is a test notification.'
            },
            notificationType: 'system',
            includePersonalization: true,
            includeRecommendations: true
          })
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('personalizedTitle');
        expect(response.body.data).toHaveProperty('personalizedContent');
      });
    });
  });

  describe('AI Service Health and Status', () => {
    describe('GET /api/ai/status', () => {
      it('should return AI service status', async () => {
        const response = await request(app)
          .get('/api/ai/status')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('services');
        expect(response.body.data).toHaveProperty('providers');
        expect(response.body.data).toHaveProperty('queue');
      });
    });

    describe('GET /api/ai/tts/status', () => {
      it('should return TTS service status', async () => {
        const response = await request(app)
          .get('/api/ai/tts/status')
          .set('Authorization', `Bearer ${authToken}`)
          .expect(200);

        expect(response.body.success).toBe(true);
        expect(response.body.data).toHaveProperty('providers');
        expect(response.body.data).toHaveProperty('queue');
        expect(response.body.data).toHaveProperty('workers');
      });
    });
  });

  describe('Error Handling and Edge Cases', () => {
    it('should handle API rate limiting', async () => {
      const requests = Array(10).fill().map(() =>
        request(app)
          .post('/api/ai/summarize')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            content: sampleContent,
            options: { maxLength: 100 }
          })
      );

      const responses = await Promise.all(requests);
      const rateLimited = responses.some(res => res.status === 429);
      
      // At least one request should be rate limited
      expect(rateLimited).toBe(true);
    });

    it('should handle invalid authentication', async () => {
      await request(app)
        .post('/api/ai/summarize')
        .send({
          content: sampleContent,
          options: { maxLength: 100 }
        })
        .expect(401);
    });

    it('should handle malformed requests', async () => {
      await request(app)
        .post('/api/ai/summarize')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          invalidField: 'invalid value'
        })
        .expect(400);
    });
  });
}); 