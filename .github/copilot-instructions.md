# Copilot / AI Agent Instructions — VocalInk

Purpose: give AI coding agents focused, actionable knowledge to be productive in this repository.

Big picture
- **Monorepo layout**: two main apps: `server/` (Express + MongoDB + Redis + queues + TTS, primary API) and `client/` (React + Vite SPA). The repository root contains docker-compose files and helper scripts.
- **Entry points**: `server/server.js` boots the API and WebSocket service; `client/` is served by Vite (`client/src/main.jsx`, `client/src/App.jsx`). API routes live under `server/src/routes/` and business logic in `server/src/controllers/`, `server/src/services/`, `server/src/models/`.

Key developer workflows (commands)
- Start server (development):
  - `cd server` then `npm run start:dev` (runs `cross-env NODE_ENV=development nodemon server.js`).
- Start client (development):
  - `cd client` then `npm run dev` (Vite dev server).
- Run server tests (Jest):
  - `cd server` then `npm run test` or use targeted scripts like `npm run test-basic`, `npm run test-ai-services`, `npm run test-badge-system`.
- Build client for production: `cd client && npm run build`.
- Production server: `cd server && npm run start:prod` or use `docker-compose.yml` / `Makefile` for deployment flows.

Project-specific conventions & patterns
- Environment-first: `server` uses `dotenv` and many features toggle via env (e.g., `ENABLE_IN_PROCESS_JOBS`, `ENABLE_TTS_CLEANUP`, `FORCE_HTTPS`). Prefer reading `server/src/app.js` to see how behavior changes with env vars.
- Security-first middleware ordering: security middleware (rate limiting, sanitization, fingerprinting, logging) is applied early in `server/src/app.js`. When adding routes, maintain order so security wrappers remain effective.
- Sanitization: there is a custom Mongo sanitization implementation in `server/src/app.js`/`server/src/utils/sanitize.js` — prefer using that utility for any request-derived DB queries.
- Static assets & TTS: generated audio is served from `server/public/tts` and `server/public/audio`. TTS-related logic is in `server/src/services/TTSService`.
- Tests use `mongodb-memory-server` and heavyweight integration tests live in `server/test/`. Many test helper scripts exist (see `server/test/setup-tests.js`). Use the targeted npm scripts to run smaller subsets without running the entire suite.

Integration points & external dependencies
- Persistent DB: MongoDB (configured in `server/src/config/connectDB`). Tests use an in-memory mongodb for CI/local unit tests.
- Cache/queues: Redis + Bull / BullMQ (`ioredis`, `bull`, `bullmq`). Look at `server/src/services/CacheService` and `server/scripts/*` for worker examples.
- File storage / CDN: AWS S3 client is included (`@aws-sdk/client-s3`) and Cloudinary is present; search `server/src/services` for upload adapters.
- TTS / AI: ElevenLabs, Google TTS, and OpenAI clients are used — expect API keys (`ELEVENLABS_API_KEY`, `GOOGLE_APPLICATION_CREDENTIALS`, `OPENAI_API_KEY`) in env.
- Websockets: server uses a WebSocket service (`server/src/services/WebSocketService`) and the client uses `socket.io-client` for real-time features.

Where to make changes
- Small API changes: modify `server/src/routes/*` and corresponding `server/src/controllers/*`. Keep controllers thin; move business logic into `server/src/services/*`.
- Data model changes: modify `server/src/models/*` and add migration/seed scripts under `server/src/utils` or `server/scripts/`.
- Frontend UI: modify `client/src/pages/`, `client/src/components/` and update routes in `client/src/routes/`.

Debugging & tests notes
- Local health checks: `GET /health` (server default port 5000) performs DB/Redis checks; use this to validate environment.
- Test isolation: many tests rely on `mongodb-memory-server`. If a test suite is flaky, check `server/test/setup-tests.js` and `server/test/setup.js` for timeouts or teardown omissions.
- Running a specific test file: `cd server && npm run test -- <path/to/testfile>` or use the provided npm scripts (e.g., `npm run test-ai-services`).

Quick examples (commands)
- Start full dev stack (client + server):
  - `# in two terminals`
  - `cd server; npm run start:dev`
  - `cd client; npm run dev`
- Run only the badge tests: `cd server && npm run test-badge-system`

Notes & gotchas
- Node version: project targets Node >= 18 (`server/package.json` `engines`). Use Node 18+.
- Pre-commit / CI: Husky and commitlint are configured — respect commit message conventions when contributing.
- Avoid changing middleware ordering in `server/src/app.js` — it affects security, logging, and rate limiting globally.
- When altering TTS audio paths or caching behavior, update both `server/src/app.js` static-serving options and any client references to `/tts` or `/audio`.

Files to read first (developer on-ramp)
- `server/server.js` (bootstrapping, websocket init)
- `server/src/app.js` (middleware, routes, static serving)
- `server/src/routes/` and `server/src/controllers/` (API surface)
- `server/src/services/` (business logic adapters: TTS, cache, DB)
- `client/src/main.jsx` and `client/src/App.jsx` (client entry & routing)

If anything here is unclear or you want me to expand examples (env list, tests to run, or a contributor checklist), tell me what to add and I will iterate.
