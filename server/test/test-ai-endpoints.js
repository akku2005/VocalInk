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
        
        authToken = response.data.accessToken; // Use accessToken instead of token
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
    console.log('🚀 Starting AI Services System Tests');
    console.log('=====================================\n');
    
    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('❌ Cannot proceed without authentication');
        return;
    }
    
    const tests = [
        {
            endpoint: '/api/ai/tts/generate',
            method: 'POST',
            data: {
                text: 'Hello, this is a test of the text-to-speech service.',
                provider: 'elevenlabs',
                voice: 'en',
                speed: 1.0 // Fixed: Use float value between 0.5 and 3.0
            },
            description: 'Text-to-Speech Generation'
        },
        {
            endpoint: '/api/ai/stt/transcribe',
            method: 'POST',
            data: {
                language: 'en-US',
                format: 'wav'
            },
            description: 'Speech-to-Text Transcription (Note: Requires audio file upload)'
        },
        {
            endpoint: '/api/ai/summary/generate',
            method: 'POST',
            data: {
                content: 'This is a long piece of text that needs to be summarized. It contains multiple sentences and should be condensed into a shorter version while maintaining the key points and important information.',
                maxLength: 100,
                style: 'concise'
            },
            description: 'Content Summary Generation'
        },
        {
            endpoint: '/api/ai/analyze/content',
            method: 'POST',
            data: {
                content: 'This is a sample text for content analysis. It should analyze sentiment, readability, and other metrics.',
                includeSentiment: true,
                includeTopics: true,
                includeReadability: true
            },
            description: 'Content Analysis'
        },
        {
            endpoint: '/api/ai/enhanced/search/semantic',
            method: 'GET',
            data: {
                query: 'artificial intelligence',
                contentType: 'blogs',
                limit: 10
            },
            description: 'Semantic Search (Enhanced)'
        },
        {
            endpoint: '/api/ai/enhanced/recommendations',
            method: 'GET',
            data: {
                contentType: 'blogs',
                limit: 5,
                includeTrending: true
            },
            description: 'Content Recommendations (Enhanced)'
        },
        {
            endpoint: '/api/ai/enhanced/moderation/screen',
            method: 'POST',
            data: {
                content: 'This is a clean piece of content that should pass moderation.',
                contentType: 'blog'
            },
            description: 'Content Moderation (Enhanced)'
        },
        {
            endpoint: '/api/ai/enhanced/status',
            method: 'GET',
            data: {},
            description: 'AI Service Status'
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
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All tests passed! The AI Services System is working perfectly.');
    } else {
        console.log('\n⚠️  Some tests failed. Please check the server logs for more details.');
    }
}

// Run the tests
runTests().catch(console.error); 