const mongoose = require('mongoose');
require('dotenv').config();

const User = require('../src/models/user.model');
const Badge = require('../src/models/badge.model');
const Blog = require('../src/models/blog.model');

const fixUserStats = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to DB');

        const users = await User.find({});
        const firstBlogBadge = await Badge.findOne({ name: /First Blog/i });

        if (!firstBlogBadge) {
            console.error('First Blog Badge not found!');
            process.exit(1);
        }

        console.log(`Found First Blog Badge: ${firstBlogBadge.name} (${firstBlogBadge._id})`);

        for (const user of users) {
            console.log(`Processing user: ${user.username} (${user._id})`);

            // Check blog count
            const blogCount = await Blog.countDocuments({ author: user._id, status: 'published' });
            console.log(`  - Blog Count: ${blogCount}`);

            let badgesModified = false;

            // Award First Blog badge if eligible and missing
            if (blogCount > 0) {
                const hasBadge = user.badges.some(b => b.toString() === firstBlogBadge._id.toString());
                if (!hasBadge) {
                    console.log('  - Awarding First Blog badge');
                    user.badges.push(firstBlogBadge._id);
                    badgesModified = true;
                } else {
                    console.log('  - Already has First Blog badge');
                }
            }

            // Recalculate XP
            // We need to fetch all badges the user has to sum XP
            // Since user.badges array might have duplicates if we aren't careful (though populate handles it usually, here we have IDs)
            // better to populate or fetch

            const distinctBadgeIds = [...new Set(user.badges.map(b => b.toString()))];
            const userBadges = await Badge.find({ _id: { $in: distinctBadgeIds } });

            let calculatedXp = 0;
            for (const b of userBadges) {
                calculatedXp += (b.rewards?.xpReward || b.xpReward || 0);
            }

            console.log(`  - Old XP: ${user.xp}, Calculated XP: ${calculatedXp}`);

            if (user.xp !== calculatedXp || badgesModified) {
                user.xp = calculatedXp;
                // Ensure distinct badges in array just in case
                user.badges = distinctBadgeIds;
                await user.save();
                console.log('  - User updated');
            } else {
                console.log('  - No changes needed');
            }
        }

        console.log('Done');
        process.exit(0);
    } catch (error) {
        console.error('Error:', error);
        process.exit(1);
    }
};

fixUserStats();
