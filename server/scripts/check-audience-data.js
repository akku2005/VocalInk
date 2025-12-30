const mongoose = require('mongoose');
require('dotenv').config();

async function checkUserData() {
  await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/vocalink');
  
  const User = require('../src/models/user.model');
  const Comment = require('../src/models/comment.model');
  const Blog = require('../src/models/blog.model');
  
  // Get all users to see current state
  const users = await User.find({}).select('_id username email dob location').lean();
  console.log('\n=== Current Users ===');
  users.forEach(u => {
    console.log(`  ${u.username || u.email}:`);
    console.log(`    dob: ${u.dob || 'NOT SET'}`);
    console.log(`    location: ${u.location || 'NOT SET'}`);
  });

  // Check comments
  const comments = await Comment.find({}).populate('userId', 'username email').lean();
  console.log('\n=== Comments ===');
  console.log(`  Total comments: ${comments.length}`);
  if (comments.length > 0) {
    const uniqueCommenters = [...new Set(comments.map(c => c.userId?.username || c.userId?.email || 'Unknown'))];
    console.log(`  Unique commenters: ${uniqueCommenters.join(', ')}`);
  }

  // Check blogs with likes/bookmarks
  const blogs = await Blog.find({ status: 'published' }).select('title likedBy bookmarkedBy').lean();
  console.log('\n=== Published Blogs ===');
  console.log(`  Total published blogs: ${blogs.length}`);
  let totalLikers = 0;
  let totalBookmarkers = 0;
  blogs.forEach(b => {
    totalLikers += (b.likedBy || []).length;
    totalBookmarkers += (b.bookmarkedBy || []).length;
  });
  console.log(`  Total likes: ${totalLikers}`);
  console.log(`  Total bookmarks: ${totalBookmarkers}`);

  await mongoose.disconnect();
  console.log('\n=== SUMMARY ===');
  console.log('To get audience data, users need to have "dob" and "location" set in their profiles.');
  console.log('You can update your profile from the Settings page.\n');
}

checkUserData().catch(console.error);
