
const mongoose = require('mongoose');
require('dotenv').config();
const Badge = require('../src/models/badge.model');

async function checkBadges() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/vocalink';
        console.log('Connecting to:', mongoUri);
        await mongoose.connect(mongoUri);

        const badges = await Badge.find({});
        console.log(`Total Badges in DB: ${badges.length}`);

        badges.forEach(b => {
            console.log(`- ${b.name} (isDemo: ${b.isDemo}, status: ${b.status})`);
        });

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBadges();
