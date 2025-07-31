const Blog = require('../models/blog.model');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');
const axios = require('axios');
const Comment = require('../models/comment.model');
const logger = require('../utils/logger');
const EmailService = require('../services/EmailService');
const User = require('../models/user.model');
const XPService = require('../services/XPService');

exports.createBlog = async (req, res) => {
  try {
    const blog = new Blog({ ...req.body, author: req.user.id });
    await blog.save();
    logger.info(`Blog created`, { user: req.user.id, blog: blog._id });
    
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
    const blogs = await Blog.find().populate('author', 'name');
    res.json(blogs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getBlogById = async (req, res) => {
  try {
    const blog = await Blog.findById(req.params.id).populate('author', 'name');
    if (!blog) return res.status(404).json({ message: 'Blog not found' });
    res.json(blog);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!blog) {
      logger.warn(`Blog not found for update`, { user: req.user.id, blog: req.params.id });
      return res.status(404).json({ message: 'Blog not found' });
    }
    logger.info(`Blog updated`, { user: req.user.id, blog: blog._id });
    res.json(blog);
  } catch (err) {
    logger.error(`Blog update failed`, { user: req.user.id, blog: req.params.id, error: err.message });
    res.status(500).json({ message: err.message });
  }
};

exports.deleteBlog = async (req, res) => {
  try {
    const blog = await Blog.findByIdAndDelete(req.params.id);
    if (!blog) {
      logger.warn(`Blog not found for delete`, { user: req.user.id, blog: req.params.id });
      return res.status(404).json({ message: 'Blog not found' });
    }
    logger.info(`Blog deleted`, { user: req.user.id, blog: blog._id });
    res.json({ message: 'Blog deleted' });
  } catch (err) {
    logger.error(`Blog deletion failed`, { user: req.user.id, blog: req.params.id, error: err.message });
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
    // Prepare TTS output path
    const ttsDir = path.join(__dirname, '../../public/tts');
    if (!fs.existsSync(ttsDir)) fs.mkdirSync(ttsDir, { recursive: true });
    const audioFilename = `blog-${blog._id}.wav`;
    const audioPath = path.join(ttsDir, audioFilename);
    // Use espeak (must be installed on server)
    const text = blog.content.replace(/\s+/g, ' ').slice(0, 4000); // espeak limit
    const cmd = `espeak "${text.replace(/"/g, '')}" --stdout > "${audioPath}"`;
    exec(cmd, async (err) => {
      if (err) {
        logger.error(`TTS generation failed`, { user: req.user.id, blog: blog._id, error: err.message });
        return res.status(500).json({ message: 'TTS generation failed', error: err.message });
      }
      // Save URL in blog
      blog.ttsUrl = `/tts/${audioFilename}`;
      await blog.save();
      logger.info(`TTS generated`, { user: req.user.id, blog: blog._id, ttsUrl: blog.ttsUrl });
      res.json({ ttsUrl: blog.ttsUrl });
    });
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
        const emailService = new EmailService();
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
        const emailService = new EmailService();
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
      const emailService = new EmailService();
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
