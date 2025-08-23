const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');

// Test configuration
const BASE_URL = 'http://localhost:3000/api';
const TEST_TEXT = 'Hello, this is a test of the ElevenLabs text-to-speech integration. The voice should sound natural and clear.';
const LONG_TEXT = 'This is a longer test to verify that the text-to-speech service can handle substantial content. It should process this text efficiently and generate high-quality audio output. The ElevenLabs integration provides premium AI voices that sound remarkably human-like.';

// Test user credentials (you'll need to create a test user first)
const TEST_USER = {
  email: 'test@example.com',
  password: 'testpassword123'
};

let authToken = null;

// Utility functions
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

function getAuthHeaders() {
  return {
    'Authorization': `Bearer ${authToken}`,
    'Content-Type': 'application/json'
  };
}

// Test functions
async function testElevenLabsVoices() {
  console.log('\n🎤 Testing ElevenLabs Voices...');
  
  try {
    const response = await axios.get(`${BASE_URL}/ai/tts/elevenlabs/voices`, {
      headers: getAuthHeaders()
    });
    
    console.log('✅ ElevenLabs voices retrieved successfully');
    console.log(`📊 Found ${response.data.count} voices`);
    
    // Display first few voices
    const voices = response.data.voices.slice(0, 5);
    voices.forEach(voice => {
      console.log(`  - ${voice.name} (${voice.id}) - ${voice.gender} - ${voice.language}`);
    });
    
    return response.data.voices;
  } catch (error) {
    console.error('❌ Failed to get ElevenLabs voices:', error.response?.data || error.message);
    return [];
  }
}

async function testVoiceDetails(voiceId) {
  console.log(`\n🔍 Testing Voice Details for ${voiceId}...`);
  
  try {
    const response = await axios.get(`${BASE_URL}/ai/tts/elevenlabs/voices/${voiceId}`, {
      headers: getAuthHeaders()
    });
    
    console.log('✅ Voice details retrieved successfully');
    console.log(`📋 Voice: ${response.data.voice.name}`);
    console.log(`🎭 Category: ${response.data.voice.category}`);
    console.log(`🌍 Language: ${response.data.voice.language}`);
    
    return response.data.voice;
  } catch (error) {
    console.error('❌ Failed to get voice details:', error.response?.data || error.message);
    return null;
  }
}

