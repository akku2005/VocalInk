const Badge = require('../models/badge.model');
const logger = require('./logger');

const badges = [
  // Engagement Badges
  {
    name: 'First Like',
    description: 'Received your first like on a blog post',
    icon: '👍',
    color: '#10B981',
    rarity: 'common',
    category: 'engagement',
    criteria: 'Receive your first like on any blog post',
    requirements: {
      likesRequired: 1
    },
    xpReward: 10
  },
  {
    name: 'Popular Writer',
    description: 'Gained 10 followers',
    icon: '👥',
    color: '#3B82F6',
    rarity: 'uncommon',
    category: 'social',
    criteria: 'Reach 10 followers',
    requirements: {
      followersRequired: 10
    },
    xpReward: 25
  },
  {
    name: 'Influencer',
    description: 'Gained 50 followers',
    icon: '🌟',
    color: '#8B5CF6',
    rarity: 'rare',
    category: 'social',
    criteria: 'Reach 50 followers',
    requirements: {
      followersRequired: 50
    },
    xpReward: 50
  },
  {
    name: 'Viral Sensation',
    description: 'Gained 100 followers',
    icon: '🚀',
    color: '#F59E0B',
    rarity: 'epic',
    category: 'social',
    criteria: 'Reach 100 followers',
    requirements: {
      followersRequired: 100
    },
    xpReward: 100
  },

  // Content Creation Badges
  {
    name: 'First Blog',
    description: 'Published your first blog post',
    icon: '✍️',
    color: '#10B981',
    rarity: 'common',
    category: 'content',
    criteria: 'Publish your first blog post',
    requirements: {
      blogsRequired: 1
    },
    xpReward: 15
  },
  {
    name: 'Regular Writer',
    description: 'Published 5 blog posts',
    icon: '📝',
    color: '#3B82F6',
    rarity: 'uncommon',
    category: 'content',
    criteria: 'Publish 5 blog posts',
    requirements: {
      blogsRequired: 5
    },
    xpReward: 30
  },
  {
    name: 'Prolific Author',
    description: 'Published 20 blog posts',
    icon: '📚',
    color: '#8B5CF6',
    rarity: 'rare',
    category: 'content',
    criteria: 'Publish 20 blog posts',
    requirements: {
      blogsRequired: 20
    },
    xpReward: 75
  },
  {
    name: 'Master Blogger',
    description: 'Published 50 blog posts',
    icon: '👑',
    color: '#F59E0B',
    rarity: 'epic',
    category: 'content',
    criteria: 'Publish 50 blog posts',
    requirements: {
      blogsRequired: 50
    },
    xpReward: 150
  },

  // Achievement Badges
  {
    name: 'Newcomer',
    description: 'Joined VocalInk and started your journey',
    icon: '🎉',
    color: '#10B981',
    rarity: 'common',
    category: 'achievement',
    criteria: 'Complete your profile and join the community',
    requirements: {
      daysActiveRequired: 1
    },
    xpReward: 5
  },
  {
    name: 'Dedicated Reader',
    description: 'Been active for 7 days',
    icon: '📖',
    color: '#3B82F6',
    rarity: 'uncommon',
    category: 'achievement',
    criteria: 'Stay active for 7 days',
    requirements: {
      daysActiveRequired: 7
    },
    xpReward: 20
  },
  {
    name: 'Loyal Member',
    description: 'Been active for 30 days',
    icon: '💎',
    color: '#8B5CF6',
    rarity: 'rare',
    category: 'achievement',
    criteria: 'Stay active for 30 days',
    requirements: {
      daysActiveRequired: 30
    },
    xpReward: 50
  },
  {
    name: 'Veteran',
    description: 'Been active for 100 days',
    icon: '🏆',
    color: '#F59E0B',
    rarity: 'epic',
    category: 'achievement',
    criteria: 'Stay active for 100 days',
    requirements: {
      daysActiveRequired: 100
    },
    xpReward: 100
  },

  // XP Level Badges
  {
    name: 'Level 5',
    description: 'Reached level 5',
    icon: '⭐',
    color: '#10B981',
    rarity: 'common',
    category: 'achievement',
    criteria: 'Reach level 5 (500 XP)',
    requirements: {
      xpRequired: 500
    },
    xpReward: 10
  },
  {
    name: 'Level 10',
    description: 'Reached level 10',
    icon: '⭐⭐',
    color: '#3B82F6',
    rarity: 'uncommon',
    category: 'achievement',
    criteria: 'Reach level 10 (1000 XP)',
    requirements: {
      xpRequired: 1000
    },
    xpReward: 25
  },
  {
    name: 'Level 25',
    description: 'Reached level 25',
    icon: '⭐⭐⭐',
    color: '#8B5CF6',
    rarity: 'rare',
    category: 'achievement',
    criteria: 'Reach level 25 (2500 XP)',
    requirements: {
      xpRequired: 2500
    },
    xpReward: 50
  },
  {
    name: 'Level 50',
    description: 'Reached level 50',
    icon: '👑',
    color: '#F59E0B',
    rarity: 'epic',
    category: 'achievement',
    criteria: 'Reach level 50 (5000 XP)',
    requirements: {
      xpRequired: 5000
    },
    xpReward: 100
  },

  // Special Badges
  {
    name: 'Early Adopter',
    description: 'One of the first users to join VocalInk',
    icon: '🚀',
    color: '#EF4444',
    rarity: 'legendary',
    category: 'special',
    criteria: 'Join VocalInk during the early access period',
    requirements: {
      daysActiveRequired: 1
    },
    xpReward: 200,
    isSecret: true
  },
  {
    name: 'Community Helper',
    description: 'Helped other users by commenting and engaging',
    icon: '🤝',
    color: '#10B981',
    rarity: 'uncommon',
    category: 'engagement',
    criteria: 'Make 10 helpful comments',
    requirements: {
      commentsRequired: 10
    },
    xpReward: 30
  },
  {
    name: 'Engagement Master',
    description: 'Highly engaged with the community',
    icon: '💬',
    color: '#8B5CF6',
    rarity: 'rare',
    category: 'engagement',
    criteria: 'Make 50 comments and receive 100 likes',
    requirements: {
      commentsRequired: 50,
      likesRequired: 100
    },
    xpReward: 75
  }
];

