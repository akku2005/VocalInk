const axios = require('axios');

async function testTTSHealthIsolation() {
  console.log('🔍 Testing TTS Health Check Isolation...\n');
  
  try {
    // Test 1: Basic server health (should work)
    console.log('1️⃣ Testing Basic Server Health...');
    const startTime = Date.now();
    
    try {
      const healthResponse = await axios.get('http://localhost:3000/health', { timeout: 5000 });
      const responseTime = Date.now() - startTime;
      console.log(`   ✅ Server Health: ${healthResponse.status} (${responseTime}ms)`);
      console.log(`   📊 Status: ${healthResponse.data.status}`);
      console.log(`   📊 Uptime: ${healthResponse.data.uptime}s`);
    } catch (error) {
      console.log(`   ❌ Server Health Failed: ${error.message}`);
      if (error.response) {
        console.log(`   📊 Status Code: ${error.response.status}`);
        console.log(`   📊 Response Data: ${JSON.stringify(error.response.data)}`);
      }
      if (error.code) {
        console.log(`   📊 Error Code: ${error.code}`);
      }
      return;
    }

    // Test 2: TTS Health with timeout
    console.log('\n2️⃣ Testing TTS Health with Timeout...');
    const ttsStartTime = Date.now();
    
    try {
      const ttsResponse = await axios.get('http://localhost:3000/api/tts/health', { 
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json'
        }
      });
      const ttsResponseTime = Date.now() - ttsStartTime;
      console.log(`   ✅ TTS Health: ${ttsResponse.status} (${ttsResponseTime}ms)`);
      console.log('   📊 Response:', JSON.stringify(ttsResponse.data, null, 2));
    } catch (error) {
      const ttsResponseTime = Date.now() - ttsStartTime;
      console.log(`   ❌ TTS Health Failed after ${ttsResponseTime}ms: ${error.message}`);
      
      if (error.response) {
        console.log(`   📊 Status Code: ${error.response.status}`);
        console.log(`   📊 Response Data: ${JSON.stringify(error.response.data)}`);
      }
      
      if (error.code === 'ECONNRESET') {
        console.log('   🔍 ECONNRESET detected - Server likely hanging during TTS health check');
      } else if (error.code === 'ECONNABORTED') {
        console.log('   🔍 ECONNABORTED detected - Request timed out');
      }
    }

    // Test 3: Check server status
    console.log('\n3️⃣ Testing Server Status...');
    try {
      const statusResponse = await axios.get('http://localhost:3000/health', { timeout: 5000 });
      console.log(`   ✅ Server Status: ${statusResponse.status}`);
      console.log(`   📊 Uptime: ${statusResponse.data.uptime}s`);
      console.log(`   📊 Environment: ${statusResponse.data.environment}`);
    } catch (error) {
      console.log(`   ❌ Server Status Failed: ${error.message}`);
      if (error.response) {
        console.log(`   📊 Status Code: ${error.response.status}`);
        console.log(`   📊 Response Data: ${JSON.stringify(error.response.data)}`);
      }
    }

  } catch (error) {
    console.log(`❌ Test failed: ${error.message}`);
  }
}

// Run the test
testTTSHealthIsolation(); 