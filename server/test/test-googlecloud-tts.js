const axios = require('axios');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_TEXT = 'Hello, this is a test of the Google Cloud text-to-speech integration. The voice should sound natural and clear.';

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

async function testGoogleCloudTTS() {
  console.log('\n🎵 Testing Google Cloud TTS...');
  
  try {
    const response = await axios.post(`${BASE_URL}/ai/tts/generate`, {
      text: TEST_TEXT,
      provider: 'googlecloud',
      voiceName: 'en-US-Standard-A',
      languageCode: 'en-US',
      ssmlGender: 'FEMALE',
      speakingRate: 1.0,
      pitch: 0.0,
      volumeGainDb: 0.0
    }, {
      headers: {
        'Authorization': `Bearer ${authToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Google Cloud TTS generation successful');
    console.log(`🔗 Audio URL: ${response.data.ttsUrl}`);
    console.log(`⏱️ Duration: ${response.data.duration}s`);
    console.log(`🎤 Voice Name: ${response.data.voiceName}`);
    console.log(`🌍 Language Code: ${response.data.languageCode}`);
    console.log(`⚙️ Settings:`, response.data.metadata);
    
    return response.data;
  } catch (error) {
    console.error('❌ Google Cloud TTS generation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGoogleCloudVoices() {
  console.log('\n🎤 Testing Google Cloud Voices...');
  
  try {
    const response = await axios.get(`${BASE_URL}/ai/tts/googlecloud/voices`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Google Cloud voices retrieved successfully');
    console.log(`📊 Found ${response.data.count} voices`);
    
    // Display first few voices
    const voices = response.data.voices.slice(0, 5);
    voices.forEach(voice => {
      console.log(`  - ${voice.name} - ${voice.gender} - ${voice.languageCode}`);
    });
    
    return response.data.voices;
  } catch (error) {
    console.error('❌ Failed to get Google Cloud voices:', error.response?.data || error.message);
    return [];
  }
}

async function testAllProviders() {
  console.log('\n🔄 Testing All TTS Providers...');
  
  const providers = ['elevenlabs', 'googlecloud', 'espeak', 'gtts'];
  
  for (const provider of providers) {
    console.log(`\n🎵 Testing ${provider.toUpperCase()}...`);
    
    try {
      const requestBody = {
        text: `Testing ${provider} text-to-speech.`,
        provider
      };

      // Add provider-specific parameters
      if (provider === 'googlecloud') {
        requestBody.voiceName = 'en-US-Standard-A';
        requestBody.languageCode = 'en-US';
        requestBody.ssmlGender = 'FEMALE';
      } else if (provider === 'elevenlabs') {
        requestBody.voiceId = '21m00Tcm4TlvDq8ikWAM';
      }

      const response = await axios.post(`${BASE_URL}/ai/tts/generate`, requestBody, {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      });
      
      console.log(`✅ ${provider} TTS successful`);
      console.log(`🔗 Audio URL: ${response.data.ttsUrl}`);
      console.log(`⏱️ Duration: ${response.data.duration}s`);
      
    } catch (error) {
      console.error(`❌ ${provider} TTS failed:`, error.response?.data || error.message);
    }
  }
}

async function testTTSStats() {
  console.log('\n📊 Testing TTS Statistics...');
  
  try {
    const response = await axios.get(`${BASE_URL}/ai/tts/stats`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ TTS stats retrieved successfully');
    console.log('📈 Statistics:', response.data.stats);
    
    return response.data.stats;
  } catch (error) {
    console.error('❌ Failed to get TTS stats:', error.response?.data || error.message);
    return null;
  }
}

async function runTests() {
  console.log('🚀 Starting Google Cloud TTS Tests...\n');
  
  // Login first
  if (!await login()) {
    console.error('❌ Cannot proceed without authentication');
    return;
  }
  
  // Test voices
  await testGoogleCloudVoices();
  
  // Test TTS generation
  await testGoogleCloudTTS();
  
  // Test all providers
  await testAllProviders();
  
  // Test statistics
  await testTTSStats();
  
  console.log('\n🎉 All tests completed!');
}

// Run tests
runTests().catch(error => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 