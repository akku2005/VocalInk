const TTSService = require('./src/services/TTSService');
const logger = require('./src/utils/logger');

async function testTTSService() {
  console.log('🧪 Testing TTS Service Directly...\n');
  
  const ttsService = new TTSService();
  
  try {
    // Test 1: Get available voices
    console.log('1. Testing getAvailableVoices...');
    const voices = await ttsService.getAvailableVoices('elevenlabs');
    console.log('✅ Voices retrieved:', voices.length, 'voices found');
    
    // Test 2: Generate TTS with eSpeak (local, no API key needed)
    console.log('\n2. Testing TTS generation with eSpeak...');
    const result = await ttsService.generateSpeech("Hello, this is a test message.", {
      provider: 'espeak',
      voice: 'en',
      speed: 150
    });
    console.log('✅ TTS generated successfully:', {
      url: result.url,
      provider: result.provider,
      duration: result.duration
    });
    
    // Test 3: Test text sanitization
    console.log('\n3. Testing text sanitization...');
    const sanitized = ttsService.sanitizeText("Test <script>alert('xss')</script> message", 100);
    console.log('✅ Text sanitized:', sanitized);
    
    // Test 4: Test duration estimation
    console.log('\n4. Testing duration estimation...');
    const duration = ttsService.estimateDuration("This is a test message for duration estimation.", 150);
    console.log('✅ Duration estimated:', duration, 'seconds');
    
    console.log('\n🎉 All TTS Service Tests PASSED!');
    
  } catch (error) {
    console.log('❌ TTS Service Test FAILED:', error.message);
    console.log('Error details:', error);
  }
}

async function testTTSProviders() {
  console.log('\n🧪 Testing TTS Providers...\n');
  
  const ttsService = new TTSService();
  const testText = "Hello, this is a provider test.";
  
  const providers = [
    { name: 'eSpeak', options: { provider: 'espeak', voice: 'en', speed: 150 } },
    { name: 'gTTS', options: { provider: 'gtts', language: 'en' } },
    { name: 'ResponsiveVoice', options: { provider: 'responsivevoice', voice: 'US English Female' } }
  ];
  
  for (const provider of providers) {
    try {
      console.log(`Testing ${provider.name}...`);
      const result = await ttsService.generateSpeech(testText, provider.options);
      console.log(`✅ ${provider.name} PASSED:`, {
        url: result.url,
        provider: result.provider
      });
    } catch (error) {
      console.log(`❌ ${provider.name} FAILED:`, error.message);
    }
  }
}

async function testElevenLabs() {
  console.log('\n🧪 Testing ElevenLabs (if configured)...\n');
  
  const ttsService = new TTSService();
  
  try {
    // Test if ElevenLabs is configured
    if (!ttsService.elevenlabsConfig.apiKey) {
      console.log('⚠️ ElevenLabs not configured, skipping test');
      return;
    }
    
    console.log('Testing ElevenLabs TTS generation...');
    const result = await ttsService.generateSpeech("Hello, this is an ElevenLabs test.", {
      provider: 'elevenlabs',
      voiceId: ttsService.elevenlabsConfig.defaultVoiceId
    });
    
    console.log('✅ ElevenLabs PASSED:', {
      url: result.url,
      provider: result.provider,
      voiceId: result.voiceId
    });
    
  } catch (error) {
    console.log('❌ ElevenLabs FAILED:', error.message);
  }
}

async function runAllTests() {
  console.log('🚀 Starting Direct TTS Service Tests...\n');
  
  await testTTSService();
  await testTTSProviders();
  await testElevenLabs();
  
  console.log('\n🎯 Direct TTS Testing Complete!');
}

runAllTests().catch(console.error); 