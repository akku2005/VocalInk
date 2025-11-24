# VocalInk - Sprint-by-Sprint Implementation Roadmap
**Planning Date**: November 23, 2025  
**Target Launch**: 8 weeks from start

---

## Overview

This roadmap breaks down the critical path to launch into **2-week sprints**. Each sprint has clear deliverables, technical tasks, and success criteria.

---

## Sprint 0: Preparation (Before Starting)

### **Goals**:
- Set up project management
- Assign team roles
- Establish development workflow

### **Tasks**:
- [ ] Create GitHub Projects board or Linear workspace
- [ ] Set up CI/CD pipeline (GitHub Actions)
- [ ] Configure staging environment
- [ ] Set up error tracking (complete Sentry integration)
- [ ] Team kickoff meeting

### **Team Roles** (Recommended):
- **1 Backend Developer**: API, database, services
- **1 Frontend Developer**: React components, UX
- **1 Full-Stack Developer**: Integration, devops
- **Optional: 1 Designer**: UI/UX polish, branding

---

## Sprint 1: SEO & Discovery Foundation (Weeks 1-2)

### **Theme**: Make VocalInk discoverable

### **Epic 1.1: Slug-Based Routing** 🔴 CRITICAL
**Owner**: Full-Stack Developer  
**Effort**: 3 days

#### **Backend Tasks**:
```javascript
// 1. Update blog.routes.js
router.get('/slug/:slug', blogController.getBlogBySlug);

// 2. Add getBlogBySlug in blog.controller.js
exports.getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, status: 'published' })
      .populate('author', 'firstName lastName username profileImage')
      .lean();
    
    if (!blog) {
      return res.status(404).json({ error: 'Blog not found' });
    }
    
    // Increment views
    await Blog.findByIdAndUpdate(blog._id, { $inc: { views: 1 } });
    
    res.json({ blog });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

#### **Frontend Tasks**:
```javascript
// 1. Update AppRoutes.jsx
<Route path="/blog/:slug" element={<ArticlePage />} />

// 2. Update ArticlePage.jsx
const { slug } = useParams();
const { data: article } = useQuery(['article', slug], () => 
  blogService.getBlogBySlug(slug)
);

// 3. Update all navigation links
// BlogCard.jsx, SearchPage.jsx, etc.
<Link to={`/blog/${blog.slug}`}>{blog.title}</Link>
```

#### **Database Migration**:
```javascript
// Ensure all existing blogs have slugs
const blogs = await Blog.find({ slug: { $exists: false } });
for (const blog of blogs) {
  blog.slug = generateSlug(blog.title, blog._id);
  await blog.save();
}
```

**Acceptance Criteria**:
- [ ] All blog URLs use slugs (e.g., `/blog/my-first-post`)
- [ ] 301 redirects from old ID URLs to slug URLs
- [ ] No broken links in app
- [ ] Database migration complete

---

### **Epic 1.2: SEO Metadata Implementation** 🔴 CRITICAL
**Owner**: Frontend Developer  
**Effort**: 2 days

#### **Tasks**:
```jsx
// 1. Update SEOHead.jsx to include all metadata
export const SEOHead = ({ 
  title, 
  description, 
  image, 
  url, 
  type = 'website',
  article 
}) => {
  return (
    <Helmet>
      {/* Basic Meta */}
      <title>{title} | VocalInk</title>
      <meta name="description" content={description} />
      <link rel="canonical" href={url} />
      
      {/* Open Graph */}
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:image" content={image} />
      <meta property="og:url" content={url} />
      <meta property="og:site_name" content="VocalInk" />
      
      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={image} />
      
      {/* Article-specific */}
      {article && (
        <>
          <meta property="article:published_time" content={article.publishedTime} />
          <meta property="article:author" content={article.author} />
          {article.tags?.map(tag => (
            <meta key={tag} property="article:tag" content={tag} />
          ))}
        </>
      )}
      
      {/* JSON-LD Structured Data */}
      <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": type === 'article' ? 'Article' : 'WebPage',
          headline: title,
          description: description,
          image: image,
          author: article?.author ? {
            "@type": "Person",
            name: article.author
          } : undefined,
          datePublished: article?.publishedTime,
        })}
      </script>
    </Helmet>
  );
};

