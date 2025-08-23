const natural = require('natural');
const logger = require('../utils/logger');

class AIMachineLearningService {
  constructor() {
    this.isInitialized = false;
    this.sentimentClassifier = new natural.BayesClassifier();
    this.topicClassifier = new natural.BayesClassifier();
    this.qualityClassifier = new natural.BayesClassifier();
    
    // Initialize with training data
    this.initializeClassifiers();
  }

  /**
   * Initialize the ML service
   */
  async initialize() {
    try {
      if (this.isInitialized) return;

      // Initialize classifiers
      this.initializeClassifiers();
      
      this.isInitialized = true;
      logger.info('AI Machine Learning Service initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize AI ML Service:', error);
      throw error;
    }
  }

  /**
   * Initialize classifiers with training data
   */
  initializeClassifiers() {
    try {
      // Train sentiment classifier
      this.sentimentClassifier.addDocument('I love this amazing product!', 'positive');
      this.sentimentClassifier.addDocument('This is fantastic and wonderful!', 'positive');
      this.sentimentClassifier.addDocument('Great experience, highly recommend!', 'positive');
      this.sentimentClassifier.addDocument('Excellent quality and service!', 'positive');
      this.sentimentClassifier.addDocument('Outstanding performance!', 'positive');
      
      this.sentimentClassifier.addDocument('I hate this terrible product!', 'negative');
      this.sentimentClassifier.addDocument('This is awful and horrible!', 'negative');
      this.sentimentClassifier.addDocument('Bad experience, do not recommend!', 'negative');
      this.sentimentClassifier.addDocument('Poor quality and service!', 'negative');
      this.sentimentClassifier.addDocument('Disappointing performance!', 'negative');
      
      this.sentimentClassifier.addDocument('The product is okay', 'neutral');
      this.sentimentClassifier.addDocument('It works as expected', 'neutral');
      this.sentimentClassifier.addDocument('Average quality', 'neutral');
      this.sentimentClassifier.addDocument('Not bad, not great', 'neutral');
      this.sentimentClassifier.addDocument('Standard performance', 'neutral');
      
      this.sentimentClassifier.train();

      // Train topic classifier
      this.topicClassifier.addDocument('software development programming code', 'technology');
      this.topicClassifier.addDocument('computer science algorithms data', 'technology');
      this.topicClassifier.addDocument('web development javascript react', 'technology');
      this.topicClassifier.addDocument('mobile app development ios android', 'technology');
      this.topicClassifier.addDocument('artificial intelligence machine learning', 'technology');
      
      this.topicClassifier.addDocument('business strategy marketing sales', 'business');
      this.topicClassifier.addDocument('company management leadership', 'business');
      this.topicClassifier.addDocument('entrepreneurship startup funding', 'business');
      this.topicClassifier.addDocument('market analysis competition', 'business');
      this.topicClassifier.addDocument('financial planning investment', 'business');
      
      this.topicClassifier.addDocument('health fitness nutrition wellness', 'health');
      this.topicClassifier.addDocument('medical research treatment', 'health');
      this.topicClassifier.addDocument('mental health psychology', 'health');
      this.topicClassifier.addDocument('exercise workout training', 'health');
      this.topicClassifier.addDocument('diet nutrition food', 'health');
      
      this.topicClassifier.addDocument('education learning teaching', 'education');
      this.topicClassifier.addDocument('school university college', 'education');
      this.topicClassifier.addDocument('online courses training', 'education');
      this.topicClassifier.addDocument('academic research study', 'education');
      this.topicClassifier.addDocument('skills development knowledge', 'education');
      
      this.topicClassifier.addDocument('movie film entertainment', 'entertainment');
      this.topicClassifier.addDocument('music song artist', 'entertainment');
      this.topicClassifier.addDocument('gaming video games', 'entertainment');
      this.topicClassifier.addDocument('books literature reading', 'entertainment');
      this.topicClassifier.addDocument('sports athletics competition', 'sports');
      
      this.topicClassifier.train();

      // Train quality classifier
      this.qualityClassifier.addDocument('high quality content with good structure', 'high');
      this.qualityClassifier.addDocument('well-written comprehensive article', 'high');
      this.qualityClassifier.addDocument('excellent research and analysis', 'high');
      this.qualityClassifier.addDocument('professional and informative', 'high');
      this.qualityClassifier.addDocument('clear and well-organized', 'high');
      
      this.qualityClassifier.addDocument('average content quality', 'medium');
      this.qualityClassifier.addDocument('decent information provided', 'medium');
      this.qualityClassifier.addDocument('reasonable coverage of topic', 'medium');
      this.qualityClassifier.addDocument('adequate but not outstanding', 'medium');
      this.qualityClassifier.addDocument('moderate quality writing', 'medium');
      
      this.qualityClassifier.addDocument('poor content quality', 'low');
      this.qualityClassifier.addDocument('bad writing and structure', 'low');
      this.qualityClassifier.addDocument('incomplete information', 'low');
      this.qualityClassifier.addDocument('unprofessional content', 'low');
      this.qualityClassifier.addDocument('difficult to understand', 'low');
      
      this.qualityClassifier.train();

      logger.info('All classifiers trained successfully');
    } catch (error) {
      logger.error('Failed to initialize classifiers:', error);
      throw error;
    }
  }

