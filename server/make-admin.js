const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.MONGO_URI).then(async () => {
    const result = await mongoose.connection.collection('users').updateOne(
        { email: 'asakashsahu20@gmail.com' },
        { $set: { role: 'admin' } }
    );
    console.log('Updated', result.modifiedCount, 'user(s) to admin');
    mongoose.disconnect();
}).catch(err => {
    console.error('Error:', err);
    process.exit(1);
});
