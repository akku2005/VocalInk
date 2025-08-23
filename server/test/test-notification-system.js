const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
// TODO: Replace with actual authentication token obtained from login
const AUTH_TOKEN = process.env.TEST_AUTH_TOKEN || 'YOUR_AUTH_TOKEN_HERE';
const USER_ID = '6896524104adc192421fd145';

let createdNotificationId = null;

async function testNotificationEndpoint(endpoint, method, data, description) {
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

async function runNotificationTests() {
    console.log('🔔 Testing Notification System');
    console.log('==============================\n');
    
    let passedTests = 0;
    let totalTests = 0;
    
    // Test 1: Get User Notifications
    totalTests++;
    const getNotificationsSuccess = await testNotificationEndpoint(
        '/api/notifications',
        'GET',
        {},
        '1. Get User Notifications'
    );
    if (getNotificationsSuccess) {
        passedTests++;
        // Extract the first notification ID for subsequent tests
        try {
            const response = await axios.get(`${BASE_URL}/api/notifications`, {
                headers: {
                    'Authorization': `Bearer ${AUTH_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.data.success && response.data.data.notifications.length > 0) {
                createdNotificationId = response.data.data.notifications[0]._id;
                console.log(`🎯 Found Notification ID: ${createdNotificationId}`);
            }
        } catch (error) {
            console.log('⚠️  Could not extract notification ID for subsequent tests');
        }
    }
    
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Test 2: Mark Notification as Read (if we have a notification ID)
    if (createdNotificationId) {
        totalTests++;
        const markReadSuccess = await testNotificationEndpoint(
            `/api/notifications/${createdNotificationId}/read`,
            'PATCH',
            {},
            '2. Mark Notification as Read'
        );
        if (markReadSuccess) passedTests++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 3: Mark All Notifications as Read
        totalTests++;
        const markAllReadSuccess = await testNotificationEndpoint(
            '/api/notifications/read-all',
            'PATCH',
            {},
            '3. Mark All Notifications as Read'
        );
        if (markAllReadSuccess) passedTests++;
        
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        // Test 4: Delete Notification (cleanup)
        totalTests++;
        const deleteNotificationSuccess = await testNotificationEndpoint(
            `/api/notifications/${createdNotificationId}`,
            'DELETE',
            {},
            '4. Delete Notification'
        );
        if (deleteNotificationSuccess) passedTests++;
    } else {
        console.log('\n⚠️  Skipping notification-specific tests (no notification found)');
    }
    
    console.log('\n📊 Notification System Test Results');
    console.log('===================================');
    console.log(`✅ Passed: ${passedTests}/${totalTests}`);
    console.log(`❌ Failed: ${totalTests - passedTests}/${totalTests}`);
    console.log(`📈 Success Rate: ${((passedTests / totalTests) * 100).toFixed(1)}%`);
    
    if (passedTests === totalTests) {
        console.log('\n🎉 All notification system endpoints are working perfectly!');
    } else if (passedTests > 0) {
        console.log('\n⚠️  Some notification endpoints are working, but there are issues with others.');
        console.log('🔧 This is normal during development - some features may need configuration.');
    } else {
        console.log('\n❌ No notification endpoints are working. Please check server configuration.');
    }
}

// Run the notification tests
runNotificationTests().catch(console.error); 