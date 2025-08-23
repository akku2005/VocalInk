# VocalInk AI Implementation Documentation

## Overview

VocalInk now includes a comprehensive AI system with **completely free** services for:
- **Text-to-Speech (TTS)** - Convert text to audio
- **Speech-to-Text (STT)** - Convert audio to text
- **AI Summary** - Generate summaries and key points
- **AI Analyzer** - Content analysis, sentiment, SEO, and more

## 🆓 Free AI Services Used

### Text-to-Speech (TTS)
- **eSpeak** - Local command-line TTS (primary)
- **gTTS (Google Text-to-Speech)** - Web-based TTS (backup)
- **ResponsiveVoice.js** - Client-side TTS (web-based)

### Speech-to-Text (STT)
- **Web Speech API** - Browser-based speech recognition
- **Local file processing** - Server-side audio file handling

### AI Summary & Analysis
- **Natural.js** - NLP library for text processing
- **TF-IDF** - Keyword extraction and analysis
- **Sentiment Analysis** - Emotional tone detection
- **Readability Scoring** - Flesch Reading Ease
- **SEO Analysis** - Content optimization

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd server
npm install
```

### 2. Install eSpeak (for TTS)

**Windows:**
```bash
# Download from: http://espeak.sourceforge.net/download.html
# Or use chocolatey:
choco install espeak
```

**macOS:**
```bash
brew install espeak
```

**Linux (Ubuntu/Debian):**
```bash
sudo apt-get install espeak
```

**Linux (CentOS/RHEL):**
```bash
sudo yum install espeak
```

### 3. Start the Server

```bash
npm run dev
```

The AI endpoints will be available at `/api/ai/*`

## 📁 File Structure

```
server/src/
├── ai/
│   ├── ai.controller.js    # AI endpoints controller
│   └── ai.routes.js        # AI routes and validation
├── services/
│   ├── TTSService.js       # Text-to-Speech service
│   ├── STTService.js       # Speech-to-Text service
│   ├── AISummaryService.js # Summary generation service
│   └── AIAnalyzerService.js # Content analysis service
├── middleware/
│   └── aiRateLimiter.js    # AI-specific rate limiting
└── models/
    ├── blog.model.js       # Updated with AI fields
    └── user.model.js       # Updated with AI preferences
```

## 🔧 Configuration

### Environment Variables

Add these to your `.env` file:

```bash
# AI Rate Limits (requests per hour)
AI_RATE_LIMIT_PER_HOUR=100
TTS_RATE_LIMIT_PER_HOUR=50
STT_RATE_LIMIT_PER_HOUR=30
SUMMARY_RATE_LIMIT_PER_HOUR=100
ANALYSIS_RATE_LIMIT_PER_HOUR=200
FILE_UPLOAD_RATE_LIMIT_PER_HOUR=20

# Audio Storage
AUDIO_STORAGE_PATH=./public/audio
MAX_AUDIO_FILE_SIZE=10485760  # 10MB

# AI Service Limits
AI_MAX_CONTENT_LENGTH=10000
AI_CACHE_DURATION=3600
```

## 📚 API Endpoints

### Text-to-Speech (TTS)

#### Generate TTS from Text
```http
POST /api/ai/tts/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "text": "Hello, this is a test message",
  "provider": "espeak",
  "voice": "en",
  "speed": 150,
  "language": "en"
}
```

#### Generate TTS from Blog
```http
POST /api/ai/tts/generate/:blogId
Content-Type: application/json
Authorization: Bearer <token>

{
  "provider": "espeak",
  "voice": "en",
  "speed": 150
}
```

#### Get Available Voices
```http
GET /api/ai/tts/voices?provider=espeak
Authorization: Bearer <token>
```

#### Customize Voice Settings
```http
POST /api/ai/tts/customize/:blogId
Content-Type: application/json
Authorization: Bearer <token>

{
  "voice": "en+f2",
  "speed": 1.2,
  "pitch": 1.1,
  "volume": 0.9
}
```

### Speech-to-Text (STT)

#### Transcribe Audio File
```http
POST /api/ai/stt/transcribe
Content-Type: multipart/form-data
Authorization: Bearer <token>

Form Data:
- audio: <audio_file>
- language: en-US
- format: wav
```

#### Get Transcription
```http
GET /api/ai/stt/transcription/:transcriptId
Authorization: Bearer <token>
```

#### Get User Transcriptions
```http
GET /api/ai/stt/transcriptions?limit=50
Authorization: Bearer <token>
```

#### Get Available Languages
```http
GET /api/ai/stt/languages
Authorization: Bearer <token>
```

### AI Summary

#### Generate Summary
```http
POST /api/ai/summary/generate
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Your long content here...",
  "maxLength": 150,
  "style": "concise",
  "includeKeyPoints": true,
  "language": "en"
}
```

#### Generate Summary from Blog
```http
POST /api/ai/summary/generate/:blogId
Content-Type: application/json
Authorization: Bearer <token>

{
  "maxLength": 150,
  "style": "concise"
}
```

#### Generate Key Points
```http
POST /api/ai/summary/key-points
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Your content here...",
  "maxPoints": 5,
  "minLength": 10,
  "maxLength": 100
}
```

#### Generate TL;DR
```http
POST /api/ai/summary/tldr
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Your content here...",
  "maxLength": 100,
  "style": "casual"
}
```

### AI Analysis

#### Comprehensive Content Analysis
```http
POST /api/ai/analyze/content
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Your content here...",
  "includeSentiment": true,
  "includeTopics": true,
  "includeReadability": true,
  "includeSEO": true,
  "includeSuggestions": true
}
```

#### Sentiment Analysis
```http
POST /api/ai/analyze/sentiment
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Your content here..."
}
```

#### SEO Analysis
```http
POST /api/ai/analyze/seo
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Your content here..."
}
```

#### Content Statistics
```http
POST /api/ai/stats/content
Content-Type: application/json
Authorization: Bearer <token>

{
  "content": "Your content here..."
}
```

## 📊 Response Examples

### TTS Response
```json
{
  "success": true,
  "ttsUrl": "/audio/espeak-1234567890-abc123.wav",
  "provider": "espeak",
  "duration": 45,
  "metadata": {
    "contentLength": 150,
    "wordCount": 25
  }
}
```

### Summary Response
```json
{
  "success": true,
  "summary": "This is a concise summary of the content...",
  "keyPoints": [
    "Key point 1",
    "Key point 2",
    "Key point 3"
  ],
  "readingTime": 3,
  "confidence": 0.85,
  "metadata": {
    "originalWordCount": 500,
    "summaryWordCount": 25,
    "compressionRatio": 0.05,
    "style": "concise",
    "language": "en"
  }
}
```

### Analysis Response
```json
{
  "success": true,
  "analysis": {
    "timestamp": "2024-01-01T12:00:00.000Z",
    "contentLength": 1500,
    "wordCount": 250,
    "sentiment": {
      "score": 2.5,
      "sentiment": "positive",
      "intensity": "medium",
      "emotionalTone": {
        "dominant": "joy",
        "score": 3,
        "allScores": { "joy": 3, "trust": 2, "anticipation": 1 }
      },
      "confidence": 0.9
    },
    "topics": {
      "primaryTopics": [
        { "word": "technology", "frequency": 15, "percentage": 6.0 },
        { "word": "innovation", "frequency": 12, "percentage": 4.8 }
      ],
      "categories": {
        "technology": [
          { "word": "technology", "frequency": 15, "percentage": 6.0 }
        ]
      },
      "topicDiversity": 0.75
    },
    "readability": {
      "fleschReadingEase": 72.5,
      "fleschKincaidGrade": 8.2,
      "readabilityLevel": "high school",
      "averageWordsPerSentence": 18.5,
      "averageSyllablesPerWord": 1.4,
      "sentenceCount": 13,
      "wordCount": 250,
      "syllableCount": 350
    },
    "seo": {
      "keywordDensity": [
        { "keyword": "technology", "count": 15, "density": 6.0 }
      ],
      "seoScore": 85,
      "issues": [],
      "recommendations": [
        "Consider adding more headings to improve structure"
      ]
    },
    "suggestions": [
      "Consider adding more emotional language to engage readers",
      "Content is well-structured and readable"
    ]
  }
}
```

## 🔒 Security & Rate Limiting

### Rate Limits
- **General AI**: 100 requests/hour
- **TTS**: 50 requests/hour
- **STT**: 30 requests/hour
- **Summary**: 100 requests/hour
- **Analysis**: 200 requests/hour
- **File Upload**: 20 requests/hour

### Authentication
All AI endpoints require authentication via JWT token:
```http
Authorization: Bearer <your_jwt_token>
```

### File Upload Security
- Maximum file size: 10MB
- Allowed formats: wav, mp3, ogg, m4a
- File type validation
- Virus scanning (recommended for production)

## 🛠️ Development

### Adding New AI Providers

1. **TTS Provider**:
```javascript
// In TTSService.js
async generateWithNewProvider(text, options) {
  // Implementation
  return {
    url: audioUrl,
    path: audioPath,
    provider: 'newprovider',
    duration: estimatedDuration
  };
}
```

2. **STT Provider**:
```javascript
// In STTService.js
async transcribeWithNewProvider(audioBuffer, options) {
  // Implementation
  return {
    text: transcribedText,
    confidence: confidenceScore,
    alternatives: alternativeTranscriptions
  };
}
```

### Testing AI Features

```bash
# Test TTS
curl -X POST http://localhost:5000/api/ai/tts/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"text": "Hello world", "provider": "espeak"}'

# Test Summary
curl -X POST http://localhost:5000/api/ai/summary/generate \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Your long content here...", "maxLength": 150}'

# Test Analysis
curl -X POST http://localhost:5000/api/ai/analyze/content \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{"content": "Your content here...", "includeSentiment": true}'
```

## 🚀 Production Deployment

### Requirements
1. **eSpeak** installed on server
2. **Node.js** 16+ with sufficient memory
3. **MongoDB** for data storage
4. **File system** access for audio storage

### Environment Setup
```bash
# Production environment variables
NODE_ENV=production
AI_RATE_LIMIT_PER_HOUR=50
TTS_RATE_LIMIT_PER_HOUR=25
STT_RATE_LIMIT_PER_HOUR=15
MAX_AUDIO_FILE_SIZE=5242880  # 5MB for production
```

### Monitoring
- Monitor AI service usage
- Track rate limit violations
- Monitor file storage usage
- Set up alerts for service failures

### Scaling Considerations
- Use CDN for audio file delivery
- Implement caching for AI results
- Consider Redis for session management
- Monitor memory usage for NLP processing

## 🐛 Troubleshooting

### Common Issues

1. **eSpeak not found**:
```bash
# Check if eSpeak is installed
which espeak
# Install if missing
sudo apt-get install espeak  # Ubuntu/Debian
```

2. **Audio file upload fails**:
- Check file size (max 10MB)
- Verify file format (wav, mp3, ogg, m4a)
- Ensure proper multipart/form-data encoding

3. **Rate limit exceeded**:
- Wait for rate limit window to reset
- Check current usage in response headers
- Consider upgrading rate limits for production

4. **Memory issues with large content**:
- Reduce content length
- Implement content chunking
- Increase server memory

### Debug Mode
Enable debug logging:
```bash
LOG_LEVEL=debug npm run dev
```

## 📈 Performance Optimization

### Caching Strategy
- Cache TTS audio files
- Cache analysis results
- Implement Redis for session data

### Content Processing
- Process content in chunks for large texts
- Use streaming for audio processing
- Implement background job queues

### Database Optimization
- Index AI-related fields
- Archive old audio files
- Implement data retention policies

## 🔮 Future Enhancements

### Planned Features
- **Multi-language support** for all AI features
- **Voice cloning** capabilities
- **Real-time transcription** streaming
- **Advanced content recommendations**
- **AI-powered content generation**

### Integration Opportunities
- **OpenAI GPT** for enhanced summaries
- **Azure Cognitive Services** for advanced analysis
- **Google Cloud Speech** for improved STT
- **AWS Polly** for premium TTS voices

## 📞 Support

For issues or questions:
1. Check the troubleshooting section
2. Review API documentation
3. Check server logs for errors
4. Create an issue in the repository

---

**Note**: This AI implementation uses only free services and libraries. No API keys or paid services are required for basic functionality. 