const natural = require('natural');
const logger = require('../utils/logger');

class AIAnalyzerService {
  constructor() {
    this.tokenizer = new natural.WordTokenizer();
    this.sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    this.tfidf = new natural.TfIdf();
  }

  /**
   * Comprehensive content analysis
   */
  async analyzeContent(content, options = {}) {
    const {
      includeSentiment = true,
      includeTopics = true,
      includeReadability = true,
      includeSEO = true,
      includeSuggestions = true
    } = options;

    try {
      const cleanContent = this.preprocessContent(content);
      const analysis = {
        timestamp: new Date().toISOString(),
        contentLength: content.length,
        wordCount: this.tokenizer.tokenize(cleanContent).length
      };

      // Sentiment analysis
      if (includeSentiment) {
        analysis.sentiment = await this.analyzeSentiment(cleanContent);
      }

      // Topic analysis
      if (includeTopics) {
        analysis.topics = await this.analyzeTopics(cleanContent);
      }

      // Readability analysis
      if (includeReadability) {
        analysis.readability = await this.analyzeReadability(cleanContent);
      }

      // SEO analysis
      if (includeSEO) {
        analysis.seo = await this.analyzeSEO(cleanContent);
      }

      // Content suggestions
      if (includeSuggestions) {
        analysis.suggestions = await this.generateSuggestions(cleanContent, analysis);
      }

      logger.info('Content analysis completed successfully', {
        contentLength: content.length,
        analysisTypes: Object.keys(analysis).filter(key => key !== 'timestamp' && key !== 'contentLength' && key !== 'wordCount')
      });

      return analysis;
    } catch (error) {
      logger.error('Content analysis failed:', error);
      throw error;
    }
  }

  /**
   * Analyze sentiment of content
   */
  async analyzeSentiment(content) {
    try {
      const words = this.tokenizer.tokenize(content);
      const sentimentScore = this.sentiment.getSentiment(words);
      
      // Determine sentiment category
      let sentiment = 'neutral';
      let intensity = 'low';
      
      if (sentimentScore > 2) {
        sentiment = 'positive';
        intensity = sentimentScore > 5 ? 'high' : 'medium';
      } else if (sentimentScore < -2) {
        sentiment = 'negative';
        intensity = sentimentScore < -5 ? 'high' : 'medium';
      }

      // Analyze emotional tone
      const emotionalTone = this.analyzeEmotionalTone(content);

      return {
        score: Math.round(sentimentScore * 100) / 100,
        sentiment,
        intensity,
        emotionalTone,
        confidence: this.calculateSentimentConfidence(words.length)
      };
    } catch (error) {
      logger.error('Sentiment analysis failed:', error);
      return {
        score: 0,
        sentiment: 'neutral',
        intensity: 'low',
        emotionalTone: 'neutral',
        confidence: 0
      };
    }
  }

  /**
   * Analyze emotional tone
   */
  analyzeEmotionalTone(content) {
    const emotionalWords = {
      joy: ['happy', 'excited', 'great', 'wonderful', 'amazing', 'fantastic'],
      sadness: ['sad', 'depressed', 'miserable', 'unhappy', 'disappointed'],
      anger: ['angry', 'furious', 'mad', 'irritated', 'annoyed'],
      fear: ['scared', 'afraid', 'terrified', 'worried', 'anxious'],
      surprise: ['surprised', 'shocked', 'amazed', 'astonished'],
      trust: ['trust', 'believe', 'confident', 'sure', 'certain'],
      anticipation: ['expect', 'hope', 'look forward', 'anticipate'],
      disgust: ['disgusting', 'revolting', 'gross', 'nasty']
    };

    const contentLower = content.toLowerCase();
    const toneScores = {};

    for (const [emotion, words] of Object.entries(emotionalWords)) {
      toneScores[emotion] = words.filter(word => contentLower.includes(word)).length;
    }

    // Find dominant emotion
    const dominantEmotion = Object.entries(toneScores)
      .sort(([,a], [,b]) => b - a)[0];

    return {
      dominant: dominantEmotion[0],
      score: dominantEmotion[1],
      allScores: toneScores
    };
  }

