const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODk2NTI0MTA0YWRjMTkyNDIxZmQxNDUiLCJlbWFpbCI6ImFzYWthc2hzYWh1MjBAZ21haWwuY29tIiwicm9sZSI6InJlYWRlciIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NTQ2ODQwODUsImV4cCI6MTc1NDc3MDQ4NSwiYXVkIjoiYWthc2giLCJpc3MiOiJha2FzaCJ9.D_D0HH-4StqeTksCQG_LLiZV3scvbRukQGgEC_Dk0y4';
const USER_ID = '6896524104adc192421fd145';

async function testBadgeEndpoint(endpoint, method, data, description) {
    try {
        console.log(`\n🧪 Testing: ${description}`);
        console.log(`📍 Endpoint: ${method} ${endpoint}`);
        
        const config = {
            method,
            url: `${BASE_URL}${endpoint}`,
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
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

async function runBadgeTests() {
    console.log('🏆 Testing Badge System Endpoints');
    console.log('==================================\n');
    
    const tests = [
        {
            endpoint: '/api/badges',
            method: 'GET',
            data: {},
            description: '1. Get All Badges'
        },
        {
            endpoint: '/api/badges/user/badges',
            method: 'GET',
            data: {},
            description: '2. Get User Badges'
        },
        {
            endpoint: '/api/badges/user/eligible',
            method: 'GET',
            data: {},
            description: '3. Get User Eligible Badges'
        },
        {
            endpoint: '/api/badges/user/claims',
            method: 'GET',
            data: {},
            description: '4. Get User Claim History'
        }
    ];
    
    let passedTests = 0;
    let totalTests = tests.length;
    
    for (const test of tests) {
        const success = await testBadgeEndpoint(
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
    
    // Test badge claiming and specific badge (we'll need to get a badge ID first)
    console.log('\n🔍 Testing Badge Claiming and Specific Badge...');
    try {
        const badgesResponse = await axios.get(`${BASE_URL}/api/badges`, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (badgesResponse.data.success && badgesResponse.data.data.badges.length > 0) {
            const firstBadge = badgesResponse.data.data.badges[0];
            console.log(`🎯 Found badge: ${firstBadge.name} (ID: ${firstBadge._id})`);
            
            // Test getting specific badge
            const specificBadgeSuccess = await testBadgeEndpoint(
                `/api/badges/${firstBadge._id}`,
                'GET',
                {},
                `5. Get Specific Badge: ${firstBadge.name}`
            );
            
            if (specificBadgeSuccess) {
                passedTests++;
            }
            totalTests++;
            
            // Test badge claiming
            const claimSuccess = await testBadgeEndpoint(
                `/api/badges/${firstBadge._id}/claim`,
                'POST',
                {},
                `6. Claim Badge: ${firstBadge.name}`
            );
            
            if (claimSuccess) {
                passedTests++;
            }
            totalTests++;
        } else {
            console.log('⚠️  No badges available for testing');
        }
    } catch (error) {
        console.error('❌ Failed to get badges for testing:', error.response?.data || error.message);
    }
    
    console.log('\n📊 Badge System Test Results');
    console.log('=============================');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All badge system endpoints are working perfectly!');
    } else if (passedTests > 0) {
        console.log('\n⚠️  Some badge endpoints are working, but there are issues with others.');
    } else {
        console.log('\n❌ No badge endpoints are working. Please check server configuration.');
    }
}

// Run the badge tests
runBadgeTests().catch(console.error); 