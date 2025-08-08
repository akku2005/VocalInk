const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
const AUTH_TOKEN = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI2ODk2NTI0MTA0YWRjMTkyNDIxZmQxNDUiLCJlbWFpbCI6ImFzYWthc2hzYWh1MjBAZ21haWwuY29tIiwicm9sZSI6InJlYWRlciIsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NTQ2ODQwODUsImV4cCI6MTc1NDc3MDQ4NSwiYXVkIjoiYWthc2giLCJpc3MiOiJha2FzaCJ9.D_D0HH-4StqeTksCQG_LLiZV3scvbRukQGgEC_Dk0y4';

async function testEndpoint(endpoint, method, data, description) {
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

async function runTests() {
    console.log('🔧 Testing Fixes');
    console.log('================\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Test 1: Get All Badges (should now have data)
    totalTests++;
    const badgesSuccess = await testEndpoint(
        '/api/badges',
        'GET',
        {},
        '1. Get All Badges (with populated data)'
    );
    if (badgesSuccess) passedTests++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Get User Badge Progress
    totalTests++;
    const progressSuccess = await testEndpoint(
        '/api/badges/user/progress',
        'GET',
        {},
        '2. Get User Badge Progress'
    );
    if (progressSuccess) passedTests++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Create Abuse Report (should work now)
    totalTests++;
    const reportData = {
        targetType: 'blog',
        targetId: '68966130f0dd910a625ff6c3', // Use the blog we created
        category: 'inappropriate_content',
        subcategory: 'offensive_content',
        title: 'Test Abuse Report',
        description: 'This is a test abuse report for testing the reporting system',
        evidence: [
            {
                type: 'text',
                content: 'Sample evidence for testing'
            }
        ],
        severity: 'medium'
    };
    
    const reportSuccess = await testEndpoint(
        '/api/abusereports',
        'POST',
        reportData,
        '3. Create Abuse Report (fixed reportId issue)'
    );
    if (reportSuccess) passedTests++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Get User Reports
    totalTests++;
    const userReportsSuccess = await testEndpoint(
        '/api/abusereports/my-reports',
        'GET',
        {},
        '4. Get User Reports'
    );
    if (userReportsSuccess) passedTests++;
    
    console.log('\n📊 Test Results');
    console.log('===============');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All fixes working perfectly!');
    } else {
        console.log('\n⚠️  Some issues still need attention');
    }
}

runTests().catch(console.error); 