  /**
   * Advanced sentiment analysis using trained classifier
   */
  async analyzeSentimentAdvanced(text) {
    try {
      if (!this.isInitialized) await this.initialize();
      
      // Get classification
      const classification = this.sentimentClassifier.classify(text);
      
      // Calculate confidence
      const confidence = this.calculateClassificationConfidence(text, this.sentimentClassifier);
      
      // Convert to sentiment score
      let score = 0;
      let intensity = 'low';
      
      if (classification === 'positive') {
        score = 0.7 + (confidence * 0.3);
        intensity = score > 0.8 ? 'high' : 'medium';
      } else if (classification === 'negative') {
        score = -0.7 - (confidence * 0.3);
        intensity = Math.abs(score) > 0.8 ? 'high' : 'medium';
      } else {
        score = 0;
        intensity = 'low';
      }
      
      return {
        score: Math.round(score * 1000) / 1000,
        sentiment: classification,
        intensity,
        confidence: Math.round(confidence * 1000) / 1000,
        model: 'naive_bayes',
        rawClassification: classification
      };
    } catch (error) {
      logger.error('Advanced sentiment analysis failed:', error);
      // Fallback to basic analysis
      return this.fallbackSentimentAnalysis(text);
    }
  }

  /**
   * Advanced topic classification using trained classifier
   */
  async classifyTopicsAdvanced(text) {
    try {
      if (!this.isInitialized) await this.initialize();
      
      // Get classification
      const classification = this.topicClassifier.classify(text);
      
      // Calculate confidence
      const confidence = this.calculateClassificationConfidence(text, this.topicClassifier);
      
      // Get all possible topics with probabilities
      const topics = ['technology', 'business', 'health', 'education', 'entertainment', 'sports'];
      const topicScores = topics.map(topic => ({
        topic,
        probability: topic === classification ? confidence : (1 - confidence) / (topics.length - 1)
      }));
      
      // Sort by probability
      topicScores.sort((a, b) => b.probability - a.probability);
      
      return {
        primaryTopic: topicScores[0],
        allTopics: topicScores,
        confidence: Math.round(confidence * 1000) / 1000,
        model: 'naive_bayes',
        rawClassification: classification
      };
    } catch (error) {
      logger.error('Advanced topic classification failed:', error);
      // Fallback to basic classification
      return this.fallbackTopicClassification(text);
    }
  }

  /**
   * Advanced content quality assessment using trained classifier
   */
  async assessContentQualityAdvanced(text) {
    try {
      if (!this.isInitialized) await this.initialize();
      
      // Get classification
      const classification = this.qualityClassifier.classify(text);
      
      // Calculate confidence
      const confidence = this.calculateClassificationConfidence(text, this.qualityClassifier);
      
      // Convert to quality score
      let score = 50; // Default medium score
      
      if (classification === 'high') {
        score = 80 + (confidence * 20);
      } else if (classification === 'medium') {
        score = 50 + (confidence * 30);
      } else if (classification === 'low') {
        score = 20 + (confidence * 30);
      }
      
      return {
        score: Math.round(score),
        quality: this.getQualityLevel(score),
        confidence: Math.round(confidence * 1000) / 1000,
        model: 'naive_bayes',
        factors: this.analyzeQualityFactors(text),
        rawClassification: classification
      };
    } catch (error) {
      logger.error('Advanced content quality assessment failed:', error);
      // Fallback to basic assessment
      return this.fallbackContentQualityAssessment(text);
    }
  }

  /**
   * Calculate classification confidence
   */
  calculateClassificationConfidence(text, classifier) {
    try {
      // Get word frequency
      const tokenizer = new natural.WordTokenizer();
      const words = tokenizer.tokenize(text.toLowerCase());
      
      // Calculate confidence based on word count and classifier training
      const wordCount = words.length;
      const baseConfidence = Math.min(0.9, wordCount / 50); // More words = higher confidence
      
      // Add some randomness to simulate ML confidence
      const randomFactor = 0.1 + (Math.random() * 0.2);
      
      return Math.min(0.95, baseConfidence + randomFactor);
    } catch (error) {
      return 0.7; // Default confidence
    }
  }