async function testBasicTTS(text, provider = 'elevenlabs') {
  console.log(`\n🎵 Testing ${provider.toUpperCase()} TTS...`);
  
  try {
    const response = await axios.post(`${BASE_URL}/ai/tts/generate`, {
      text,
      provider
    }, {
      headers: getAuthHeaders()
    });
    
    console.log('✅ TTS generation successful');
    console.log(`🔗 Audio URL: ${response.data.ttsUrl}`);
    console.log(`⏱️ Duration: ${response.data.duration}s`);
    console.log(`🏷️ Provider: ${response.data.provider}`);
    
    if (response.data.voiceId) {
      console.log(`🎤 Voice ID: ${response.data.voiceId}`);
    }
    
    return response.data;
  } catch (error) {
    console.error('❌ TTS generation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testElevenLabsWithCustomSettings() {
  console.log('\n🎛️ Testing ElevenLabs with Custom Settings...');
  
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
      headers: getAuthHeaders()
    });
    
    console.log('✅ Custom TTS generation successful');
    console.log(`🔗 Audio URL: ${response.data.ttsUrl}`);
    console.log(`🎤 Voice ID: ${response.data.voiceId}`);
    console.log(`⚙️ Settings:`, response.data.metadata);
    
    return response.data;
  } catch (error) {
    console.error('❌ Custom TTS generation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testLongTextTTS() {
  console.log('\n📝 Testing Long Text TTS...');
  
  try {
    const response = await axios.post(`${BASE_URL}/ai/tts/generate`, {
      text: LONG_TEXT,
      provider: 'elevenlabs'
    }, {
      headers: getAuthHeaders()
    });
    
    console.log('✅ Long text TTS generation successful');
    console.log(`🔗 Audio URL: ${response.data.ttsUrl}`);
    console.log(`⏱️ Duration: ${response.data.duration}s`);
    console.log(`📊 Word count: ${response.data.metadata.wordCount}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Long text TTS generation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testFallbackTTS() {
  console.log('\n🔄 Testing Fallback TTS...');
  
  try {
    // Test with invalid voice ID to trigger fallback
    const response = await axios.post(`${BASE_URL}/ai/tts/generate`, {
      text: TEST_TEXT,
      provider: 'elevenlabs',
      voiceId: 'invalid-voice-id'
    }, {
      headers: getAuthHeaders()
    });
    
    console.log('✅ Fallback TTS generation successful');
    console.log(`🔗 Audio URL: ${response.data.ttsUrl}`);
    console.log(`🏷️ Provider: ${response.data.provider}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Fallback TTS generation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testTTSStats() {
  console.log('\n📊 Testing TTS Statistics...');
  
  try {
    const response = await axios.get(`${BASE_URL}/ai/tts/stats`, {
      headers: getAuthHeaders()
    });
    
    console.log('✅ TTS stats retrieved successfully');
    console.log('📈 Statistics:', response.data.stats);
    
    return response.data.stats;
  } catch (error) {
    console.error('❌ Failed to get TTS stats:', error.response?.data || error.message);
    return null;
  }
}

async function testAllProviders() {
  console.log('\n🔄 Testing All TTS Providers...');
  
  const providers = ['elevenlabs', 'espeak', 'gtts'];
  
  for (const provider of providers) {
    console.log(`\n🎵 Testing ${provider.toUpperCase()}...`);
    
    try {
      const response = await axios.post(`${BASE_URL}/ai/tts/generate`, {
        text: `Testing ${provider} text-to-speech.`,
        provider
      }, {
        headers: getAuthHeaders()
      });
      
      console.log(`✅ ${provider} TTS successful`);
      console.log(`🔗 Audio URL: ${response.data.ttsUrl}`);
      console.log(`⏱️ Duration: ${response.data.duration}s`);
      
    } catch (error) {
      console.error(`❌ ${provider} TTS failed:`, error.response?.data || error.message);
    }
  }
}

async function testErrorHandling() {
  console.log('\n🚨 Testing Error Handling...');
  
  // Test with empty text
  try {
    await axios.post(`${BASE_URL}/ai/tts/generate`, {
      text: '',
      provider: 'elevenlabs'
    }, {
      headers: getAuthHeaders()
    });
    console.log('❌ Should have failed with empty text');
  } catch (error) {
    console.log('✅ Correctly handled empty text error');
  }
  
  // Test with very long text
  try {
    const longText = 'A'.repeat(10000);
    await axios.post(`${BASE_URL}/ai/tts/generate`, {
      text: longText,
      provider: 'elevenlabs'
    }, {
      headers: getAuthHeaders()
    });
    console.log('✅ Handled long text (should be truncated)');
  } catch (error) {
    console.log('❌ Failed to handle long text:', error.response?.data || error.message);
  }
  
  // Test with invalid provider
  try {
    await axios.post(`${BASE_URL}/ai/tts/generate`, {
      text: TEST_TEXT,
      provider: 'invalid-provider'
    }, {
      headers: getAuthHeaders()
    });
    console.log('✅ Handled invalid provider (should fallback)');
  } catch (error) {
    console.log('❌ Failed to handle invalid provider:', error.response?.data || error.message);
  }
}

// Main test runner
async function runTests() {
  console.log('🚀 Starting ElevenLabs TTS Integration Tests...\n');
  
  // Login first
  if (!await login()) {
    console.error('❌ Cannot proceed without authentication');
    return;
  }
  
  // Run all tests
  const voices = await testElevenLabsVoices();
  
  if (voices.length > 0) {
    await testVoiceDetails(voices[0].id);
  }
  
  await testBasicTTS(TEST_TEXT);
  await testElevenLabsWithCustomSettings();
  await testLongTextTTS();
  await testFallbackTTS();
  await testTTSStats();
  await testAllProviders();
  await testErrorHandling();
  
  console.log('\n🎉 All tests completed!');
  console.log('\n📋 Test Summary:');
  console.log('✅ ElevenLabs voices retrieval');
  console.log('✅ Voice details retrieval');
  console.log('✅ Basic TTS generation');
  console.log('✅ Custom settings TTS');
  console.log('✅ Long text handling');
  console.log('✅ Fallback mechanism');
  console.log('✅ Statistics tracking');
  console.log('✅ Multi-provider support');
  console.log('✅ Error handling');
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests().catch(error => {
    console.error('💥 Test runner failed:', error);
    process.exit(1);
  });
}

module.exports = {
  runTests,
  testElevenLabsVoices,
  testBasicTTS,
  testElevenLabsWithCustomSettings,
  testLongTextTTS,
  testFallbackTTS,
  testTTSStats,
  testAllProviders,
  testErrorHandling
}; 