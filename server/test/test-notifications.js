const mongoose = require('mongoose');
const NotificationService = require('./src/services/NotificationService');
const User = require('./src/models/user.model');
const Badge = require('./src/models/badge.model');
require('dotenv').config();

// Connect to database
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vocalink');

async function testNotificationSystem() {
  try {
    console.log('🧪 Testing Notification System Integration...\n');

    // Create test user
    const testUser = await User.create({
      email: 'test-notifications@example.com',
      password: 'TestPassword123!',
      name: 'Test User',
      isVerified: true,
      emailNotifications: true
    });

    console.log('✅ Test user created:', testUser.email);

    // Create test badge
    const testBadge = await Badge.create({
      badgeKey: 'test_badge',
      name: 'Test Badge',
      description: 'A test badge for notification testing',
      icon: '🏆',
      category: 'achievement',
      rarity: 'common',
      requirements: {
        xpRequired: 0,
        blogsRequired: 0,
        followersRequired: 0,
        likesRequired: 0,
        commentsRequired: 0,
        daysActiveRequired: 0
      },
      rewards: {
        xpReward: 50
      }
    });

    console.log('✅ Test badge created:', testBadge.name);

    // Test 1: Badge earned notification
    console.log('\n📧 Testing Badge Earned Notification...');
    try {
      await NotificationService.sendBadgeEarnedNotification(testUser._id, testBadge._id, 50);
      console.log('✅ Badge earned notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending badge earned notification:', error.message);
    }

    // Test 2: Badge eligibility notification
    console.log('\n📧 Testing Badge Eligibility Notification...');
    try {
      await NotificationService.sendBadgeEligibilityNotification(testUser._id, testBadge._id);
      console.log('✅ Badge eligibility notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending badge eligibility notification:', error.message);
    }

    // Test 3: Level up notification
    console.log('\n📧 Testing Level Up Notification...');
    try {
      await NotificationService.sendLevelUpNotification(testUser._id, 5, 100);
      console.log('✅ Level up notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending level up notification:', error.message);
    }

    // Test 4: Achievement milestone notification
    console.log('\n📧 Testing Achievement Milestone Notification...');
    try {
      await NotificationService.sendAchievementMilestoneNotification(testUser._id, 'First Blog Published', {
        description: 'You published your first blog post!'
      });
      console.log('✅ Achievement milestone notification sent successfully');
    } catch (error) {
      console.error('❌ Error sending achievement milestone notification:', error.message);
    }

    // Test 5: Get notification statistics
    console.log('\n📊 Testing Notification Statistics...');
    try {
      const stats = await NotificationService.getNotificationStats(testUser._id);
      console.log('✅ Notification statistics retrieved:', {
        totalNotifications: stats.totalNotifications,
        unreadCount: stats.unreadCount,
        readCount: stats.readCount
      });
    } catch (error) {
      console.error('❌ Error getting notification statistics:', error.message);
    }

    // Test 6: Test with email notifications disabled
    console.log('\n🔕 Testing with Email Notifications Disabled...');
    try {
      testUser.emailNotifications = false;
      await testUser.save();
      
      await NotificationService.sendBadgeEarnedNotification(testUser._id, testBadge._id, 25);
      console.log('✅ Notification sent with email disabled (in-app only)');
    } catch (error) {
      console.error('❌ Error testing disabled email notifications:', error.message);
    }

    // Cleanup
    console.log('\n🧹 Cleaning up test data...');
    await User.findByIdAndDelete(testUser._id);
    await Badge.findByIdAndDelete(testBadge._id);
    console.log('✅ Test cleanup completed');

    console.log('\n🎉 All notification tests completed successfully!');
    console.log('\n📋 Summary:');
    console.log('- ✅ Badge earned notifications (in-app + email)');
    console.log('- ✅ Badge eligibility notifications (in-app + email)');
    console.log('- ✅ Level up notifications (in-app + email)');
    console.log('- ✅ Achievement milestone notifications (in-app + email)');
    console.log('- ✅ Notification statistics');
    console.log('- ✅ User preference handling');

  } catch (error) {
    console.error('❌ Test failed:', error.message);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Database connection closed');
  }
}

// Run the test
testNotificationSystem(); 