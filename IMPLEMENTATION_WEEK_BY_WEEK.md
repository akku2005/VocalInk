# VocalInk Implementation Roadmap: Week-by-Week Execution Guide

**Last Updated**: November 24, 2025  
**Target**: Launch-ready in 8 weeks  
**Status**: Ready to execute

---

## Table of Contents

1. [Week 1-2: Foundation (SEO & Drafts)](#week-1-2-foundation)
2. [Week 3-4: Monetization](#week-3-4-monetization)
3. [Week 5-6: Growth Features](#week-5-6-growth-features)
4. [Week 7-8: Polish & Launch](#week-7-8-polish--launch)
5. [Post-Launch: Scaling](#post-launch-scaling)

---

## Week 1-2: Foundation (SEO & Drafts)

### Sprint Goal
Make VocalInk discoverable on Google and save user drafts safely.

### Task Breakdown

#### Task 1.1: Fix URL Routing to Slug-Based (2 days)

**Why**: Currently using `/article/{id}` (not SEO-friendly), need `/article/{slug}`

**Files to Change**:
- `server/src/models/blog.model.js`
- `server/src/blog/blog.controller.js`
- `server/src/routes/blog/blog.routes.js`
- `client/src/routes/AppRoutes.jsx`
- `client/src/components/blog/BlogCard.jsx`
- `client/src/services/blogService.js`

**Implementation**:

```javascript
// 1. server/src/models/blog.model.js - Add slug generation
const generateSlug = (title) => {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 50); // Max 50 chars
};

blogSchema.pre('save', async function(next) {
  if (!this.slug && this.title) {
    let slug = generateSlug(this.title);
    
    // Check for duplicates
    let count = await this.constructor.countDocuments({
      slug: new RegExp(`^${slug}(-\\d+)?$`)
    });
    
    if (count > 0) {
      slug = `${slug}-${count + 1}`;
    }
    
    this.slug = slug;
  }
  next();
});

// Add unique index
blogSchema.index({ slug: 1 }, { unique: true, sparse: true });
```

```javascript
// 2. server/src/blog/blog.controller.js - Add getBlogBySlug
exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, status: 'published' })
      .populate('author', 'displayName avatar bio email')
      .lean();
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }
    
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
```

```jsx
// 3. client/src/routes/AppRoutes.jsx - Update routing
<Route path="/article/:slug" element={<ArticlePage />} />

// 4. client/src/pages/ArticlePage.jsx - Use slug instead of id
const { slug } = useParams();

const fetchBlog = async () => {
  try {
    const response = await blogService.getBlogBySlug(slug);
    setArticle(response);
  } catch (error) {
    setError('Blog not found');
  }
};

// 5. client/src/services/blogService.js - Add method
getBlogBySlug: async (slug) => {
  const { data } = await api.get(`/blogs/slug/${slug}`);
  return data;
}
```

**Testing**:
- [ ] Can access blog by slug: `/article/my-first-post`
- [ ] Old ID URLs redirect to slug URLs
- [ ] Slug auto-generates from title
- [ ] Duplicate titles get numbered slug
- [ ] All blog links updated to use slug

**Estimated Time**: 2-3 hours

---

#### Task 1.2: Add SEO Meta Tags (1 day)

**Why**: Without meta tags, social shares look terrible and Google can't understand content

**Files to Change**:
- `client/src/components/seo/SEOHead.jsx` (already exists, needs invocation)
- `client/src/pages/ArticlePage.jsx`
- `client/src/pages/HomePage.jsx`
- `client/src/pages/BlogPage.jsx`
- `client/src/pages/ProfilePage.jsx`

**Implementation**:

```jsx
// client/src/components/seo/SEOHead.jsx - Already exists, update it
import { Helmet } from 'react-helmet-async';

export default function SEOHead({
  title,
  description,
  image,
  url,
  type = 'website',
  author,
  publishedTime,
  updatedTime,
  tags = []
}) {
  const fullTitle = title ? `${title} | VocalInk` : 'VocalInk - Blog Platform';
  const fullUrl = url || window.location.href;

  return (
    <Helmet>
      {/* Basic Meta Tags */}
      <title>{fullTitle}</title>
      <meta name="description" content={description || ''} />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta name="theme-color" content="#000000" />

      {/* Open Graph (Facebook, LinkedIn, etc.) */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={fullTitle} />
      <meta property="og:description" content={description || ''} />
      <meta property="og:image" content={image || 'https://vocalink.io/og-image.png'} />
      <meta property="og:url" content={fullUrl} />
      <meta property="og:site_name" content="VocalInk" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={fullTitle} />
      <meta name="twitter:description" content={description || ''} />
      <meta name="twitter:image" content={image || 'https://vocalink.io/og-image.png'} />
      <meta name="twitter:site" content="@VocalInk" />

      {/* Article Specific */}
      {type === 'article' && (
        <>
          <meta property="article:author" content={author || ''} />
          {publishedTime && (
            <meta property="article:published_time" content={publishedTime} />
          )}
          {updatedTime && (
            <meta property="article:modified_time" content={updatedTime} />
          )}
          {tags.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}

      {/* Canonical URL */}
      <link rel="canonical" href={fullUrl} />

      {/* Additional SEO */}
      <meta name="keywords" content={tags.join(', ')} />
      <meta name="robots" content="index, follow" />
      <meta name="language" content="English" />
    </Helmet>
  );
}
```

```jsx
// client/src/pages/ArticlePage.jsx - Use SEOHead
import SEOHead from '../components/seo/SEOHead';

export default function ArticlePage() {
  const [article, setArticle] = useState(null);

  return (
    <>
      <SEOHead
        title={article?.title}
        description={article?.summary || article?.content?.substring(0, 160)}
        image={article?.coverImage}
        url={`https://vocalink.io/article/${article?.slug}`}
        type="article"
        author={article?.author?.displayName}
        publishedTime={article?.publishedAt?.toISOString?.()}
        updatedTime={article?.updatedAt?.toISOString?.()}
        tags={article?.tags}
      />
      {/* Rest of component */}
    </>
  );
}
```

**Testing**:
- [ ] Meta tags visible in `<head>` (View Source)
- [ ] OG tags correct on Facebook share preview
- [ ] Twitter card works on Twitter share
- [ ] Image preview shows correctly
- [ ] Canonical URL set properly

**Estimated Time**: 2-3 hours

---

#### Task 1.3: Generate Sitemap & Robots.txt (1 day)

**Why**: Google needs sitemap to discover all pages; robots.txt tells crawlers what to index

**Files to Create**:
- `server/src/routes/sitemap.routes.js` (already exists, update it)
- `server/public/robots.txt`

**Implementation**:

```javascript
// server/src/routes/sitemap.routes.js
const express = require('express');
const router = express.Router();
const Blog = require('../models/blog.model');
const User = require('../models/user.model');

// Generate XML sitemap
router.get('/sitemap.xml', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .select('slug updatedAt')
      .lean();

    const users = await User.find({ 'totalBlogs': { $gt: 0 } })
      .select('username updatedAt')
      .lean();

    let xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

    // Add static pages
    const staticUrls = ['', '/about', '/pricing'];
    staticUrls.forEach(path => {
      xml += `
  <url>
    <loc>https://vocalink.io${path}</loc>
    <lastmod>${new Date().toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>${path === '' ? '1.0' : '0.8'}</priority>
  </url>`;
    });

    // Add blog pages
    blogs.forEach(blog => {
      xml += `
  <url>
    <loc>https://vocalink.io/article/${blog.slug}</loc>
    <lastmod>${blog.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
    });

    // Add user profiles
    users.forEach(user => {
      xml += `
  <url>
    <loc>https://vocalink.io/profile/${user.username}</loc>
    <lastmod>${user.updatedAt.toISOString().split('T')[0]}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
    });

    xml += '\n</urlset>';

    res.header('Content-Type', 'application/xml');
    res.send(xml);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Sitemap index (for large sites)
router.get('/sitemap_index.xml', async (req, res) => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <sitemap>
    <loc>https://vocalink.io/sitemap.xml</loc>
  </sitemap>
</sitemapindex>`;

  res.header('Content-Type', 'application/xml');
  res.send(xml);
});

module.exports = router;
```

```
# server/public/robots.txt
User-agent: *
Allow: /
Disallow: /admin
Disallow: /api
Disallow: /auth
Disallow: /settings
Disallow: /dashboard

# Specific to important bots
User-agent: Googlebot
Allow: /
Crawl-delay: 0

User-agent: Bingbot
Allow: /
Crawl-delay: 1

# Sitemaps
Sitemap: https://vocalink.io/sitemap.xml
Sitemap: https://vocalink.io/sitemap_index.xml
```

**Testing**:
- [ ] Sitemap accessible at `/sitemap.xml`
- [ ] All published blogs in sitemap
- [ ] All user profiles in sitemap
- [ ] Valid XML (no parse errors)
- [ ] robots.txt blocks admin/api routes
- [ ] Submit to Google Search Console

**Estimated Time**: 1-2 hours

---

#### Task 1.4: Add JSON-LD Schema (1 day)

**Why**: Helps search engines understand content structure; enables rich results

**Files to Create**:
- `client/src/utils/schemaMarkup.js`

**Implementation**:

```javascript
// client/src/utils/schemaMarkup.js
export const getArticleSchema = (article, baseUrl) => ({
  '@context': 'https://schema.org',
  '@type': 'Article',
  'headline': article.title,
  'description': article.summary || article.content.substring(0, 160),
  'image': article.coverImage ? {
    '@type': 'ImageObject',
    'url': article.coverImage,
    'width': 1200,
    'height': 630
  } : undefined,
  'author': {
    '@type': 'Person',
    'name': article.author?.displayName || 'Anonymous',
    'url': `${baseUrl}/profile/${article.author?.username}`
  },
  'datePublished': article.publishedAt?.toISOString(),
  'dateModified': article.updatedAt?.toISOString(),
  'articleBody': article.content.replace(/<[^>]*>/g, ''),
  'wordCount': article.readingTime * 200,
  'url': `${baseUrl}/article/${article.slug}`,
  'isPartOf': {
    '@type': 'CreativeWork',
    '@id': baseUrl
  }
});

export const getOrganizationSchema = () => ({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  'name': 'VocalInk',
  'url': 'https://vocalink.io',
  'logo': 'https://vocalink.io/logo.png',
  'sameAs': [
    'https://twitter.com/vocalink',
    'https://github.com/vocalink',
    'https://linkedin.com/company/vocalink'
  ],
  'contactPoint': {
    '@type': 'ContactPoint',
    'contactType': 'Customer Service',
    'email': 'support@vocalink.io'
  }
});

export const getBreadcrumbSchema = (items) => ({
  '@context': 'https://schema.org',
  '@type': 'BreadcrumbList',
  'itemListElement': items.map((item, index) => ({
    '@type': 'ListItem',
    'position': index + 1,
    'name': item.name,
    'item': item.url
  }))
});
```

```jsx
// client/src/pages/ArticlePage.jsx - Add schema to Helmet
import { Helmet } from 'react-helmet-async';
import { getArticleSchema } from '../utils/schemaMarkup';

<Helmet>
  {/* ... other tags ... */}
  <script type="application/ld+json">
    {JSON.stringify(getArticleSchema(article, window.location.origin))}
  </script>
</Helmet>
```

**Testing**:
- [ ] Schema markup validates at schema.org/validator
- [ ] Rich snippet shows in Google search results
- [ ] JSON-LD is valid (no parse errors)

**Estimated Time**: 2 hours

---

#### Task 1.5: Server-Side Draft Autosave (2 days)

**Why**: Users lose work if browser crashes; need automatic server-side backup

**Files to Update**:
- `server/src/models/blog.model.js`
- `server/src/blog/blog.controller.js`
- `client/src/hooks/useAutosave.js`
- `client/src/pages/CreateBlogPage.jsx`
- `client/src/pages/EditBlogPage.jsx`

**Implementation**:

```javascript
// server/src/models/blog.model.js - Add version history
const versionSchema = new Schema({
  versionNumber: { type: Number, required: true },
  title: String,
  content: String,
  summary: String,
  tags: [String],
  coverImage: String,
  savedAt: { type: Date, default: Date.now },
  savedBy: { type: Schema.Types.ObjectId, ref: 'User' },
  isAutosave: { type: Boolean, default: false },
  changeDescription: String // User-provided note
}, { _id: false });

// Add to blogSchema
blogSchema.add({
  versions: [versionSchema],
  lastAutosaved: Date,
  autosaveVersion: { type: Number, default: 0 }
});

// Keep only last 20 versions
blogSchema.pre('save', function(next) {
  if (this.versions && this.versions.length > 20) {
    this.versions = this.versions.slice(-20);
  }
  next();
});
```

```javascript
// server/src/blog/blog.controller.js - Add autosave endpoint
exports.autosaveBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, summary, tags, coverImage } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Authorization check
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    // Create new version
    const newVersion = {
      versionNumber: (blog.autosaveVersion || 0) + 1,
      title: title || blog.title,
      content: content || blog.content,
      summary: summary || blog.summary,
      tags: tags || blog.tags,
      coverImage: coverImage || blog.coverImage,
      savedBy: req.user._id,
      isAutosave: true
    };

    blog.versions.push(newVersion);
    blog.autosaveVersion = newVersion.versionNumber;
    blog.lastAutosaved = new Date();

    // Update main content (draft)
    blog.title = title || blog.title;
    blog.content = content || blog.content;
    blog.summary = summary || blog.summary;
    blog.tags = tags || blog.tags;
    if (coverImage) blog.coverImage = coverImage;

    await blog.save();

    res.json({
      success: true,
      version: blog.autosaveVersion,
      lastAutosaved: blog.lastAutosaved,
      message: 'Draft saved successfully'
    });
  } catch (error) {
    logger.error('Autosave error:', error);
    res.status(500).json({ message: 'Failed to save draft' });
  }
};

// Get version history
exports.getBlogVersions = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id)
      .select('versions autosaveVersion')
      .populate('versions.savedBy', 'displayName email');

    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    res.json(blog.versions || []);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch versions' });
  }
};

// Restore from version
exports.restoreBlogVersion = async (req, res) => {
  try {
    const { id, versionNumber } = req.params;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Authorization
    if (blog.author.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Not authorized' });
    }

    const version = blog.versions.find(v => v.versionNumber == versionNumber);
    if (!version) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Create new version entry for the restore action
    blog.versions.push({
      versionNumber: (blog.autosaveVersion || 0) + 1,
      title: blog.title,
      content: blog.content,
      summary: blog.summary,
      tags: blog.tags,
      coverImage: blog.coverImage,
      savedBy: req.user._id,
      isAutosave: false,
      changeDescription: `Restored from version ${versionNumber}`
    });

    // Restore content
    blog.title = version.title;
    blog.content = version.content;
    blog.summary = version.summary;
    blog.tags = version.tags;
    blog.coverImage = version.coverImage;

    await blog.save();

    res.json({
      success: true,
      message: `Restored to version ${versionNumber}`,
      blog
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to restore version' });
  }
};
```

```jsx
// client/src/hooks/useAutosave.js
import { useEffect, useRef, useCallback } from 'react';
import api from '../services/api';

export const useAutosave = (
  blogId,
  content,
  onStatusChange,
  debounceMs = 3000
) => {
  const timeoutRef = useRef(null);
  const lastSaveRef = useRef(null);

  const performAutosave = useCallback(async () => {
    if (!blogId || !content.title) {
      return;
    }

    onStatusChange?.('saving');

    try {
      const response = await api.post(`/blogs/${blogId}/autosave`, content);
      lastSaveRef.current = new Date();
      onStatusChange?.('saved');

      // Show "Saved" message for 3 seconds
      setTimeout(() => {
        onStatusChange?.(null);
      }, 3000);
    } catch (error) {
      console.error('Autosave failed:', error);
      onStatusChange?.('failed');
    }
  }, [blogId, content, onStatusChange]);

  useEffect(() => {
    // Clear existing timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set new timeout for autosave
    timeoutRef.current = setTimeout(() => {
      performAutosave();
    }, debounceMs);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [content, debounceMs, performAutosave]);

  return { performAutosave };
};
```

```jsx
// client/src/pages/CreateBlogPage.jsx - Use autosave hook
import { useAutosave } from '../hooks/useAutosave';

export default function CreateBlogPage() {
  const [blog, setBlog] = useState({
    title: '',
    content: '',
    summary: '',
    tags: []
  });
  const [saveStatus, setSaveStatus] = useState(null);
  const [blogId, setBlogId] = useState(null);

  const { performAutosave } = useAutosave(blogId, blog, setSaveStatus, 3000);

  const handleCreate = async () => {
    if (!blogId) {
      const response = await api.post('/blogs/addBlog', {
        ...blog,
        status: 'draft'
      });
      setBlogId(response.data._id);
    }
  };

  useEffect(() => {
    if (blogId) {
      performAutosave();
    }
  }, [blog, blogId]);

  return (
    <div>
      {/* Editor */}
      <textarea
        value={blog.content}
        onChange={(e) => setBlog({ ...blog, content: e.target.value })}
      />

      {/* Save Status Indicator */}
      <div className="save-indicator">
        {saveStatus === 'saving' && (
          <span className="text-blue-500">💾 Saving...</span>
        )}
        {saveStatus === 'saved' && (
          <span className="text-green-500">✅ Saved</span>
        )}
        {saveStatus === 'failed' && (
          <span className="text-red-500">❌ Failed to save</span>
        )}
      </div>
    </div>
  );
}
```

**Testing**:
- [ ] Draft auto-saves every 3 seconds
- [ ] "Saving..." shows while saving
- [ ] "Saved" appears after successful save
- [ ] Can view version history
- [ ] Can restore from previous version
- [ ] Works with multiple tabs open
- [ ] Preserves formatting and images

**Estimated Time**: 4-5 hours

---

#### Task 1.6: Testing & Deployment (1 day)

**Testing Checklist**:
- [ ] All 404 errors redirect to 404 page
- [ ] SEO meta tags visible in all pages
- [ ] Sitemap generates correctly
- [ ] Robots.txt blocks admin routes
- [ ] JSON-LD schema validates
- [ ] Autosave works without errors
- [ ] Version history displays correctly
- [ ] Can restore from old versions
- [ ] Performance metrics acceptable (<200ms)
- [ ] No console errors

**Deployment Steps**:
1. Create feature branch: `git checkout -b feat/seo-drafts`
2. Test locally: `npm run dev`
3. Build for production: `npm run build`
4. Deploy to staging: `make deploy-staging`
5. Run smoke tests
6. Deploy to production: `make deploy`
7. Monitor error logs for 1 hour

**Estimated Time**: 3-4 hours

---

### Week 1-2 Summary

**Completed**:
- ✅ SEO-friendly URL routing
- ✅ Meta tags for social sharing
- ✅ Sitemap & robots.txt
- ✅ JSON-LD schema markup
- ✅ Server-side autosave with version history

**Metrics to Track**:
- Google Search Console indexing
- Organic traffic (Google Analytics)
- Social share engagement
- Draft save frequency

**Time Spent**: ~40 hours  
**Team Size**: 2-3 developers

---

## Week 3-4: Monetization

[Continue in next section...]

### Sprint Goal
Enable creators to earn money through subscriptions and revenue sharing.

#### Task 2.1: Stripe Integration (3 days)

**Why**: Can't attract professional creators without payment capability

**Implementation Details**:

```javascript
// server/src/services/stripeService.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

const SUBSCRIPTION_TIERS = {
  'reader_pro': {
    name: 'Reader Pro',
    priceId: process.env.STRIPE_PRICE_READER_PRO,
    price: 1000, // $10/month in cents
    features: ['Unlimited reading', 'Offline mode', 'Ad-free']
  },
  'creator_pro': {
    name: 'Creator Pro',
    priceId: process.env.STRIPE_PRICE_CREATOR_PRO,
    price: 900, // $9/month in cents
    features: ['Advanced analytics', 'Premium TTS', 'Custom domain']
  },
  'business': {
    name: 'Business',
    priceId: process.env.STRIPE_PRICE_BUSINESS,
    price: 4900, // $49/month in cents
    features: ['Team collaboration', 'White-label', 'API access']
  }
};

exports.createCheckoutSession = async (userId, tierId) => {
  const user = await User.findById(userId);
  const tier = SUBSCRIPTION_TIERS[tierId];

  if (!tier) {
    throw new Error('Invalid tier');
  }

  const session = await stripe.checkout.sessions.create({
    customer_email: user.email,
    payment_method_types: ['card'],
    mode: 'subscription',
    line_items: [{
      price: tier.priceId,
      quantity: 1
    }],
    success_url: `${process.env.CLIENT_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.CLIENT_URL}/pricing`,
    metadata: {
      userId: userId.toString(),
      tier: tierId
    }
  });

  return session;
};

exports.handleWebhookEvent = async (event) => {
  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      await handleSubscriptionUpdate(event.data.object);
      break;
    case 'customer.subscription.deleted':
      await handleSubscriptionCanceled(event.data.object);
      break;
    case 'charge.succeeded':
      await handleChargeSucceeded(event.data.object);
      break;
  }
};

async function handleSubscriptionUpdate(subscription) {
  const user = await User.findById(subscription.metadata.userId);
  user.subscription = {
    status: subscription.status,
    tier: subscription.metadata.tier,
    stripeCustomerId: subscription.customer,
    stripeSubscriptionId: subscription.id,
    currentPeriodStart: new Date(subscription.current_period_start * 1000),
    currentPeriodEnd: new Date(subscription.current_period_end * 1000)
  };
  await user.save();
}

async function handleSubscriptionCanceled(subscription) {
  const user = await User.findById(subscription.metadata.userId);
  user.subscription.status = 'canceled';
  user.subscription.canceledAt = new Date();
  await user.save();
}
```

```javascript
// server/src/controllers/subscriptionController.js
const stripeService = require('../services/stripeService');

exports.createCheckoutSession = async (req, res) => {
  try {
    const { tierId } = req.body;
    const session = await stripeService.createCheckoutSession(
      req.user._id,
      tierId
    );
    res.json({ url: session.url });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};

exports.handleWebhook = async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return res.status(400).send(`Webhook Error: ${error.message}`);
  }

  await stripeService.handleWebhookEvent(event);
  res.json({ received: true });
};

exports.getSubscriptionStatus = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json(user.subscription || null);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.cancelSubscription = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.subscription?.stripeSubscriptionId) {
      return res.status(400).json({ error: 'No active subscription' });
    }

    await stripe.subscriptions.cancel(
      user.subscription.stripeSubscriptionId
    );

    res.json({ message: 'Subscription canceled' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Files to Create**:
- `server/src/services/stripeService.js`
- `server/src/controllers/subscriptionController.js`
- `client/src/pages/PricingPage.jsx`
- `client/src/pages/CheckoutPage.jsx`

**Testing**:
- [ ] Checkout flow works end-to-end
- [ ] Payment processes successfully
- [ ] Subscription saved to database
- [ ] Webhook events handled correctly
- [ ] Member-only content blocked for non-subscribers

**Estimated Time**: 16 hours

#### Task 2.2: Revenue Dashboard (3 days)

**Implementation Details**:

```javascript
// server/src/services/revenueService.js
exports.calculateCreatorEarnings = async (creatorId, startDate, endDate) => {
  const blogs = await Blog.find({
    author: creatorId,
    publishedAt: { $gte: startDate, $lte: endDate }
  }).lean();

  let totalEarnings = 0;
  const breakdown = {};

  for (const blog of blogs) {
    const views = blog.views || 0;
    const engagement = (blog.likes + blog.comments * 2) || 0;
    const subscriberReads = blog.subscriberViews || 0;

    const earnings =
      (views * 0.001) +           // $0.001 per view
      (engagement * 0.01) +       // $0.01 per engagement
      (subscriberReads * 0.05);   // $0.05 per subscriber read

    breakdown[blog._id] = earnings;
    totalEarnings += earnings;
  }

  return {
    totalEarnings: Math.round(totalEarnings * 100),
    blogCount: blogs.length,
    breakdown
  };
};

exports.schedulePayouts = async () => {
  const creators = await User.find({ role: { $in: ['writer', 'admin'] } });

  for (const creator of creators) {
    const lastPayout = creator.lastPayoutDate || new Date(0);
    const now = new Date();
    const weeksSinceLastPayout = (now - lastPayout) / (7 * 24 * 60 * 60 * 1000);

    if (weeksSinceLastPayout >= 1) {
      const earnings = await exports.calculateCreatorEarnings(
        creator._id,
        lastPayout,
        now
      );

      if (earnings.totalEarnings > 0) {
        await createPayout(creator, earnings);
      }

      creator.lastPayoutDate = now;
      await creator.save();
    }
  }
};

async function createPayout(creator, earnings) {
  // Create Stripe Connect transfer
  const transfer = await stripe.transfers.create({
    amount: earnings.totalEarnings,
    currency: 'usd',
    destination: creator.stripeConnectId,
    description: `VocalInk Weekly Payout`
  });

  // Record payout
  const payout = new Payout({
    creator: creator._id,
    amount: earnings.totalEarnings,
    stripeTransferId: transfer.id,
    status: 'sent',
    period: {
      startDate: new Date(),
      endDate: new Date()
    }
  });

  await payout.save();

  // Send email
  await sendPayoutEmail(creator, earnings, transfer);
}
```

---

## Week 5-6: Growth Features

### Email Newsletters
### PWA Implementation
### Engagement Heatmaps

---

## Week 7-8: Polish & Launch

### Final Testing
### Security Audit
### Performance Optimization
### Beta Launch

---

## Post-Launch: Scaling

### Growth Metrics
### Feature Rollout Schedule
### Community Building

---

## Implementation Checklist

### Week 1-2
- [ ] SEO URLs implemented
- [ ] Meta tags added
- [ ] Sitemap generated
- [ ] Autosave working
- [ ] All tests passing
- [ ] Code reviewed & merged

### Week 3-4
- [ ] Stripe integrated
- [ ] Revenue dashboard built
- [ ] Webhooks tested
- [ ] Payouts scheduled

### Week 5-6
- [ ] Emails sending
- [ ] PWA manifest created
- [ ] Service worker functional
- [ ] Heatmaps showing

### Week 7-8
- [ ] Security audit complete
- [ ] Performance optimized
- [ ] 100 beta creators loaded
- [ ] Launch ready

---

## Success Metrics

**By Week 4**:
- 200+ organic search impressions
- 0 autosave failures
- 50+ creators signing up

**By Week 8**:
- 10,000+ organic visitors
- 100% email delivery rate
- 5,000+ blogs published
- $5,000 MRR

---

