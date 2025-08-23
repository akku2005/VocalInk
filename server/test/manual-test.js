const request = require('supertest');
const mongoose = require('mongoose');
const app = require('./src/app');
const User = require('./src/models/user.model');
const Series = require('./src/models/series.model');
const Blog = require('./src/models/blog.model');
const JWTService = require('./src/services/JWTService');

// Test configuration
const TEST_CONFIG = {
  baseUrl: 'http://localhost:5000',
  testUser: {
    name: 'Test User',
    email: 'test@example.com',
    password: 'password123',
    role: 'writer'
  }
};

class ManualTester {
  constructor() {
    this.authToken = null;
    this.testUser = null;
    this.testBlog = null;
    this.testSeries = null;
  }

  async setup() {
    console.log('🔧 Setting up test environment...');
    
    // Create test user
    this.testUser = new User(TEST_CONFIG.testUser);
    await this.testUser.save();
    
    // Generate auth token
    this.authToken = await JWTService.generateAccessToken({ userId: this.testUser._id });
    
    // Create test blog
    this.testBlog = new Blog({
      title: 'Test Blog Post',
      content: 'This is a test blog post content.',
      summary: 'Test summary',
      author: this.testUser._id,
      status: 'published'
    });
    await this.testBlog.save();
    
    console.log('✅ Test environment setup complete');
  }

  async cleanup() {
    console.log('🧹 Cleaning up test data...');
    await User.deleteMany({ email: TEST_CONFIG.testUser.email });
    await Series.deleteMany({});
    await Blog.deleteMany({});
    console.log('✅ Cleanup complete');
  }

  async testSeriesCreation() {
    console.log('\n📝 Testing Series Creation...');
    
    const seriesData = {
      title: 'JavaScript Mastery',
      description: 'Complete guide to modern JavaScript development',
      category: 'Programming',
      template: 'educational_course',
      visibility: 'public',
      tags: ['javascript', 'programming', 'web-development'],
      monetization: {
        model: 'free'
      }
    };

    try {
      const response = await request(app)
        .post('/api/series')
        .set('Authorization', `Bearer ${this.authToken}`)
        .send(seriesData);

      if (response.status === 201) {
        console.log('✅ Series creation successful');
        this.testSeries = response.body.data;
        return this.testSeries;
      } else {
        console.log('❌ Series creation failed:', response.body);
        return null;
      }
    } catch (error) {
      console.log('❌ Series creation error:', error.message);
      return null;
    }
  }

  async testGetSeries() {
    console.log('\n📖 Testing Get Series...');
    
    try {
      const response = await request(app)
        .get('/api/series')
        .set('Authorization', `Bearer ${this.authToken}`);

      if (response.status === 200) {
        console.log('✅ Get series successful');
        console.log(`📊 Found ${response.body.data.length} series`);
        return response.body.data;
      } else {
        console.log('❌ Get series failed:', response.body);
        return null;
      }
    } catch (error) {
      console.log('❌ Get series error:', error.message);
      return null;
    }
  }

  async testAddEpisode() {
    console.log('\n➕ Testing Add Episode...');
    
    if (!this.testSeries) {
      console.log('❌ No test series available');
      return null;
    }

    const episodeData = {
      blogId: this.testBlog._id.toString(),
      order: 1,
      title: 'Episode 1: Introduction to JavaScript',
      status: 'published',
      estimatedReadTime: 15,
      isPremium: false
    };

    try {
      const response = await request(app)
        .post(`/api/series/${this.testSeries._id}/episodes`)
        .set('Authorization', `Bearer ${this.authToken}`)
        .send(episodeData);

      if (response.status === 201) {
        console.log('✅ Add episode successful');
        return response.body.data;
      } else {
        console.log('❌ Add episode failed:', response.body);
        return null;
      }
    } catch (error) {
      console.log('❌ Add episode error:', error.message);
      return null;
    }
  }

  async testUpdateProgress() {
    console.log('\n📈 Testing Progress Update...');
    
    if (!this.testSeries) {
      console.log('❌ No test series available');
      return null;
    }

    const progressData = {
      episodeId: this.testBlog._id.toString(),
      progress: 75,
      timeSpent: 300
    };

    try {
      const response = await request(app)
        .post(`/api/series/${this.testSeries._id}/progress`)
        .set('Authorization', `Bearer ${this.authToken}`)
        .send(progressData);

      if (response.status === 200) {
        console.log('✅ Progress update successful');
        return response.body.data;
      } else {
        console.log('❌ Progress update failed:', response.body);
        return null;
      }
    } catch (error) {
      console.log('❌ Progress update error:', error.message);
      return null;
    }
  }

  async testAddBookmark() {
    console.log('\n🔖 Testing Add Bookmark...');
    
    if (!this.testSeries) {
      console.log('❌ No test series available');
      return null;
    }

    const bookmarkData = {
      episodeId: this.testBlog._id.toString(),
      position: 1500,
      note: 'Important point about JavaScript fundamentals'
    };

    try {
      const response = await request(app)
        .post(`/api/series/${this.testSeries._id}/bookmarks`)
        .set('Authorization', `Bearer ${this.authToken}`)
        .send(bookmarkData);

      if (response.status === 200) {
        console.log('✅ Add bookmark successful');
        return response.body.data;
      } else {
        console.log('❌ Add bookmark failed:', response.body);
        return null;
      }
    } catch (error) {
      console.log('❌ Add bookmark error:', error.message);
      return null;
    }
  }

  async testGetAnalytics() {
    console.log('\n📊 Testing Get Analytics...');
    
    if (!this.testSeries) {
      console.log('❌ No test series available');
      return null;
    }

    try {
      const response = await request(app)
        .get(`/api/series/${this.testSeries._id}/analytics`)
        .set('Authorization', `Bearer ${this.authToken}`);

      if (response.status === 200) {
        console.log('✅ Get analytics successful');
        console.log('📈 Analytics data:', JSON.stringify(response.body.data, null, 2));
        return response.body.data;
      } else {
        console.log('❌ Get analytics failed:', response.body);
        return null;
      }
    } catch (error) {
      console.log('❌ Get analytics error:', error.message);
      return null;
    }
  }

  async runAllTests() {
    console.log('🚀 Starting Manual API Tests');
    console.log('==============================\n');

    try {
      // Setup
      await this.setup();

      // Test 1: Series Creation
      await this.testSeriesCreation();

      // Test 2: Get Series
      await this.testGetSeries();

      // Test 3: Add Episode
      await this.testAddEpisode();

      // Test 4: Update Progress
      await this.testUpdateProgress();

      // Test 5: Add Bookmark
      await this.testAddBookmark();

      // Test 6: Get Analytics
      await this.testGetAnalytics();

      console.log('\n🎉 All manual tests completed!');
      
    } catch (error) {
      console.error('💥 Test execution failed:', error.message);
    } finally {
      // Cleanup
      await this.cleanup();
    }
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new ManualTester();
  tester.runAllTests();
}

module.exports = ManualTester; 