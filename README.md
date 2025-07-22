![Screenshot 2025-07-16 021839](https://github.com/user-attachments/assets/46711911-1ca5-4e0c-93b8-7e2e8549151a)
![Screenshot 2025-07-16 021910](https://github.com/user-attachments/assets/dcb68e61-7a6e-4f6f-accb-8d737f2f1a91)
![Screenshot 2025-07-16 021928](https://github.com/user-attachments/assets/e7fe4705-d749-4225-a43c-6baf0a658a0c)
![Screenshot 2025-07-16 021943](https://github.com/user-attachments/assets/ce13c9a7-5a3a-41b4-b4c0-59cd24363d8e)

# VocalInk – The Next-Gen Blogging Platform

**Status:** 🚧 _In active development_

## Project Vision
VocalInk is a modern, AI-powered, gamified blog platform for readers and writers. Unlike traditional blogs, VocalInk rewards both engagement and content creation, offers mood-based discovery, and provides advanced features for accessibility, analytics, and community moderation.

> **Brand Promise:**
> _“The human blog network — where curiosity earns you more than knowledge.”_

## Unique Features
- **AI-Powered Summaries & Personalized Feeds:**
  - Auto-generated TL;DR for every blog
  - Personalized recommendations ("Netflix for blogs")
  - Mood-based blog filters (e.g., Motivational, Thoughtful)
- **Engage-to-Earn Model:**
  - Readers and writers earn badges, XP, and rewards for meaningful engagement
  - Reputation system (like StackOverflow/Reddit Karma)
- **Collaborative Blogging:**
  - Co-authored posts, community series, open writing requests
- **Voice & AI Avatars:**
  - Text-to-speech (TTS) for blogs, AI avatars for storytelling
- **Multilingual Auto-Publishing:**
  - Real-time blog translation ("Your voice, in every language")
- **Creator Analytics Dashboard:**
  - Deep insights: reader time, scroll depth, engagement heatmap
- **Verified Human Comments:**
  - AI + CAPTCHA + social graph scoring for safe, respectful comments
- **Series & Timelines:**
  - Blog series as timelines (e.g., Startup Journey: Day 1 → Day 100)
- **Inline Reactions:**
  - React/comment on specific sentences (micro-engagement)
- **Export to Resume/Portfolio:**
  - One-click export of best blogs as a PDF portfolio

## Tech Stack
- **Frontend:** React.js, TailwindCSS, Vite
- **Backend:** Node.js, Express.js, MongoDB (Mongoose)
- **Auth:** JWT, social login (planned: Firebase/Auth0)
- **AI Tools:** OpenAI (summarization, moderation), TTS (planned: ElevenLabs), DeepL (translation)
- **APIs:** REST (OpenAPI/Swagger docs)
- **Optional Web3:** Ethereum/Solana for rewards (future)

## Backend Structure
- **Entry:** `server.js` → `src/app.js` (Express app, MongoDB connection, middleware)
- **API Modules:**
  - `/api/auth` – Registration, login, email verification, password reset, sessions
  - `/api/users` – Profiles, follow, badges, notifications, leaderboard
  - `/api/blogs` – CRUD, TTS, translation, like, bookmark, comments
  - `/api/comments` – Inline comments, replies, reporting
  - `/api/series` – Blog series management
  - `/api/badges` – Badge listing and claiming
  - `/api/notifications` – User notifications
  - `/api/abusereports` – Abuse reporting
- **Middleware:**
  - Auth, role/permission checks, rate limiting, error handling, audit logging
- **Models:**
  - **User:** Profile, role, XP, badges, followers, verification, social links
  - **Blog:** Title, content, summary, author, tags, series, mood, language, TTS, likes/bookmarks
  - **Comment:** Blog ref, user ref, content, parent, inline ref, status
  - **Series, Badge, Notification, AbuseReport, Token**
- **API Docs:** [Swagger UI](http://localhost:5000/api-docs) (auto-generated)

## Frontend Structure
- **React + Vite + TailwindCSS**
- **Planned Pages:**
  - Home, Blog Feed, Blog Reader (AI summary, TTS, inline comments), Write/Edit Blog, Author Profile, Series Timeline, Auth (login/signup), Dashboard, Rewards Center, Settings

## Development Roadmap
- **Phase 1:** Auth, Blog CRUD, Feed, Reader, Profile, Comments
- **Phase 2:** Reactions, Series, Dashboard, Bookmarks, Analytics
- **Phase 3:** Gamification, Rewards, Admin Panel, Advanced AI
- **Phase 4:** Mobile App, Monetization, Web3, AI Avatars

## How to Run (Dev)
```bash
# Backend
cd server
npm install
npm run dev

# Frontend
cd ../client
npm install
npm run dev
```

## API Reference
See [Swagger UI](http://localhost:5000/api-docs) after running the backend.

## Contributing
This project is in early development. PRs, ideas, and feedback are welcome!

---

_© 2025 VocalInk. All rights reserved._
