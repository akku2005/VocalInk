const XPService = require('../services/XPService');
const QualityService = require('../services/QualityService');
const logger = require('../utils/logger');

/**
 * Middleware to award XP for blog creation
 */
const awardBlogCreationXP = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = async function(data) {
    try {
      // Only award XP if the request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user.id;
        const blogData = req.body;
        
        // Award XP for creating blog draft
        const responseData = typeof data === 'string' ? JSON.parse(data) : data;
        logger.info('Awarding blog creation XP', { userId, blogId: responseData._id });
        await XPService.awardXP(userId, 'create_blog_draft', {
          blogId: responseData._id,
          category: blogData.tags?.[0] || 'general',
          language: blogData.language || 'en',
        }, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          platform: 'web',
        });
      }
    } catch (error) {
      logger.error('Error awarding blog creation XP:', error);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware to award XP for blog publishing
 */
const awardBlogPublishingXP = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = async function(data) {
    try {
      // Only award XP if the request was successful and status changed to published
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user.id;
        const blogData = req.body;
        
        if (blogData.status === 'published') {
          // Calculate quality score for the blog
          const qualityResult = await QualityService.calculateContentQuality(
            blogData.content,
            {
              wordCount: blogData.content.split(/\s+/).length,
              estimatedReadingTime: Math.ceil(blogData.content.split(/\s+/).length / 200), // 200 words per minute
            }
          );
          
          // Award XP for publishing blog
          await XPService.awardXP(userId, 'publish_blog', {
            blogId: JSON.parse(data)._id,
            qualityScore: qualityResult.overallScore,
            wordCount: blogData.content.split(/\s+/).length,
            category: blogData.tags?.[0] || 'general',
            language: blogData.language || 'en',
          }, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            platform: 'web',
          });
        }
      }
    } catch (error) {
      logger.error('Error awarding blog publishing XP:', error);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware to award XP for blog updates
 */
const awardBlogUpdateXP = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = async function(data) {
    try {
      // Only award XP if the request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user.id;
        const blogData = req.body;
        
        // Award XP for updating blog
        await XPService.awardXP(userId, 'update_blog', {
          blogId: req.params.id,
          qualityScore: blogData.content ? 
            (await QualityService.calculateContentQuality(blogData.content)).overallScore : null,
        }, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          platform: 'web',
        });
      }
    } catch (error) {
      logger.error('Error awarding blog update XP:', error);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware to award XP for comment creation
 */
const awardCommentXP = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = async function(data) {
    try {
      // Only award XP if the request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user.id;
        const commentData = req.body;
        
        // Calculate quality score for the comment
        const qualityResult = await QualityService.calculateContentQuality(
          commentData.content,
          {
            wordCount: commentData.content.split(/\s+/).length,
          }
        );
        
        // Award XP for writing comment
        const responseData = typeof data === 'string' ? JSON.parse(data) : data;
        logger.info('Awarding comment XP', { userId, commentId: responseData._id });
        await XPService.awardXP(userId, 'write_comment', {
          commentId: responseData._id,
          blogId: req.params.id, // Use the blog ID from URL params
          qualityScore: qualityResult.overallScore,
          isReply: !!commentData.parentId,
        }, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          platform: 'web',
        });
      }
    } catch (error) {
      logger.error('Error awarding comment XP:', error);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware to award XP for blog likes
 */
const awardBlogLikeXP = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = async function(data) {
    try {
      // Only award XP if the request was successful and it's a like action
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const responseData = JSON.parse(data);
        
        if (responseData.liked) {
          // Find the blog author to award them XP
          const blogId = req.params.id;
          // This would need to be implemented to get the blog author
          // For now, we'll skip this as it requires additional database lookup
        }
      }
    } catch (error) {
      logger.error('Error awarding blog like XP:', error);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware to award XP for comment likes
 */
const awardCommentLikeXP = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = async function(data) {
    try {
      // Only award XP if the request was successful and it's a like action
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const responseData = JSON.parse(data);
        
        if (responseData.liked) {
          // Find the comment author to award them XP
          const commentId = req.params.id;
          // This would need to be implemented to get the comment author
          // For now, we'll skip this as it requires additional database lookup
        }
      }
    } catch (error) {
      logger.error('Error awarding comment like XP:', error);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware to award XP for daily login
 */
const awardDailyLoginXP = async (req, res, next) => {
  try {
    const userId = req.user.id;
    
    // Award daily login XP
    await XPService.awardXP(userId, 'daily_login', {}, {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      platform: 'web',
    });
  } catch (error) {
    logger.error('Error awarding daily login XP:', error);
  }
  
  next();
};

/**
 * Middleware to award XP for profile completion
 */
const awardProfileCompletionXP = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = async function(data) {
    try {
      // Only award XP if the request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user.id;
        const profileData = req.body;
        
        // Check if profile is being completed
        const hasProfilePicture = profileData.profilePicture || profileData.avatar;
        const hasBio = profileData.bio;
        const hasSocialLinks = profileData.socialLinks && profileData.socialLinks.length > 0;
        
        if (hasProfilePicture && hasBio && hasSocialLinks) {
          // Award XP for completing profile
          await XPService.awardXP(userId, 'complete_profile', {
            hasProfilePicture,
            hasBio,
            hasSocialLinks,
          }, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            platform: 'web',
          });
        }
      }
    } catch (error) {
      logger.error('Error awarding profile completion XP:', error);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware to award XP for social media connection
 */
const awardSocialMediaXP = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = async function(data) {
    try {
      // Only award XP if the request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user.id;
        const socialData = req.body;
        
        if (socialData.socialLinks && socialData.socialLinks.length > 0) {
          // Award XP for connecting social media
          await XPService.awardXP(userId, 'connect_social_media', {
            platforms: socialData.socialLinks.map(link => link.platform),
          }, {
            ip: req.ip,
            userAgent: req.get('User-Agent'),
            platform: 'web',
          });
        }
      }
    } catch (error) {
      logger.error('Error awarding social media XP:', error);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware to award XP for following users
 */
const awardFollowXP = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = async function(data) {
    try {
      // Only award XP if the request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user.id;
        
        // Award XP for following user
        await XPService.awardXP(userId, 'subscribe_author', {
          followedUserId: req.params.id,
        }, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          platform: 'web',
        });
      }
    } catch (error) {
      logger.error('Error awarding follow XP:', error);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware to award XP for bookmarking blogs
 */
const awardBookmarkXP = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = async function(data) {
    try {
      // Only award XP if the request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user.id;
        
        // Award XP for bookmarking blog
        await XPService.awardXP(userId, 'bookmark_blog', {
          blogId: req.params.id,
        }, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          platform: 'web',
        });
      }
    } catch (error) {
      logger.error('Error awarding bookmark XP:', error);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

/**
 * Middleware to award XP for sharing blogs
 */
const awardShareXP = async (req, res, next) => {
  const originalSend = res.send;
  
  res.send = async function(data) {
    try {
      // Only award XP if the request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const userId = req.user.id;
        const shareData = req.body;
        
        // Award XP for sharing blog
        await XPService.awardXP(userId, 'share_blog_external', {
          blogId: req.params.id,
          platform: shareData.platform,
          url: shareData.url,
        }, {
          ip: req.ip,
          userAgent: req.get('User-Agent'),
          platform: 'web',
        });
      }
    } catch (error) {
      logger.error('Error awarding share XP:', error);
    }
    
    originalSend.call(this, data);
  };
  
  next();
};

module.exports = {
  awardBlogCreationXP,
  awardBlogPublishingXP,
  awardBlogUpdateXP,
  awardCommentXP,
  awardBlogLikeXP,
  awardCommentLikeXP,
  awardDailyLoginXP,
  awardProfileCompletionXP,
  awardSocialMediaXP,
  awardFollowXP,
  awardBookmarkXP,
  awardShareXP,
}; 