// 2. Add to ArticlePage.jsx
<SEOHead
  title={article.title}
  description={article.summary || article.aiSummary}
  image={article.coverImage}
  url={`${window.location.origin}/blog/${article.slug}`}
  type="article"
  article={{
    publishedTime: article.publishedAt,
    author: article.author.name,
    tags: article.tags,
  }}
/>

// 3. Add to Home.jsx, BlogPage.jsx, ProfilePage.jsx, etc.
```

**Acceptance Criteria**:
- [ ] SEOHead component on all pages
- [ ] Open Graph validator passes (https://developers.facebook.com/tools/debug/)
- [ ] Twitter Card validator passes (https://cards-dev.twitter.com/validator)
- [ ] Rich snippets show in Google Search Console

---

### **Epic 1.3: Sitemap & Robots.txt** 🔴 CRITICAL
**Owner**: Backend Developer  
**Effort**: 1 day

#### **Tasks**:
```javascript
// 1. Create sitemap.routes.js
const express = require('express');
const router = express.Router();
const Blog = require('../models/blog.model');

router.get('/sitemap.xml', async (req, res) => {
  try {
    const blogs = await Blog.find({ status: 'published' })
      .select('slug updatedAt')
      .sort({ updatedAt: -1 })
      .lean();

    const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url>
    <loc>https://vocalink.io/</loc>
    <changefreq>daily</changefreq>
    <priority>1.0</priority>
  </url>
  ${blogs.map(blog => `
  <url>
    <loc>https://vocalink.io/blog/${blog.slug}</loc>
    <lastmod>${blog.updatedAt.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.8</priority>
  </url>
  `).join('')}
</urlset>`;

    res.header('Content-Type', 'application/xml');
    res.send(sitemap);
  } catch (error) {
    res.status(500).send('Error generating sitemap');
  }
});

router.get('/robots.txt', (req, res) => {
  res.type('text/plain');
  res.send(`User-agent: *
Disallow: /api/
Disallow: /admin/
Disallow: /dashboard/
Allow: /blog/
Allow: /

Sitemap: https://vocalink.io/sitemap.xml`);
});

module.exports = router;

// 2. Add to app.js
const sitemapRoutes = require('./routes/sitemap.routes');
app.use('/', sitemapRoutes);
```

**Acceptance Criteria**:
- [ ] `/sitemap.xml` accessible and valid (check with https://www.xml-sitemaps.com/validate-xml-sitemap.html)
- [ ] `/robots.txt` accessible
- [ ] Submitted to Google Search Console
- [ ] Submitted to Bing Webmaster Tools

---

### **Epic 1.4: Performance Optimization** 🟡 HIGH
**Owner**: Frontend Developer  
**Effort**: 2 days

#### **Tasks**:
- [ ] Add React.lazy for code splitting
- [ ] Optimize images (already using Cloudinary ✅)
- [ ] Add loading states
- [ ] Reduce bundle size (analyze with `npm run build:analyze`)
- [ ] Add prefetching for popular routes

```javascript
// Lazy load pages
const BlogPage = lazy(() => import('./pages/BlogPage'));
const ArticlePage = lazy(() => import('./pages/ArticlePage'));

// Add Suspense wrapper
<Suspense fallback={<PageLoader />}>
  <Routes>
    <Route path="/blog" element={<BlogPage />} />
    <Route path="/blog/:slug" element={<ArticlePage />} />
  </Routes>
</Suspense>
```

**Acceptance Criteria**:
- [ ] Lighthouse SEO score > 90
- [ ] Lighthouse Performance score > 80
- [ ] Page load time < 2 seconds
- [ ] Bundle size < 500KB (gzipped)

---

### **Sprint 1 Deliverables**:
✅ All blog URLs use SEO-friendly slugs  
✅ Complete meta tags on all pages  
✅ Sitemap and robots.txt live  
✅ Performance optimized  
✅ Google Search Console connected  

**Demo**: Show improved search appearance, faster load times

---

## Sprint 2: Server-Side Drafts & TTS (Weeks 3-4)

### **Theme**: Professional writing experience

### **Epic 2.1: Server-Side Draft Management** 🔴 CRITICAL
**Owner**: Backend Developer  
**Effort**: 4 days

#### **Backend Tasks**:
```javascript
// 1. Update blog.model.js
const blogSchema = new mongoose.Schema({
  // ... existing fields
  versions: [{
    content: String,
    title: String,
    savedAt: { type: Date, default: Date.now },
    savedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  }],
  lastAutosaveAt: Date,
});

// 2. Add autosave endpoint in blog.routes.js
router.post('/drafts/:id/autosave', authenticate, blogController.autosaveDraft);

// 3. Implement in blog.controller.js
exports.autosaveDraft = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.user._id;

    const blog = await Blog.findById(id);
    
    if (!blog || blog.author.toString() !== userId.toString()) {
      return res.status(403).json({ error: 'Unauthorized' });
    }

    // Keep last 10 versions
    if (blog.versions.length >= 10) {
      blog.versions.shift();
    }

    blog.versions.push({
      content: blog.content,
      title: blog.title,
      savedBy: userId,
    });

    blog.title = title;
    blog.content = content;
    blog.lastAutosaveAt = new Date();

    await blog.save();

    res.json({ 
      success: true, 
      lastSaved: blog.lastAutosaveAt,
      versionCount: blog.versions.length 
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// 4. Add version history endpoints
router.get('/drafts/:id/versions', authenticate, blogController.getVersions);
router.post('/drafts/:id/restore/:versionIndex', authenticate, blogController.restoreVersion);
```

#### **Frontend Tasks**:
```javascript
// 1. Create useAutosave hook
export const useAutosave = (blogId, content, title) => {
  const [lastSaved, setLastSaved] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const timer = setTimeout(async () => {
      if (content && title) {
        setIsSaving(true);
        try {
          const result = await blogService.autosaveDraft(blogId, { content, title });
          setLastSaved(result.lastSaved);
        } catch (error) {
          console.error('Autosave failed:', error);
        } finally {
          setIsSaving(false);
        }
      }
    }, 30000); // 30 seconds

    return () => clearTimeout(timer);
  }, [content, title, blogId]);

  return { lastSaved, isSaving };
};

// 2. Use in CreateBlogPage.jsx and EditBlogPage.jsx
const { lastSaved, isSaving } = useAutosave(blogId, content, title);

// 3. Display save status
<div className="save-status">
  {isSaving ? (
    <span>Saving...</span>
  ) : lastSaved ? (
    <span>Saved {formatDistanceToNow(new Date(lastSaved))} ago</span>
  ) : null}
</div>
```

**Acceptance Criteria**:
- [ ] Drafts autosave every 30 seconds
- [ ] Last 10 versions stored
- [ ] Version history accessible
- [ ] Restore from any version
- [ ] Visual indicator when saving
- [ ] Works offline (queues saves)

---

### **Epic 2.2: Real-Time TTS Highlighting** 🟡 HIGH
**Owner**: Full-Stack Developer  
**Effort**: 5 days

#### **Backend Tasks**:
```javascript
// 1. Update TTSService.js to return segments
exports.generateTTSWithSegments = async (text, options) => {
  // Split text into paragraphs
  const paragraphs = text.split('\n\n').filter(p => p.trim());
  
  const segments = [];
  let currentTime = 0;

  for (let i = 0; i < paragraphs.length; i++) {
    const paragraph = paragraphs[i];
    const wordCount = paragraph.split(' ').length;
    const estimatedDuration = (wordCount / 150) * 60; // 150 WPM average
    
    segments.push({
      text: paragraph,
      start: currentTime,
      end: currentTime + estimatedDuration,
      domId: `segment-${i}`,
    });
    
    currentTime += estimatedDuration;
  }

  // Generate audio (existing logic)
  const audioUrl = await this.synthesizeSpeech(text, options);

  return {
    audioUrl,
    segments,
    duration: currentTime,
  };
};

// 2. Update blog TTS endpoint
exports.generateBlogTTS = async (req, res) => {
  const { id } = req.params;
  const blog = await Blog.findById(id);
  
  const result = await TTSService.generateTTSWithSegments(
    blog.content,
    blog.ttsOptions
  );

  blog.ttsUrl = result.audioUrl;
  blog.ttsSegments = result.segments;
  blog.audioDuration = result.duration;
  await blog.save();

  res.json(result);
};
```

#### **Frontend Tasks**:
```jsx
// 1. Update ArticleView.jsx to add segment IDs
const renderContentWithSegments = (content, segments) => {
  const paragraphs = content.split('\n\n').filter(p => p.trim());
  
  return paragraphs.map((para, index) => {
    const segment = segments.find(s => s.domId === `segment-${index}`);
    return (
      <p 
        key={index}
        id={segment?.domId}
        className="article-paragraph"
      >
        {para}
      </p>
    );
  });
};

// 2. Update AudioPlayer.jsx to sync highlighting
export const AudioPlayer = ({ audioUrl, segments }) => {
  const audioRef = useRef();
  const [currentSegment, setCurrentSegment] = useState(null);

  useEffect(() => {
    const interval = setInterval(() => {
      if (!audioRef.current) return;
      
      const time = audioRef.current.currentTime;
      const active = segments.find(s => time >= s.start && time < s.end);
      
      if (active && active.domId !== currentSegment) {
        setCurrentSegment(active.domId);
        
        // Highlight and scroll
        document.querySelectorAll('.article-paragraph').forEach(p => {
          p.classList.remove('highlighted');
        });
        
        const element = document.getElementById(active.domId);
        if (element) {
          element.classList.add('highlighted');
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    }, 100);

    return () => clearInterval(interval);
  }, [segments, currentSegment]);

  return (
    <div className="audio-player">
      <audio ref={audioRef} src={audioUrl} controls />
      {/* Speed control, progress bar, etc. */}
    </div>
  );
};

// 3. Add CSS for highlighting
.article-paragraph.highlighted {
  background-color: #fef3c7;
  border-left: 4px solid #f59e0b;
  padding-left: 12px;
  transition: all 0.3s ease;
}
```

**Acceptance Criteria**:
- [ ] Text highlights in sync with audio
- [ ] Auto-scroll to active paragraph
- [ ] Speed controls work (0.5x to 2x)
- [ ] Clicking paragraph seeks audio to that point
- [ ] Works on mobile
- [ ] Smooth transitions

---

### **Epic 2.3: PWA Implementation** 🟡 HIGH
**Owner**: Frontend Developer  
**Effort**: 2 days

#### **Tasks**:
```javascript
// 1. Install vite-plugin-pwa
npm install -D vite-plugin-pwa

// 2. Update vite.config.js
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'logo.svg', 'logo-192.png', 'logo-512.png'],
      manifest: {
        name: 'VocalInk - The Human Blog Network',
        short_name: 'VocalInk',
        description: 'AI-powered blogging platform with gamification and TTS',
        theme_color: '#4F46E5',
        background_color: '#ffffff',
        display: 'standalone',
        icons: [
          {
            src: '/logo-192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: '/logo-512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/api\.vocalink\.io\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24, // 24 hours
              },
            },
          },
          {
            urlPattern: /\.(png|jpg|jpeg|svg|gif|webp)$/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'image-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
            },
          },
        ],
      },
    }),
  ],
});

