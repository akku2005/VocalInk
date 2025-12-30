const mongoose = require('mongoose');
const dotenv = require('dotenv');
const { connectDB } = require('./src/config/connectDB'); // Adjust path
const AdminService = require('./src/services/AdminService');
const redisManager = require('./src/services/RedisManager');

dotenv.config();

const runDebug = async () => {
    try {
        await connectDB();
        console.log('DB Connected');

        // Redis connection is handled by the service, no need to wait explicitly for this debug script
        // which relies on the service's own error handling if it fails.
        console.log('Skipping explicit Redis wait...');

        // Simulate the exact call from controller
        const mockData = {
            subject: 'Debug Campaign',
            content: '<p>Test</p>',
            filters: { target: 'subscribed' } // Standard case
        };

        // We need a valid user ID for AuditLog usually, or mock it?
        // AuditLog requires userId to be ObjectId usually
        // Let's find the admin user we fixed
        const User = require('./src/models/user.model');
        const admin = await User.findOne({ email: 'asakashsahu20@gmail.com' });

        if (!admin) throw new Error('Admin user not found for debug');

        console.log('Calling AdminService.sendMarketingCampaign...');
        const result = await AdminService.sendMarketingCampaign(mockData, admin._id.toString());

        console.log('Success:', result);

    } catch (error) {
        console.error('CAUGHT ERROR:', error);
        if (error.stack) console.error(error.stack);
    } finally {
        await mongoose.connection.close();
        await redisManager.shutdown();
        process.exit();
    }
};

runDebug();
