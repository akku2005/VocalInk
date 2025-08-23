const axios = require('axios');
const logger = require('./src/utils/logger');

const BASE_URL = 'http://localhost:3000/api';
// TODO: Replace with actual authentication token obtained from login
const TEST_USER_TOKEN = process.env.TEST_AUTH_TOKEN || 'YOUR_AUTH_TOKEN_HERE';

class TTSTester {
  constructor() {
    this.testResults = [];
    this.errors = [];
  }

  async log(message, data = null) {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${message}`);
    if (data) {
      console.log(JSON.stringify(data, null, 2));
    }
    console.log('---');
  }

  async testHealthCheck() {
    try {
      this.log('🧪 Testing TTS Health Check...');
      
      const response = await axios.get(`${BASE_URL}/tts/health`);
      
      if (response.status === 200) {
        this.log('✅ Health Check PASSED', response.data);
        this.testResults.push({ test: 'Health Check', status: 'PASSED' });
        return response.data;
      } else {
        throw new Error(`Health check failed with status ${response.status}`);
      }
    } catch (error) {
      this.log('❌ Health Check FAILED', { error: error.message });
      this.testResults.push({ test: 'Health Check', status: 'FAILED', error: error.message });
      this.errors.push(error);
    }
  }

  async testGetVoices() {
    try {
      this.log('🧪 Testing Get Available Voices...');
      
      const response = await axios.get(`${BASE_URL}/tts/voices?provider=elevenlabs`);
      
      if (response.status === 200) {
        this.log('✅ Get Voices PASSED', response.data);
        this.testResults.push({ test: 'Get Voices', status: 'PASSED' });
        return response.data;
      } else {
        throw new Error(`Get voices failed with status ${response.status}`);
      }
    } catch (error) {
      this.log('❌ Get Voices FAILED', { error: error.message });
      this.testResults.push({ test: 'Get Voices', status: 'FAILED', error: error.message });
      this.errors.push(error);
    }
  }

  async testGenerateTTSImmediate() {
    try {
      this.log('🧪 Testing TTS Generation (Immediate Mode)...');
      
      const testData = {
        text: "Hello, this is a test message for TTS generation.",
        provider: "espeak",
        voice: "en",
        speed: 150
      };
      
      const response = await axios.post(`${BASE_URL}/tts/generate`, testData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_USER_TOKEN}`
        }
      });
      
      if (response.status === 200) {
        this.log('✅ TTS Generation PASSED', response.data);
        this.testResults.push({ test: 'TTS Generation', status: 'PASSED' });
        return response.data;
      } else {
        throw new Error(`TTS generation failed with status ${response.status}`);
      }
    } catch (error) {
      this.log('❌ TTS Generation FAILED', { error: error.message });
      this.testResults.push({ test: 'TTS Generation', status: 'FAILED', error: error.message });
      this.errors.push(error);
    }
  }

  async testGenerateTTSQueue() {
    try {
      this.log('🧪 Testing TTS Generation (Queue Mode)...');
      
      const testData = {
        text: "This is a longer test message that should be processed through the queue system. It contains more text to ensure it goes through the async processing pipeline.",
        provider: "elevenlabs",
        voiceId: "21m00Tcm4TlvDq8ikWAM",
        stability: 0.5,
        similarityBoost: 0.5
      };
      
      const response = await axios.post(`${BASE_URL}/tts/generate`, testData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_USER_TOKEN}`
        }
      });
      
      if (response.status === 200) {
        this.log('✅ TTS Queue Generation PASSED', response.data);
        this.testResults.push({ test: 'TTS Queue Generation', status: 'PASSED' });
        
        // If it's a queued job, test job status
        if (response.data.jobId) {
          await this.testJobStatus(response.data.jobId);
        }
        
        return response.data;
      } else {
        throw new Error(`TTS queue generation failed with status ${response.status}`);
      }
    } catch (error) {
      this.log('❌ TTS Queue Generation FAILED', { error: error.message });
      this.testResults.push({ test: 'TTS Queue Generation', status: 'FAILED', error: error.message });
      this.errors.push(error);
    }
  }

  async testJobStatus(jobId) {
    try {
      this.log(`🧪 Testing Job Status for Job ID: ${jobId}...`);
      
      const response = await axios.get(`${BASE_URL}/tts/jobs/${jobId}`, {
        headers: {
          'Authorization': `Bearer ${TEST_USER_TOKEN}`
        }
      });
      
      if (response.status === 200) {
        this.log('✅ Job Status PASSED', response.data);
        this.testResults.push({ test: 'Job Status', status: 'PASSED' });
        return response.data;
      } else {
        throw new Error(`Job status failed with status ${response.status}`);
      }
    } catch (error) {
      this.log('❌ Job Status FAILED', { error: error.message });
      this.testResults.push({ test: 'Job Status', status: 'FAILED', error: error.message });
      this.errors.push(error);
    }
  }

  async testValidationErrors() {
    try {
      this.log('🧪 Testing Validation Errors...');
      
      const invalidData = {
        text: "", // Empty text should fail validation
        provider: "invalid_provider", // Invalid provider
        speed: 999 // Invalid speed value
      };
      
      const response = await axios.post(`${BASE_URL}/tts/generate`, invalidData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_USER_TOKEN}`
        }
      });
      
      // This should fail with validation errors
      throw new Error('Validation should have failed but didn\'t');
      
    } catch (error) {
      if (error.response && error.response.status === 400) {
        this.log('✅ Validation Errors PASSED', error.response.data);
        this.testResults.push({ test: 'Validation Errors', status: 'PASSED' });
      } else {
        this.log('❌ Validation Errors FAILED', { error: error.message });
        this.testResults.push({ test: 'Validation Errors', status: 'FAILED', error: error.message });
        this.errors.push(error);
      }
    }
  }

  async testServiceStats() {
    try {
      this.log('🧪 Testing Service Statistics...');
      
      const response = await axios.get(`${BASE_URL}/tts/admin/stats`, {
        headers: {
          'Authorization': `Bearer ${TEST_USER_TOKEN}`
        }
      });
      
      if (response.status === 200) {
        this.log('✅ Service Stats PASSED', response.data);
        this.testResults.push({ test: 'Service Stats', status: 'PASSED' });
        return response.data;
      } else {
        throw new Error(`Service stats failed with status ${response.status}`);
      }
    } catch (error) {
      this.log('❌ Service Stats FAILED', { error: error.message });
      this.testResults.push({ test: 'Service Stats', status: 'FAILED', error: error.message });
      this.errors.push(error);
    }
  }

  async testProviderFallback() {
    try {
      this.log('🧪 Testing Provider Fallback...');
      
      const testData = {
        text: "Testing provider fallback functionality.",
        provider: "invalid_provider_that_should_fallback"
      };
      
      const response = await axios.post(`${BASE_URL}/tts/generate`, testData, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${TEST_USER_TOKEN}`
        }
      });
      
      if (response.status === 200) {
        this.log('✅ Provider Fallback PASSED', response.data);
        this.testResults.push({ test: 'Provider Fallback', status: 'PASSED' });
        return response.data;
      } else {
        throw new Error(`Provider fallback failed with status ${response.status}`);
      }
    } catch (error) {
      this.log('❌ Provider Fallback FAILED', { error: error.message });
      this.testResults.push({ test: 'Provider Fallback', status: 'FAILED', error: error.message });
      this.errors.push(error);
    }
  }

  async runAllTests() {
    this.log('🚀 Starting Comprehensive TTS Testing...');
    
    // Test basic functionality
    await this.testHealthCheck();
    await this.testGetVoices();
    
    // Test TTS generation
    await this.testGenerateTTSImmediate();
    await this.testGenerateTTSQueue();
    
    // Test validation
    await this.testValidationErrors();
    
    // Test admin features
    await this.testServiceStats();
    
    // Test fallback
    await this.testProviderFallback();
    
    // Print summary
    this.printTestSummary();
  }

  printTestSummary() {
    this.log('📊 Test Summary:');
    
    const passed = this.testResults.filter(r => r.status === 'PASSED').length;
    const failed = this.testResults.filter(r => r.status === 'FAILED').length;
    const total = this.testResults.length;
    
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`📈 Success Rate: ${((passed / total) * 100).toFixed(1)}%`);
    
    if (failed > 0) {
      console.log('\n❌ Failed Tests:');
      this.testResults
        .filter(r => r.status === 'FAILED')
        .forEach(r => console.log(`  - ${r.test}: ${r.error}`));
    }
    
    if (this.errors.length > 0) {
      console.log('\n🔍 Detailed Errors:');
      this.errors.forEach((error, index) => {
        console.log(`  ${index + 1}. ${error.message}`);
      });
    }
  }
}

// Run the tests
async function main() {
  const tester = new TTSTester();
  await tester.runAllTests();
}

// Check if server is running first
async function checkServer() {
  try {
    await axios.get('http://localhost:3000/health');
    console.log('✅ Server is running, starting tests...');
    await main();
  } catch (error) {
    console.log('❌ Server is not running. Please start the server first with: npm run dev');
    process.exit(1);
  }
}

checkServer().catch(console.error); 