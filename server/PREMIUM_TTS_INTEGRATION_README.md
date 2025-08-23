# Premium Text-to-Speech Integration

This document describes the integration of premium AI text-to-speech services (ElevenLabs and Google Cloud) into the VocalInk backend.

## Overview

This integration provides access to multiple premium AI text-to-speech services:

- **ElevenLabs**: State-of-the-art AI voices that sound remarkably human-like
- **Google Cloud TTS**: High-quality neural voices with extensive language support
- **Fallback Providers**: eSpeak, gTTS, and ResponsiveVoice for reliability

The system automatically falls back to alternative providers if the primary service is unavailable.

## Features

- **Premium AI Voices**: Access to 100+ ElevenLabs voices and 400+ Google Cloud voices
- **Voice Customization**: Control stability, similarity boost, style, speaking rate, pitch, and volume
- **Multi-language Support**: Voices available in 50+ languages across both providers
- **Intelligent Fallback**: Automatic fallback between premium providers and free alternatives
- **Voice Management**: Browse and select from available voices for each provider
- **Usage Statistics**: Track TTS usage across all providers
- **Error Handling**: Comprehensive error handling with user-friendly messages
- **Provider Selection**: Choose between ElevenLabs, Google Cloud, or automatic selection

## Configuration

### Environment Variables

Add the following to your `.env` file:

```env
# ElevenLabs API Key for Text-to-Speech
ELEVENLABS_API_KEY=your-elevenlabs-api-key-here

# Google Cloud Text-to-Speech API
GOOGLE_CLOUD_PROJECT_ID=your-project-id
GOOGLE_CLOUD_CREDENTIALS={"type":"service_account","project_id":"your-project-id",...}
```

### Default Settings

The default configurations are defined in `src/config/index.js`:

```javascript
elevenlabs: {
  apiKey: process.env.ELEVENLABS_API_KEY,
  baseUrl: 'https://api.elevenlabs.io/v1',
  defaultVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
  defaultSettings: {
    stability: 0.5,
    similarityBoost: 0.5,
    style: 0.0,
    useSpeakerBoost: true
  }
},
googleCloud: {
  projectId: process.env.GOOGLE_CLOUD_PROJECT_ID,
  credentials: process.env.GOOGLE_CLOUD_CREDENTIALS ? JSON.parse(process.env.GOOGLE_CLOUD_CREDENTIALS) : null,
  defaultVoice: {
    languageCode: 'en-US',
    name: 'en-US-Standard-A',
    ssmlGender: 'FEMALE'
  },
  defaultSettings: {
    speakingRate: 1.0,
    pitch: 0.0,
    volumeGainDb: 0.0,
    effectsProfileId: []
  }
}
```

## API Endpoints

### Generate TTS

**POST** `/api/ai/tts/generate`

Generate text-to-speech using ElevenLabs or other providers.

**Request Body (ElevenLabs):**
```json
{
  "text": "Hello, this is a test message.",
  "provider": "elevenlabs",
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "stability": 0.7,
  "similarityBoost": 0.8,
  "style": 0.3,
  "useSpeakerBoost": true
}
```

**Request Body (Google Cloud):**
```json
{
  "text": "Hello, this is a test message.",
  "provider": "googlecloud",
  "voiceName": "en-US-Standard-A",
  "languageCode": "en-US",
  "ssmlGender": "FEMALE",
  "speakingRate": 1.0,
  "pitch": 0.0,
  "volumeGainDb": 0.0
}
```

**Response:**
```json
{
  "success": true,
  "ttsUrl": "/tts/elevenlabs-1234567890-abc123.mp3",
  "provider": "elevenlabs",
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "duration": 5,
  "metadata": {
    "contentLength": 28,
    "wordCount": 6,
    "modelId": "eleven_monolingual_v1",
    "stability": 0.7,
    "similarityBoost": 0.8,
    "style": 0.3,
    "useSpeakerBoost": true
  }
}
```

### Get Available Voices

**GET** `/api/ai/tts/voices?provider=elevenlabs`

Get available voices for a specific provider.

**Response:**
```json
{
  "success": true,
  "provider": "elevenlabs",
  "voices": [
    {
      "id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "category": "premade",
      "description": "A calm and collected voice",
      "gender": "female",
      "accent": "american",
      "language": "en",
      "provider": "elevenlabs",
      "previewUrl": "https://..."
    }
  ],
  "count": 1
}
```

### Get ElevenLabs Voices

**GET** `/api/ai/tts/elevenlabs/voices`

Get all available ElevenLabs voices.

### Get ElevenLabs Voice Details

**GET** `/api/ai/tts/elevenlabs/voices/:voiceId`

Get detailed information about a specific ElevenLabs voice.

### Get Google Cloud Voices

**GET** `/api/ai/tts/googlecloud/voices`

Get all available Google Cloud voices.

### Get Google Cloud Voice Details

**GET** `/api/ai/tts/googlecloud/voices/:voiceName`

Get detailed information about a specific Google Cloud voice.

### Get TTS Statistics

**GET** `/api/ai/tts/stats`

Get usage statistics for TTS services.

**Response:**
```json
{
  "success": true,
  "stats": {
    "totalFiles": 150,
    "audioFiles": 100,
    "ttsFiles": 50,
    "providers": {
      "espeak": 30,
      "gtts": 20,
      "responsivevoice": 0,
      "elevenlabs": 50
    }
  }
}
```

## Voice Settings

### ElevenLabs Settings

