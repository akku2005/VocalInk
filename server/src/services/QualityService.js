const logger = require('../utils/logger');

class QualityService {
  // Quality scoring weights
  static QUALITY_WEIGHTS = {
    // Content metrics
    wordCount: 0.15,
    readability: 0.20,
    uniqueness: 0.15,
    structure: 0.10,
    
    // Engagement metrics
    engagement: 0.15,
    completion: 0.10,
    timeSpent: 0.10,
    
    // Technical metrics
    formatting: 0.05,
  };

  // Minimum thresholds
  static MINIMUM_THRESHOLDS = {
    wordCount: 50,
    readingTime: 30, // seconds
    engagement: 0.3, // 30% engagement
  };

  /**
   * Calculate overall quality score for content
   */
  static async calculateContentQuality(content, metadata = {}) {
    try {
      const scores = {};

      // Calculate individual quality metrics
      scores.wordCount = this.calculateWordCountScore(content);
      scores.readability = this.calculateReadabilityScore(content);
      scores.uniqueness = await this.calculateUniquenessScore(content);
      scores.structure = this.calculateStructureScore(content);
      scores.engagement = this.calculateEngagementScore(metadata);
      scores.completion = this.calculateCompletionScore(metadata);
      scores.timeSpent = this.calculateTimeSpentScore(metadata);
      scores.formatting = this.calculateFormattingScore(content);

      // Calculate weighted average
      const overallScore = this.calculateWeightedScore(scores);

      logger.info('Content quality calculated', {
        scores,
        overallScore,
        contentLength: content.length,
      });

      return {
        overallScore: Math.round(overallScore),
        breakdown: scores,
        grade: this.getQualityGrade(overallScore),
        multiplier: this.getQualityMultiplier(overallScore),
      };
    } catch (error) {
      logger.error('Error calculating content quality:', error);
      return {
        overallScore: 50, // Default score
        breakdown: {},
        grade: 'C',
        multiplier: 1.0,
      };
    }
  }

  /**
   * Calculate word count score
   */
  static calculateWordCountScore(content) {
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    
    if (wordCount < this.MINIMUM_THRESHOLDS.wordCount) {
      return Math.max(0, (wordCount / this.MINIMUM_THRESHOLDS.wordCount) * 50);
    }
    
    // Optimal range: 300-2000 words
    if (wordCount >= 300 && wordCount <= 2000) {
      return 100;
    }
    
    // Penalize very short or very long content
    if (wordCount < 300) {
      return 50 + (wordCount - this.MINIMUM_THRESHOLDS.wordCount) / (300 - this.MINIMUM_THRESHOLDS.wordCount) * 50;
    }
    
    // Penalize extremely long content
    return Math.max(60, 100 - (wordCount - 2000) / 100);
  }

  /**
   * Calculate readability score using Flesch Reading Ease
   */
  static calculateReadabilityScore(content) {
    try {
      const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
      const words = content.split(/\s+/).filter(word => word.length > 0);
      const syllables = this.countSyllables(content);

      if (sentences.length === 0 || words.length === 0) {
        return 50;
      }

      // Flesch Reading Ease formula
      const fleschScore = 206.835 - (1.015 * (words.length / sentences.length)) - (84.6 * (syllables / words.length));

      // Convert to 0-100 scale
      let score = Math.max(0, Math.min(100, fleschScore));

      // Adjust for optimal readability (60-80 is considered good)
      if (score >= 60 && score <= 80) {
        score = 100;
      } else if (score >= 50 && score < 60) {
        score = 80 + (score - 50) * 2;
      } else if (score > 80 && score <= 90) {
        score = 100 - (score - 80) * 2;
      } else {
        score = Math.max(0, score * 0.8);
      }

      return Math.round(score);
    } catch (error) {
      logger.error('Error calculating readability score:', error);
      return 50;
    }
  }

