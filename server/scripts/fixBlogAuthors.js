/**
 * Script to fix blogs with null authors
 * Run this with: node scripts/fixBlogAuthors.js
 */

const mongoose = require('mongoose');
const Blog = require('../src/models/blog.model');
const User = require('../src/models/user.model');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixBlogAuthors() {
  try {
    // Connect to MongoDB
    console.log('Connecting to MongoDB...');
    const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
    
    if (!mongoUri) {
      console.error('❌ MONGODB_URI or MONGO_URI not found in .env file');
      console.log('Please check your .env file has one of these variables set.');
      process.exit(1);
    }
    
    await mongoose.connect(mongoUri);
    console.log('✅ Connected to MongoDB');

    // Find ALL blogs and check their authors
    const allBlogs = await Blog.find();
    console.log(`\n📊 Total blogs in database: ${allBlogs.length}`);
    
    // Check which blogs have invalid author references
    const blogsWithInvalidAuthor = [];
    for (const blog of allBlogs) {
      if (!blog.author) {
        blogsWithInvalidAuthor.push(blog);
        console.log(`  ❌ Blog "${blog.title}" has no author`);
      } else {
        // Check if author exists
        const authorExists = await User.findById(blog.author);
        if (!authorExists) {
          blogsWithInvalidAuthor.push(blog);
          console.log(`  ❌ Blog "${blog.title}" has invalid author ID: ${blog.author}`);
        }
      }
    }

    console.log(`\n📊 Found ${blogsWithInvalidAuthor.length} blogs with invalid authors`);

    if (blogsWithInvalidAuthor.length === 0) {
      console.log('✅ All blogs have valid authors. Nothing to fix!');
      process.exit(0);
    }

    // Get the first user (preferably admin)
    const user = await User.findOne({ role: 'admin' }) || await User.findOne();

    if (!user) {
      console.error('❌ No users found in database. Cannot fix blog authors.');
      process.exit(1);
    }

    console.log(`\n👤 Using user as default author:`);
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   ID: ${user._id}`);

    // Update all blogs with invalid authors
    console.log('\n🔄 Updating blogs...');
    const blogIds = blogsWithInvalidAuthor.map(b => b._id);
    const result = await Blog.updateMany(
      { _id: { $in: blogIds } },
      { $set: { author: user._id } }
    );

    console.log(`\n✅ Successfully updated ${result.modifiedCount} blogs!`);
    console.log('\n📋 Summary:');
    console.log(`   Total blogs found: ${blogsWithInvalidAuthor.length}`);
    console.log(`   Blogs updated: ${result.modifiedCount}`);
    console.log(`   Default author: ${user.firstName} ${user.lastName} (${user.email})`);

    // Verify the fix
    const remainingBlogsWithoutAuthor = await Blog.find({
      $or: [
        { author: null },
        { author: { $exists: false } }
      ]
    });

    if (remainingBlogsWithoutAuthor.length === 0) {
      console.log('\n✅ Verification passed: All blogs now have authors!');
    } else {
      console.log(`\n⚠️  Warning: ${remainingBlogsWithoutAuthor.length} blogs still without authors`);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error fixing blog authors:', error);
    process.exit(1);
  }
}

// Run the script
fixBlogAuthors();
