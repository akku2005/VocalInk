const axios = require('axios');
const mongoose = require('mongoose');
require('dotenv').config();

const BASE_URL = 'http://localhost:3000/api';
let authToken = '';
let testBlogId = '';

// Test data
const testBlog = {
  title: 'Test Blog Post for Enhanced Features',
  content: 'This is a comprehensive test blog post to verify all the new features including AI summary generation, slug creation, mood classification, and tag support. The content should be long enough to generate a meaningful summary.',
  tags: ['test', 'enhancement', 'ai'],
  mood: 'Educational',
  status: 'draft'
};

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/vocalink');
    console.log('✅ Connected to MongoDB');
  } catch (error) {
    console.error('❌ MongoDB connection failed:', error.message);
    process.exit(1);
  }
}

async function login() {
  try {
    // You'll need to create a test user first or use existing credentials
    const response = await axios.post(`${BASE_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'testpassword123'
    });
    
    authToken = response.data.token;
    console.log('✅ Login successful');
  } catch (error) {
    console.log('⚠️  Login failed, continuing without auth (some tests will be skipped)');
    console.log('   Create a test user or update credentials in this script');
  }
}

async function testCreateBlog() {
  try {
    console.log('\n📝 Testing blog creation...');
    
    const response = await axios.post(`${BASE_URL}/blogs`, testBlog, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    testBlogId = response.data._id;
    console.log('✅ Blog created successfully');
    console.log(`   ID: ${testBlogId}`);
    console.log(`   Slug: ${response.data.slug}`);
    console.log(`   Summary: ${response.data.summary?.substring(0, 100)}...`);
    console.log(`   Mood: ${response.data.mood}`);
    console.log(`   Status: ${response.data.status}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Blog creation failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetBlogs() {
  try {
    console.log('\n📋 Testing blog listing with filters...');
    
    // Test basic listing
    const response = await axios.get(`${BASE_URL}/blogs?limit=5`);
    console.log('✅ Blog listing successful');
    console.log(`   Found ${response.data.length} blogs`);
    
    // Test with filters
    const filteredResponse = await axios.get(`${BASE_URL}/blogs?mood=Educational&limit=5`);
    console.log('✅ Filtered blog listing successful');
    console.log(`   Found ${filteredResponse.data.length} Educational blogs`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Blog listing failed:', error.response?.data || error.message);
    return null;
  }
}

async function testGetBlogBySlug() {
  if (!testBlogId) {
    console.log('⚠️  Skipping slug test - no blog created');
    return;
  }
  
  try {
    console.log('\n🔗 Testing blog retrieval by slug...');
    
    // First get the blog to get its slug
    const blogResponse = await axios.get(`${BASE_URL}/blogs/${testBlogId}`);
    const slug = blogResponse.data.slug;
    
    // Test slug retrieval
    const response = await axios.get(`${BASE_URL}/blogs/slug/${slug}`);
    console.log('✅ Blog retrieval by slug successful');
    console.log(`   Retrieved blog: ${response.data.title}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Blog retrieval by slug failed:', error.response?.data || error.message);
    return null;
  }
}

async function testRegenerateSummary() {
  if (!testBlogId || !authToken) {
    console.log('⚠️  Skipping summary regeneration test - no blog or auth');
    return;
  }
  
  try {
    console.log('\n🤖 Testing AI summary regeneration...');
    
    const response = await axios.post(`${BASE_URL}/blogs/${testBlogId}/summary`, {
      maxLength: 200,
      style: 'engaging'
    }, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Summary regeneration successful');
    console.log(`   New summary: ${response.data.summary}`);
    console.log(`   Provider: ${response.data.provider}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Summary regeneration failed:', error.response?.data || error.message);
    return null;
  }
}

async function testPublishBlog() {
  if (!testBlogId || !authToken) {
    console.log('⚠️  Skipping publish test - no blog or auth');
    return;
  }
  
  try {
    console.log('\n📢 Testing blog publishing...');
    
    const response = await axios.put(`${BASE_URL}/blogs/${testBlogId}/publish`, {}, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Blog publishing successful');
    console.log(`   Published at: ${response.data.publishedAt}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Blog publishing failed:', error.response?.data || error.message);
    return null;
  }
}

async function testUpdateBlog() {
  if (!testBlogId || !authToken) {
    console.log('⚠️  Skipping update test - no blog or auth');
    return;
  }
  
  try {
    console.log('\n✏️  Testing blog update...');
    
    const updateData = {
      title: 'Updated Test Blog Post',
      tags: ['test', 'enhancement', 'ai', 'updated'],
      mood: 'Thoughtful'
    };
    
    const response = await axios.put(`${BASE_URL}/blogs/${testBlogId}`, updateData, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Blog update successful');
    console.log(`   New title: ${response.data.title}`);
    console.log(`   New slug: ${response.data.slug}`);
    console.log(`   New mood: ${response.data.mood}`);
    
    return response.data;
  } catch (error) {
    console.error('❌ Blog update failed:', error.response?.data || error.message);
    return null;
  }
}

async function cleanup() {
  if (!testBlogId || !authToken) {
    console.log('⚠️  Skipping cleanup - no blog or auth');
    return;
  }
  
  try {
    console.log('\n🧹 Cleaning up test blog...');
    
    await axios.delete(`${BASE_URL}/blogs/${testBlogId}`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    console.log('✅ Test blog deleted successfully');
  } catch (error) {
    console.error('❌ Cleanup failed:', error.response?.data || error.message);
  }
}

async function runTests() {
  console.log('🚀 Starting Blog Enhancement Tests\n');
  
  await connectDB();
  await login();
  
  await testCreateBlog();
  await testGetBlogs();
  await testGetBlogBySlug();
  await testRegenerateSummary();
  await testUpdateBlog();
  await testPublishBlog();
  
  await cleanup();
  
  console.log('\n✨ All tests completed!');
  process.exit(0);
}

// Handle errors
process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled rejection:', error);
  process.exit(1);
});

process.on('SIGINT', async () => {
  console.log('\n🛑 Tests interrupted');
  await cleanup();
  process.exit(0);
});

// Run tests
runTests().catch(console.error);
