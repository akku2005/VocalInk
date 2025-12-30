const cheerio = require('cheerio');
const logger = require('./logger');
const { segmentContentWithAI } = require('./aiSegmentation');

/**
 * Split HTML content into TTS segments using AI-powered analysis.
 * Uses Gemini AI to intelligently segment content into logical chunks.
 * 
 * @param {string} html - HTML content to parse
 * @param {Object} options - Configuration options
 * @param {boolean} options.useAI - Use AI segmentation (default: true)
 * @returns {Promise<Array>} Array of segment objects
 */
async function splitHtmlIntoSegments(html, options = {}) {
    const { useAI = true } = options;

    if (!html || typeof html !== 'string') {
        logger.warn('splitHtmlIntoSegments: Invalid HTML input');
        return [];
    }

    // Use AI segmentation for intelligent content analysis
    if (useAI) {
        try {
            const aiSegments = await segmentContentWithAI(html);
            logger.info(`✅ AI segmentation successful: ${aiSegments.length} segments`);
            return aiSegments;
        } catch (error) {
            logger.error('AI segmentation failed, falling back to HTML parser:', error.message);
            // Fall through to cheerio fallback
        }
    }

    // Fallback: Use Cheerio HTML parsing
    try {
        const $ = cheerio.load(html, {
            decodeEntities: true,
            xmlMode: false
        });

        const segments = [];
        let index = 0;

        // Select block-level semantic elements
        const blockSelector = 'p, li, blockquote, h1, h2, h3, h4, h5, h6, td, th, pre';

        // Get all potential elements
        const allElements = $(blockSelector);

        // Filter out nested elements
        const topLevelElements = allElements.filter((i, elem) => {
            const $elem = $(elem);
            const hasSelectedParent = $elem.parentsUntil('body').filter((j, parent) => {
                return $(parent).is(blockSelector);
            }).length > 0;

            return !hasSelectedParent;
        });

        topLevelElements.each((i, elem) => {
            const $elem = $(elem);
            let text = $elem.text().trim();

            if (!text || text.length < 3) {
                return;
            }

            text = text.replace(/\s+/g, ' ').trim();

            const segmentId = `tts-seg-${index}`;

            segments.push({
                id: segmentId,
                paragraphId: segmentId,
                text: text,
                element: elem.tagName?.toLowerCase() || 'unknown',
                order: index
            });

            index++;
        });

        logger.info(`📋 Cheerio fallback: extracted ${segments.length} segments`);
        return segments;

    } catch (error) {
        logger.error('Failed to parse HTML:', {
            message: error.message,
            stack: error.stack
        });

        // Last resort: simple text extraction
        return [{
            id: 'tts-seg-0',
            paragraphId: 'tts-seg-0',
            text: html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim(),
            element: 'fallback',
            order: 0
        }];
    }
}

/**
 * Prepare segments for TTS generation with AI analysis.
 */
async function prepareSegmentsForTTS(html, options = {}) {
    const segments = await splitHtmlIntoSegments(html, options);

    const totalLength = segments.reduce((sum, seg) => sum + seg.text.length, 0);
    const elementCounts = segments.reduce((counts, seg) => {
        counts[seg.element] = (counts[seg.element] || 0) + 1;
        return counts;
    }, {});

    return {
        segments,
        totalLength,
        elementCounts,
        segmentCount: segments.length,
        averageSegmentLength: segments.length > 0 ? Math.round(totalLength / segments.length) : 0
    };
}

module.exports = {
    splitHtmlIntoSegments,
    prepareSegmentsForTTS
};
