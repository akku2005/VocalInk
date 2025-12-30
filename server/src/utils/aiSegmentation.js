const OpenAI = require('openai');
const logger = require('./logger');

// Initialize OpenAI client with API key from environment
let openaiClient = null;
if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
    try {
        openaiClient = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY.trim(),
        });
        logger.info('AI Segmentation: OpenAI client initialized');
    } catch (error) {
        logger.warn('AI Segmentation: Failed to initialize OpenAI client:', error.message);
    }
} else {
    logger.warn('OPENAI_API_KEY not found - AI segmentation will use fallback parser');
}

/**
 * Use OpenAI to intelligently segment blog content for TTS.
 * This analyzes the content and creates logical segments for speech.
 * Uses gpt-4o-mini (lowest cost model) for cost-effective segmentation.
 * 
 * @param {string} html - Raw HTML content
 * @returns {Promise<Array>} Array of segments with { id, text, element }
 */
async function segmentContentWithAI(html) {
    try {
        // Check if OpenAI is available
        if (!openaiClient) {
            throw new Error('OpenAI not initialized - OPENAI_API_KEY not configured');
        }

        // Strip HTML tags but preserve structure information
        const textContent = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .replace(/<[^>]+>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();

        if (!textContent || textContent.length < 10) {
            logger.warn('Content too short for AI segmentation');
            return [{
                id: 'tts-seg-0',
                paragraphId: 'tts-seg-0',
                text: textContent,
                element: 'paragraph',
                order: 0
            }];
        }

        // Truncate if too long (keep under ~4000 tokens ≈ 16000 chars)
        const maxChars = 16000;
        const truncatedContent = textContent.length > maxChars
            ? textContent.substring(0, maxChars) + '...'
            : textContent;

        const prompt = `Analyze this blog content and segment it into logical TTS (text-to-speech) chunks.
Each chunk should be a complete thought unit - typically a full paragraph, heading, or list item.

Rules:
1. Do NOT split paragraphs in the middle
2. Each heading should be its own segment
3. List items can be grouped or individual based on length
4. Aim for segments between 50-500 characters
5. Return ONLY a valid JSON array, no other text

Format your response as a JSON array like this:
[
  {"text": "Introduction heading text", "type": "heading"},
  {"text": "First full paragraph text...", "type": "paragraph"},
  {"text": "Second full paragraph text...", "type": "paragraph"}
]

Content to segment:
${truncatedContent}`;

        // Use gpt-4o-mini - the lowest cost OpenAI model
        const response = await openaiClient.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [
                {
                    role: 'system',
                    content: 'You are a text segmentation assistant. You analyze content and split it into logical chunks for text-to-speech. Always respond with valid JSON arrays only.'
                },
                {
                    role: 'user',
                    content: prompt
                }
            ],
            max_tokens: 4000,
            temperature: 0.3, // Lower temperature for more consistent output
            response_format: { type: 'json_object' } // Ensure JSON response
        });

        const responseText = response.choices[0]?.message?.content?.trim();

        if (!responseText) {
            throw new Error('OpenAI returned empty response');
        }

        // Parse the JSON response
        let aiSegments;
        try {
            const parsed = JSON.parse(responseText);
            // Handle both direct array and wrapped object formats
            aiSegments = Array.isArray(parsed) ? parsed : (parsed.segments || parsed.data || []);
        } catch (parseError) {
            logger.error('Failed to parse OpenAI response as JSON:', {
                response: responseText.substring(0, 200),
                error: parseError.message
            });
            throw new Error('OpenAI returned invalid JSON format');
        }

        // Validate structure
        if (!Array.isArray(aiSegments) || aiSegments.length === 0) {
            throw new Error('OpenAI response is not a valid array of segments');
        }

        // Convert AI segments to TTS format with IDs, sanitizing text output
        const segments = aiSegments
            .filter(seg => seg && typeof seg.text === 'string' && seg.text.trim().length > 0)
            .map((seg, idx) => ({
                id: `tts-seg-${idx}`,
                paragraphId: `tts-seg-${idx}`,
                // Sanitize AI output: remove any HTML tags that might have been injected
                text: seg.text.trim().replace(/<[^>]*>/g, ''),
                element: seg.type || 'paragraph',
                order: idx
            }));

        if (segments.length === 0) {
            throw new Error('No valid segments extracted from AI response');
        }

        logger.info(`OpenAI segmented content into ${segments.length} chunks`, {
            model: 'gpt-4o-mini',
            inputChars: truncatedContent.length,
            outputSegments: segments.length
        });

        return segments;

    } catch (error) {
        logger.error('OpenAI segmentation failed:', {
            message: error.message,
            stack: error.stack
        });

        // Fallback: Simple paragraph split
        const paragraphs = html
            .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
            .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
            .split(/<\/p>|<\/h[1-6]>|<\/li>/)
            .map(p => p.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim())
            .filter(p => p.length > 10);

        logger.info(`Fallback parser created ${paragraphs.length} segments`);

        return paragraphs.map((text, idx) => ({
            id: `tts-seg-${idx}`,
            paragraphId: `tts-seg-${idx}`,
            text,
            element: 'paragraph',
            order: idx
        }));
    }
}

module.exports = {
    segmentContentWithAI
};