async function seedBadges() {
  try {
    logger.info('Starting badge seeding...');

    // Clear existing badges (optional - comment out if you want to keep existing)
    // await Badge.deleteMany({});
    // logger.info('Cleared existing badges');

    const createdBadges = [];
    const skippedBadges = [];

    for (const badgeData of badges) {
      try {
        // Check if badge already exists
        const existingBadge = await Badge.findOne({ name: badgeData.name });
        
        if (existingBadge) {
          skippedBadges.push(badgeData.name);
          continue;
        }

        const badge = await Badge.create(badgeData);
        createdBadges.push(badge.name);
        logger.info(`Created badge: ${badge.name}`);
      } catch (error) {
        logger.error(`Error creating badge ${badgeData.name}:`, error.message);
      }
    }

    logger.info(`Badge seeding completed!`);
    logger.info(`Created: ${createdBadges.length} badges`);
    logger.info(`Skipped: ${skippedBadges.length} badges (already exist)`);
    
    if (createdBadges.length > 0) {
      logger.info('Created badges:', createdBadges);
    }
    
    if (skippedBadges.length > 0) {
      logger.info('Skipped badges:', skippedBadges);
    }

    return {
      created: createdBadges,
      skipped: skippedBadges,
      total: badges.length
    };
  } catch (error) {
    logger.error('Error seeding badges:', error);
    throw error;
  }
}

// Export for use in other files
module.exports = { seedBadges, badges };

// Run if this file is executed directly
if (require.main === module) {
  const mongoose = require('mongoose');
  const { connectDB } = require('../config/connectDB');

  async function run() {
    try {
      await connectDB();
      await seedBadges();
      process.exit(0);
    } catch (error) {
      logger.error('Failed to seed badges:', error);
      process.exit(1);
    }
  }

  run();
} 