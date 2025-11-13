# ElevenLabs API Setup Guide for VocalInk

## Current Issue
TTS generation is failing with: **"Invalid API key. Please check your ElevenLabs API key."**

This means `ELEVENLABS_API_KEY` environment variable is either:
- ❌ Not set
- ❌ Empty string
- ❌ Invalid/expired key

## Step 1: Get Your ElevenLabs API Key

### Option A: Free Trial (Recommended for Testing)
1. Go to https://elevenlabs.io/
2. Click **"Sign Up"** (top right)
3. Create account with email/Google/Microsoft
4. Verify your email
5. Go to **Account** → **API Keys** (left sidebar)
6. Copy your **API Key** (starts with `sk_...`)

### Option B: Paid Plan
1. Sign in to https://elevenlabs.io/
2. Go to **Account** → **Subscription**
3. Choose a plan (Starter, Pro, or Business)
4. Go to **Account** → **API Keys**
5. Copy your **API Key**

## Step 2: Configure Environment Variable

### For Development (Local Testing)

**File**: `server/.env`

Add this line:
```bash
ELEVENLABS_API_KEY=sk_your_actual_api_key_here
```

**Example**:
```bash
ELEVENLABS_API_KEY=sk_1234567890abcdefghijklmnopqrstuvwxyz
```

### For Production (Docker/Server)

Set environment variable before starting server:

**Docker Compose**:
```yaml
# docker-compose.yml
services:
  server:
    environment:
      ELEVENLABS_API_KEY: sk_your_api_key_here
```

**Docker Run**:
```bash
docker run -e ELEVENLABS_API_KEY=sk_your_api_key_here vocalink-server
```

**Linux/Mac**:
```bash
export ELEVENLABS_API_KEY=sk_your_api_key_here
npm start
```

**Windows PowerShell**:
```powershell
$env:ELEVENLABS_API_KEY="sk_your_api_key_here"
npm start
```

## Step 3: Verify Configuration

### Check if API Key is Loaded

1. Start the server
2. Look for this log message:
```
✅ Google Cloud TTS client initialized successfully
```
or
```
ℹ️  Google Cloud TTS not configured - will use fallback providers
```

3. Check the server console for any warnings about ElevenLabs

### Test TTS Generation

**Using cURL**:
```bash
curl -X POST http://localhost:3000/api/blogs/YOUR_BLOG_ID/tts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "elevenlabs",
    "voiceId": "21m00Tcm4TlvDq8ikWAM"
  }'
```

**Expected Response**:
```json
{
  "success": true,
  "ttsUrl": "/tts/elevenlabs-1699876234567-abc123.mp3",
  "provider": "elevenlabs",
  "voiceId": "21m00Tcm4TlvDq8ikWAM",
  "duration": 45,
  "metadata": {
    "contentLength": 1234,
    "wordCount": 200,
    "modelId": "eleven_multilingual_v2",
    "stability": 0.5,
    "similarityBoost": 0.5,
    "style": 0,
    "useSpeakerBoost": true,
    "storage": "local"
  }
}
```

## Step 4: Available Voices

### Default Voice
- **ID**: `21m00Tcm4TlvDq8ikWAM`
- **Name**: Rachel
- **Gender**: Female
- **Accent**: American

### Get All Available Voices

**API Endpoint**:
```bash
GET http://localhost:3000/api/ai/tts/elevenlabs/voices
Authorization: Bearer YOUR_TOKEN
```

**Response**:
```json
{
  "success": true,
  "provider": "elevenlabs",
  "voices": [
    {
      "id": "21m00Tcm4TlvDq8ikWAM",
      "name": "Rachel",
      "category": "professional",
      "description": "Warm and professional female voice",
      "gender": "female",
      "accent": "american",
      "language": "en",
      "provider": "elevenlabs",
      "previewUrl": "https://..."
    },
    // ... more voices
  ],
  "count": 50
}
```

## Step 5: Configuration Details

### Current Configuration (server/src/config/index.js)

```javascript
elevenlabs: {
  apiKey: process.env.ELEVENLABS_API_KEY,  // ← Your API key goes here
  baseUrl: 'https://api.elevenlabs.io/v1',
  defaultVoiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel
  defaultSettings: {
    stability: 0.5,              // 0-1: Voice stability
    similarityBoost: 0.5,        // 0-1: Similarity to original voice
    style: 0.0,                  // 0-1: Style exaggeration
    useSpeakerBoost: true        // Enhance voice quality
  }
}
```

