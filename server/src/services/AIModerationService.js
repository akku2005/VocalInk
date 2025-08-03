const natural = require('natural');
const logger = require('../utils/logger');
const Comment = require('../models/comment.model');
const Blog = require('../models/blog.model');
const User = require('../models/user.model');

class AIModerationService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    
    // Spam detection patterns
    this.spamPatterns = [
      /\b(buy\s+now|click\s+here|limited\s+time|act\s+now|free\s+offer)\b/i,
      /\b(earn\s+money|make\s+money|work\s+from\s+home|get\s+rich)\b/i,
      /\b(weight\s+loss|diet\s+pills|miracle\s+cure|lose\s+weight)\b/i,
      /\b(viagra|cialis|penis|enlargement)\b/i,
      /\b(casino|poker|bet|gambling|lottery)\b/i,
      /\b(loan|credit|debt|refinance|mortgage)\b/i,
      /\b(pharmacy|prescription|medication|drugs)\b/i
    ];

    // Toxic keywords
    this.toxicKeywords = [
      'hate', 'kill', 'death', 'suicide', 'murder', 'terrorist',
      'racist', 'sexist', 'homophobic', 'transphobic', 'nazi',
      'pedophile', 'rapist', 'abuse', 'harassment', 'bully'
    ];

    // Suspicious patterns
    this.suspiciousPatterns = [
      /(.)\1{4,}/, // Repeated characters
      /[A-Z]{5,}/, // ALL CAPS
      /\b\w{20,}\b/, // Very long words
      /(http|www\.)\S+/i, // URLs
      /\d{10,}/, // Long numbers (phone/credit card)
      /[^\w\s]{5,}/ // Too many special characters
    ];
  }

  /**
   * Screen content for inappropriate material
   */
  async screenContent(content, contentType = 'blog', options = {}) {
    try {
      const {
        checkSpam = true,
        checkToxicity = true,
        checkQuality = true,
        checkSuspicious = true
      } = options;

      const results = {
        isApproved: true,
        score: 0,
        flags: [],
        confidence: 0,
        suggestions: []
      };

      // Spam detection
      if (checkSpam) {
        const spamResult = this.detectSpam(content);
        if (spamResult.isSpam) {
          results.isApproved = false;
          results.flags.push('spam');
          results.score += spamResult.score;
        }
      }

      // Toxicity detection
      if (checkToxicity) {
        const toxicityResult = this.detectToxicity(content);
        if (toxicityResult.isToxic) {
          results.isApproved = false;
          results.flags.push('toxic');
          results.score += toxicityResult.score;
        }
      }

      // Quality assessment
      if (checkQuality) {
        const qualityResult = this.assessContentQuality(content, contentType);
        results.score += qualityResult.score;
        results.suggestions.push(...qualityResult.suggestions);
      }

      // Suspicious pattern detection
      if (checkSuspicious) {
        const suspiciousResult = this.detectSuspiciousPatterns(content);
        if (suspiciousResult.isSuspicious) {
          results.flags.push('suspicious');
          results.score += suspiciousResult.score;
        }
      }

      // Calculate confidence based on multiple factors
      results.confidence = this.calculateConfidence(results);
      
      // Final approval decision
      results.isApproved = results.score < 0.7 && results.flags.length < 2;

      logger.info('Content screening completed', {
        contentType,
        isApproved: results.isApproved,
        score: results.score,
        flags: results.flags,
        confidence: results.confidence
      });

      return results;

    } catch (error) {
      logger.error('Error screening content:', error);
      return {
        isApproved: true, // Default to approved on error
        score: 0,
        flags: ['error'],
        confidence: 0,
        suggestions: []
      };
    }
  }

  /**
   * Detect spam in content
   */
  detectSpam(content) {
    try {
      const text = content.toLowerCase();
      let spamScore = 0;
      let spamFlags = [];

      // Check for spam patterns
      this.spamPatterns.forEach((pattern, index) => {
        if (pattern.test(text)) {
          spamScore += 0.2;
          spamFlags.push(`spam_pattern_${index}`);
        }
      });

      // Check for excessive links
      const linkCount = (text.match(/https?:\/\/[^\s]+/g) || []).length;
      if (linkCount > 3) {
        spamScore += linkCount * 0.1;
        spamFlags.push('excessive_links');
      }

      // Check for repetitive content
      const words = this.tokenizer.tokenize(text);
      const uniqueWords = new Set(words);
      const repetitionRatio = uniqueWords.size / words.length;
      if (repetitionRatio < 0.3) {
        spamScore += 0.3;
        spamFlags.push('repetitive_content');
      }

      // Check for suspicious keywords
      const suspiciousWords = words.filter(word => 
        this.spamPatterns.some(pattern => pattern.test(word))
      );
      if (suspiciousWords.length > 5) {
        spamScore += 0.4;
        spamFlags.push('suspicious_keywords');
      }

      return {
        isSpam: spamScore > 0.5,
        score: Math.min(spamScore, 1.0),
        flags: spamFlags,
        confidence: this.calculateSpamConfidence(spamScore, spamFlags.length)
      };

    } catch (error) {
      logger.error('Error detecting spam:', error);
      return { isSpam: false, score: 0, flags: [], confidence: 0 };
    }
  }

  /**
   * Detect toxic content
   */
  detectToxicity(content) {
    try {
      const text = content.toLowerCase();
      let toxicityScore = 0;
      let toxicityFlags = [];

      // Sentiment analysis
      const words = this.tokenizer.tokenize(text);
      const sentimentScore = this.sentiment.getSentiment(words);
      
      if (sentimentScore < -3) {
        toxicityScore += 0.3;
        toxicityFlags.push('negative_sentiment');
      }

      // Check for toxic keywords
      const toxicWordCount = words.filter(word => 
        this.toxicKeywords.includes(word)
      ).length;
      
      if (toxicWordCount > 0) {
        toxicityScore += toxicWordCount * 0.2;
        toxicityFlags.push('toxic_keywords');
      }

      // Check for hate speech patterns
      const hateSpeechPatterns = [
        /\b(kill\s+all\s+\w+)\b/i,
        /\b(death\s+to\s+\w+)\b/i,
        /\b(\w+\s+should\s+die)\b/i,
        /\b(\w+\s+deserves\s+to\s+die)\b/i
      ];

      hateSpeechPatterns.forEach(pattern => {
        if (pattern.test(text)) {
          toxicityScore += 0.5;
          toxicityFlags.push('hate_speech');
        }
      });

      // Check for harassment patterns
      const harassmentPatterns = [
        /\b(fuck\s+you|fuck\s+off)\b/i,
        /\b(you\s+suck|you're\s+stupid)\b/i,
        /\b(die\s+\w+|kill\s+yourself)\b/i
      ];

      harassmentPatterns.forEach(pattern => {
        if (pattern.test(text)) {
          toxicityScore += 0.4;
          toxicityFlags.push('harassment');
        }
      });

      return {
        isToxic: toxicityScore > 0.4,
        score: Math.min(toxicityScore, 1.0),
        flags: toxicityFlags,
        confidence: this.calculateToxicityConfidence(toxicityScore, toxicityFlags.length)
      };

    } catch (error) {
      logger.error('Error detecting toxicity:', error);
      return { isToxic: false, score: 0, flags: [], confidence: 0 };
    }
  }

  /**
   * Assess content quality
   */
  assessContentQuality(content, contentType) {
    try {
      let qualityScore = 0;
      const suggestions = [];

      // Length assessment
      const wordCount = content.split(/\s+/).length;
      if (contentType === 'blog' && wordCount < 50) {
        qualityScore -= 0.2;
        suggestions.push('Consider adding more content to make your blog more comprehensive');
      } else if (contentType === 'comment' && wordCount < 5) {
        qualityScore -= 0.1;
        suggestions.push('Consider adding more detail to your comment');
      }

      // Readability assessment
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const avgSentenceLength = wordCount / sentences.length;
      
      if (avgSentenceLength > 25) {
        qualityScore -= 0.15;
        suggestions.push('Consider breaking down long sentences for better readability');
      }

      // Grammar and spelling (basic check)
      const commonErrors = this.detectCommonErrors(content);
      if (commonErrors.length > 0) {
        qualityScore -= commonErrors.length * 0.05;
        suggestions.push('Consider reviewing grammar and spelling');
      }

      // Structure assessment
      if (contentType === 'blog') {
        const hasHeadings = /^#{1,6}\s+/m.test(content);
        const hasParagraphs = content.split(/\n\s*\n/).length > 2;
        
        if (!hasHeadings && !hasParagraphs) {
          qualityScore -= 0.1;
          suggestions.push('Consider adding headings and paragraphs for better structure');
        }
      }

      return {
        score: Math.max(qualityScore, -1.0),
        suggestions
      };

    } catch (error) {
      logger.error('Error assessing content quality:', error);
      return { score: 0, suggestions: [] };
    }
  }

  /**
   * Detect suspicious patterns
   */
  detectSuspiciousPatterns(content) {
    try {
      let suspiciousScore = 0;
      const flags = [];

      this.suspiciousPatterns.forEach((pattern, index) => {
        if (pattern.test(content)) {
          suspiciousScore += 0.2;
          flags.push(`suspicious_pattern_${index}`);
        }
      });

      // Check for excessive punctuation
      const punctuationCount = (content.match(/[!?]{2,}/g) || []).length;
      if (punctuationCount > 3) {
        suspiciousScore += 0.15;
        flags.push('excessive_punctuation');
      }

      // Check for all caps
      const capsRatio = (content.match(/[A-Z]/g) || []).length / content.length;
      if (capsRatio > 0.7) {
        suspiciousScore += 0.2;
        flags.push('excessive_caps');
      }

      return {
        isSuspicious: suspiciousScore > 0.3,
        score: Math.min(suspiciousScore, 1.0),
        flags
      };

    } catch (error) {
      logger.error('Error detecting suspicious patterns:', error);
      return { isSuspicious: false, score: 0, flags: [] };
    }
  }

  /**
   * Moderate comments in real-time
   */
  async moderateComment(comment, context = {}) {
    try {
      const {
        userId,
        blogId,
        parentId,
        userHistory = {}
      } = context;

      // Screen the comment content
      const screeningResult = await this.screenContent(comment, 'comment', {
        checkSpam: true,
        checkToxicity: true,
        checkQuality: true,
        checkSuspicious: true
      });

      // Additional context-based checks
      const contextResult = await this.analyzeCommentContext(comment, context);

      // Combine results
      const finalResult = {
        ...screeningResult,
        score: screeningResult.score + contextResult.score,
        flags: [...screeningResult.flags, ...contextResult.flags],
        contextAnalysis: contextResult
      };

      // Final decision
      finalResult.isApproved = finalResult.score < 0.6 && finalResult.flags.length < 3;

      // Log moderation decision
      logger.info('Comment moderation completed', {
        commentId: context.commentId,
        userId,
        isApproved: finalResult.isApproved,
        score: finalResult.score,
        flags: finalResult.flags
      });

      return finalResult;

    } catch (error) {
      logger.error('Error moderating comment:', error);
      return {
        isApproved: true,
        score: 0,
        flags: ['error'],
        confidence: 0,
        suggestions: []
      };
    }
  }

  /**
   * Analyze comment context
   */
  async analyzeCommentContext(comment, context) {
    try {
      const { userId, blogId, userHistory } = context;
      let contextScore = 0;
      const flags = [];

      // Check user history
      if (userHistory.reportedComments > 5) {
        contextScore += 0.3;
        flags.push('user_history_reported');
      }

      if (userHistory.spamComments > 3) {
        contextScore += 0.4;
        flags.push('user_history_spam');
      }

      // Check for rapid commenting
      if (userHistory.recentComments > 10) {
        contextScore += 0.2;
        flags.push('rapid_commenting');
      }

      // Check for duplicate content
      if (userHistory.duplicateComments > 2) {
        contextScore += 0.3;
        flags.push('duplicate_content');
      }

      return {
        score: Math.min(contextScore, 1.0),
        flags
      };

    } catch (error) {
      logger.error('Error analyzing comment context:', error);
      return { score: 0, flags: [] };
    }
  }

  /**
   * Detect common writing errors
   */
  detectCommonErrors(content) {
    const errors = [];

    // Common misspellings
    const misspellings = [
      { pattern: /\b(teh)\b/gi, correction: 'the' },
      { pattern: /\b(recieve)\b/gi, correction: 'receive' },
      { pattern: /\b(seperate)\b/gi, correction: 'separate' },
      { pattern: /\b(definately)\b/gi, correction: 'definitely' },
      { pattern: /\b(occassion)\b/gi, correction: 'occasion' }
    ];

    misspellings.forEach(({ pattern, correction }) => {
      if (pattern.test(content)) {
        errors.push(`Consider using "${correction}" instead`);
      }
    });

    // Basic grammar checks
    if (content.match(/\b(i\s+[a-z])/gi)) {
      errors.push('Consider capitalizing "I" when referring to yourself');
    }

    return errors;
  }

  /**
   * Calculate confidence scores
   */
  calculateConfidence(results) {
    const factors = [
      results.score < 0.3 ? 0.9 : 0.5,
      results.flags.length === 0 ? 0.8 : 0.6,
      results.suggestions.length < 3 ? 0.7 : 0.5
    ];
    
    return factors.reduce((sum, factor) => sum + factor, 0) / factors.length;
  }

  calculateSpamConfidence(score, flagCount) {
    return Math.max(0.3, Math.min(0.9, 1 - (score + flagCount * 0.1)));
  }

  calculateToxicityConfidence(score, flagCount) {
    return Math.max(0.3, Math.min(0.9, 1 - (score + flagCount * 0.15)));
  }

  /**
   * Get moderation statistics
   */
  async getModerationStats(timeframe = '30d') {
    try {
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - parseInt(timeframe));

      const stats = {
        totalContent: 0,
        flaggedContent: 0,
        spamDetected: 0,
        toxicContent: 0,
        suspiciousContent: 0,
        averageScore: 0,
        byCategory: {}
      };

      // This would typically query a moderation log
      // For now, return placeholder stats
      logger.info('Moderation stats requested', { timeframe });

      return stats;

    } catch (error) {
      logger.error('Error getting moderation stats:', error);
      throw error;
    }
  }
}

module.exports = new AIModerationService(); 