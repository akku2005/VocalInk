const axios = require('axios');

const BASE_URL = 'http://localhost:3000/api';

async function testTTSHealth() {
  try {
    console.log('🧪 Testing TTS Health Check...');
    const response = await axios.get(`${BASE_URL}/tts/health`);
    console.log('✅ Health Check PASSED:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Health Check FAILED:', error.response?.data || error.message);
    return false;
  }
}

async function testTTSVoices() {
  try {
    console.log('🧪 Testing Get Available Voices...');
    const response = await axios.get(`${BASE_URL}/tts/voices?provider=elevenlabs`);
    console.log('✅ Get Voices PASSED:', response.data);
    return true;
  } catch (error) {
    console.log('❌ Get Voices FAILED:', error.response?.data || error.message);
    return false;
  }
}

async function testTTSGeneration() {
  try {
    console.log('🧪 Testing TTS Generation...');
    const testData = {
      text: "Hello, this is a test message for TTS generation.",
      provider: "espeak",
      voice: "en",
      speed: 150
    };
    
    const response = await axios.post(`${BASE_URL}/tts/generate`, testData, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ TTS Generation PASSED:', response.data);
    return true;
  } catch (error) {
    console.log('❌ TTS Generation FAILED:', error.response?.data || error.message);
    return false;
  }
}

async function runTests() {
  console.log('🚀 Starting Simple TTS Tests...\n');
  
  const results = [];
  
  results.push(await testTTSHealth());
  results.push(await testTTSVoices());
  results.push(await testTTSGeneration());
  
  console.log('\n📊 Test Summary:');
  const passed = results.filter(r => r).length;
  const total = results.length;
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get('http://localhost:3000/health');
    console.log('✅ Server is running, starting tests...\n');
    await runTests();
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first with: npm run dev');
    process.exit(1);
  }
}

checkServer().catch(console.error); 