const dotenv = require('dotenv');

// Load environment variables first
dotenv.config();

console.log('🔍 TTS Service Debug Test\n');

// Test 1: Check environment variables
console.log('1️⃣ Environment Variables Check:');
console.log('   TTS_QUEUE_ENABLED:', process.env.TTS_QUEUE_ENABLED);
console.log('   TTS_WORKER_ENABLED:', process.env.TTS_WORKER_ENABLED);
console.log('   REDIS_HOST:', process.env.REDIS_HOST);
console.log('   REDIS_PORT:', process.env.REDIS_PORT);
console.log('   ELEVENLABS_API_KEY:', process.env.ELEVENLABS_API_KEY ? 'SET' : 'NOT SET');
console.log('   TTS_STORAGE_PROVIDER:', process.env.TTS_STORAGE_PROVIDER);

// Test 2: Check if required packages are available
console.log('\n2️⃣ Package Availability Check:');
try {
  const Bull = require('bull');
  console.log('   ✅ Bull package: Available');
} catch (error) {
  console.log('   ❌ Bull package: NOT AVAILABLE -', error.message);
}

try {
  const redis = require('redis');
  console.log('   ✅ Redis package: Available');
} catch (error) {
  console.log('   ❌ Redis package: NOT AVAILABLE -', error.message);
}

// Test 3: Test Redis connection
console.log('\n3️⃣ Redis Connection Test:');
async function testRedis() {
  try {
    const redis = require('redis');
    const client = redis.createClient({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT) || 6379,
      password: process.env.REDIS_PASSWORD || undefined,
      db: parseInt(process.env.REDIS_DB) || 0,
    });
    
    await client.connect();
    await client.ping();
    console.log('   ✅ Redis: Connected successfully');
    await client.disconnect();
  } catch (error) {
    console.log('   ❌ Redis: Connection failed -', error.message);
  }
}

// Test 4: Test TTS Service initialization
console.log('\n4️⃣ TTS Service Initialization Test:');
async function testTTSService() {
  try {
    const TTSEnhancedService = require('./src/services/TTSEnhancedService');
    console.log('   ✅ TTSEnhancedService: Loaded successfully');
    
    const ttsService = new TTSEnhancedService();
    console.log('   ✅ TTSEnhancedService: Instance created');
    
    // Try to initialize
    await ttsService.initialize();
    console.log('   ✅ TTSEnhancedService: Initialized successfully');
    
    return true;
  } catch (error) {
    console.log('   ❌ TTSEnhancedService: Initialization failed -', error.message);
    console.log('   Stack trace:', error.stack);
    return false;
  }
}

// Test 5: Check server health
console.log('\n5️⃣ Server Health Check:');
async function testServerHealth() {
  try {
    const axios = require('axios');
    const response = await axios.get('http://localhost:3000/health');
    console.log('   ✅ Server: Running and healthy');
    console.log('   Status:', response.status);
    return true;
  } catch (error) {
    console.log('   ❌ Server: Not accessible -', error.message);
    return false;
  }
}

// Test 6: Check TTS health endpoint
console.log('\n6️⃣ TTS Health Endpoint Test:');
async function testTTSHealth() {
  try {
    const axios = require('axios');
    const response = await axios.get('http://localhost:3000/api/tts/health');
    console.log('   ✅ TTS Health: Endpoint accessible');
    console.log('   Status:', response.status);
    console.log('   Data:', response.data);
    return true;
  } catch (error) {
    console.log('   ❌ TTS Health: Endpoint failed -', error.message);
    if (error.response) {
      console.log('   Response Status:', error.response.status);
      console.log('   Response Data:', error.response.data);
    }
    return false;
  }
}

// Run all tests
async function runAllTests() {
  console.log('\n🚀 Running all tests...\n');
  
  // Test Redis connection
  await testRedis();
  
  // Test TTS Service
  const ttsResult = await testTTSService();
  
  // Test Server Health
  const serverResult = await testServerHealth();
  
  // Test TTS Health
  if (serverResult) {
    await testTTSHealth();
  }
  
  console.log('\n📊 Test Summary:');
  console.log('   TTS Service Initialization:', ttsResult ? '✅ PASSED' : '❌ FAILED');
  console.log('   Server Health:', serverResult ? '✅ PASSED' : '❌ FAILED');
  
  if (!ttsResult) {
    console.log('\n🔧 Troubleshooting Tips:');
    console.log('   1. Check if Redis is running on localhost:6379');
    console.log('   2. Verify all TTS environment variables are set');
    console.log('   3. Check if Bull package is properly installed');
    console.log('   4. Restart the server after environment changes');
  }
}

// Run the tests
runAllTests().catch(console.error); 