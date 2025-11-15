/**
 * Utility script to fix blogs with null authors
 * Run this once to update existing blogs
 */

const Blog = require('../models/blog.model');
const User = require('../models/user.model');
const logger = require('./logger');

async function fixBlogAuthors() {
  try {
    // Find blogs with null or missing author
    const blogsWithoutAuthor = await Blog.find({
      $or: [
        { author: null },
        { author: { $exists: false } }
      ]
    });

    if (blogsWithoutAuthor.length === 0) {
      logger.info('No blogs found without authors');
      return { fixed: 0, total: 0 };
    }

    logger.info(`Found ${blogsWithoutAuthor.length} blogs without authors`);

    // Get the first admin or any user to assign as author
    const defaultUser = await User.findOne({ role: 'admin' }) || await User.findOne();

    if (!defaultUser) {
      logger.error('No users found in database. Cannot fix blog authors.');
      return { fixed: 0, total: blogsWithoutAuthor.length, error: 'No users found' };
    }

    logger.info(`Using user ${defaultUser.email} (${defaultUser._id}) as default author`);

    // Update all blogs without author
    const result = await Blog.updateMany(
      {
        $or: [
          { author: null },
          { author: { $exists: false } }
        ]
      },
      {
        $set: { author: defaultUser._id }
      }
    );

    logger.info(`Fixed ${result.modifiedCount} blogs`);

    return {
      fixed: result.modifiedCount,
      total: blogsWithoutAuthor.length,
      defaultAuthor: {
        id: defaultUser._id,
        email: defaultUser.email,
        name: `${defaultUser.firstName} ${defaultUser.lastName}`
      }
    };
  } catch (error) {
    logger.error('Error fixing blog authors:', error);
    throw error;
  }
}

module.exports = { fixBlogAuthors };
