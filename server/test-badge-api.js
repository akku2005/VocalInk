const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const EMAIL = 'asakashsahu20@gmail.com';
const PASSWORD = 'Akash@2001';

let authToken = null;
let userId = null;

async function login() {
    try {
        console.log('🔐 Logging in...');
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        
        authToken = response.data.accessToken;
        userId = response.data.user.id;
        console.log('✅ Login successful!');
        console.log(`👤 User ID: ${userId}`);
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
    console.log('🏆 Starting Badge System API Tests');
    console.log('===================================\n');
    
    // Login first
    const loginSuccess = await login();
    if (!loginSuccess) {
        console.log('❌ Cannot proceed without authentication');
        return;
    }
    
    const tests = [
        {
            endpoint: '/api/badges',
            method: 'GET',
            data: {},
            description: 'Get All Badges'
        },
        {
            endpoint: `/api/badges/user/${userId}`,
            method: 'GET',
            data: {},
            description: 'Get User Badges'
        },
        {
            endpoint: `/api/badges/progress/${userId}`,
            method: 'GET',
            data: {},
            description: 'Get Badge Progress'
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
    
    // Test badge claiming (we'll need to get a badge ID first)
    console.log('\n🔍 Getting available badges for claiming test...');
    try {
        const badgesResponse = await axios.get(`${BASE_URL}/api/badges`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (badgesResponse.data.success && badgesResponse.data.data.length > 0) {
            const firstBadge = badgesResponse.data.data[0];
            console.log(`🎯 Found badge: ${firstBadge.name} (ID: ${firstBadge._id})`);
            
            // Test badge claiming
            const claimSuccess = await testEndpoint(
                `/api/badges/claim/${firstBadge._id}`,
                'POST',
                {},
                `Claim Badge: ${firstBadge.name}`
            );
            
            if (claimSuccess) {
                passedTests++;
            }
            totalTests++;
        } else {
            console.log('⚠️  No badges available for claiming test');
        }
    } catch (error) {
        console.error('❌ Failed to get badges for claiming test:', error.response?.data || error.message);
    }
    
    // Test getting specific badge (we'll use the first badge ID)
    try {
        const badgesResponse = await axios.get(`${BASE_URL}/api/badges`, {
            headers: {
                'Authorization': `Bearer ${authToken}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (badgesResponse.data.success && badgesResponse.data.data.length > 0) {
            const firstBadge = badgesResponse.data.data[0];
            
            const specificBadgeSuccess = await testEndpoint(
                `/api/badges/${firstBadge._id}`,
                'GET',
                {},
                `Get Specific Badge: ${firstBadge.name}`
            );
            
            if (specificBadgeSuccess) {
                passedTests++;
            }
            totalTests++;
        }
    } catch (error) {
        console.error('❌ Failed to get specific badge:', error.response?.data || error.message);
    }
    
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All badge system tests passed! The Badge System is working perfectly.');
    } else if (passedTests > 0) {
        console.log('\n⚠️  Some badge tests passed, but there are issues with others.');
        console.log('🔧 This is normal during development - some features may need configuration.');
    } else {
        console.log('\n❌ No badge tests passed. Please check server configuration.');
    }
}

// Run the tests
runTests().catch(console.error); 