  /**
   * Analyze topics in content
   */
  async analyzeTopics(content) {
    try {
      const words = this.tokenizer.tokenize(content.toLowerCase());
      const wordFreq = {};
      
      // Count word frequency (excluding common words)
      const stopWords = new Set(['the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by', 'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might', 'can', 'this', 'that', 'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they', 'me', 'him', 'her', 'us', 'them']);
      
      words.forEach(word => {
        if (word.length > 3 && !stopWords.has(word)) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });

      // Get top topics
      const topics = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => ({
          word,
          frequency: count,
          percentage: Math.round((count / words.length) * 1000) / 10
        }));

      // Categorize topics
      const categories = this.categorizeTopics(topics);

      return {
        primaryTopics: topics.slice(0, 5),
        allTopics: topics,
        categories,
        topicDiversity: this.calculateTopicDiversity(topics)
      };
    } catch (error) {
      logger.error('Topic analysis failed:', error);
      return {
        primaryTopics: [],
        allTopics: [],
        categories: {},
        topicDiversity: 0
      };
    }
  }

  /**
   * Categorize topics into themes
   */
  categorizeTopics(topics) {
    const categories = {
      technology: ['tech', 'software', 'programming', 'computer', 'digital', 'app', 'website', 'code'],
      business: ['business', 'company', 'market', 'industry', 'profit', 'revenue', 'growth'],
      health: ['health', 'medical', 'fitness', 'wellness', 'diet', 'exercise', 'medicine'],
      education: ['education', 'learning', 'school', 'university', 'study', 'course', 'training'],
      entertainment: ['entertainment', 'movie', 'music', 'game', 'fun', 'enjoy', 'play'],
      sports: ['sport', 'game', 'team', 'player', 'match', 'competition', 'athlete'],
      politics: ['politics', 'government', 'policy', 'election', 'vote', 'democracy'],
      science: ['science', 'research', 'study', 'experiment', 'discovery', 'theory']
    };

    const categorized = {};

    for (const [category, keywords] of Object.entries(categories)) {
      const matchingTopics = topics.filter(topic => 
        keywords.some(keyword => topic.word.includes(keyword))
      );
      
      if (matchingTopics.length > 0) {
        categorized[category] = matchingTopics;
      }
    }

    return categorized;
  }

  /**
   * Analyze readability
   */
  async analyzeReadability(content) {
    try {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = this.tokenizer.tokenize(content);
      const syllables = this.countSyllables(content);

      // Flesch Reading Ease
      const fleschScore = 206.835 - (1.015 * (words.length / sentences.length)) - (84.6 * (syllables / words.length));
      
      // Flesch-Kincaid Grade Level
      const gradeLevel = 0.39 * (words.length / sentences.length) + 11.8 * (syllables / words.length) - 15.59;

      // Determine readability level
      let readabilityLevel = 'college';
      if (fleschScore >= 90) readabilityLevel = 'elementary';
      else if (fleschScore >= 80) readabilityLevel = 'middle school';
      else if (fleschScore >= 70) readabilityLevel = 'high school';
      else if (fleschScore >= 60) readabilityLevel = 'college';
      else readabilityLevel = 'graduate';

      return {
        fleschReadingEase: Math.round(fleschScore * 100) / 100,
        fleschKincaidGrade: Math.round(gradeLevel * 100) / 100,
        readabilityLevel,
        averageWordsPerSentence: Math.round((words.length / sentences.length) * 100) / 100,
        averageSyllablesPerWord: Math.round((syllables / words.length) * 100) / 100,
        sentenceCount: sentences.length,
        wordCount: words.length,
        syllableCount: syllables
      };
    } catch (error) {
      logger.error('Readability analysis failed:', error);
      return {
        fleschReadingEase: 0,
        fleschKincaidGrade: 0,
        readabilityLevel: 'unknown',
        averageWordsPerSentence: 0,
        averageSyllablesPerWord: 0,
        sentenceCount: 0,
        wordCount: 0,
        syllableCount: 0
      };
    }
  }

  /**
   * Analyze SEO aspects
   */
  async analyzeSEO(content) {
    try {
      const words = this.tokenizer.tokenize(content.toLowerCase());
      const wordFreq = {};
      
      // Count word frequency
      words.forEach(word => {
        if (word.length > 2) {
          wordFreq[word] = (wordFreq[word] || 0) + 1;
        }
      });

      // Get keyword density
      const keywordDensity = Object.entries(wordFreq)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 10)
        .map(([word, count]) => ({
          keyword: word,
          count,
          density: Math.round((count / words.length) * 10000) / 100
        }));

      // Check for common SEO issues
      const seoIssues = this.checkSEOIssues(content, words);

      // Calculate SEO score
      const seoScore = this.calculateSEOScore(content, words, seoIssues);

      return {
        keywordDensity,
        seoScore,
        issues: seoIssues,
        recommendations: this.generateSEORecommendations(seoIssues, keywordDensity)
      };
    } catch (error) {
      logger.error('SEO analysis failed:', error);
      return {
        keywordDensity: [],
        seoScore: 0,
        issues: [],
        recommendations: []
      };
    }
  }

  /**
   * Check for common SEO issues
   */
  checkSEOIssues(content, words) {
    const issues = [];

    // Check content length
    if (words.length < 300) {
      issues.push('Content is too short (less than 300 words)');
    }

    // Check for keyword stuffing
    const wordFreq = {};
    words.forEach(word => {
      wordFreq[word] = (wordFreq[word] || 0) + 1;
    });

    const maxDensity = Math.max(...Object.values(wordFreq));
    const maxDensityWord = Object.keys(wordFreq).find(word => wordFreq[word] === maxDensity);
    
    if (maxDensity > words.length * 0.05) {
      issues.push(`Potential keyword stuffing: "${maxDensityWord}" appears too frequently`);
    }

    // Check for headings
    if (!content.includes('#')) {
      issues.push('No headings found - consider adding H1, H2, H3 tags');
    }

    // Check for lists
    if (!content.includes('-') && !content.includes('*') && !content.includes('1.')) {
      issues.push('No lists found - consider adding bullet points or numbered lists');
    }

    return issues;
  }

  /**
   * Calculate SEO score
   */
  calculateSEOScore(content, words, issues) {
    let score = 100;

    // Deduct points for issues
    score -= issues.length * 10;

    // Bonus for good content length
    if (words.length >= 500) score += 10;
    if (words.length >= 1000) score += 10;

    // Bonus for headings
    if (content.includes('#')) score += 10;

    // Bonus for lists
    if (content.includes('-') || content.includes('*') || content.includes('1.')) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Generate content suggestions
   */
  async generateSuggestions(content, analysis) {
    const suggestions = [];

    // Based on sentiment
    if (analysis.sentiment && analysis.sentiment.intensity === 'low') {
      suggestions.push('Consider adding more emotional language to engage readers');
    }

    // Based on readability
    if (analysis.readability && analysis.readability.fleschReadingEase < 60) {
      suggestions.push('Consider simplifying language to improve readability');
    }

    // Based on SEO
    if (analysis.seo && analysis.seo.seoScore < 70) {
      suggestions.push('Consider improving SEO by adding more headings and lists');
    }

    // Based on content length
    if (analysis.wordCount < 300) {
      suggestions.push('Consider expanding content to provide more value to readers');
    }

    // Based on topic diversity
    if (analysis.topics && analysis.topics.topicDiversity < 0.3) {
      suggestions.push('Consider diversifying topics to appeal to broader audience');
    }

    return suggestions;
  }

  /**
   * Preprocess content
   */
  preprocessContent(content) {
    return content
      .replace(/\s+/g, ' ')
      .replace(/[^\w\s.,!?-]/g, ' ')
      .trim();
  }

  /**
   * Count syllables in text
   */
  countSyllables(text) {
    const words = text.toLowerCase().split(/\s+/);
    let syllableCount = 0;

    for (const word of words) {
      syllableCount += this.countWordSyllables(word);
    }

    return syllableCount;
  }

  /**
   * Count syllables in a single word
   */
  countWordSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  }

  /**
   * Calculate sentiment confidence
   */
  calculateSentimentConfidence(wordCount) {
    if (wordCount < 10) return 0.3;
    if (wordCount < 50) return 0.6;
    if (wordCount < 100) return 0.8;
    return 0.9;
  }

  /**
   * Calculate topic diversity
   */
  calculateTopicDiversity(topics) {
    if (topics.length === 0) return 0;
    
    const totalFrequency = topics.reduce((sum, topic) => sum + topic.frequency, 0);
    const diversity = topics.length / Math.log(totalFrequency + 1);
    
    return Math.round(diversity * 100) / 100;
  }

  /**
   * Generate SEO recommendations
   */
  generateSEORecommendations(issues, keywordDensity) {
    const recommendations = [];

    if (issues.includes('Content is too short')) {
      recommendations.push('Expand content to at least 300 words for better SEO');
    }

    if (issues.includes('No headings found')) {
      recommendations.push('Add H1, H2, H3 headings to improve structure and SEO');
    }

    if (issues.includes('No lists found')) {
      recommendations.push('Add bullet points or numbered lists to improve readability');
    }

    // Keyword recommendations
    if (keywordDensity.length > 0) {
      const topKeyword = keywordDensity[0];
      if (topKeyword.density > 3) {
        recommendations.push(`Reduce keyword density for "${topKeyword.keyword}" (currently ${topKeyword.density}%)`);
      }
    }

    return recommendations;
  }
}

module.exports = AIAnalyzerService; 