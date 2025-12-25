
const mongoose = require('mongoose');
require('dotenv').config();
const Badge = require('../src/models/badge.model');
const User = require('../src/models/user.model');
const BadgeService = require('../src/services/BadgeService');

async function verifyStats() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/vocalink';
        console.log('Connecting to:', mongoUri);
        await mongoose.connect(mongoUri);

        // 1. Get a user
        const user = await User.findOne();
        if (!user) {
            console.log('No user found to test with.');
            process.exit(0);
        }
        console.log(`Testing with user: ${user.name} (${user._id})`);

        // 2. Get initial stats
        let progress = await BadgeService.getUserBadgeProgress(user._id);
        console.log('--- Initial Stats ---');
        console.log(`Total Badges: ${progress.totalBadges}`);
        console.log(`Earned Badges: ${progress.earnedBadges}`);
        console.log(`Completion %: ${progress.completionPercentage}`);
        console.log(`Total XP: ${progress.totalXp}`);

        // 3. Award a badge (if not already all earned)
        const availableBadge = await Badge.findOne({ _id: { $nin: user.badges } });
        if (availableBadge) {
            console.log(`Awarding badge: ${availableBadge.name}`);
            // Simulate award manually pushing to array valid for test
            user.badges.push(availableBadge._id);
            user.xp += availableBadge.rewards?.xpReward || 0;
            await user.save();

            // Update analytics manually as service would
            await Badge.updateAnalytics(availableBadge._id, 'earned');
        } else {
            console.log('User has all badges already.');
        }

        // 4. Get updated stats
        progress = await BadgeService.getUserBadgeProgress(user._id);
        console.log('--- Updated Stats ---');
        console.log(`Total Badges: ${progress.totalBadges}`);
        console.log(`Earned Badges: ${progress.earnedBadges}`);
        console.log(`Completion %: ${progress.completionPercentage}`);
        console.log(`Total XP: ${progress.totalXp}`);

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

verifyStats();