// 3. Add install prompt
const [installPrompt, setInstallPrompt] = useState(null);

useEffect(() => {
  const handleBeforeInstallPrompt = (e) => {
    e.preventDefault();
    setInstallPrompt(e);
  };

  window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
  return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
}, []);

const handleInstallClick = () => {
  if (installPrompt) {
    installPrompt.prompt();
  }
};
```

**Acceptance Criteria**:
- [ ] App installable on desktop and mobile
- [ ] Offline reading works (cached articles)
- [ ] Install prompt appears
- [ ] App icons display correctly
- [ ] Splash screen shows on launch
- [ ] Lighthouse PWA score > 90

---

### **Sprint 2 Deliverables**:
✅ Drafts autosave to server  
✅ Version history works  
✅ TTS real-time highlighting complete  
✅ PWA installable  
✅ Offline reading functional  

**Demo**: Show autosave in action, TTS highlighting, PWA install

---

## Sprint 3: Monetization MVP (Weeks 5-6)

### **Theme**: Creators can earn money

### **Epic 3.1: Stripe Integration** 🔴 CRITICAL
**Owner**: Backend Developer  
**Effort**: 5 days

#### **Setup**:
```bash
npm install stripe
```

#### **Backend Tasks**:
```javascript
// 1. Create stripe.service.js
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

