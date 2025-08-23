const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
// TODO: Replace with actual test credentials
const EMAIL = process.env.TEST_EMAIL || 'YOUR_TEST_EMAIL_HERE';
const PASSWORD = process.env.TEST_PASSWORD || 'YOUR_TEST_PASSWORD_HERE';

let authToken = null;

async function login() {
    try {
        console.log('🔐 Logging in...');
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        
        authToken = response.data.accessToken;
        console.log('✅ Login successful!');
        return true;
    } catch (error) {
        console.error('❌ Login failed:', error.response?.data || error.message);
        return false;
    }
}

async function testEndpoint(endpoint, method, data, description) {
    try {
        console.log(`\n🧪 Testing: ${description}`);
        console.log(`📍 Endpoint: ${method} ${endpoint}`);
        
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        };
        
        if (data) {
            if (method === 'GET') {
                config.params = data;
            } else {
                config.data = data;
            }
        }
        
        const response = await axios(config);
        console.log(`✅ Success! Status: ${response.status}`);
        console.log(`📊 Response:`, JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.error(`❌ Failed! Status: ${error.response?.status}`);
        console.error(`📝 Error:`, error.response?.data || error.message);
        return false;
    }
}

async function runTests() {
    console.log('🚀 Starting AI Services Status Test');
    console.log('====================================\n');
    
    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('❌ Cannot proceed without authentication');
        return;
    }
    
    const tests = [
        {
            endpoint: '/api/ai/enhanced/status',
            method: 'GET',
            data: {},
            description: 'AI Service Status'
        },
        {
            endpoint: '/api/ai/tts/voices',
            method: 'GET',
            data: {},
            description: 'Get Available TTS Voices'
        },
        {
            endpoint: '/api/ai/tts/stats',
            method: 'GET',
            data: {},
            description: 'Get TTS Statistics'
        },
        {
            endpoint: '/api/ai/stt/languages',
            method: 'GET',
            data: {},
            description: 'Get Available STT Languages'
        },
        {
            endpoint: '/api/ai/enhanced/search/semantic',
            method: 'GET',
            data: {
                query: 'test',
                contentType: 'blogs',
                limit: 1
            },
            description: 'Semantic Search (Minimal)'
        },
        {
            endpoint: '/api/ai/enhanced/recommendations',
            method: 'GET',
            data: {
                contentType: 'blogs',
                limit: 1
            },
            description: 'Recommendations (Minimal)'
        },
        {
            endpoint: '/api/ai/enhanced/moderation/screen',
            method: 'POST',
            data: {
                content: 'test',
                contentType: 'blog'
            },
            description: 'Moderation (Minimal)'
        }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        const success = await testEndpoint(
            test.endpoint,
            test.method,
            test.data,
            test.description
        );
        
        if (success) {
            passedTests++;
        }
        
        // Add a small delay between tests
        await new Promise(resolve => setTimeout(resolve, 500));
    }
    
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All AI services are working perfectly!');
    } else if (passedTests > 0) {
        console.log('\n⚠️  Some AI services are working, but there are issues with others.');
        console.log('🔧 This is normal during development - some services may need configuration.');
    } else {
        console.log('\n❌ No AI services are working. Please check server configuration.');
    }
}

// Run the tests
runTests().catch(console.error); 