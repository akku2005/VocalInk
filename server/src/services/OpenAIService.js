const OpenAI = require('openai');
const logger = require('../utils/logger');

class OpenAIService {
  constructor() {
    this.openai = null;

    // Only initialize OpenAI client if API key is available
    if (process.env.OPENAI_API_KEY && process.env.OPENAI_API_KEY.trim()) {
      try {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY.trim(),
        });
        logger.info('OpenAI service initialized successfully');
      } catch (error) {
        logger.error('Failed to initialize OpenAI client:', error.message);
        this.openai = null;
      }
    } else {
      logger.warn('OpenAI API key not configured - OpenAI features will be disabled');
    }
  }

  /**
   * Strip HTML tags and truncate content to fit token limits
   * Uses intelligent sampling for very large documents
   */
  stripAndTruncateContent(content, maxTokens = 12000) {
    // Strip HTML tags
    const textOnly = content
      .replace(/<[^>]*>/g, ' ')
      .replace(/&[^;]+;/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    // Rough estimate: 1 token ≈ 4 characters
    const maxChars = maxTokens * 4;

    if (textOnly.length <= maxChars) {
      return textOnly;
    }

    // For very large content, take samples from beginning, middle, and end
    const sampleSize = Math.floor(maxChars / 3);
    const beginning = textOnly.substring(0, sampleSize);
    const middle = textOnly.substring(
      Math.floor(textOnly.length / 2) - Math.floor(sampleSize / 2),
      Math.floor(textOnly.length / 2) + Math.floor(sampleSize / 2)
    );
    const end = textOnly.substring(textOnly.length - sampleSize);

    return `${beginning}\n\n[...middle section...]\n\n${middle}\n\n[...continued...]\n\n${end}`;
  }

  /**
   * Generate TL;DR summary using OpenAI API
   */
  async generateSummary(content, options = {}) {
    const {
      maxLength = 150,
      style = 'concise',
      language = 'en'
    } = options;

    try {
      if (!this.openai) {
        logger.warn('OpenAI client not available, falling back to local summary generation');
        return this.generateLocalSummary(content, options);
      }

      // Truncate content to fit within token limits
      const truncatedContent = this.stripAndTruncateContent(content, 12000);

      logger.info('Content truncation stats', {
        originalLength: content.length,
        truncatedLength: truncatedContent.length,
        reduction: `${((1 - truncatedContent.length / content.length) * 100).toFixed(1)}%`
      });

      const prompt = this.buildSummaryPrompt(truncatedContent, maxLength, style, language);

      const response = await this.openai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful assistant that creates concise, engaging summaries of blog content. Focus on the main points and key insights.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: Math.min(maxLength * 2, 500),
        temperature: 0.7,
        top_p: 0.9,
        frequency_penalty: 0.1,
        presence_penalty: 0.1
      });

      const summary = response.choices[0]?.message?.content?.trim();

      if (!summary) {
        throw new Error('No summary generated from OpenAI');
      }

      logger.info('OpenAI summary generated successfully', {
        originalLength: content.length,
        summaryLength: summary.length,
        style,
        language
      });

      return {
        summary,
        provider: 'openai',
        model: 'gpt-3.5-turbo',
        metadata: {
          originalWordCount: content.split(' ').length,
          summaryWordCount: summary.split(' ').length,
          compressionRatio: summary.length / content.length,
          style,
          language
        }
      };

    } catch (error) {
      logger.error('OpenAI summary generation failed:', error);

      // Fallback to local summary generation
      logger.info('Falling back to local summary generation');
      return this.generateLocalSummary(content, options);
    }
  }

  /**
   * Generate local summary as fallback
   */
  async generateLocalSummary(content, options = {}) {
    const {
      maxLength = 150,
      style = 'concise'
    } = options;

    try {
      // Simple extractive summarization
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = content.split(/\s+/);

      if (sentences.length < 3) {
        return {
          summary: content.substring(0, maxLength),
          provider: 'local',
          model: 'extractive',
          metadata: {
            originalWordCount: words.length,
            summaryWordCount: Math.min(words.length, maxLength / 5),
            compressionRatio: Math.min(1, maxLength / content.length),
            style,
            language: 'en'
          }
        };
      }

      // Select first few sentences that fit within maxLength
      let summary = '';
      let currentLength = 0;

      for (const sentence of sentences) {
        if (currentLength + sentence.length <= maxLength) {
          summary += sentence + '. ';
          currentLength += sentence.length + 2;
        } else {
          break;
        }
      }

      summary = summary.trim();

      if (!summary) {
        summary = content.substring(0, maxLength);
      }

      logger.info('Local summary generated successfully', {
        originalLength: content.length,
        summaryLength: summary.length,
        style
      });

      return {
        summary,
        provider: 'local',
        model: 'extractive',
        metadata: {
          originalWordCount: words.length,
          summaryWordCount: summary.split(/\s+/).length,
          compressionRatio: summary.length / content.length,
          style,
          language: 'en'
        }
      };

    } catch (error) {
      logger.error('Local summary generation failed:', error);
      throw error;
    }
  }

  /**
   * Build prompt for OpenAI summary generation
   */
  buildSummaryPrompt(content, maxLength, style, language) {
    const styleInstructions = {
      concise: 'Write a concise, factual summary focusing on the main points.',
      engaging: 'Write an engaging summary that captures the reader\'s attention.',
      detailed: 'Write a detailed summary that covers all important aspects.',
      casual: 'Write a casual, conversational summary that\'s easy to understand.'
    };

    const languageInstructions = {
      en: 'Write in clear, professional English.',
      es: 'Write in clear, professional Spanish.',
      fr: 'Write in clear, professional French.',
      de: 'Write in clear, professional German.'
    };

    return `Please create a ${style} TL;DR summary of the following blog content:

${content}

Requirements:
- Maximum 150 words (approximately ${maxLength} characters)
- ${styleInstructions[style] || styleInstructions.concise}
- ${languageInstructions[language] || languageInstructions.en}
- Focus on the main ideas and key insights
- Maintain the original tone and intent
- Do not include personal opinions or commentary
- If the content is sampled, create a cohesive summary that captures the overall theme

TL;DR Summary:`;
  }

  /**
   * Check if OpenAI is available
   */
  isAvailable() {
    return !!this.openai;
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      available: this.isAvailable(),
      provider: 'openai',
      model: 'gpt-3.5-turbo'
    };
  }
}

module.exports = OpenAIService;