exports.createCustomer = async (email, name) => {
  return await stripe.customers.create({ email, name });
};

exports.createSubscription = async (customerId, priceId) => {
  return await stripe.subscriptions.create({
    customer: customerId,
    items: [{ price: priceId }],
    payment_behavior: 'default_incomplete',
    expand: ['latest_invoice.payment_intent'],
  });
};

exports.createCheckoutSession = async (customerId, priceId, successUrl, cancelUrl) => {
  return await stripe.checkout.sessions.create({
    customer: customerId,
    mode: 'subscription',
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
  });
};

exports.createConnectedAccount = async (email) => {
  // For creators to receive payouts
  return await stripe.accounts.create({
    type: 'express',
    email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  });
};

// 2. Add subscription fields to user.model.js
subscription: {
  status: {
    type: String,
    enum: ['none', 'active', 'canceled', 'past_due'],
    default: 'none',
  },
  stripeCustomerId: String,
  stripePriceId: String,
  currentPeriodEnd: Date,
},
creatorAccount: {
  stripeAccountId: String,
  onboardingComplete: Boolean,
  payoutsEnabled: Boolean,
},

// 3. Create subscription routes
router.post('/subscribe', authenticate, subscriptionController.subscribe);
router.post('/cancel-subscription', authenticate, subscriptionController.cancel);
router.get('/subscription-status', authenticate, subscriptionController.getStatus);

