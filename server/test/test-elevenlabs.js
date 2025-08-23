const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_TEXT = 'Hello, this is a test of the ElevenLabs text-to-speech integration.';

// Test user credentials
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

let authToken = null;

async function login() {
  try {
    console.log('🔐 Logging in...');
    const response = await axios.post(`${BASE_URL}/auth/login`, TEST_USER);
    authToken = response.data.token;
    console.log('✅ Login successful');
    return true;
  } catch (error) {
    console.error('❌ Login failed:', error.response?.data || error.message);
    return false;
  }
}

async function testElevenLabsTTS() {
  console.log('\n🎵 Testing ElevenLabs TTS...');
  
  try {
    const response = await axios.post(`${BASE_URL}/ai/tts/generate`, {
      text: TEST_TEXT,
      provider: 'elevenlabs',
      voiceId: '21m00Tcm4TlvDq8ikWAM', // Rachel voice
      stability: 0.7,
      similarityBoost: 0.8,
      style: 0.3,
      useSpeakerBoost: true
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ ElevenLabs TTS generation successful');
    console.log(`🔗 Audio URL: ${response.data.ttsUrl}`);
    console.log(`⏱️ Duration: ${response.data.duration}s`);
    console.log(`🎤 Voice ID: ${response.data.voiceId}`);
    console.log(`⚙️ Settings:`, response.data.metadata);
    
    return response.data;
  } catch (error) {
    console.error('❌ ElevenLabs TTS generation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testElevenLabsVoices() {
  console.log('\n🎤 Testing ElevenLabs Voices...');
  
  try {
    const response = await axios.get(`${BASE_URL}/ai/tts/elevenlabs/voices`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ ElevenLabs voices retrieved successfully');
    console.log(`📊 Found ${response.data.count} voices`);
    
    // Display first few voices
    const voices = response.data.voices.slice(0, 3);
    voices.forEach(voice => {
      console.log(`  - ${voice.name} (${voice.id}) - ${voice.gender} - ${voice.language}`);
    });
    
    return response.data.voices;
  } catch (error) {
    console.error('❌ Failed to get ElevenLabs voices:', error.response?.data || error.message);
    return [];
  }
}

async function runTests() {
  console.log('🚀 Starting ElevenLabs TTS Tests...\n');
  
  // Login first
  if (!await login()) {
    console.error('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test voices
  await testElevenLabsVoices();
  
  // Test TTS generation
  await testElevenLabsTTS();
  
  console.log('\n🎉 Tests completed!');
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 