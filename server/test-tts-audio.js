/**
 * Test TTS Audio Generation from Segments
 * This demonstrates the full flow: HTML → Segments → Audio
 * 
 * Run: node test-tts-audio.js
 */

require('dotenv').config();
const { segmentContentWithAI } = require('./src/utils/aiSegmentation');
const TTSService = require('./src/services/TTSService');

// Sample blog HTML content
const sampleBlogHTML = `
<h1>Introduction to Machine Learning</h1>

<p>Machine learning is a subset of artificial intelligence that enables systems to learn and improve from experience without being explicitly programmed.</p>

<h2>Types of Machine Learning</h2>

<p>There are three main types: supervised learning, unsupervised learning, and reinforcement learning. Each has its own use cases and applications.</p>

<p>Supervised learning uses labeled data to train models. Unsupervised learning finds patterns in unlabeled data. Reinforcement learning learns through trial and error.</p>
`;

async function testTTSAudioGeneration() {
    console.log('🎤 Testing TTS Audio Generation\n');
    console.log('='.repeat(60));

    const ttsService = new TTSService();

    try {
        // Step 1: Segment the HTML content
        console.log('\n📝 Step 1: AI Segmentation');
        console.log('-'.repeat(40));

        const segments = await segmentContentWithAI(sampleBlogHTML);
        console.log(`✅ Created ${segments.length} segments`);

        segments.forEach((seg, i) => {
            console.log(`   ${i + 1}. [${seg.element}] "${seg.text.substring(0, 50)}..."`);
        });

        // Step 2: Generate audio for each segment
        console.log('\n🔊 Step 2: Audio Generation');
        console.log('-'.repeat(40));
        console.log('Provider: ElevenLabs');
        console.log('Processing segments in batches of 3...\n');

        // We'll only generate for first 2 segments to save API credits
        const testSegments = segments.slice(0, 2);
        console.log(`⚠️  Testing with first ${testSegments.length} segments (to save API credits)\n`);

        const audioResults = await ttsService.generateSegmentedSpeech(testSegments, {
            provider: 'elevenlabs',
            skipDiskStorage: true // Keep audio in memory as base64
        });

        console.log(`\n✅ Generated ${audioResults.length} audio segments:\n`);

        audioResults.forEach((result, i) => {
            console.log(`   Segment ${i + 1}:`);
            console.log(`   - ID: ${result.id}`);
            console.log(`   - Text: "${result.text.substring(0, 40)}..."`);
            console.log(`   - Duration: ${result.duration || 'calculated'} seconds`);
            console.log(`   - Audio Data: ${result.audioData ? `${(result.audioData.length / 1024).toFixed(1)} KB` : 'N/A'}`);
            console.log(`   - Provider: ${result.provider || 'elevenlabs'}`);
            console.log('');
        });

        // Step 3: Summary
        console.log('='.repeat(60));
        console.log('\n📊 Summary:');
        console.log(`   Total segments: ${segments.length}`);
        console.log(`   Audio generated: ${audioResults.length}`);
        console.log(`   Total duration: ${audioResults.reduce((sum, r) => sum + (r.duration || 0), 0).toFixed(1)}s`);

        const totalAudioSize = audioResults.reduce((sum, r) => {
            return sum + (r.audioData ? r.audioData.length : 0);
        }, 0);
        console.log(`   Total audio size: ${(totalAudioSize / 1024).toFixed(1)} KB`);

        console.log('\n✅ SUCCESS: TTS Audio Generation working correctly!');

        // Show the flow
        console.log('\n📋 The Complete Flow:');
        console.log(`
   ┌─────────────────────────────────────────────────────────────┐
   │  1. Blog HTML Content                                       │
   │     ↓                                                       │
   │  2. segmentContentWithAI(html)                              │
   │     → Sends to OpenAI gpt-4o-mini                          │
   │     → Returns: [{ id, text, element, order }, ...]          │
   │     ↓                                                       │
   │  3. TTSService.generateSegmentedSpeech(segments, options)   │
   │     → Processes in batches of 3                             │
   │     → Calls generateSpeech() for each segment               │
   │     → Uses ElevenLabs/GoogleCloud/gTTS                      │
   │     ↓                                                       │
   │  4. Returns Audio Segments                                  │
   │     → [{ id, text, audioData, duration, provider }, ...]    │
   │     ↓                                                       │
   │  5. Client receives base64 audio                            │
   │     → Stores in IndexedDB                                   │
   │     → Plays segment by segment                              │
   └─────────────────────────────────────────────────────────────┘
        `);

    } catch (error) {
        console.error('\n❌ Error:', error.message);

        if (error.message.includes('API key')) {
            console.log('\n💡 Tip: Make sure ELEVENLABS_API_KEY is set in your .env file');
        }

        console.error('\nStack:', error.stack);
    }
}

testTTSAudioGeneration();