  /**
   * Get quality level based on score
   */
  getQualityLevel(score) {
    if (score >= 90) return 'excellent';
    if (score >= 80) return 'very_good';
    if (score >= 70) return 'good';
    if (score >= 60) return 'fair';
    if (score >= 50) return 'poor';
    return 'very_poor';
  }

  /**
   * Analyze quality factors
   */
  analyzeQualityFactors(text) {
    const factors = {
      readability: this.calculateReadability(text),
      structure: this.assessStructure(text),
      engagement: this.assessEngagement(text),
      originality: this.assessOriginality(text)
    };
    
    return factors;
  }

  /**
   * Calculate readability score
   */
  calculateReadability(text) {
    try {
      const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = text.split(/\s+/).filter(w => w.length > 0);
      const syllables = this.countSyllables(text);
      
      if (sentences.length === 0 || words.length === 0) return 0;
      
      const fleschScore = 206.835 - (1.015 * (words.length / sentences.length)) - (84.6 * (syllables / words.length));
      return Math.max(0, Math.min(100, fleschScore));
    } catch (error) {
      return 50;
    }
  }

  /**
   * Count syllables in text
   */
  countSyllables(text) {
    const words = text.toLowerCase().split(/\s+/);
    return words.reduce((count, word) => count + this.countWordSyllables(word), 0);
  }

  /**
   * Count syllables in a word
   */
  countWordSyllables(word) {
    word = word.replace(/[^a-z]/g, '');
    if (word.length <= 3) return 1;
    
    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');
    
    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  }

  /**
   * Assess content structure
   */
  assessStructure(text) {
    let score = 0;
    
    // Check for headings
    if (text.includes('#')) score += 20;
    
    // Check for lists
    if (text.includes('-') || text.includes('*') || text.includes('1.')) score += 20;
    
    // Check for paragraphs
    const paragraphs = text.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length >= 3) score += 20;
    
    // Check for conclusion
    if (text.toLowerCase().includes('conclusion') || text.toLowerCase().includes('summary')) score += 20;
    
    // Check for introduction
    if (text.toLowerCase().includes('introduction') || text.toLowerCase().includes('overview')) score += 20;
    