#### Stability (0.0 - 1.0)
Controls how consistent the voice sounds across different generations. Higher values make the voice more consistent but less expressive.

#### Similarity Boost (0.0 - 1.0)
Controls how similar the generated voice should be to the original voice. Higher values make it more similar but may reduce quality.

#### Style (0.0 - 1.0)
Controls how much the voice should adapt to the content. Higher values make the voice more expressive but less stable.

#### Use Speaker Boost
Enhances the clarity and quality of the generated speech.

### Google Cloud Settings

#### Speaking Rate (0.25 - 4.0)
Controls the speed of speech. 1.0 is normal speed, 2.0 is twice as fast.

#### Pitch (-20.0 - 20.0)
Controls the pitch of the voice. 0.0 is normal pitch, positive values increase pitch.

#### Volume Gain DB (-96.0 - 16.0)
Controls the volume of the audio. 0.0 is normal volume, positive values increase volume.

#### SSML Gender
Specifies the gender of the voice: MALE, FEMALE, or NEUTRAL.

## Error Handling

The integration includes comprehensive error handling for common API errors:

### ElevenLabs Errors
- **401**: Invalid API key
- **403**: Insufficient permissions
- **404**: Voice not found
- **422**: Invalid request parameters
- **429**: Rate limit exceeded
- **500**: Server error

### Google Cloud Errors
- **3**: Invalid argument
- **7**: Permission denied
- **9**: Resource exhausted (quota exceeded)
- **13**: Internal error
- **14**: Service unavailable

## File Management

### Audio Storage
- ElevenLabs audio files are stored in `public/tts/`
- Other provider files are stored in `public/audio/`
- Files are automatically cleaned up after 24 hours

### File Naming
- ElevenLabs: `elevenlabs-{timestamp}-{random}.mp3`
- Google Cloud: `googlecloud-{timestamp}-{random}.mp3`
- eSpeak: `espeak-{timestamp}-{random}.wav`
- gTTS: `gtts-{timestamp}-{random}.mp3`
- ResponsiveVoice: `rv-{timestamp}-{random}.json`

## Testing

Run the integration tests:

```bash
# Test ElevenLabs
cd server
node test-elevenlabs.js

# Test Google Cloud
node test-googlecloud-tts.js
```

These tests will verify:
- Authentication
- Voice retrieval for each provider
- TTS generation with custom settings
- Error handling
- Fallback mechanisms

## Rate Limiting

The TTS endpoints are protected by rate limiting middleware:

- **TTS Generation**: 10 requests per minute per user
- **Voice Retrieval**: 30 requests per minute per user
- **Statistics**: 20 requests per minute per user

## Security Considerations

1. **API Key Protection**: The ElevenLabs API key is stored in environment variables
2. **Input Validation**: All text input is sanitized and validated
3. **File Security**: Audio files are served from a restricted public directory
4. **Rate Limiting**: Prevents abuse of the TTS service
5. **Authentication**: All TTS endpoints require user authentication

## Performance Optimization

1. **Text Sanitization**: Removes HTML tags and special characters
2. **Length Limits**: Truncates text to prevent excessive API usage
3. **Caching**: Consider implementing Redis caching for frequently requested voices
4. **Async Processing**: TTS generation is non-blocking
5. **File Cleanup**: Automatic cleanup of old audio files

## Troubleshooting

### Common Issues

1. **ElevenLabs API Key Error**
   - Ensure `ELEVENLABS_API_KEY` is set in your `.env` file
   - Verify the API key is valid and has sufficient credits

2. **Google Cloud Credentials Error**
   - Ensure `GOOGLE_CLOUD_PROJECT_ID` and `GOOGLE_CLOUD_CREDENTIALS` are set
   - Verify the service account has Text-to-Speech API permissions
   - Check that the project has the Text-to-Speech API enabled

3. **Voice Not Found**
   - For ElevenLabs: Use `/api/ai/tts/elevenlabs/voices` to get valid voice IDs
   - For Google Cloud: Use `/api/ai/tts/googlecloud/voices` to get valid voice names

4. **Rate Limit Exceeded**
   - Wait before making additional requests
   - Consider upgrading your service plan

5. **Audio File Not Found**
   - Check that the `public/tts/` directory exists and is writable
   - Verify file permissions

### Debug Mode

Enable debug logging by setting `LOG_LEVEL=debug` in your `.env` file.

## Migration from Other Providers

To migrate existing TTS functionality to use premium providers:

1. Update your frontend to send `provider: 'elevenlabs'` or `provider: 'googlecloud'` in TTS requests
2. Add voice selection UI using the provider-specific voices endpoints
3. Update any hardcoded provider references
4. Test the fallback mechanism between providers
5. Configure environment variables for your chosen provider(s)

## Future Enhancements

- **Voice Cloning**: Support for custom voice cloning (ElevenLabs)
- **Batch Processing**: Generate multiple audio files in parallel
- **Real-time Streaming**: Support for streaming TTS output
- **Voice Analytics**: Track voice usage and preferences
- **Multi-language Support**: Enhanced language detection and selection
- **Provider Comparison**: Side-by-side comparison of different TTS providers
- **Custom Voice Training**: Train custom voices for specific use cases

## Support

For issues related to:
- **ElevenLabs API**: Contact ElevenLabs support
- **Google Cloud TTS**: Contact Google Cloud support
- **Integration**: Check the logs and error messages
- **Configuration**: Verify environment variables and settings

## License

This integration is part of the VocalInk project and follows the same license terms. 