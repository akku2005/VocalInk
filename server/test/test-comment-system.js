const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
// TODO: Replace with actual authentication token obtained from login
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'YOUR_AUTH_TOKEN_HERE';
const USER_ID = '6896524104adc192421fd145';

let createdCommentId = null;
let testBlogId = null;

async function testCommentEndpoint(endpoint, method, data, description) {
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

async function createTestBlog() {
    try {
        console.log('\n📝 Creating a test blog for comment testing...');
        
        const blogData = {
            title: 'Test Blog for Comments',
            content: 'This is a test blog content for testing the comment system.',
            tags: ['test', 'comments', 'api'],
            status: 'published'
        };
        
        const response = await axios.post(`${BASE_URL}/api/blogs`, blogData, {
            headers: {
                'Authorization': `Bearer ${AUTH_TOKEN}`,
                'Content-Type': 'application/json'
            }
        });
        
        if (response.data._id) {
            testBlogId = response.data._id;
            console.log(`✅ Test blog created with ID: ${testBlogId}`);
            return true;
        }
    } catch (error) {
        console.error('❌ Failed to create test blog:', error.response?.data || error.message);
        return false;
    }
}

async function runCommentTests() {
    console.log('💬 Testing Comment System');
    console.log('==========================\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // First, create a test blog
    const blogCreated = await createTestBlog();
    if (!blogCreated) {
        console.log('❌ Cannot test comments without a blog. Exiting...');
        return;
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 1: Get Blog Comments
    totalTests++;
    const getCommentsSuccess = await testCommentEndpoint(
        `/api/comments/blog/${testBlogId}`,
        'GET',
        {},
        '1. Get Blog Comments'
    );
    if (getCommentsSuccess) passedTests++;
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Create Comment
    totalTests++;
    const createCommentData = {
        content: 'This is a test comment for API testing'
    };
    
    const createCommentSuccess = await testCommentEndpoint(
        `/api/comments/blog/${testBlogId}`,
        'POST',
        createCommentData,
        '2. Create Comment'
    );
    
    if (createCommentSuccess) {
        passedTests++;
        // Extract the created comment ID for subsequent tests
        try {
            const response = await axios.get(`${BASE_URL}/api/comments/blog/${testBlogId}`, {
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success && response.data.data.comments.length > 0) {
                createdCommentId = response.data.data.comments[0]._id;
                console.log(`🎯 Created Comment ID: ${createdCommentId}`);
            }
        } catch (error) {
            console.log('⚠️  Could not extract comment ID for subsequent tests');
        }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 3: Update Comment (if we have a comment ID)
    if (createdCommentId) {
        totalTests++;
        const updateCommentData = {
            content: 'This is an updated test comment for API testing'
        };
        
        const updateCommentSuccess = await testCommentEndpoint(
            `/api/comments/${createdCommentId}`,
            'PUT',
            updateCommentData,
            '3. Update Comment'
        );
        if (updateCommentSuccess) passedTests++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 4: Reply to Comment
        totalTests++;
        const replyData = {
            content: 'This is a reply to the test comment'
        };
        
        const replySuccess = await testCommentEndpoint(
            `/api/comments/${createdCommentId}/reply`,
            'POST',
            replyData,
            '4. Reply to Comment'
        );
        if (replySuccess) passedTests++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 5: Delete Comment (cleanup)
        totalTests++;
        const deleteCommentSuccess = await testCommentEndpoint(
            `/api/comments/${createdCommentId}`,
            'DELETE',
            {},
            '5. Delete Comment'
        );
        if (deleteCommentSuccess) passedTests++;
    } else {
        console.log('\n⚠️  Skipping comment-specific tests (no comment created)');
    }
    
    console.log('\n📊 Comment System Test Results');
    console.log('==============================');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All comment system endpoints are working perfectly!');
    } else if (passedTests > 0) {
        console.log('\n⚠️  Some comment endpoints are working, but there are issues with others.');
        console.log('🔧 This is normal during development - some features may need configuration.');
    } else {
        console.log('\n❌ No comment endpoints are working. Please check server configuration.');
    }
}

// Run the comment tests
runCommentTests().catch(console.error); 