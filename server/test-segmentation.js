/**
 * Test script to verify AI segmentation doesn't miss any words
 * Run: node test-segmentation.js
 */

require('dotenv').config();
const { segmentContentWithAI } = require('./src/utils/aiSegmentation');

// Sample blog HTML content
const sampleBlogHTML = `
<h1>The Future of Artificial Intelligence in Healthcare</h1>

<p>Artificial Intelligence (AI) is revolutionizing healthcare in unprecedented ways. From diagnosing diseases to developing personalized treatment plans, AI is becoming an integral part of modern medicine.</p>

<h2>Key Applications</h2>

<p>One of the most promising applications is in medical imaging. AI algorithms can now detect cancers, tumors, and other abnormalities with remarkable accuracy, often surpassing human radiologists.</p>

<p>Another exciting area is drug discovery. Machine learning models can analyze millions of compounds to identify potential drug candidates, significantly reducing the time and cost of bringing new medications to market.</p>

<h3>Challenges and Considerations</h3>

<ul>
<li>Data privacy and security concerns must be addressed carefully</li>
<li>AI systems require extensive training data to perform accurately</li>
<li>Regulatory frameworks are still evolving to accommodate AI technologies</li>
</ul>

<p>Despite these challenges, the future looks bright. Healthcare providers worldwide are increasingly adopting AI solutions to improve patient outcomes and reduce costs.</p>

<blockquote>The integration of AI in healthcare represents one of the most significant technological shifts of our generation.</blockquote>

<p>As we move forward, collaboration between technologists, healthcare professionals, and policymakers will be essential to ensure AI is deployed responsibly and effectively.</p>
`;

// Extract plain text from HTML for comparison
function extractPlainText(html) {
    return html
        .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
        .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
}

// Get all words from text
function getWords(text) {
    return text.toLowerCase()
        .replace(/[^\w\s]/g, '')
        .split(/\s+/)
        .filter(w => w.length > 0);
}

async function testSegmentation() {
    console.log('🧪 Testing AI Segmentation\n');
    console.log('='.repeat(60));

    // Get original text and words
    const originalText = extractPlainText(sampleBlogHTML);
    const originalWords = getWords(originalText);

    console.log('\n📄 Original Content:');
    console.log(`   Words: ${originalWords.length}`);
    console.log(`   Characters: ${originalText.length}`);

    // Run segmentation
    console.log('\n⏳ Running AI segmentation...\n');

    try {
        const segments = await segmentContentWithAI(sampleBlogHTML);

        console.log(`✅ Created ${segments.length} segments:\n`);

        // Collect all segmented words
        const segmentedWords = [];

        segments.forEach((seg, i) => {
            console.log(`--- Segment ${i + 1} (${seg.element}) ---`);
            console.log(`ID: ${seg.id}`);
            console.log(`Text: ${seg.text.substring(0, 100)}${seg.text.length > 100 ? '...' : ''}`);
            console.log(`Length: ${seg.text.length} chars`);
            console.log('');

            segmentedWords.push(...getWords(seg.text));
        });

        console.log('='.repeat(60));
        console.log('\n📊 Verification Results:\n');

        // Compare word counts
        console.log(`   Original words: ${originalWords.length}`);
        console.log(`   Segmented words: ${segmentedWords.length}`);

        // Find missing words
        const originalWordSet = new Set(originalWords);
        const segmentedWordSet = new Set(segmentedWords);

        const missingWords = [...originalWordSet].filter(w => !segmentedWordSet.has(w));
        const extraWords = [...segmentedWordSet].filter(w => !originalWordSet.has(w));

        if (missingWords.length === 0) {
            console.log('\n   ✅ No unique words missing from segments!');
        } else {
            console.log(`\n   ⚠️ Missing unique words: ${missingWords.slice(0, 20).join(', ')}`);
            if (missingWords.length > 20) {
                console.log(`      ... and ${missingWords.length - 20} more`);
            }
        }

        if (extraWords.length > 0) {
            console.log(`\n   📝 Extra words in segments (possibly AI formatting): ${extraWords.slice(0, 10).join(', ')}`);
        }

        // Calculate coverage
        const coverage = ((segmentedWords.length / originalWords.length) * 100).toFixed(1);
        console.log(`\n   📈 Word coverage: ${coverage}%`);

        // Final verdict
        console.log('\n' + '='.repeat(60));
        if (missingWords.length === 0 && coverage >= 90) {
            console.log('✅ PASS: Segmentation successful with no missing content!');
        } else if (coverage >= 80) {
            console.log('⚠️ PARTIAL: Most content captured, minor differences may exist.');
        } else {
            console.log('❌ FAIL: Significant content loss detected.');
        }

    } catch (error) {
        console.error('❌ Segmentation failed:', error.message);
        console.error('\nStack:', error.stack);
    }
}

testSegmentation();