// 4. Implement webhook handler
router.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  switch (event.type) {
    case 'customer.subscription.created':
    case 'customer.subscription.updated':
      // Update user subscription status
      break;
    case 'customer.subscription.deleted':
      // Cancel user subscription
      break;
    case 'invoice.payment_succeeded':
      // Record successful payment
      break;
    case 'invoice.payment_failed':
      // Handle failed payment
      break;
  }

  res.json({ received: true });
});
```

**Acceptance Criteria**:
- [ ] Stripe test mode working
- [ ] Subscription checkout flow complete
- [ ] Webhook handling subscriptions
- [ ] User subscription status updates
- [ ] Creator onboarding flow (Stripe Connect)

---

### **Epic 3.2: Member-Only Content** 🔴 CRITICAL
**Owner**: Full-Stack Developer  
**Effort**: 3 days

#### **Backend Tasks**:
```javascript
// 1. Add "memberOnly" field to blog.model.js
memberOnly: { type: Boolean, default: false },

// 2. Update getBlog endpoint to check access
exports.getBlog = async (req, res) => {
  const { id } = req.params;
  const userId = req.user?._id;
  
  const blog = await Blog.findById(id);
  
  if (blog.memberOnly) {
    // Check if user has active subscription
    const user = await User.findById(userId);
    
    if (!user || user.subscription.status !== 'active') {
      // Return preview only (first 200 words)
      const preview = blog.content.split(' ').slice(0, 200).join(' ') + '...';
      
      return res.json({
        ...blog.toObject(),
        content: preview,
        isPreview: true,
        requiresSubscription: true,
      });
    }
  }
  
  // Full access
  res.json({ ...blog.toObject(), isPreview: false });
};
```

#### **Frontend Tasks**:
```jsx
// 1. Add "Member-only" toggle in CreateBlogPage
<label>
  <input
    type="checkbox"
    checked={memberOnly}
    onChange={(e) => setMemberOnly(e.target.checked)}
  />
  Make this article member-only
