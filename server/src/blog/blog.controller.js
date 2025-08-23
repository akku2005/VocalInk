const Blog = require('../models/blog.model');
const TTSService = require('../services/TTSService');
const OpenAIService = require('../services/OpenAIService');
const axios = require('axios');
const Comment = require('../models/comment.model');
const logger = require('../utils/logger');
const EmailService = require('../services/EmailService');
const User = require('../models/user.model');
const XPService = require('../services/XPService');
const cacheService = require('../services/CacheService');
const slugify = require('slugify');

// Get singleton email service instance
const emailService = EmailService;

const ttsService = new TTSService();
const openaiService = new OpenAIService();

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
        .populate('author', 'name email avatar')
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
    logger.debug('Get all blogs endpoint accessed');
    const blogs=await Blog.find();
    res.json(blogs);
  }catch(err){
    logger.error('Get all blogs failed:', err);
    res.status(500).json({ message: err.message });
  }
}
exports.getBlogById = async (req, res) => {
  try {
    const cacheKey = cacheService.generateKey('blog', req.params.id);
    
    const blog = await cacheService.cacheFunction(cacheKey, async () => {
      return await Blog.findById(req.params.id).populate('author', 'name email avatar');
    }, 600); // Cache for 10 minutes
    
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    logger.error('Get blog by ID failed:', err);
    res.status(500).json({ message: err.message });
  }
};

exports.getBlogBySlug = async (req, res) => {
  try {
    const cacheKey = cacheService.generateKey('blog-slug', req.params.slug);
    
    const blog = await cacheService.cacheFunction(cacheKey, async () => {
      return await Blog.findOne({ slug: req.params.slug }).populate('author', 'name email avatar');
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
    const blog = await Blog.findById(req.params.id).populate('author');
    if (!blog) {
      logger.warn(`Blog not found for like`, { user: req.user.id, blog: req.params.id });
      return res.status(404).json({ message: 'Blog not found' });
    }
    const userId = req.user.id;
    const alreadyLiked = blog.likedBy.includes(userId);
    let action = '';
    if (alreadyLiked) {
      blog.likedBy.pull(userId);
      blog.likes = Math.max(0, blog.likes - 1);
      logger.info(`Blog unliked`, { user: req.user.id, blog: blog._id });
      action = 'unliked';
    } else {
      blog.likedBy.push(userId);
      blog.likes += 1;
      logger.info(`Blog liked`, { user: req.user.id, blog: blog._id });
      action = 'liked';
      // Email notification to blog author
      if (blog.author && blog.author.emailNotifications !== false && blog.author._id.toString() !== userId) {
        const subject = `Your blog was liked: ${blog.title}`;
        const html = `<p>Hi ${blog.author.name},</p>
          <p>Your blog <strong>${blog.title}</strong> was liked by a user.</p>`;
        emailService.sendNotificationEmail(blog.author.email, subject, html).catch(err => logger.error('Failed to send like notification email', err));
      }
    }
    await blog.save();
    res.json({ liked: !alreadyLiked, likes: blog.likes });
  } catch (err) {
    logger.error(`Like error`, { user: req.user.id, blog: req.params.id, error: err.message });
    res.status(500).json({ message: err.message });
  }
};
exports.bookmarkBlog = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author');
    if (!blog) {
      logger.warn(`Blog not found for bookmark`, { user: req.user.id, blog: req.params.id });
      return res.status(404).json({ message: 'Blog not found' });
    }
    const userId = req.user.id;
    const alreadyBookmarked = blog.bookmarkedBy.includes(userId);
    let action = '';
    if (alreadyBookmarked) {
      blog.bookmarkedBy.pull(userId);
      blog.bookmarks = Math.max(0, blog.bookmarks - 1);
      logger.info(`Blog unbookmarked`, { user: req.user.id, blog: blog._id });
      action = 'unbookmarked';
    } else {
      blog.bookmarkedBy.push(userId);
      blog.bookmarks += 1;
      logger.info(`Blog bookmarked`, { user: req.user.id, blog: blog._id });
      action = 'bookmarked';
      // Email notification to blog author
      if (blog.author && blog.author.emailNotifications !== false && blog.author._id.toString() !== userId) {
        const subject = `Your blog was bookmarked: ${blog.title}`;
        const html = `<p>Hi ${blog.author.name},</p>
          <p>Your blog <strong>${blog.title}</strong> was bookmarked by a user.</p>`;
        emailService.sendNotificationEmail(blog.author.email, subject, html).catch(err => logger.error('Failed to send bookmark notification email', err));
      }
    }
    await blog.save();
    res.json({ bookmarked: !alreadyBookmarked, bookmarks: blog.bookmarks });
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
    }).populate('userId', 'name');
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
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
    await comment.populate('userId', 'name');
    logger.info(`Comment added`, { user: req.user.id, blog: req.params.id, comment: comment._id });

    // Email notification to blog author
    const blog = await Blog.findById(req.params.id).populate('author');
    if (blog && blog.author && blog.author.emailNotifications !== false) {
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
