const Blog = require('../models/blog.model');
const TTSService = require('../services/TTSService');
const OpenAIService = require('../services/OpenAIService');
const axios = require('axios');
const Comment = require('../models/comment.model');
const logger = require('../utils/logger');
const EmailService = require('../services/EmailService');
const User = require('../models/user.model');
const Series = require('../models/series.model');
const XPService = require('../services/XPService');
const cacheService = require('../services/CacheService');
const slugify = require('slugify');

// Get singleton email service instance
const emailService = EmailService;

const ttsService = new TTSService();
const openaiService = new OpenAIService();
const { fixBlogAuthors } = require('../utils/fixBlogAuthors');

exports.createBlog = async (req, res) => {
  try {
    // Generate slug from title
    const baseSlug = slugify(req.body.title, { 
      lower: true, 
      strict: true,
      remove: /[*+~.()'"!:@]/g
    });
    
    // Ensure unique slug
    let slug = baseSlug;
    let counter = 1;
    while (await Blog.findOne({ slug })) {
      slug = `${baseSlug}-${counter}`;
      counter++;
    }

    // Generate AI summary if not provided
    let summary = req.body.summary;
    if (!summary && req.body.content) {
      try {
        const summaryResult = await openaiService.generateSummary(req.body.content, {
          maxLength: 150,
          style: 'concise'
        });
        summary = summaryResult.summary;
        logger.info('AI summary generated for new blog', { 
          blogId: 'new', 
          provider: summaryResult.provider 
        });
      } catch (summaryError) {
        logger.error('Failed to generate AI summary', { error: summaryError.message });
        // Continue without summary
      }
    }

    // Set publishedAt if status is published
    const publishedAt = req.body.status === 'published' ? new Date() : null;

    const blog = new Blog({ 
      ...req.body, 
      author: req.user.id,
      slug,
      summary,
      publishedAt
    });
    
    await blog.save();
    logger.info(`Blog created`, { user: req.user.id, blog: blog._id, slug });
    
    // Award XP for blog creation
    try {
      await XPService.awardXP(req.user.id, 'create_blog_draft', {
        blogId: blog._id,
        category: req.body.tags?.[0] || 'general',
        language: req.body.language || 'en',
      }, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        platform: 'web',
      });
      logger.info('XP awarded for blog creation', { userId: req.user.id, blogId: blog._id });
    } catch (xpError) {
      logger.error('Failed to award XP for blog creation', { userId: req.user.id, error: xpError.message });
    }
    
    res.status(201).json(blog);
  } catch (err) {
    logger.error(`Blog creation failed`, { user: req.user.id, error: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.getBlogs = async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      status = 'published', 
      mood, 
      tags, 
      author, 
      seriesId,
      sort = 'createdAt',
      order = 'desc'
    } = req.query;

    logger.info('[getBlogs] Request received', { page, limit, status, mood, tags, author, seriesId, sort, order });

    const cacheKey = cacheService.generateKey(
      'blogs', page, limit, status, mood, tags, author, seriesId, sort, order
    );

    logger.debug('[getBlogs] Generated cache key:', cacheKey);

    const blogs = await cacheService.cacheFunction(cacheKey, async () => {
      const query = {};

      // Status filter
      if (status !== 'all') {
        query.status = status;
      }

      // Mood filter
      if (mood) {
        query.mood = mood;
      }

      // Tags filter
      if (tags) {
        const tagArray = tags.split(',').map(tag => tag.trim());
        query.tags = { $in: tagArray };
      }

      // Author filter
      if (author) {
        query.author = author;
      }

      // Series filter
      if (seriesId) {
        query.seriesId = seriesId;
      }

      logger.debug('[getBlogs] MongoDB query:', query);

      // Build sort object
      const sortObj = {};
      sortObj[sort] = order === 'asc' ? 1 : -1;

      logger.debug('[getBlogs] Sort object:', sortObj);

      // ✅ RETURN the query result
      const results = await Blog.find(query)
        .populate('author', 'firstName lastName displayName username email avatar')
        .sort(sortObj)
        .limit(Number(limit))
        .skip((Number(page) - 1) * Number(limit));

      logger.info(`[getBlogs] Found ${results.length} blogs`);
      return results;
    }, 300); // Cache for 5 minutes

    res.json(blogs);
  } catch (err) {
    logger.error('[getBlogs] Failed', { error: err.message, stack: err.stack });
    res.status(500).json({ message: err.message });
  }
};

exports.getallBlogs=async(req,res)=>{
  try{
    const blogs=await Blog.find()
      .populate('author', 'firstName lastName displayName username email avatar')
      .sort({ createdAt: -1 });
    
    res.json(blogs);
  }catch(err){
    logger.error('Get all blogs failed:', err);
    res.status(500).json({ message: err.message });
  }
}
const ensureNonNegative = async (Model, id, field) => {
  if (!id || !field) return;
  await Model.updateOne({ _id: id, [field]: { $lt: 0 } }, { $set: { [field]: 0 } });
};

const updateSeriesAnalytics = async (seriesId, increments = {}) => {
  if (!seriesId) return;

  const inc = {};
  ['likes', 'bookmarks', 'comments'].forEach((key) => {
    if (typeof increments[key] === 'number' && increments[key] !== 0) {
      inc[`analytics.${key}`] = increments[key];
    }
  });

  if (Object.keys(inc).length === 0) return;

  await Series.findByIdAndUpdate(seriesId, { $inc: inc });

  if (inc['analytics.likes']) {
    await ensureNonNegative(Series, seriesId, 'analytics.likes');
  }
  if (inc['analytics.bookmarks']) {
    await ensureNonNegative(Series, seriesId, 'analytics.bookmarks');
  }
  if (inc['analytics.comments']) {
    await ensureNonNegative(Series, seriesId, 'analytics.comments');
  }

  await cacheService.delete(cacheService.generateKey('series', seriesId.toString()));
};

exports.getBlogById = async (req, res) => {
  try {
    const cacheKey = cacheService.generateKey('blog', req.params.id);
    
    const blog = await cacheService.cacheFunction(cacheKey, async () => {
      return await Blog.findById(req.params.id)
        .populate('author', 'firstName lastName displayName username email avatar');
    }, 600); // Cache for 10 minutes
    
    if (!blog) return res.status(404).json({ message: 'Blog not found' });

    const blogObject = blog.toObject ? blog.toObject() : JSON.parse(JSON.stringify(blog));

    const commentCount = await Comment.countDocuments({ blogId: blog._id, status: 'active' });
    blogObject.commentCount = commentCount;

    const userId = req.user?.id?.toString();
    if (userId) {
      const likedByList = (blogObject.likedBy || []).map((entry) =>
        entry?.toString ? entry.toString() : String(entry)
      );
      const bookmarkedByList = (blogObject.bookmarkedBy || []).map((entry) =>
        entry?.toString ? entry.toString() : String(entry)
      );

      blogObject.isLiked = likedByList.includes(userId);
      blogObject.isBookmarked = bookmarkedByList.includes(userId);
    } else {
      blogObject.isLiked = false;
      blogObject.isBookmarked = false;
    }

    res.json({ success: true, data: blogObject });
  } catch (err) {
    logger.error('Get blog by ID failed:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const cacheKey = cacheService.generateKey('blog-slug', req.params.slug);
    
    const blog = await cacheService.cacheFunction(cacheKey, async () => {
      return await Blog.findOne({ slug: req.params.slug })
        .populate('author', 'firstName lastName displayName username email avatar');
    }, 600); // Cache for 10 minutes
    
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    
    // Only return published blogs for public access
    if (blog.status !== 'published' && (!req.user || blog.author._id.toString() !== req.user.id)) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    res.json(blog);
  } catch (err) {
    logger.error('Get blog by slug failed:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      logger.warn(`Blog not found for update`, { user: req.user.id, blog: req.params.id });
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`Unauthorized blog update attempt`, { user: req.user.id, blog: blog._id });
      return res.status(403).json({ message: 'Forbidden: Only the author can update this blog' });
    }

    // Generate new slug if title is being updated
    if (req.body.title && req.body.title !== blog.title) {
      const baseSlug = slugify(req.body.title, { 
        lower: true, 
        strict: true,
        remove: /[*+~.()'"!:@]/g
      });
      
      let slug = baseSlug;
      let counter = 1;
      while (await Blog.findOne({ slug, _id: { $ne: blog._id } })) {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
      req.body.slug = slug;
    }

    // Update publishedAt if status is changing to published
    if (req.body.status === 'published' && blog.status !== 'published') {
      req.body.publishedAt = new Date();
    }

    // Update the blog
    const updatedBlog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    }).populate('author', 'name email avatar');

    logger.info(`Blog updated`, { user: req.user.id, blog: blog._id });
    res.json(updatedBlog);
  } catch (err) {
    logger.error(`Blog update failed`, { user: req.user.id, blog: req.params.id, error: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      logger.warn(`Blog not found for delete`, { user: req.user.id, blog: req.params.id });
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`Unauthorized blog deletion attempt`, { user: req.user.id, blog: blog._id });
      return res.status(403).json({ message: 'Forbidden: Only the author can delete this blog' });
    }

    await Blog.findByIdAndDelete(req.params.id);
    logger.info(`Blog deleted`, { user: req.user.id, blog: blog._id });
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    logger.error(`Blog deletion failed`, { user: req.user.id, blog: req.params.id, error: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.regenerateSummary = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      logger.warn(`Blog not found for summary regeneration`, { user: req.user.id, blog: req.params.id });
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`Unauthorized summary regeneration attempt`, { user: req.user.id, blog: blog._id });
      return res.status(403).json({ message: 'Forbidden: Only the author can regenerate summary' });
    }

    // Generate new AI summary
    const summaryResult = await openaiService.generateSummary(blog.content, {
      maxLength: req.body.maxLength || 150,
      style: req.body.style || 'concise',
      language: blog.language || 'en'
    });

    // Update blog with new summary
    blog.summary = summaryResult.summary;
    await blog.save();

    logger.info(`Blog summary regenerated`, { 
      user: req.user.id, 
      blog: blog._id, 
      provider: summaryResult.provider 
    });

    res.json({
      summary: summaryResult.summary,
      provider: summaryResult.provider,
      metadata: summaryResult.metadata
    });
  } catch (err) {
    logger.error(`Summary regeneration failed`, { user: req.user.id, blog: req.params.id, error: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.publishBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      logger.warn(`Blog not found for publishing`, { user: req.user.id, blog: req.params.id });
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Check if user is the author
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`Unauthorized blog publishing attempt`, { user: req.user.id, blog: blog._id });
      return res.status(403).json({ message: 'Forbidden: Only the author can publish this blog' });
    }

    // Update status to published and set publishedAt
    blog.status = 'published';
    blog.publishedAt = new Date();
    await blog.save();

    // Award XP for publishing
    try {
      await XPService.awardXP(req.user.id, 'publish_blog', {
        blogId: blog._id,
        category: blog.tags?.[0] || 'general',
        language: blog.language || 'en',
      }, {
        ip: req.ip,
        userAgent: req.get('User-Agent'),
        platform: 'web',
      });
      logger.info('XP awarded for blog publishing', { userId: req.user.id, blogId: blog._id });
    } catch (xpError) {
      logger.error('Failed to award XP for blog publishing', { userId: req.user.id, error: xpError.message });
    }

    logger.info(`Blog published`, { user: req.user.id, blog: blog._id });
    res.json({
      message: 'Blog published successfully',
      publishedAt: blog.publishedAt
    });
  } catch (err) {
    logger.error(`Blog publishing failed`, { user: req.user.id, blog: req.params.id, error: err.message });
    res.status(500).json({ message: err.message });
  }
};

// Stubs for advanced endpoints
exports.generateTTS = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      logger.warn(`Blog not found for TTS`, { user: req.user.id, blog: req.params.id });
      return res.status(404).json({ message: 'Blog not found' });
    }
    // Only author or admin can generate TTS
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`Unauthorized TTS attempt`, { user: req.user.id, blog: blog._id });
      return res.status(403).json({ message: 'Forbidden' });
    }
    // Generate via unified TTS service (uses provider selection and fallbacks)
    const content = blog.content || '';
    const result = await ttsService.generateSpeech(content, {
      provider: req.body?.provider || 'elevenlabs',
      voice: req.body?.voice,
      voiceId: req.body?.voiceId,
      voiceName: req.body?.voiceName,
      languageCode: req.body?.languageCode,
      ssmlGender: req.body?.ssmlGender,
      speakingRate: req.body?.speakingRate,
      speed: req.body?.speed,
      language: req.body?.language,
      stability: req.body?.stability,
      similarityBoost: req.body?.similarityBoost,
      style: req.body?.style,
      useSpeakerBoost: req.body?.useSpeakerBoost,
      pitch: req.body?.pitch,
      volumeGainDb: req.body?.volumeGainDb,
      effectsProfileId: req.body?.effectsProfileId
    });

    blog.ttsUrl = result.url;
    blog.ttsOptions = {
      provider: result.provider,
      voice: req.body?.voice,
      voiceId: req.body?.voiceId,
      voiceName: req.body?.voiceName,
      languageCode: req.body?.languageCode,
      ssmlGender: req.body?.ssmlGender,
      speed: req.body?.speed,
      speakingRate: req.body?.speakingRate,
      language: req.body?.language,
      stability: req.body?.stability,
      similarityBoost: req.body?.similarityBoost,
      style: req.body?.style,
      useSpeakerBoost: req.body?.useSpeakerBoost,
      pitch: req.body?.pitch,
      volumeGainDb: req.body?.volumeGainDb,
      effectsProfileId: req.body?.effectsProfileId
    };
    blog.audioDuration = result.duration;
    await blog.save();

    logger.info(`TTS generated`, { user: req.user.id, blog: blog._id, ttsUrl: blog.ttsUrl, provider: result.provider });
    res.json({ ttsUrl: blog.ttsUrl, provider: result.provider, duration: result.duration, metadata: result.metadata });
  } catch (err) {
    logger.error(`TTS generation error`, { user: req.user.id, blog: req.params.id, error: err.message });
    res.status(500).json({ message: err.message });
  }
};
exports.translateBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id);
    if (!blog) {
      logger.warn(`Blog not found for translation`, { user: req.user.id, blog: req.params.id });
      return res.status(404).json({ message: 'Blog not found' });
    }
    // Only author or admin can translate
    if (blog.author.toString() !== req.user.id && req.user.role !== 'admin') {
      logger.warn(`Unauthorized translation attempt`, { user: req.user.id, blog: blog._id });
      return res.status(403).json({ message: 'Forbidden' });
    }
    const { targetLang } = req.body;
    if (!targetLang) return res.status(400).json({ message: 'targetLang is required' });
    // Use LibreTranslate (free, open-source, public instance or self-hosted)
    const apiUrl = 'https://libretranslate.de/translate';
    const response = await axios.post(apiUrl, {
      q: blog.content,
      source: blog.language || 'en',
      target: targetLang,
      format: 'text',
    }, {
      headers: { 'accept': 'application/json' }
    });
    logger.info(`Blog translated`, { user: req.user.id, blog: blog._id, targetLang });
    res.json({
      original: blog.content,
      translated: response.data.translatedText,
      targetLang,
    });
  } catch (err) {
    logger.error(`Translation error`, { user: req.user.id, blog: req.params.id, error: err.message });
    res.status(500).json({ message: err.message });
  }
};
exports.likeBlog = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // RACE CONDITION FIX: Use atomic operations to prevent count inconsistencies
    // First, check if user already liked the blog
    const blog = await Blog.findById(req.params.id).populate('author');
    if (!blog) {
      logger.warn(`Blog not found for like`, { user: req.user.id, blog: req.params.id });
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    const alreadyLiked = blog.likedBy.includes(userId);
    let updatedBlog;
    
    const likeDelta = alreadyLiked ? -1 : 1;

    if (alreadyLiked) {
      // Unlike: Remove user from likedBy and decrement count atomically
      updatedBlog = await Blog.findByIdAndUpdate(
        req.params.id,
        {
          $pull: { likedBy: userId },
          $inc: { likes: -1 }
        },
        { new: true }
      ).populate('author');
      logger.info(`Blog unliked`, { user: req.user.id, blog: blog._id });
    } else {
      // Like: Add user to likedBy and increment count atomically
      updatedBlog = await Blog.findByIdAndUpdate(
        req.params.id,
        {
          $addToSet: { likedBy: userId },
          $inc: { likes: 1 }
        },
        { new: true }
      ).populate('author');
      logger.info(`Blog liked`, { user: req.user.id, blog: blog._id });
      
      // Create in-app notification for blog author
      if (updatedBlog.author && updatedBlog.author._id.toString() !== userId) {
        const NotificationTriggers = require('../utils/notificationTriggers');
        NotificationTriggers.createLikeNotification(updatedBlog._id, userId).catch(err => 
          logger.error('Failed to create like notification', err)
        );
      }
      
      // Email notification to blog author (FIXED: Use notificationSettings)
      if (updatedBlog.author && 
          updatedBlog.author.notificationSettings?.emailNotifications !== false && 
          updatedBlog.author._id.toString() !== userId) {
        const subject = `Your blog was liked: ${updatedBlog.title}`;
        const html = `<p>Hi ${updatedBlog.author.name},</p>
          <p>Your blog <strong>${updatedBlog.title}</strong> was liked by a user.</p>`;
        emailService.sendNotificationEmail(updatedBlog.author.email, subject, html).catch(err => logger.error('Failed to send like notification email', err));
      }
    }
    
    // Ensure likes count doesn't go negative
    if (updatedBlog.likes < 0) {
      await Blog.findByIdAndUpdate(req.params.id, { likes: 0 });
      updatedBlog.likes = 0;
    }

    const authorId = updatedBlog.author?._id || updatedBlog.author;
    if (authorId) {
      await User.findByIdAndUpdate(authorId, { $inc: { totalLikes: likeDelta } });
      await ensureNonNegative(User, authorId, 'totalLikes');
    }

    if (updatedBlog.seriesId) {
      await updateSeriesAnalytics(updatedBlog.seriesId, { likes: likeDelta });
    }

    await cacheService.delete(cacheService.generateKey('blog', updatedBlog._id.toString()));
    
    res.json({ liked: !alreadyLiked, likes: updatedBlog.likes });
  } catch (err) {
    logger.error(`Like error`, { user: req.user.id, blog: req.params.id, error: err.message });
    res.status(500).json({ message: err.message });
  }
};
exports.bookmarkBlog = async (req, res) => {
  try {
    const userId = req.user.id;
    
    // RACE CONDITION FIX: Use atomic operations to prevent count inconsistencies
    const blog = await Blog.findById(req.params.id).populate('author');
    if (!blog) {
      logger.warn(`Blog not found for bookmark`, { user: req.user.id, blog: req.params.id });
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    const alreadyBookmarked = blog.bookmarkedBy.includes(userId);
    let updatedBlog;
    
    const bookmarkDelta = alreadyBookmarked ? -1 : 1;

    if (alreadyBookmarked) {
      // Remove bookmark: Remove user from bookmarkedBy and decrement count atomically
      updatedBlog = await Blog.findByIdAndUpdate(
        req.params.id,
        {
          $pull: { bookmarkedBy: userId },
          $inc: { bookmarks: -1 }
        },
        { new: true }
      ).populate('author');
      logger.info(`Blog unbookmarked`, { user: req.user.id, blog: blog._id });
    } else {
      // Add bookmark: Add user to bookmarkedBy and increment count atomically
      updatedBlog = await Blog.findByIdAndUpdate(
        req.params.id,
        {
          $addToSet: { bookmarkedBy: userId },
          $inc: { bookmarks: 1 }
        },
        { new: true }
      ).populate('author');
      logger.info(`Blog bookmarked`, { user: req.user.id, blog: blog._id });
      
      // Email notification to blog author (FIXED: Use notificationSettings)
      if (updatedBlog.author && 
          updatedBlog.author.notificationSettings?.emailNotifications !== false && 
          updatedBlog.author._id.toString() !== userId) {
        const subject = `Your blog was bookmarked: ${updatedBlog.title}`;
        const html = `<p>Hi ${updatedBlog.author.name},</p>
          <p>Your blog <strong>${updatedBlog.title}</strong> was bookmarked by a user.</p>`;
        emailService.sendNotificationEmail(updatedBlog.author.email, subject, html).catch(err => logger.error('Failed to send bookmark notification email', err));
      }
    }
    
    // Ensure bookmarks count doesn't go negative
    if (updatedBlog.bookmarks < 0) {
      await Blog.findByIdAndUpdate(req.params.id, { bookmarks: 0 });
      updatedBlog.bookmarks = 0;
    }

    await User.findByIdAndUpdate(userId, { $inc: { totalBookmarks: bookmarkDelta } });
    await ensureNonNegative(User, userId, 'totalBookmarks');

    if (updatedBlog.seriesId) {
      await updateSeriesAnalytics(updatedBlog.seriesId, { bookmarks: bookmarkDelta });
    }

    await cacheService.delete(cacheService.generateKey('blog', updatedBlog._id.toString()));
    
    res.json({ bookmarked: !alreadyBookmarked, bookmarks: updatedBlog.bookmarks });
  } catch (err) {
    logger.error(`Bookmark error`, { user: req.user.id, blog: req.params.id, error: err.message });
    res.status(500).json({ message: err.message });
  }
};
exports.getBlogComments = async (req, res) => {
  try {
    const comments = await Comment.find({
      blogId: req.params.id,
      status: 'active',
    })
    .populate('userId', 'firstName lastName displayName avatar username email')
    .sort({ createdAt: -1 });
    
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
// Admin endpoint to fix blogs with null authors
exports.fixBlogAuthors = async (req, res) => {
  try {
    // Only allow admins
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const result = await fixBlogAuthors();
    res.json({
      message: 'Blog authors fixed successfully',
      ...result
    });
  } catch (error) {
    logger.error('Error in fixBlogAuthors endpoint:', error);
    res.status(500).json({ message: error.message });
  }
};

exports.addBlogComment = async (req, res) => {
  try {
    const { content, parentId } = req.body;
    if (!content) return res.status(400).json({ message: 'Content is required' });
    const comment = new Comment({
      blogId: req.params.id,
      userId: req.user.id,
      content,
      parentId: parentId || null,
    });
    await comment.save();
    await comment.populate('userId', 'firstName lastName displayName avatar username email');
    logger.info(`Comment added`, { user: req.user.id, blog: req.params.id, comment: comment._id });

    // Email notification to blog author (FIXED: Use notificationSettings)
    const blog = await Blog.findById(req.params.id).populate('author');
    if (blog && blog.author && blog.author.notificationSettings?.emailNotifications !== false) {
      const subject = `New comment on your blog: ${blog.title}`;
      const html = `<p>Hi ${blog.author.name},</p>
        <p>You have a new comment on your blog <strong>${blog.title}</strong>:</p>
        <blockquote>${content}</blockquote>
        <p>From: ${comment.userId.name}</p>`;
      emailService.sendNotificationEmail(blog.author.email, subject, html).catch(err => logger.error('Failed to send comment notification email', err));
    }

    res.status(201).json(comment);
  } catch (err) {
    logger.error(`Add comment error`, { user: req.user.id, blog: req.params.id, error: err.message });
    res.status(500).json({ message: err.message });
  }
};

// Like/Unlike a comment
exports.likeComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    const userId = req.user.id;
    const isLiked = comment.likedBy.includes(userId);

    if (isLiked) {
      // Unlike
      await comment.unlike(userId);
    } else {
      // Like
      await comment.like(userId);
    }

    await comment.populate('userId', 'firstName lastName displayName avatar username email');
    
    logger.info(`Comment ${isLiked ? 'unliked' : 'liked'}`, { 
      user: req.user.id, 
      comment: comment._id 
    });

    res.json(comment);
  } catch (err) {
    logger.error(`Like comment error`, { user: req.user.id, comment: req.params.id, error: err.message });
    res.status(500).json({ message: err.message });
  }
};

// Delete a comment
exports.deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    if (!comment) {
      return res.status(404).json({ message: 'Comment not found' });
    }

    // Check if user is the comment author
    if (comment.userId.toString() !== req.user.id) {
      return res.status(403).json({ message: 'Not authorized to delete this comment' });
    }

    // Soft delete
    await comment.softDelete();
    
    logger.info(`Comment deleted`, { user: req.user.id, comment: comment._id });

    res.json({ message: 'Comment deleted successfully' });
  } catch (err) {
    logger.error(`Delete comment error`, { user: req.user.id, comment: req.params.id, error: err.message });
    res.status(500).json({ message: err.message });
  }
};
