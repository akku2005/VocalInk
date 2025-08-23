const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
// TODO: Replace with actual authentication token obtained from login
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'YOUR_AUTH_TOKEN_HERE';
const USER_ID = '6896524104adc192421fd145';

let createdBlogId = null;
let createdSeriesId = null;
let createdBadgeId = null;
let createdReportId = null;

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

async function populateData() {
    console.log('🚀 Populating Test Data');
    console.log('========================\n');
    
    // Step 1: Create a test blog
    console.log('📝 Creating test blog...');
    const blogData = {
        title: 'Test Blog for Data Population',
        content: 'This is a test blog for populating data and testing various systems.',
        tags: ['test', 'data', 'population'],
        status: 'published'
    };
    
    const blogResponse = await axios.post(`${BASE_URL}/api/blogs`, blogData, {
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (blogResponse.data._id) {
        createdBlogId = blogResponse.data._id;
        console.log(`✅ Test blog created with ID: ${createdBlogId}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 2: Create a test series
    console.log('📚 Creating test series...');
    const seriesData = {
        title: 'Test Series for Progress Tracking',
        description: 'A test series for testing progress tracking functionality',
        category: 'technology',
        tags: ['test', 'series', 'progress'],
        isPublic: true
    };
    
    const seriesResponse = await axios.post(`${BASE_URL}/api/series`, seriesData, {
        headers: {
            'Authorization': `Bearer ${AUTH_TOKEN}`,
            'Content-Type': 'application/json'
        }
    });
    
    if (seriesResponse.data.success) {
        createdSeriesId = seriesResponse.data.data._id;
        console.log(`✅ Test series created with ID: ${createdSeriesId}`);
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 3: Create a test badge (if badge creation endpoint exists)
    console.log('🏆 Creating test badge...');
    const badgeData = {
        name: 'Test Badge',
        description: 'A test badge for testing badge functionality',
        category: 'achievement',
        requirements: {
            xpRequired: 100,
            blogsRequired: 1
        },
        icon: 'test-icon.png',
        rarity: 'common'
    };
    
    try {
        const badgeResponse = await axios.post(`${BASE_URL}/api/badges`, badgeData, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (badgeResponse.data.success) {
            createdBadgeId = badgeResponse.data.data._id;
            console.log(`✅ Test badge created with ID: ${createdBadgeId}`);
        }
    } catch (error) {
        console.log('⚠️  Badge creation endpoint not available, using existing badges');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Step 4: Create a test abuse report
    console.log('🚨 Creating test abuse report...');
    const reportData = {
        targetType: 'blog',
        targetId: createdBlogId,
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
    
    try {
        const reportResponse = await axios.post(`${BASE_URL}/api/abusereports`, reportData, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (reportResponse.data.success) {
            createdReportId = reportResponse.data.data.reportId;
            console.log(`✅ Test abuse report created with ID: ${createdReportId}`);
        }
    } catch (error) {
        console.log('⚠️  Abuse report creation failed, will test with existing data');
    }
    
    console.log('\n✅ Data population completed!');
    console.log(`📝 Created Blog ID: ${createdBlogId}`);
    console.log(`📚 Created Series ID: ${createdSeriesId}`);
    console.log(`🏆 Created Badge ID: ${createdBadgeId}`);
    console.log(`🚨 Created Report ID: ${createdReportId}`);
}

async function testBadgeSystem() {
    console.log('\n🏆 Testing Badge System');
    console.log('=======================\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Test 1: Get All Badges
    totalTests++;
    const getBadgesSuccess = await testEndpoint(
        '/api/badges',
        'GET',
        {},
        '1. Get All Badges'
    );
    if (getBadgesSuccess) passedTests++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Get Specific Badge (if we have a badge ID)
    if (createdBadgeId) {
        totalTests++;
        const getBadgeSuccess = await testEndpoint(
            `/api/badges/${createdBadgeId}`,
            'GET',
            {},
            '2. Get Specific Badge'
        );
        if (getBadgeSuccess) passedTests++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 3: Claim Badge
        totalTests++;
        const claimBadgeSuccess = await testEndpoint(
            `/api/badges/${createdBadgeId}/claim`,
            'POST',
            {},
            '3. Claim Badge'
        );
        if (claimBadgeSuccess) passedTests++;
    } else {
        console.log('\n⚠️  Skipping badge-specific tests (no badge created)');
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 4: Get User Badges
    totalTests++;
    const getUserBadgesSuccess = await testEndpoint(
        '/api/badges/user/badges',
        'GET',
        {},
        '4. Get User Badges'
    );
    if (getUserBadgesSuccess) passedTests++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 5: Get User Badge Progress
    totalTests++;
    const getBadgeProgressSuccess = await testEndpoint(
        '/api/badges/user/progress',
        'GET',
        {},
        '5. Get User Badge Progress'
    );
    if (getBadgeProgressSuccess) passedTests++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 6: Get Specific Badge (if we have badges)
    totalTests++;
    const getSpecificBadgeSuccess = await testEndpoint(
        '/api/badges',
        'GET',
        {},
        '6. Get All Badges (should now have data)'
    );
    if (getSpecificBadgeSuccess) passedTests++;
    
    console.log('\n📊 Badge System Test Results');
    console.log('=============================');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
}

async function testSeriesProgress() {
    console.log('\n📚 Testing Series Progress System');
    console.log('==================================\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Test 1: Get Series Progress (if we have a series ID)
    if (createdSeriesId) {
        totalTests++;
        const getProgressSuccess = await testEndpoint(
            `/api/series/${createdSeriesId}/progress`,
            'GET',
            {},
            '1. Get Series Progress'
        );
        if (getProgressSuccess) passedTests++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 2: Update Series Progress
        totalTests++;
        const updateProgressData = {
            episodeId: createdBlogId, // Using blog as episode
            progress: 50,
            timeSpent: 300 // 5 minutes
        };
        
        const updateProgressSuccess = await testEndpoint(
            `/api/series/${createdSeriesId}/progress`,
            'POST',
            updateProgressData,
            '2. Update Series Progress'
        );
        if (updateProgressSuccess) passedTests++;
    } else {
        console.log('\n⚠️  Skipping series progress tests (no series created)');
    }
    
    console.log('\n📊 Series Progress Test Results');
    console.log('===============================');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
}

async function testAbuseReports() {
    console.log('\n🚨 Testing Abuse Reports System');
    console.log('===============================\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Test 1: Create Abuse Report (if not already created)
    if (!createdReportId) {
        totalTests++;
        const reportData = {
            targetType: 'blog',
            targetId: createdBlogId || 'test-blog-id',
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
        
        const createReportSuccess = await testEndpoint(
            '/api/abusereports',
            'POST',
            reportData,
            '1. Create Abuse Report'
        );
        if (createReportSuccess) passedTests++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    // Test 2: Get User's Reports (if any exist)
    totalTests++;
    const getUserReportsSuccess = await testEndpoint(
        '/api/abusereports/my-reports',
        'GET',
        {},
        '2. Get User Reports'
    );
    if (getUserReportsSuccess) passedTests++;
    
    console.log('\n📊 Abuse Reports Test Results');
    console.log('=============================');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
}

async function runAllTests() {
    console.log('🎯 Comprehensive System Testing');
    console.log('===============================\n');
    
    // First, populate data
    await populateData();
    
    // Then test each system
    await testBadgeSystem();
    await testSeriesProgress();
    await testAbuseReports();
    
    console.log('\n🎉 All tests completed!');
    console.log('📋 Summary of created data:');
    console.log(`   📝 Blog ID: ${createdBlogId}`);
    console.log(`   📚 Series ID: ${createdSeriesId}`);
    console.log(`   🏆 Badge ID: ${createdBadgeId}`);
    console.log(`   🚨 Report ID: ${createdReportId}`);
}

// Run all tests
runAllTests().catch(console.error); 