</label>

// 2. Show paywall in ArticleView if preview
{article.isPreview && (
  <div className="paywall">
    <h3>This is a member-only article</h3>
    <p>Subscribe to read the full content</p>
    <Link to="/subscribe">
      <button>Subscribe for $10/month</button>
    </Link>
  </div>
)}

// 3. Add badge to member-only articles
{blog.memberOnly && (
  <span className="member-badge">Members Only</span>
)}
```

**Acceptance Criteria**:
- [ ] Writers can toggle member-only on posts
- [ ] Non-subscribers see preview + paywall
- [ ] Subscribers see full content
- [ ] Badge shows on member-only articles
- [ ] Member-only filter works in search

---

### **Epic 3.3: Creator Revenue Dashboard** 🔴 CRITICAL
**Owner**: Frontend Developer  
**Effort**: 4 days

#### **Tasks**:
```jsx
// 1. Create RevenueService.js
export const revenueService = {
  getEarnings: async (timeframe = 'month') => {
    return await apiService.get(`/api/revenue/earnings?timeframe=${timeframe}`);
  },
  
  getPayouts: async () => {
    return await apiService.get('/api/revenue/payouts');
  },
  
  requestPayout: async () => {
    return await apiService.post('/api/revenue/request-payout');
  },
};

// 2. Create RevenueDashboard.jsx
export const RevenueDashboard = () => {
  const { data: earnings } = useQuery('earnings', revenueService.getEarnings);
  const { data: payouts } = useQuery('payouts', revenueService.getPayouts);

  return (
    <div className="revenue-dashboard">
      <h1>Revenue Dashboard</h1>
      
      {/* Earnings Summary */}
      <div className="earnings-summary">
        <StatCard title="This Month" value={`$${earnings.thisMonth}`} />
        <StatCard title="Total Earned" value={`$${earnings.total}`} />
        <StatCard title="Pending Payout" value={`$${earnings.pending}`} />
      </div>

      {/* Chart */}
      <LineChart data={earnings.history} />

      {/* Breakdown */}
      <table className="earnings-table">
        <thead>
          <tr>
            <th>Article</th>
            <th>Reads</th>
            <th>Earned</th>
          </tr>
        </thead>
        <tbody>
          {earnings.byArticle.map(item => (
            <tr key={item.id}>
              <td>{item.title}</td>
              <td>{item.reads}</td>
              <td>${item.earned}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* Payout History */}
      <div className="payout-history">
        <h2>Payout History</h2>
        {payouts.map(payout => (
          <div key={payout.id}>
            <span>{payout.date}</span>
            <span>${payout.amount}</span>
            <span>{payout.status}</span>
          </div>
        ))}
      </div>

      {/* Request Payout */}
      <button onClick={() => requestPayout()}>
        Request Payout
      </button>
    </div>
  );
};
```

**Acceptance Criteria**:
- [ ] Revenue dashboard accessible
- [ ] Shows earnings breakdown
- [ ] Chart displays historical data
- [ ] Payout history visible
- [ ] Request payout button works
- [ ] Stripe Connect onboarding linked

---

### **Sprint 3 Deliverables**:
✅ Stripe integration complete  
✅ Subscription checkout works  
✅ Member-only content functional  
✅ Creator revenue dashboard live  
✅ Test payments successful  

**Demo**: Subscribe as user, publish member-only content, show revenue dashboard

---

## Sprint 4: Final Polish & Launch Prep (Weeks 7-8)

### **Theme**: Production ready

### **Epic 4.1: Import/Export Tools** 🟡 HIGH
**Owner**: Backend Developer  
**Effort**: 3 days

#### **Import Tasks**:
```javascript
// Support importing from:
// 1. Medium export (HTML)
// 2. WordPress XML
// 3. Markdown files

router.post('/import/medium', authenticate, upload.single('file'), importController.fromMedium);
router.post('/import/wordpress', authenticate, upload.single('file'), importController.fromWordPress);
router.post('/import/markdown', authenticate, upload.single('file'), importController.fromMarkdown);

exports.fromMedium = async (req, res) => {
  const html = await fs.readFile(req.file.path, 'utf-8');
  
  // Parse Medium HTML
  const $ = cheerio.load(html);
  const title = $('h1').first().text();
  const content = $('.section-content').html();
  
  // Create blog
  const blog = await Blog.create({
    title,
    content,
    author: req.user._id,
    status: 'draft',
    importedFrom: 'medium',
  });
  
  res.json({ blogId: blog._id });
};
```

#### **Export Tasks**:
```javascript
// Support exporting to:
// 1. Markdown
// 2. PDF
// 3. WordPress XML

router.get('/export/:id/markdown', authenticate, exportController.toMarkdown);
router.get('/export/:id/pdf', authenticate, exportController.toPDF);
router.get('/export/:id/wordpress', authenticate, exportController.toWordPress);
```

**Acceptance Criteria**:
- [ ] Import Medium archives
- [ ] Import WordPress XML
- [ ] Import Markdown files
- [ ] Export to Markdown
- [ ] Export to PDF (styled)
- [ ] Batch import supported

---

### **Epic 4.2: Security Audit** 🔴 CRITICAL
**Owner**: Backend Developer  
**Effort**: 2 days

#### **Checklist**:
- [ ] OWASP Top 10 review
- [ ] SQL injection protection (use parameterized queries ✅)
- [ ] XSS protection (sanitize HTML ✅)
- [ ] CSRF tokens
- [ ] Rate limiting verified
- [ ] Authentication flows tested
- [ ] File upload validation
- [ ] Environment variables secured
- [ ] HTTPS enforced
- [ ] Database access audited
- [ ] Logging sanitized (no PII)

---

### **Epic 4.3: Performance & Load Testing** 🔴 CRITICAL
**Owner**: Full-Stack Developer  
**Effort**: 2 days

#### **Tasks**:
```bash
# 1. Install k6 for load testing
brew install k6  # or download from k6.io

# 2. Create load test script
// load-test.js
import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 100 }, // Ramp up to 100 users
    { duration: '5m', target: 100 }, // Stay at 100
    { duration: '2m', target: 0 },   // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests under 500ms
    http_req_failed: ['rate<0.01'],   // Error rate under 1%
  },
};

