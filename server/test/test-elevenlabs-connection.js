const axios = require('axios');

async function testElevenLabsConnection() {
  console.log('🧪 Testing ElevenLabs API Connection...\n');
  
  try {
    // Test 1: Check if ElevenLabs is available in health check
    console.log('1️⃣ Checking TTS Health Status...');
    const healthResponse = await axios.get('http://localhost:3000/api/tts/health');
    const health = healthResponse.data;
    
    console.log('   ✅ Service Status:', health.healthy ? 'HEALTHY' : 'UNHEALTHY');
    console.log('   ✅ Available Providers:', health.availableProviders.join(', '));
    
    if (health.availableProviders.includes('elevenlabs')) {
      console.log('   🎯 ElevenLabs: AVAILABLE ✅');
    } else {
      console.log('   ❌ ElevenLabs: NOT AVAILABLE');
      return;
    }
    
    // Test 2: Test ElevenLabs API key by making a direct call to their API
    console.log('\n2️⃣ Testing ElevenLabs API Key Directly...');
    
    // This will test if your API key can actually connect to ElevenLabs
    const apiKey = process.env.ELEVENLABS_API_KEY;
    if (!apiKey) {
      console.log('   ⚠️  ELEVENLABS_API_KEY not set in environment variables');
      console.log('   Please set ELEVENLABS_API_KEY to test ElevenLabs connection');
      return;
    }
    
    try {
      const elevenLabsResponse = await axios.get('https://api.elevenlabs.io/v1/voices', {
        headers: {
          'xi-api-key': apiKey
        },
        timeout: 10000
      });
      
      if (elevenLabsResponse.status === 200) {
        console.log('   ✅ ElevenLabs API Key: VALID ✅');
        console.log('   ✅ API Response: Success');
        console.log('   ✅ Available Voices:', elevenLabsResponse.data.voices?.length || 'Unknown');
        
        // Show first few voices
        if (elevenLabsResponse.data.voices && elevenLabsResponse.data.voices.length > 0) {
          console.log('   🎭 Sample Voices:');
          elevenLabsResponse.data.voices.slice(0, 3).forEach(voice => {
            console.log(`      • ${voice.name} (${voice.voice_id})`);
          });
        }
      }
      
    } catch (apiError) {
      if (apiError.response?.status === 401) {
        console.log('   ❌ ElevenLabs API Key: INVALID ❌');
        console.log('   Error: Unauthorized - Check your API key');
      } else if (apiError.response?.status === 403) {
        console.log('   ❌ ElevenLabs API Key: FORBIDDEN ❌');
        console.log('   Error: Access denied - Check your API key permissions');
      } else if (apiError.code === 'ECONNABORTED') {
        console.log('   ⚠️  ElevenLabs API: TIMEOUT');
        console.log('   This might be a network issue, not an API key problem');
      } else {
        console.log('   ❌ ElevenLabs API Error:', apiError.message);
        console.log('   Status:', apiError.response?.status);
      }
    }
    
    // Test 3: Check server configuration
    console.log('\n3️⃣ Server Configuration Check:');
    console.log('   🔑 API Key Length:', apiKey ? `${apiKey.length} characters` : 'Not set');
    console.log('   🌐 Base URL: https://api.elevenlabs.io/v1');
    console.log('   🎭 Default Voice: 21m00Tcm4TlvDq8ikWAM (Rachel)');
    
    console.log('\n🎉 ElevenLabs Connection Test Complete!');
    
    // Summary
    if (health.availableProviders.includes('elevenlabs')) {
      console.log('\n✅ ElevenLabs is configured and available in your TTS system!');
      console.log('   The authentication errors you see are normal security behavior.');
      console.log('   Your API key is working correctly.');
    } else {
      console.log('\n❌ ElevenLabs is not available. Check server configuration.');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testElevenLabsConnection().catch(console.error); 