#!/usr/bin/env node

/**
 * Test script to validate ElevenLabs API key
 * Run with: node test-elevenlabs-key.js
 */

const axios = require('axios');
require('dotenv').config();

const API_KEY = process.env.ELEVENLABS_API_KEY;
const BASE_URL = 'https://api.elevenlabs.io/v1';

if (!API_KEY) {
  console.error('❌ ERROR: ELEVENLABS_API_KEY not set in .env file');
  process.exit(1);
}

console.log('🔍 Testing ElevenLabs API Key...');
console.log(`📝 API Key: ${API_KEY.substring(0, 10)}...${API_KEY.substring(API_KEY.length - 10)}`);
console.log('');

async function testAPIKey() {
  try {
    // Test 1: Get user info (simplest test)
    console.log('📌 Test 1: Fetching user information...');
    const userResponse = await axios({
      method: 'GET',
      url: `${BASE_URL}/user`,
      headers: {
        'xi-api-key': API_KEY
      },
      timeout: 10000
    });

    console.log('✅ SUCCESS! API key is valid');
    console.log('📊 User Info:');
    console.log(`   - Character Limit: ${userResponse.data.subscription.character_limit}`);
    console.log(`   - Characters Used: ${userResponse.data.subscription.character_count}`);
    console.log(`   - Characters Remaining: ${userResponse.data.subscription.character_limit - userResponse.data.subscription.character_count}`);
    console.log(`   - Tier: ${userResponse.data.subscription.tier}`);
    console.log('');

    // Test 2: Get available voices
    console.log('📌 Test 2: Fetching available voices...');
    const voicesResponse = await axios({
      method: 'GET',
      url: `${BASE_URL}/voices`,
      headers: {
        'xi-api-key': API_KEY
      },
      timeout: 10000
    });

    console.log(`✅ Found ${voicesResponse.data.voices.length} available voices`);
    console.log('📋 Sample voices:');
    voicesResponse.data.voices.slice(0, 3).forEach(voice => {
      console.log(`   - ${voice.name} (ID: ${voice.voice_id})`);
    });
    console.log('');

    // Test 3: Try a simple TTS generation
    console.log('📌 Test 3: Generating sample audio...');
    const ttsResponse = await axios({
      method: 'POST',
      url: `${BASE_URL}/text-to-speech/21m00Tcm4TlvDq8ikWAM`,
      headers: {
        'Accept': 'audio/mpeg',
        'Content-Type': 'application/json',
        'xi-api-key': API_KEY
      },
      data: {
        text: 'Hello, this is a test of the ElevenLabs API.',
        model_id: 'eleven_multilingual_v2',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
          style: 0.0,
          use_speaker_boost: true
        }
      },
      responseType: 'arraybuffer',
      timeout: 30000
    });

    console.log(`✅ Audio generated successfully!`);
    console.log(`   - Audio size: ${(ttsResponse.data.length / 1024).toFixed(2)} KB`);
    console.log('');

    console.log('🎉 All tests passed! Your ElevenLabs API key is working correctly.');
    process.exit(0);

  } catch (error) {
    console.error('❌ ERROR:', error.message);
    
    if (error.response) {
      console.error('');
      console.error('📋 Response Details:');
      console.error(`   - Status: ${error.response.status} ${error.response.statusText}`);
      console.error(`   - Data: ${JSON.stringify(error.response.data, null, 2)}`);
      
      if (error.response.status === 401) {
        console.error('');
        console.error('💡 Possible causes:');
        console.error('   1. API key is invalid or expired');
        console.error('   2. API key was revoked');
        console.error('   3. API key belongs to a different account');
        console.error('');
        console.error('✅ Solution: Generate a new API key from https://elevenlabs.io/app/account/api-keys');
      }
    }
    
    process.exit(1);
  }
}

testAPIKey();
