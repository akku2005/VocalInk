const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
// TODO: Replace with actual authentication token obtained from login
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'YOUR_AUTH_TOKEN_HERE';
const USER_ID = process.env.TEST_USER_ID || 'YOUR_USER_ID_HERE';

async function testXPEndpoint(endpoint, method, data, description) {
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

async function runXPTests() {
    console.log('⭐ Testing XP & Gamification System');
    console.log('====================================\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Test 1: Get User XP
    totalTests++;
    const getUserXPSuccess = await testXPEndpoint(
        '/api/xp/user',
        'GET',
        {},
        '1. Get User XP'
    );
    if (getUserXPSuccess) passedTests++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Get XP History
    totalTests++;
    const getXPHistorySuccess = await testXPEndpoint(
        '/api/xp/history',
        'GET',
        {},
        '2. Get XP History'
    );
    if (getXPHistorySuccess) passedTests++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Get User Stats
    totalTests++;
    const getUserStatsSuccess = await testXPEndpoint(
        '/api/xp/stats',
        'GET',
        {},
        '3. Get User Stats'
    );
    if (getUserStatsSuccess) passedTests++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Get User Rank
    totalTests++;
    const getUserRankSuccess = await testXPEndpoint(
        '/api/xp/rank',
        'GET',
        {},
        '4. Get User Rank'
    );
    if (getUserRankSuccess) passedTests++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 5: Get Leaderboard
    totalTests++;
    const getLeaderboardSuccess = await testXPEndpoint(
        '/api/xp/leaderboard',
        'GET',
        {},
        '5. Get Leaderboard'
    );
    if (getLeaderboardSuccess) passedTests++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 6: Update Gamification Settings
    totalTests++;
    const updateSettingsData = {
        notifications: true,
        soundEffects: false,
        animations: true,
        privacy: 'public'
    };
    
    const updateSettingsSuccess = await testXPEndpoint(
        '/api/xp/settings',
        'PUT',
        updateSettingsData,
        '6. Update Gamification Settings'
    );
    if (updateSettingsSuccess) passedTests++;
    
    console.log('\n📊 XP & Gamification System Test Results');
    console.log('=========================================');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All XP & gamification system endpoints are working perfectly!');
    } else if (passedTests > 0) {
        console.log('\n⚠️  Some XP endpoints are working, but there are issues with others.');
        console.log('🔧 This is normal during development - some features may need configuration.');
    } else {
        console.log('\n❌ No XP endpoints are working. Please check server configuration.');
    }
}

// Run the XP tests
runXPTests().catch(console.error); 