  /**
   * Calculate uniqueness score (placeholder for plagiarism detection)
   */
  static async calculateUniquenessScore(content) {
    // This would integrate with a plagiarism detection service
    // For now, return a base score based on content characteristics
    
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const uniqueWords = new Set(words.map(word => word.toLowerCase()));
    const uniquenessRatio = uniqueWords.size / words.length;

    // Base score on vocabulary diversity
    let score = uniquenessRatio * 100;

    // Penalize very repetitive content
    if (uniquenessRatio < 0.3) {
      score *= 0.5;
    }

    // Bonus for good vocabulary diversity
    if (uniquenessRatio > 0.7) {
      score = Math.min(100, score * 1.2);
    }

    return Math.round(score);
  }

  /**
   * Calculate structure score
   */
  static calculateStructureScore(content) {
    let score = 50;

    // Check for paragraphs
    const paragraphs = content.split(/\n\s*\n/).filter(p => p.trim().length > 0);
    if (paragraphs.length >= 3) {
      score += 20;
    } else if (paragraphs.length >= 1) {
      score += 10;
    }

    // Check for headings
    const headings = content.match(/^#{1,6}\s+.+$/gm) || [];
    if (headings.length >= 2) {
      score += 15;
    } else if (headings.length >= 1) {
      score += 10;
    }

    // Check for lists
    const lists = content.match(/^[\s]*[-*+]\s+.+$/gm) || [];
    if (lists.length >= 3) {
      score += 10;
    } else if (lists.length >= 1) {
      score += 5;
    }

    // Check for proper sentence structure
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const avgSentenceLength = sentences.reduce((sum, s) => sum + s.split(/\s+/).length, 0) / sentences.length;
    
    if (avgSentenceLength >= 10 && avgSentenceLength <= 25) {
      score += 10;
    } else if (avgSentenceLength >= 5 && avgSentenceLength <= 30) {
      score += 5;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate engagement score based on user interaction
   */
  static calculateEngagementScore(metadata) {
    const { likes, comments, shares, bookmarks, views } = metadata;
    
    if (!views || views === 0) {
      return 50; // Default score
    }

    const engagementRate = ((likes || 0) + (comments || 0) * 2 + (shares || 0) * 3 + (bookmarks || 0) * 1.5) / views;
    
    // Convert to 0-100 scale
    let score = Math.min(100, engagementRate * 1000);

    // Bonus for high engagement
    if (engagementRate > 0.1) {
      score = Math.min(100, score * 1.2);
    }

    return Math.round(score);
  }

  /**
   * Calculate completion score
   */
  static calculateCompletionScore(metadata) {
    const { scrollPercentage, timeSpent, estimatedReadingTime } = metadata;
    
    if (!scrollPercentage && !timeSpent) {
      return 50; // Default score
    }

    let score = 50;

    // Scroll-based completion
    if (scrollPercentage) {
      if (scrollPercentage >= 90) {
        score += 40;
      } else if (scrollPercentage >= 70) {
        score += 30;
      } else if (scrollPercentage >= 50) {
        score += 20;
      } else if (scrollPercentage >= 30) {
        score += 10;
      }
    }

    // Time-based completion
    if (timeSpent && estimatedReadingTime) {
      const timeRatio = timeSpent / estimatedReadingTime;
      if (timeRatio >= 0.8 && timeRatio <= 2.0) {
        score += 10;
      } else if (timeRatio >= 0.5 && timeRatio <= 3.0) {
        score += 5;
      }
    }

    return Math.min(100, score);
  }

  /**
   * Calculate time spent score
   */
  static calculateTimeSpentScore(metadata) {
    const { timeSpent, estimatedReadingTime } = metadata;
    
    if (!timeSpent || !estimatedReadingTime) {
      return 50;
    }

    const timeRatio = timeSpent / estimatedReadingTime;
    
    // Optimal reading time is 0.8x to 2x estimated time
    if (timeRatio >= 0.8 && timeRatio <= 2.0) {
      return 100;
    } else if (timeRatio >= 0.5 && timeRatio <= 3.0) {
      return 75;
    } else if (timeRatio >= 0.3 && timeRatio <= 4.0) {
      return 50;
    } else {
      return Math.max(0, 50 - Math.abs(timeRatio - 1.5) * 20);
    }
  }

  /**
   * Calculate formatting score
   */
  static calculateFormattingScore(content) {
    let score = 50;

    // Check for proper spacing
    const hasProperSpacing = !content.match(/\n{3,}/) && content.includes('\n\n');
    if (hasProperSpacing) {
      score += 20;
    }

    // Check for proper punctuation
    const sentences = content.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const properlyPunctuated = sentences.filter(s => s.trim().match(/[.!?]$/)).length;
    const punctuationRatio = properlyPunctuated / sentences.length;
    
    if (punctuationRatio >= 0.8) {
      score += 20;
    } else if (punctuationRatio >= 0.6) {
      score += 10;
    }

    // Check for capitalization
    const words = content.split(/\s+/).filter(word => word.length > 0);
    const capitalizedWords = words.filter(word => /^[A-Z]/.test(word)).length;
    const capitalizationRatio = capitalizedWords / words.length;
    
    if (capitalizationRatio >= 0.1 && capitalizationRatio <= 0.3) {
      score += 10;
    }

    return Math.min(100, score);
  }

  /**
   * Calculate weighted score from individual metrics
   */
  static calculateWeightedScore(scores) {
    let totalScore = 0;
    let totalWeight = 0;

    for (const [metric, score] of Object.entries(scores)) {
      const weight = this.QUALITY_WEIGHTS[metric] || 0;
      totalScore += score * weight;
      totalWeight += weight;
    }

    return totalWeight > 0 ? totalScore / totalWeight : 50;
  }

  /**
   * Get quality grade (A-F)
   */
  static getQualityGrade(score) {
    if (score >= 90) return 'A+';
    if (score >= 85) return 'A';
    if (score >= 80) return 'A-';
    if (score >= 75) return 'B+';
    if (score >= 70) return 'B';
    if (score >= 65) return 'B-';
    if (score >= 60) return 'C+';
    if (score >= 55) return 'C';
    if (score >= 50) return 'C-';
    if (score >= 45) return 'D+';
    if (score >= 40) return 'D';
    if (score >= 35) return 'D-';
    return 'F';
  }

  /**
   * Get quality multiplier for XP
   */
  static getQualityMultiplier(score) {
    if (score >= 90) return 2.5;
    if (score >= 80) return 2.0;
    if (score >= 70) return 1.5;
    return 1.0;
  }

  /**
   * Count syllables in text (simplified)
   */
  static countSyllables(text) {
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
  static countWordSyllables(word) {
    word = word.toLowerCase().replace(/[^a-z]/g, '');
    
    if (word.length <= 3) return 1;

    word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, '');
    word = word.replace(/^y/, '');

    const syllables = word.match(/[aeiouy]{1,2}/g);
    return syllables ? syllables.length : 1;
  }

  /**
   * Validate content meets minimum quality standards
   */
  static validateContentQuality(content, metadata = {}) {
    const issues = [];

    // Check word count
    const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
    if (wordCount < this.MINIMUM_THRESHOLDS.wordCount) {
      issues.push(`Content too short (${wordCount} words, minimum ${this.MINIMUM_THRESHOLDS.wordCount})`);
    }

    // Check reading time
    if (metadata.estimatedReadingTime && metadata.estimatedReadingTime < this.MINIMUM_THRESHOLDS.readingTime) {
      issues.push(`Reading time too short (${metadata.estimatedReadingTime}s, minimum ${this.MINIMUM_THRESHOLDS.readingTime}s)`);
    }

    // Check engagement
    if (metadata.engagement && metadata.engagement < this.MINIMUM_THRESHOLDS.engagement) {
      issues.push(`Low engagement rate (${(metadata.engagement * 100).toFixed(1)}%, minimum ${(this.MINIMUM_THRESHOLDS.engagement * 100).toFixed(1)}%)`);
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }
}

module.exports = QualityService; 