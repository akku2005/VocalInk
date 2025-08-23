const natural = require('natural');
const nlp = require('compromise');
const logger = require('../utils/logger');

class AISummaryService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.tfidf = new natural.TfIdf();
    this.sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    
    // Initialize compromise plugins - only use installed ones
    nlp.extend(require('compromise-numbers'));
    nlp.extend(require('compromise-dates'));
  }

  /**
   * Generate summary using extractive summarization
   */
  async generateSummary(content, options = {}) {
    const {
      maxLength = 150,
      style = 'concise',
      includeKeyPoints = true,
      language = 'en'
    } = options;

    try {
      // Clean and preprocess content
      const cleanContent = this.preprocessContent(content);
      
      // Split into sentences
      const sentences = this.splitIntoSentences(cleanContent);
      
      if (sentences.length < 3) {
        return {
          summary: cleanContent,
          keyPoints: [cleanContent],
          readingTime: this.calculateReadingTime(cleanContent),
          confidence: 1.0
        };
      }

      // Calculate sentence importance scores
      const sentenceScores = this.calculateSentenceScores(sentences, cleanContent);
      
      // Select top sentences for summary
      const summarySentences = this.selectSummarySentences(sentences, sentenceScores, maxLength);
      
      // Generate summary
      const summary = this.formatSummary(summarySentences, style);
      
      // Generate key points if requested
      const keyPoints = includeKeyPoints ? await this.generateKeyPoints(content) : [];
      
      // Calculate reading time
      const readingTime = this.calculateReadingTime(content);
      
      // Calculate confidence score
      const confidence = this.calculateConfidence(sentences.length, summarySentences.length);

      logger.info('AI summary generated successfully', {
        originalLength: content.length,
        summaryLength: summary.length,
        keyPointsCount: keyPoints.length,
        readingTime
      });

      return {
        summary,
        keyPoints,
        readingTime,
        confidence,
        metadata: {
          originalWordCount: this.tokenizer.tokenize(content).length,
          summaryWordCount: this.tokenizer.tokenize(summary).length,
          compressionRatio: summary.length / content.length,
          style,
          language
        }
      };
    } catch (error) {
      logger.error('AI summary generation failed:', error);
      throw error;
    }
  }

  /**
   * Generate key points from content
   */
  async generateKeyPoints(content, options = {}) {
    const {
      maxPoints = 5,
      minLength = 10,
      maxLength = 100
    } = options;

    try {
      const cleanContent = this.preprocessContent(content);
      const sentences = this.splitIntoSentences(cleanContent);
      
      // Calculate TF-IDF scores for important terms
      this.tfidf.addDocument(cleanContent);
      const importantTerms = this.tfidf.listTerms(0).slice(0, 10);
      
      // Find sentences containing important terms
      const keySentences = sentences
        .filter(sentence => {
          const sentenceLower = sentence.toLowerCase();
          return importantTerms.some(term => 
            sentenceLower.includes(term.term.toLowerCase())
          );
        })
        .map(sentence => sentence.trim())
        .filter(sentence => 
          sentence.length >= minLength && sentence.length <= maxLength
        )
        .slice(0, maxPoints);

      // If not enough key sentences, add some based on position and length
      if (keySentences.length < maxPoints) {
        const remainingSentences = sentences
          .filter(sentence => !keySentences.includes(sentence))
          .filter(sentence => 
            sentence.length >= minLength && sentence.length <= maxLength
          )
          .slice(0, maxPoints - keySentences.length);
        
        keySentences.push(...remainingSentences);
      }

      return keySentences.slice(0, maxPoints);
    } catch (error) {
      logger.error('Key points generation failed:', error);
      return [];
    }
  }

  /**
   * Generate TL;DR (Too Long; Didn't Read) summary
   */
  async generateTLDR(content, options = {}) {
    const {
      maxLength = 100,
      style = 'casual'
    } = options;

    try {
      const summary = await this.generateSummary(content, {
        maxLength,
        style: 'concise',
        includeKeyPoints: false
      });

      let tldr = summary.summary;
      
      if (style === 'casual') {
        tldr = `TL;DR: ${tldr}`;
      } else if (style === 'bullet') {
        const points = tldr.split('. ').filter(point => point.trim());
        tldr = points.map(point => `• ${point}`).join('\n');
      }

      return {
        tldr,
        originalLength: content.length,
        tldrLength: tldr.length,
        compressionRatio: tldr.length / content.length
      };
    } catch (error) {
      logger.error('TL;DR generation failed:', error);
      throw error;
    }
  }

  /**
   * Preprocess content for analysis
   */
  preprocessContent(content) {
    return content
      .replace(/\s+/g, ' ') // Normalize whitespace
      .replace(/[^\w\s.,!?-]/g, ' ') // Remove special characters
      .trim();
  }

  /**
   * Split content into sentences
   */
  splitIntoSentences(content) {
    return content
      .split(/[.!?]+/)
      .map(sentence => sentence.trim())
      .filter(sentence => sentence.length > 10);
  }

  /**
   * Calculate sentence importance scores
   */
  calculateSentenceScores(sentences, fullContent) {
    const scores = [];
    
    for (let i = 0; i < sentences.length; i++) {
      const sentence = sentences[i];
      let score = 0;
      
      // Position score (first and last sentences are more important)
      if (i === 0 || i === sentences.length - 1) {
        score += 0.3;
      }
      
      // Length score (medium length sentences are preferred)
      const wordCount = this.tokenizer.tokenize(sentence).length;
      if (wordCount >= 8 && wordCount <= 25) {
        score += 0.2;
      }
      
      // Keyword density score
      const importantWords = this.getImportantWords(fullContent);
      const sentenceWords = this.tokenizer.tokenize(sentence.toLowerCase());
      const keywordMatches = importantWords.filter(word => 
        sentenceWords.includes(word)
      ).length;
      score += (keywordMatches / Math.max(sentenceWords.length, 1)) * 0.4;
      
      // Sentiment score (neutral to slightly positive is preferred)
      const sentimentScore = this.sentiment.getSentiment(sentenceWords);
      score += Math.max(0, 1 - Math.abs(sentimentScore)) * 0.1;
      
      scores.push(score);
    }
    
    return scores;
  }

  /**
   * Get important words from content
   */
  getImportantWords(content) {
    const words = this.tokenizer.tokenize(content.toLowerCase());
    const wordFreq = {};
    
    // Count word frequency
    words.forEach(word => {
      if (word.length > 3) { // Skip short words
        wordFreq[word] = (wordFreq[word] || 0) + 1;
      }
    });
    
    // Return words that appear multiple times
    return Object.keys(wordFreq)
      .filter(word => wordFreq[word] > 1)
      .sort((a, b) => wordFreq[b] - wordFreq[a])
      .slice(0, 20);
  }

  /**
   * Select sentences for summary
   */
  selectSummarySentences(sentences, scores, maxLength) {
    const sentenceScorePairs = sentences.map((sentence, index) => ({
      sentence,
      score: scores[index]
    }));
    
    // Sort by score (descending)
    sentenceScorePairs.sort((a, b) => b.score - a.score);
    
    const selectedSentences = [];
    let currentLength = 0;
    
    for (const pair of sentenceScorePairs) {
      if (currentLength + pair.sentence.length <= maxLength) {
        selectedSentences.push(pair.sentence);
        currentLength += pair.sentence.length;
      }
      
      if (currentLength >= maxLength * 0.8) {
        break;
      }
    }
    
    // Sort back to original order
    return selectedSentences.sort((a, b) => 
      sentences.indexOf(a) - sentences.indexOf(b)
    );
  }

  /**
   * Format summary based on style
   */
  formatSummary(sentences, style) {
    let summary = sentences.join('. ');
    
    if (style === 'bullet') {
      summary = sentences.map(sentence => `• ${sentence}`).join('\n');
    } else if (style === 'numbered') {
      summary = sentences.map((sentence, index) => `${index + 1}. ${sentence}`).join('\n');
    }
    
    return summary;
  }

  /**
   * Calculate reading time in minutes
   */
  calculateReadingTime(content) {
    const wordsPerMinute = 200; // Average reading speed
    const wordCount = this.tokenizer.tokenize(content).length;
    const minutes = wordCount / wordsPerMinute;
    
    return Math.ceil(minutes);
  }

  /**
   * Calculate confidence score
   */
  calculateConfidence(totalSentences, summarySentences) {
    if (totalSentences === 0) return 0;
    
    const ratio = summarySentences / totalSentences;
    
    // Higher confidence for moderate compression ratios
    if (ratio >= 0.1 && ratio <= 0.3) {
      return 0.9;
    } else if (ratio >= 0.05 && ratio <= 0.5) {
      return 0.7;
    } else {
      return 0.5;
    }
  }

  /**
   * Analyze content structure
   */
  analyzeContentStructure(content) {
    const sentences = this.splitIntoSentences(content);
    const words = this.tokenizer.tokenize(content);
    
    return {
      sentenceCount: sentences.length,
      wordCount: words.length,
      averageSentenceLength: words.length / sentences.length,
      paragraphCount: content.split(/\n\s*\n/).length,
      hasHeadings: /^#{1,6}\s/.test(content),
      hasLists: /^[\s]*[-*+]\s/.test(content),
      hasCode: /```|`/.test(content)
    };
  }

  /**
   * Get content statistics
   */
  getContentStats(content) {
    const cleanContent = this.preprocessContent(content);
    const words = this.tokenizer.tokenize(cleanContent);
    const sentences = this.splitIntoSentences(cleanContent);
    
    // Calculate unique words
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));
    
    // Calculate vocabulary diversity
    const vocabularyDiversity = uniqueWords.size / words.length;
    
    return {
      totalWords: words.length,
      uniqueWords: uniqueWords.size,
      vocabularyDiversity: Math.round(vocabularyDiversity * 100) / 100,
      sentenceCount: sentences.length,
      averageWordsPerSentence: Math.round((words.length / sentences.length) * 100) / 100,
      readingTime: this.calculateReadingTime(content),
      complexity: this.calculateComplexity(words, sentences)
    };
  }

  /**
   * Calculate content complexity
   */
  calculateComplexity(words, sentences) {
    const longWords = words.filter(word => word.length > 6).length;
    const longWordRatio = longWords / words.length;
    
    const avgSentenceLength = words.length / sentences.length;
    
    // Simple complexity score
    let complexity = 0;
    
    if (longWordRatio > 0.2) complexity += 0.4;
    if (avgSentenceLength > 20) complexity += 0.3;
    if (avgSentenceLength > 15) complexity += 0.2;
    if (avgSentenceLength > 10) complexity += 0.1;
    
    if (complexity >= 0.7) return 'high';
    if (complexity >= 0.4) return 'medium';
    return 'low';
  }
}

module.exports = AISummaryService; 