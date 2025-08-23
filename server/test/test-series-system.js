const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
// TODO: Replace with actual authentication token obtained from login
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'YOUR_AUTH_TOKEN_HERE';
const USER_ID = '6896524104adc192421fd145';

let createdSeriesId = null;

async function testSeriesEndpoint(endpoint, method, data, description) {
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

async function runSeriesTests() {
    console.log('📚 Testing Series Management System');
    console.log('===================================\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Test 1: Get All Series
    totalTests++;
    const getAllSeriesSuccess = await testSeriesEndpoint(
        '/api/series',
        'GET',
        {},
        '1. Get All Series'
    );
    if (getAllSeriesSuccess) passedTests++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Create Series
    totalTests++;
    const createSeriesData = {
        title: 'Test Series',
        description: 'A test series for API testing',
        category: 'technology',
        tags: ['test', 'api', 'series'],
        isPublic: true,
        coverImage: 'https://example.com/cover.jpg'
    };
    
    const createSeriesSuccess = await testSeriesEndpoint(
        '/api/series',
        'POST',
        createSeriesData,
        '2. Create Series'
    );
    
    if (createSeriesSuccess) {
        passedTests++;
        // Extract the created series ID for subsequent tests
        try {
            const response = await axios.get(`${BASE_URL}/api/series`, {
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success && response.data.data.length > 0) {
                createdSeriesId = response.data.data[0]._id;
                console.log(`🎯 Created Series ID: ${createdSeriesId}`);
            }
        } catch (error) {
            console.log('⚠️  Could not extract series ID for subsequent tests');
        }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Get Specific Series (if we have a series ID)
    if (createdSeriesId) {
        totalTests++;
        const getSpecificSeriesSuccess = await testSeriesEndpoint(
            `/api/series/${createdSeriesId}`,
            'GET',
            {},
            '3. Get Specific Series'
        );
        if (getSpecificSeriesSuccess) passedTests++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 4: Update Series
        totalTests++;
        const updateSeriesData = {
            title: 'Updated Test Series',
            description: 'An updated test series for API testing',
            category: 'technology',
            tags: ['test', 'api', 'series', 'updated'],
            isPublic: true
        };
        
        const updateSeriesSuccess = await testSeriesEndpoint(
            `/api/series/${createdSeriesId}`,
            'PUT',
            updateSeriesData,
            '4. Update Series'
        );
        if (updateSeriesSuccess) passedTests++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 5: Add Episode to Series (CORRECTED ENDPOINT)
        totalTests++;
        const addEpisodeData = {
            blogId: 'test-blog-id', // This would be a real blog ID in practice
            order: 1,
            title: 'Test Episode 1'
        };
        
        const addEpisodeSuccess = await testSeriesEndpoint(
            `/api/series/${createdSeriesId}/episodes`,
            'POST',
            addEpisodeData,
            '5. Add Episode to Series'
        );
        if (addEpisodeSuccess) passedTests++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 6: Get Series Progress
        totalTests++;
        const getProgressSuccess = await testSeriesEndpoint(
            `/api/series/${createdSeriesId}/progress`,
            'GET',
            {},
            '6. Get Series Progress'
        );
        if (getProgressSuccess) passedTests++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 7: Delete Series (cleanup)
        totalTests++;
        const deleteSeriesSuccess = await testSeriesEndpoint(
            `/api/series/${createdSeriesId}`,
            'DELETE',
            {},
            '7. Delete Series'
        );
        if (deleteSeriesSuccess) passedTests++;
    } else {
        console.log('\n⚠️  Skipping series-specific tests (no series created)');
    }
    
    console.log('\n📊 Series Management Test Results');
    console.log('==================================');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All series management endpoints are working perfectly!');
    } else if (passedTests > 0) {
        console.log('\n⚠️  Some series endpoints are working, but there are issues with others.');
        console.log('🔧 This is normal during development - some features may need configuration.');
    } else {
        console.log('\n❌ No series endpoints are working. Please check server configuration.');
    }
}

// Run the series tests
runSeriesTests().catch(console.error); 