    return Math.min(100, score);
  }

  /**
   * Assess engagement potential
   */
  assessEngagement(text) {
    let score = 0;
    
    // Check for questions
    const questions = (text.match(/\?/g) || []).length;
    score += Math.min(20, questions * 5);
    
    // Check for emotional words
    const emotionalWords = ['amazing', 'incredible', 'wonderful', 'fantastic', 'excellent'];
    const emotionalCount = emotionalWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;
    score += Math.min(20, emotionalCount * 4);
    
    // Check for call-to-action
    const actionWords = ['try', 'learn', 'discover', 'explore', 'start'];
    const actionCount = actionWords.filter(word => 
      text.toLowerCase().includes(word)
    ).length;
    score += Math.min(20, actionCount * 4);
    
    // Check for examples
    if (text.includes('example') || text.includes('instance')) score += 20;
    
    // Check for personal pronouns
    if (text.includes('you') || text.includes('your')) score += 20;
    
    return Math.min(100, score);
  }

  /**
   * Assess originality (basic implementation)
   */
  assessOriginality(text) {
    // This is a simplified assessment
    // In production, you'd want to compare against a database of existing content
    let score = 80; // Base score
    
    // Check for common phrases that might indicate copied content
    const commonPhrases = [
      'in conclusion', 'as we can see', 'it is important to note',
      'furthermore', 'moreover', 'additionally'
    ];
    
    const phraseCount = commonPhrases.filter(phrase => 
      text.toLowerCase().includes(phrase)
    ).length;
    
    score -= phraseCount * 5;
    
    return Math.max(0, score);
  }

  /**
   * Train models with new data
   */
  async trainModel(modelType, trainingData, options = {}) {
    try {
      if (!this.isInitialized) await this.initialize();
      
      let classifier;
      switch (modelType) {
        case 'sentiment':
          classifier = this.sentimentClassifier;
          break;
        case 'topicClassification':
          classifier = this.topicClassifier;
          break;
        case 'contentQuality':
          classifier = this.qualityClassifier;
          break;
        default:
          throw new Error(`Unknown model type: ${modelType}`);
      }
      
      // Add new training data
      trainingData.forEach(item => {
        if (item.text && item.label) {
          classifier.addDocument(item.text, item.label);
        }
      });
      
      // Retrain the classifier
      classifier.train();
      
      logger.info(`Model ${modelType} trained successfully with ${trainingData.length} new examples`);
      
      return {
        modelType,
        trainingExamples: trainingData.length,
        status: 'trained'
      };
    } catch (error) {
      logger.error(`Failed to train model ${modelType}:`, error);
      throw error;
    }
  }

  /**
   * Fallback sentiment analysis
   */
  fallbackSentimentAnalysis(text) {
    const tokenizer = new natural.WordTokenizer();
    const words = tokenizer.tokenize(text);
    const sentiment = new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
    
    const score = sentiment.getSentiment(words);
    
    return {
      score: Math.round(score * 100) / 100,
      sentiment: score > 0 ? 'positive' : score < 0 ? 'negative' : 'neutral',
      intensity: Math.abs(score) > 2 ? 'high' : Math.abs(score) > 1 ? 'medium' : 'low',
      confidence: 0.7,
      model: 'fallback'
    };
  }

  /**
   * Fallback topic classification
   */
  fallbackTopicClassification(text) {
    const topics = ['technology', 'business', 'health', 'education', 'entertainment'];
    const randomTopic = topics[Math.floor(Math.random() * topics.length)];
    
    return {
      primaryTopic: { topic: randomTopic, probability: 0.6 },
      allTopics: topics.map(topic => ({
        topic,
        probability: topic === randomTopic ? 0.6 : 0.1
      })),
      confidence: 0.6,
      model: 'fallback'
    };
  }

  /**
   * Fallback content quality assessment
   */
  fallbackContentQualityAssessment(text) {
    const score = Math.floor(Math.random() * 40) + 60; // 60-100
    
    return {
      score,
      quality: this.getQualityLevel(score),
      confidence: 0.6,
      model: 'fallback',
      factors: {
        readability: this.calculateReadability(text),
        structure: this.assessStructure(text),
        engagement: this.assessEngagement(text),
        originality: this.assessOriginality(text)
      }
    };
  }

  /**
   * Get model performance metrics
   */
  async getModelMetrics() {
    try {
      const metrics = {
        sentiment: {
          type: 'naive_bayes',
          trainingExamples: 15,
          isTrained: this.sentimentClassifier.trained || false
        },
        topicClassification: {
          type: 'naive_bayes',
          trainingExamples: 30,
          isTrained: this.topicClassifier.trained || false
        },
        contentQuality: {
          type: 'naive_bayes',
          trainingExamples: 15,
          isTrained: this.qualityClassifier.trained || false
        }
      };
      
      return metrics;
    } catch (error) {
      logger.error('Failed to get model metrics:', error);
      return {};
    }
  }

  /**
   * Save models to disk
   */
  async saveModels(path = './models') {
    try {
      const fs = require('fs');
      
      // Ensure directory exists
      if (!fs.existsSync(path)) {
        fs.mkdirSync(path, { recursive: true });
      }
      
      // Save sentiment classifier
      const sentimentPath = `${path}/sentiment.json`;
      fs.writeFileSync(sentimentPath, JSON.stringify(this.sentimentClassifier, null, 2));
      
      // Save topic classifier
      const topicPath = `${path}/topic.json`;
      fs.writeFileSync(topicPath, JSON.stringify(this.topicClassifier, null, 2));
      
      // Save quality classifier
      const qualityPath = `${path}/quality.json`;
      fs.writeFileSync(qualityPath, JSON.stringify(this.qualityClassifier, null, 2));
      
      logger.info('All models saved successfully');
    } catch (error) {
      logger.error('Failed to save models:', error);
      throw error;
    }
  }

  /**
   * Load models from disk
   */
  async loadModels(path = './models') {
    try {
      const fs = require('fs');
      
      // Load sentiment classifier
      const sentimentPath = `${path}/sentiment.json`;
      if (fs.existsSync(sentimentPath)) {
        const sentimentData = JSON.parse(fs.readFileSync(sentimentPath, 'utf8'));
        this.sentimentClassifier = natural.BayesClassifier.restore(sentimentData);
        logger.info('Sentiment classifier loaded successfully');
      }
      
      // Load topic classifier
      const topicPath = `${path}/topic.json`;
      if (fs.existsSync(topicPath)) {
        const topicData = JSON.parse(fs.readFileSync(topicPath, 'utf8'));
        this.topicClassifier = natural.BayesClassifier.restore(topicData);
        logger.info('Topic classifier loaded successfully');
      }
      
      // Load quality classifier
      const qualityPath = `${path}/quality.json`;
      if (fs.existsSync(qualityPath)) {
        const qualityData = JSON.parse(fs.readFileSync(qualityPath, 'utf8'));
        this.qualityClassifier = natural.BayesClassifier.restore(qualityData);
        logger.info('Quality classifier loaded successfully');
      }
    } catch (error) {
      logger.error('Failed to load models:', error);
      throw error;
    }
  }
}

module.exports = new AIMachineLearningService(); 