export default function () {
  // Test blog list
  let res = http.get('https://api.vocalink.io/api/blogs');
  check(res, {
    'status is 200': (r) => r.status === 200,
    'response time < 500ms': (r) => r.timings.duration < 500,
  });
  
  sleep(1);
}

# 3. Run load test
k6 run load-test.js
```

**Acceptance Criteria**:
- [ ] Handles 100 concurrent users
- [ ] 95th percentile response time < 500ms
- [ ] Error rate < 1%
- [ ] No memory leaks
- [ ] Database connection pool optimized

---

### **Epic 4.4: Beta Launch** 🎉
**Owner**: Team  
**Effort**: 5 days

#### **Tasks**:
- [ ] Create beta landing page
- [ ] Invite 100 beta users
- [ ] Set up feedback form
- [ ] Create onboarding email sequence
- [ ] Monitor analytics (Mixpanel/GA4)
- [ ] Daily bug triage
- [ ] Performance monitoring (New Relic)
- [ ] User interviews (5-10 users)

#### **Beta Metrics**:
- [ ] 80% user activation (publish 1 article)
- [ ] 50% publish 2+ articles
- [ ] 10% enable TTS
- [ ] 20% invite friends
- [ ] 5% subscribe to Pro

---

### **Sprint 4 Deliverables**:
✅ Import/export tools working  
✅ Security audit passed  
✅ Load testing complete  
✅ Beta launched with 100 users  
✅ Monitoring dashboards live  

**Demo**: Public beta, real users creating content

---

## Post-Launch: Sprint 5+ (Months 3-6)

### **Priorities**:
1. Newsletter platform
2. Custom domains
3. Publications/teams
4. Collaborative writing
5. Multi-language support
6. Mobile apps

---

## Resource Requirements

### **Team**:
- **2-3 developers** (1 backend, 1 frontend, 1 full-stack)
- **Optional**: 1 designer for UI polish

### **Budget** (Monthly):
- **Hosting**: $200 (Railway/Render backend, Vercel frontend)
- **Database**: $50 (MongoDB Atlas)
- **Stripe**: 2.9% + $0.30 per transaction
- **OpenAI**: ~$100 (API credits)
- **ElevenLabs TTS**: ~$50 (for premium voices)
- **Cloudinary**: $50 (image hosting)
- **Monitoring**: $50 (Sentry, New Relic)
- **Total**: ~$500/month

### **Tools**:
- GitHub (code hosting)
- Linear or GitHub Projects (project management)
- Figma (design)
- Postman (API testing)
- k6 (load testing)

---

## Success Metrics

### **Technical**:
- ✅ Zero critical bugs
- ✅ 99.9% uptime
- ✅ < 2s page load
- ✅ Lighthouse score > 90
- ✅ Test coverage > 70%

### **Product**:
- ✅ 1,000 creators signed up
- ✅ 10,000 articles published
- ✅ 100 paying subscribers
- ✅ 60% TTS adoption
- ✅ 30% monthly growth

### **Business**:
- ✅ $1,000 MRR (month 3)
- ✅ $5,000 MRR (month 6)
- ✅ Break-even by month 9

---

## Risk Mitigation

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Stripe integration delays | High | Medium | Start early, use test mode |
| TTS costs too high | Medium | Low | Cache aggressively, limit free tier |
| SEO takes time | High | High | Invest in content marketing |
| Competitors copy features | Medium | Medium | Focus on execution, community |
| Scale issues | High | Low | Load test early, optimize |
| Low user adoption | High | Medium | Beta program, iterate on feedback |

---

## Key Decisions Needed

Before starting Sprint 1:
1. **Pricing**: Confirm subscription tiers ($10 reader, $9 creator Pro?)
2. **Revenue split**: 90/10 or 85/15?
3. **TTS voice**: Which default (Google/ElevenLabs)?
4. **Domain**: Is vocalink.io secured?
5. **Payment flow**: Stripe Checkout vs. Elements?
6. **Beta size**: 100 or 500 users?

---

## Communication Plan

### **Daily**:
- Stand-up (15 min)
- Slack updates

### **Weekly**:
- Sprint planning (Monday)
- Demo (Friday)
- Retrospective (Friday)

### **Monthly**:
- Product roadmap review
- Metrics review
- User interviews

---

## Next Steps

1. **Review this roadmap** with your team
2. **Assign ownership** of each epic
3. **Set sprint dates** (calendar invites)
4. **Create tickets** in GitHub Projects/Linear
5. **Start Sprint 1** 🚀

**Questions? Need clarification on any task?** Let me know!

---

**Good luck! You're building something truly special.** 🎉

