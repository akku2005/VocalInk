# Phase 1 Implementation Plan - SEO & Core Fixes

**Start Date**: November 23, 2025  
**Duration**: 2 weeks  
**Priority**: CRITICAL  

---

## Overview

This phase focuses on the **3 most critical gaps** that are blocking launch:

1. ✅ **SEO Foundation** (Days 1-3)
2. ✅ **Server-Side Drafts** (Days 4-6)
3. ✅ **TTS Real-Time Highlighting** (Days 7-10)

**Goal**: Make VocalInk discoverable, prevent content loss, and complete the killer TTS feature.

---

## Day-by-Day Implementation

### **Day 1: Slug-Based Routing**

#### Backend Tasks
- [x] Add `getBlogBySlug` endpoint
- [x] Ensure all blogs have unique slugs
- [x] Add 301 redirects from old ID URLs

#### Frontend Tasks
- [x] Update `AppRoutes.jsx` to use `/blog/:slug`
- [x] Update `ArticlePage.jsx` to fetch by slug
- [x] Update all navigation links (`BlogCard`, `SearchPage`, etc.)

**Files to Modify**:
- `server/src/blog/blog.controller.js`
- `server/src/blog/blog.routes.js`
- `client/src/routes/AppRoutes.jsx`
- `client/src/pages/ArticlePage.jsx`
- `client/src/components/blog/BlogCard.jsx`
- `client/src/pages/SearchPage.jsx`

---

### **Day 2: SEO Metadata Implementation**

#### Tasks
- [x] Update `SEOHead` component with full metadata
- [x] Add Open Graph tags
- [x] Add Twitter Card tags
- [x] Add JSON-LD structured data
- [x] Implement on all pages

**Files to Modify**:
- `client/src/components/seo/SEOHead.jsx`
- `client/src/pages/ArticlePage.jsx`
- `client/src/pages/Home.jsx`
- `client/src/pages/BlogPage.jsx`
- `client/src/pages/ProfilePage.jsx`

---

### **Day 3: Sitemap & Performance**

#### Tasks
- [x] Create sitemap generator
- [x] Add robots.txt
- [x] Implement lazy loading
- [x] Bundle optimization
- [x] Submit to Google Search Console

**Files to Create**:
- `server/src/routes/sitemap.routes.js`

**Files to Modify**:
- `server/src/app.js`
- `client/vite.config.js`

---

### **Days 4-6: Server-Side Draft Management**

#### Backend Tasks
- [x] Add `versions` field to blog model
- [x] Create autosave endpoint
- [x] Create version history endpoints
- [x] Implement restore functionality

#### Frontend Tasks
- [x] Create `useAutosave` hook
- [x] Add save status indicator
- [x] Build version history UI
- [x] Implement restore dialog

**Files to Modify**:
- `server/src/models/blog.model.js`
- `server/src/blog/blog.controller.js`
- `server/src/blog/blog.routes.js`
- `client/src/pages/CreateBlogPage.jsx`
- `client/src/pages/EditBlogPage.jsx`

---

### **Days 7-10: TTS Real-Time Highlighting**

#### Backend Tasks
- [x] Enhance TTS service to generate segments
- [x] Store segment timing metadata
- [x] Update TTS endpoint response

#### Frontend Tasks
- [x] Add segment IDs to article content
- [x] Sync audio playback with highlighting
- [x] Implement auto-scroll
- [x] Add playback controls (speed, skip)

**Files to Modify**:
- `server/src/services/TTSService.js`
- `server/src/models/blog.model.js`
- `client/src/components/blog/ArticleView.jsx`
- `client/src/components/audio/AudioPlayer.jsx`

---

## Success Criteria

### Day 3 Checklist
- [ ] All blog URLs use slugs
- [ ] Open Graph validator passes
- [ ] Sitemap.xml accessible
- [ ] Lighthouse SEO score > 90

### Day 6 Checklist
- [ ] Drafts autosave every 30 seconds
- [ ] Version history accessible
- [ ] No content loss scenarios
- [ ] Works offline (queued saves)

### Day 10 Checklist
- [x] TTS highlights current paragraph
- [x] Auto-scroll works smoothly
- [x] Speed controls functional
- [x] Mobile-compatible

---

## Implementation Order (Start Here)

1. **SEO Fix** (Most Critical)
   - Without this, platform won't be discovered
   - Affects all future growth

2. **Draft Autosave** (Prevent Data Loss)
   - Users will lose content without this
   - Critical for trust

3. **TTS Highlighting** (Killer Feature)
   - Your unique differentiator
   - Needs to be perfect

---

## Next: Start Coding

I'll now implement these features one by one, starting with the SEO fixes.

Ready to begin? Let's code! 🚀

