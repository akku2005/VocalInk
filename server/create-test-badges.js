const mongoose = require('mongoose');
const Badge = require('./src/models/badge.model');
const User = require('./src/models/user.model');
require('dotenv').config();

async function createTestBadges() {
  try {
    // Connect to MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vocalink');
    console.log('✅ Connected to MongoDB');

    // Clear existing badges
    await Badge.deleteMany({});
    console.log('🧹 Cleared existing badges');

    // Create test badges
    const testBadges = [
      {
        name: 'First Steps',
        description: 'Complete your first blog post',
        badgeKey: 'first_blog',
        category: 'achievement',
        rarity: 'common',
        icon: '📝',
        requirements: {
          xpRequired: 50,
          blogsRequired: 1,
          followersRequired: 0,
          likesRequired: 0,
          commentsRequired: 0,
          daysActiveRequired: 1
        },
        status: 'active',
        analytics: {
          totalEarned: 0,
          popularityScore: 0
        }
      },
      {
        name: 'Blog Master',
        description: 'Publish 10 blog posts',
        badgeKey: 'blog_master',
        category: 'achievement',
        rarity: 'rare',
        icon: '📚',
        requirements: {
          xpRequired: 500,
          blogsRequired: 10,
          followersRequired: 5,
          likesRequired: 50,
          commentsRequired: 20,
          daysActiveRequired: 30
        },
        status: 'active',
        analytics: {
          totalEarned: 0,
          popularityScore: 0
        }
      },
      {
        name: 'Community Builder',
        description: 'Gain 100 followers',
        badgeKey: 'community_builder',
        category: 'social',
        rarity: 'epic',
        icon: '👥',
        requirements: {
          xpRequired: 1000,
          blogsRequired: 5,
          followersRequired: 100,
          likesRequired: 200,
          commentsRequired: 50,
          daysActiveRequired: 60
        },
        status: 'active',
        analytics: {
          totalEarned: 0,
          popularityScore: 0
        }
      },
      {
        name: 'Engagement Expert',
        description: 'Receive 500 total likes on your content',
        badgeKey: 'engagement_expert',
        category: 'engagement',
        rarity: 'rare',
        icon: '❤️',
        requirements: {
          xpRequired: 800,
          blogsRequired: 3,
          followersRequired: 20,
          likesRequired: 500,
          commentsRequired: 100,
          daysActiveRequired: 45
        },
        status: 'active',
        analytics: {
          totalEarned: 0,
          popularityScore: 0
        }
      },
      {
        name: 'Veteran Writer',
        description: 'Be active for 90 days',
        badgeKey: 'veteran_writer',
        category: 'achievement',
        rarity: 'legendary',
        icon: '🏆',
        requirements: {
          xpRequired: 2000,
          blogsRequired: 20,
          followersRequired: 50,
          likesRequired: 1000,
          commentsRequired: 200,
          daysActiveRequired: 90
        },
        status: 'active',
        analytics: {
          totalEarned: 0,
          popularityScore: 0
        }
      },
      {
        name: 'Comment Champion',
        description: 'Make 100 comments',
        badgeKey: 'comment_champion',
        category: 'engagement',
        rarity: 'uncommon',
        icon: '💬',
        requirements: {
          xpRequired: 300,
          blogsRequired: 2,
          followersRequired: 10,
          likesRequired: 100,
          commentsRequired: 100,
          daysActiveRequired: 30
        },
        status: 'active',
        analytics: {
          totalEarned: 0,
          popularityScore: 0
        }
      },
      {
        name: 'XP Collector',
        description: 'Earn 1000 XP',
        badgeKey: 'xp_collector',
        category: 'achievement',
        rarity: 'rare',
        icon: '⭐',
        requirements: {
          xpRequired: 1000,
          blogsRequired: 5,
          followersRequired: 15,
          likesRequired: 150,
          commentsRequired: 30,
          daysActiveRequired: 45
        },
        status: 'active',
        analytics: {
          totalEarned: 0,
          popularityScore: 0
        }
      },
      {
        name: 'Series Creator',
        description: 'Create your first series',
        badgeKey: 'series_creator',
        category: 'achievement',
        rarity: 'uncommon',
        icon: '📖',
        requirements: {
          xpRequired: 200,
          blogsRequired: 3,
          followersRequired: 5,
          likesRequired: 50,
          commentsRequired: 10,
          daysActiveRequired: 15
        },
        status: 'active',
        analytics: {
          totalEarned: 0,
          popularityScore: 0
        }
      }
    ];

    // Insert badges
    const createdBadges = await Badge.insertMany(testBadges);
    console.log(`✅ Created ${createdBadges.length} test badges`);

    // Display created badges
    console.log('\n📋 Created Badges:');
    createdBadges.forEach(badge => {
      console.log(`   🏆 ${badge.name} (${badge.rarity}) - ${badge.description}`);
    });

    console.log('\n🎉 Test badges created successfully!');
    console.log('📊 You can now test badge functionality with these badges.');

  } catch (error) {
    console.error('❌ Error creating test badges:', error);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

// Run the script
createTestBadges(); 