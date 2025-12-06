
const mongoose = require('mongoose');
require('dotenv').config();
const Badge = require('../src/models/badge.model');

async function checkBadgeStructure() {
    try {
        const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/vocalink';
        console.log('Connecting to:', mongoUri);
        await mongoose.connect(mongoUri);

        const badge = await Badge.findOne();
        console.log('Badge Structure:', JSON.stringify(badge.toObject(), null, 2));

        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

checkBadgeStructure();