### Customization Options

When calling TTS generation, you can override defaults:

```javascript
// Frontend call
const response = await blogService.generateTTS(blogId, {
  provider: 'elevenlabs',
  voiceId: '21m00Tcm4TlvDq8ikWAM',  // Different voice
  stability: 0.7,                    // More stable
  similarityBoost: 0.8,              // More similar to original
  style: 0.3,                        // Some style variation
  useSpeakerBoost: true,
  outputFormat: 'mp3_44100_128'      // Audio quality
});
```

## Step 6: Troubleshooting

### Error: "Invalid API key"
**Cause**: API key is missing, empty, or incorrect
**Solution**:
1. Verify API key in `.env` file
2. Restart server after changing `.env`
3. Check key hasn't expired on ElevenLabs dashboard
4. Try generating new key

### Error: "Rate limit exceeded"
**Cause**: Too many requests to ElevenLabs API
**Solution**:
1. Wait a few minutes before retrying
2. Upgrade ElevenLabs plan for higher limits
3. Implement request queuing on frontend

### Error: "Voice not found"
**Cause**: Invalid voice ID
**Solution**:
1. Use default voice: `21m00Tcm4TlvDq8ikWAM`
2. Get list of available voices from `/api/ai/tts/elevenlabs/voices`
3. Use voice ID from that list

### Error: "Text too long"
**Cause**: Content exceeds 5000 characters
**Solution**:
1. Split content into smaller chunks
2. Generate multiple TTS files
3. Concatenate on frontend

### Fallback to gTTS
If ElevenLabs fails, system automatically falls back to gTTS (free):
```
ElevenLabs (Premium) → Google Cloud (if configured) → gTTS (Free) → eSpeak (Local)
```

## Step 7: Pricing & Limits

### Free Trial
- **Characters/month**: 10,000
- **Concurrent requests**: 1
- **Voices available**: All

### Starter Plan ($5/month)
- **Characters/month**: 100,000
- **Concurrent requests**: 3
- **Priority support**: No

### Pro Plan ($99/month)
- **Characters/month**: 1,000,000
- **Concurrent requests**: 30
- **Priority support**: Yes

### Check Usage
1. Go to https://elevenlabs.io/
2. Sign in
3. **Account** → **Usage**
4. See current month's usage

## Step 8: Security Best Practices

### ✅ DO
- Store API key in `.env` file (never commit to git)
- Rotate API key periodically
- Use different keys for dev/prod
- Monitor usage for unusual activity

### ❌ DON'T
- Hardcode API key in source code
- Commit `.env` file to git
- Share API key with others
- Use same key for multiple projects

### .gitignore
Ensure `.env` is in `.gitignore`:
```
# .gitignore
.env
.env.local
.env.*.local
```

## Step 9: Testing the Full Flow

### 1. Start Server
```bash
cd server
npm start
```

### 2. Login to Get Token
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "password": "password123"
  }'
```

Save the `accessToken` from response.

### 3. Create a Blog (if needed)
```bash
curl -X POST http://localhost:3000/api/blogs \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Blog",
    "content": "This is a test blog for TTS generation.",
    "tags": ["test"]
  }'
```

Save the `_id` from response.

### 4. Generate TTS
```bash
curl -X POST http://localhost:3000/api/blogs/BLOG_ID/tts \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "provider": "elevenlabs"
  }'
```

### 5. Check Response
Should return:
```json
{
  "success": true,
  "ttsUrl": "/tts/elevenlabs-...",
  "provider": "elevenlabs",
  "duration": 45
}
```

## Step 10: Next Steps

After setting up ElevenLabs:

1. **Test in UI**: Go to a blog and click "Listen to this post"
2. **Check audio quality**: Adjust voice settings if needed
3. **Monitor usage**: Check ElevenLabs dashboard monthly
4. **Optimize costs**: Use gTTS for non-critical content, ElevenLabs for premium

## Support

- **ElevenLabs Docs**: https://elevenlabs.io/docs
- **API Reference**: https://elevenlabs.io/docs/api-reference
- **Community**: https://discord.gg/elevenlabs

---

**Status**: ✅ Ready to use after adding API key to `.env`
