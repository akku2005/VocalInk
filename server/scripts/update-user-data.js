const mongoose = require('mongoose');
require('dotenv').config();

async function updateUserData() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vocalink');
  
  const User = require('../src/models/user.model');
  
  // Update users with location data
  const updates = [
    { email: 'asakashsahu20@gmail.com', location: 'India' },
    { username: 'akashsahu', location: 'United States', dob: new Date('1995-03-15') },
    { username: 'akashsahu1', location: 'United Kingdom', dob: new Date('1988-07-22') },
  ];

  for (const update of updates) {
    const filter = update.email ? { email: update.email } : { username: update.username };
    const updateData = {};
    if (update.location) updateData.location = update.location;
    if (update.dob) updateData.dob = update.dob;
    
    const result = await User.updateOne(filter, { $set: updateData });
    console.log(`Updated ${update.email || update.username}: ${result.modifiedCount} modified`);
  }

  // Verify updates
  const users = await User.find({}).select('_id username email dob location').lean();
  console.log('\n=== Updated Users ===');
  users.forEach(u => {
    const age = u.dob ? Math.floor((Date.now() - new Date(u.dob)) / (365.25 * 24 * 60 * 60 * 1000)) : 'N/A';
    console.log(`  ${u.username || u.email}:`);
    console.log(`    dob: ${u.dob ? u.dob.toISOString().split('T')[0] : 'NOT SET'} (age: ${age})`);
    console.log(`    location: ${u.location || 'NOT SET'}`);
  });

  await mongoose.disconnect();
  console.log('\nDone! Refresh the analytics page to see the data.');
}

updateUserData().catch(console.error);
