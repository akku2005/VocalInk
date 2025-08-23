const axios = require('axios');

const BASE_URL = 'http://localhost:3000';
// TODO: Replace with actual test credentials
const EMAIL = process.env.TEST_EMAIL || 'YOUR_TEST_EMAIL_HERE';
const PASSWORD = process.env.TEST_PASSWORD || 'YOUR_TEST_PASSWORD_HERE';

async function testLogin() {
    try {
        console.log('🔐 Testing login...');
        console.log(`📧 Email: ${EMAIL}`);
        console.log(`🔑 Password: ${PASSWORD}`);
        
        const response = await axios.post(`${BASE_URL}/api/auth/login`, {
            email: EMAIL,
            password: PASSWORD
        });
        
        console.log('✅ Login successful!');
        console.log('📊 Response:', JSON.stringify(response.data, null, 2));
        return response.data.accessToken;
    } catch (error) {
        console.error('❌ Login failed!');
        console.error('📝 Error details:', error.response?.data || error.message);
        
        // If user doesn't exist, try to register
        if (error.response?.status === 401) {
            console.log('\n🔄 User not found. Trying to register...');
            return await testRegister();
        }
        
        return null;
    }
}

async function testRegister() {
    try {
        console.log('📝 Registering new user...');
        
        const response = await axios.post(`${BASE_URL}/api/auth/register`, {
            email: EMAIL,
            password: PASSWORD,
            name: 'Akash Sahu',
            skipVerification: true // Skip verification for testing
        });
        
        console.log('✅ Registration successful!');
        console.log('📊 Response:', JSON.stringify(response.data, null, 2));
        
        // Try login again after registration
        console.log('\n🔄 Trying login after registration...');
        return await testLogin();
    } catch (error) {
        console.error('❌ Registration failed!');
        console.error('📝 Error details:', error.response?.data || error.message);
        return null;
    }
}

async function testHealth() {
    try {
        console.log('🏥 Testing server health...');
        const response = await axios.get(`${BASE_URL}/health`);
        console.log('✅ Server is healthy!');
        console.log('📊 Response:', JSON.stringify(response.data, null, 2));
        return true;
    } catch (error) {
        console.error('❌ Server health check failed!');
        console.error('📝 Error details:', error.response?.data || error.message);
        return false;
    }
}

async function main() {
    console.log('🚀 Starting Authentication Test');
    console.log('================================\n');
    
    // First check if server is healthy
    const isHealthy = await testHealth();
    if (!isHealthy) {
        console.log('❌ Server is not responding. Please check if the server is running.');
        return;
    }
    
    // Try to login
    const token = await testLogin();
    
    if (token) {
        console.log('\n🎉 Authentication successful!');
        console.log(`🔑 Token: ${token.substring(0, 50)}...`);
    } else {
        console.log('\n❌ Authentication failed. Please check your credentials or server logs.');
    }
}

main().catch(console.error); 