![License](https://img.shields.io/badge/License-MIT-blue.svg)
![Status](https://img.shields.io/badge/status-in_development-orange)
![Contributions welcome](https://img.shields.io/badge/contributions-welcome-brightgreen.svg)

# VocalInk

VocalInk is an open-source voice-to-text and transcription platform...



<img width="1536" height="1024" alt="ChatGPT Image Jul 26, 2025, 03_55_28 PM" src="https://github.com/user-attachments/assets/e6e8dade-88aa-4162-ac5d-9cecce1130bb" />
![Screenshot 2025-08-27 195004](https://github.com/user-attachments/assets/b0b11b6e-ce7b-432b-a42a-55f155b36816)



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

## Quick Start

### Option 1: Automated Setup (Recommended)
```bash
# Run the automated setup script
./setup.sh          # Linux/macOS
# OR
setup.bat           # Windows

# Start development environment
make dev
# OR
./start-dev.sh      # Linux/macOS
# OR
start-dev.bat       # Windows
```

### Option 2: Manual Setup
```bash
# Install dependencies
make install

# Setup environment
make setup-env

# Start development environment
make dev

# Or run services individually:
# Backend
cd server
npm install
npm run dev

# Frontend
cd ../client
npm install
npm run dev
```

### Docker Commands
```bash
# Build and run with Docker
make docker-build
make docker-run

# View logs
make logs

# Stop containers
make docker-stop

# Check status
make status
```

### GitHub CLI Commands
```bash
# Setup GitHub CLI
make github-setup

# Create pull request
make github-pr TITLE="Feature" BODY="Description"

# Create release
make github-release VERSION="v1.0.0" TITLE="Release" NOTES="Notes"

# Create issue
make github-issue TITLE="Bug" BODY="Description" LABEL="bug"
```

For detailed setup instructions, see [DOCKER_GITHUB_SETUP.md](DOCKER_GITHUB_SETUP.md).

## API Reference
See [Swagger UI](http://localhost:5000/api-docs) after running the backend.

## Contributing
This project is in early development. PRs, ideas, and feedback are welcome!

---

_© 2025 VocalInk. All rights reserved._
