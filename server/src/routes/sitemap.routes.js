const express = require('express');
const router = express.Router();
const Blog = require('../models/blog.model');
const User = require('../models/user.model');
const logger = require('../utils/logger');

/**
 * Generate XML Sitemap
 * https://your-domain.com/sitemap.xml
 */
router.get('/sitemap.xml', async (req, res) => {
  try {
    const baseUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

    // Fetch all published blogs
    const blogs = await Blog.find({ status: 'published' })
      .select('slug updatedAt createdAt')
      .sort({ updatedAt: -1 })
      .lean();

    // Fetch all public user profiles (optional)
    const users = await User.find({ 'privacySettings.profileVisibility': 'public' })
      .select('username updatedAt')
      .limit(1000) // Limit to prevent huge sitemaps
      .lean();

    // Generate sitemap XML
    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:news="http://www.google.com/schemas/sitemap-news/0.9"
        xmlns:xhtml="http://www.w3.org/1999/xhtml"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">

  <!-- Homepage -->
  <url>
    <loc>${baseUrl}/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
    <lastmod>${new Date().toISOString()}</lastmod>
  </url>

  <!-- Static Pages -->
  <url>
    <loc>${baseUrl}/blogs</loc>
    <changefreq>hourly</changefreq>
    <priority>0.9</priority>
  </url>
  <url>
    <loc>${baseUrl}/series</loc>
    <changefreq>daily</changefreq>
    <priority>0.8</priority>
  </url>
  <url>
    <loc>${baseUrl}/badges</loc>
    <changefreq>weekly</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/leaderboard</loc>
    <changefreq>daily</changefreq>
    <priority>0.7</priority>
  </url>
  <url>
    <loc>${baseUrl}/search</loc>
    <changefreq>daily</changefreq>
    <priority>0.6</priority>
  </url>

  <!-- Blog Articles -->
  ${blogs
        .map(
          (blog) => `
  <url>
    <loc>${baseUrl}/blog/${blog.slug}</loc>
    <lastmod>${(blog.updatedAt || blog.createdAt).toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>`
        )
        .join('')}

  <!-- User Profiles -->
  ${users
        .map(
          (user) => `
  <url>
    <loc>${baseUrl}/profile/${user.username || user._id}</loc>
    <lastmod>${user.updatedAt?.toISOString() || new Date().toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.5</priority>
  </url>`
        )
        .join('')}

</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);

    logger.info('Sitemap generated successfully', {
      blogsCount: blogs.length,
      usersCount: users.length,
    });
  } catch (error) {
    logger.error('Sitemap generation failed', { error: error.message });
    res.status(500).send('<?xml version="1.0" encoding="UTF-8"?><error>Sitemap generation failed</error>');
  }
});

/**
 * Generate robots.txt
 * https://your-domain.com/robots.txt
 */
router.get('/robots.txt', (req, res) => {
  const backendUrl = process.env.BACKEND_URL || `http://localhost:${process.env.PORT || 3000}`;
  const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';

  const robotsTxt = `# VocalInk Robots.txt
User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Disallow: /edit-blog/
Disallow: /create-blog/
Disallow: /create-series/
Disallow: /settings/
Disallow: /notifications/
Disallow: /rewards/
Disallow: /analytics/
Disallow: /2fa-setup/

# Allow blog content
Allow: /blog/
Allow: /blogs
Allow: /series
Allow: /badges
Allow: /leaderboard
Allow: /search

# Sitemap
Sitemap: ${backendUrl}/sitemap.xml

# Crawl delay (be nice to servers)
Crawl-delay: 1`;

  res.type('text/plain');
  res.send(robotsTxt);

  logger.info('Robots.txt served');
});

module.exports = router;
