## Goals
- Fix TTS 500 errors and add multi‑language conversational audio with a persistent, app‑wide player.
- Audit and strengthen notifications: realtime delivery, preference filtering, grouping, read/unread.
- Upgrade /create-blog UX and safety: validation, rich editor, autosave, versioning, performance.
- Extend /analytics with engagement tracking, reporting, and visualizations.
- Ship QA: tests, logging/monitoring, docs, performance and security hardening.

## Audio Generation (TTS)
### Current Issues
- AudioPlayer calls backend successfully but server errors show espeak not available on Windows; fails command invocation.
- Voice/language/pacing limited; no global playback persistence.

### Backend Changes
1. Add ElevenLabs integration in `server/src/services/TTSService.js` (or `TTSEnhancedService.js` if preferred):
- Use `@elevenlabs/elevenlabs-js` (already in deps).
- Load `ELEVENLABS_API_KEY` from `.env` only; do not hardcode.
- Implement `generateAudio({ text, language, voice, speed, style })` with:
  - Language validation: whitelist supported language codes.
  - Voice mapping per language.
  - Conversational style params (stability, similarity, style exaggeration) to mimic Notebook LM pacing/pauses.
- Fallback chain: ElevenLabs → Google TTS (if credentials provided) → local espeak (only when configured) → descriptive error if unsupported.

2. Routes/Controllers (`server/src/routes/tts.routes.js`, `server/src/controllers/TTSController.js`):
- Accept `language`, `voice`, `speed`, `pitch`, `style` in request body.
- Validate against supported languages; return 400 for unsupported.
- Persist generated audio under `/public/audio` with metadata (id, language, voice, createdAt) and return URL.
- Optional: queue/async job when text is long; expose `/tts/queue/:id` for status (already scaffolded).

3. Data Model (optional):
- Add simple `ttsJobs` in memory or a lightweight collection to track job metadata and enable retry/replay.

### Frontend Changes
1. AudioPlayer UI (`client/src/components/audio/AudioPlayer.jsx`):
- Add language dropdown; populate from supported list.
- Pass `language` plus current `voiceSettings` to API; show errors from validation clearly.
- Improve error messages when backend returns 4xx for unsupported language.

2. Global Player
- Create `client/src/components/audio/GlobalAudioPlayer.jsx` + `AudioContext`:
  - Maintains current track queue and playback state across routes.
  - When a blog generates audio, push to queue; user can resume from anywhere.
  - Keyboard shortcuts; accessible labels; mini sticky bar.
- Mount in `Layout.jsx` so it is always available.

### Tests
- Server unit tests for language validation and ElevenLabs integration (mock HTTP).
- Client tests: AudioPlayer renders language options, calls TTS with selected language, handles errors.

## Notifications Audit & Enhancements
### Audit
- Review `server/src/notification/notification.routes.js` and controller for types: Likes, Comments, Follows, Badges, Level Ups, System.
- Verify EmailService triggers respect `notificationSettings` on user.
- Check WebSocketService for realtime; ensure auth guard.

### Backend Changes
- Add `/notifications/unread-count` endpoint.
- Grouping: add query `groupBy=type,date` returning grouped payload.
- Preference filtering server-side: honor `user.notificationSettings.*` when creating and fetching.
- Realtime: emit socket events per user id on create/update.
- Email: integrate `EmailService` with per-type templates; gate by preferences.

### Frontend Changes
- Extend `client/src/services/notificationService.js` to support new endpoints and grouping param.
- UI: grouping toggles, realtime updates via `socket.io-client`, badge counts from unread endpoint.

### Tests
- Server tests: creation of each type, preference gating, unread-count, grouping.
- Client tests: mark read/unread, grouping render, realtime update mock.

## /create-blog Improvements
- Validation: strengthen `server/src/middleware/blogValidation.js`; sanitize inputs.
- Editor: use existing `AdvancedRichTextEditor.jsx`; enable image upload via Cloudinary endpoints.
- Autosave: client side debounce to localStorage and background `PATCH /blogs/:id` for drafts.
- Version control: add `versions` array in `blog.model.js` (title, content, timestamp, author), populate on save.
- Performance: chunk large content saves, lazy image uploads, request size limits.

## /analytics Enhancement
- Tracking: add event emitters for reads, likes, comments, TTS plays; push to `SeriesProgress`/`Blog` analytics fields.
- Reporting: `/analytics` route returns engagement metrics (views, read time, CTR, TTS plays) with timeframe filters.
- Visualization: client charts (Recharts) on `/analytics` page; realtime updates via websockets for counters.

## Security & Performance
- Secrets only via `.env`; never log keys.
- Rate limits, auth checks on new endpoints.
- Input validation and sanitization for all new payloads.
- Caching for notifications list and analytics summaries.

## Logging & Monitoring
- Structured logs with request IDs for TTS and notifications; error classes mapped to status codes.
- Hook into existing `logger` and Sentry (if prod DSN present).

## Testing & Documentation
- End‑to‑end flows: TTS generate → play globally; notifications create → realtime update; blog autosave/version; analytics queries.
- Unit/integration tests both sides; CI ready.
- Update Swagger (`server/src/swagger.json`) for new fields and endpoints.

## Rollout Plan
1. Implement TTS backend (ElevenLabs), language validation, and UI updates; add global player.
2. Add notification endpoints, realtime socket emissions, grouping & unread count; update client.
3. Upgrade blog creation: validation, autosave, versioning.
4. Extend analytics: events, reporting, charts.
5. Tests, docs, performance/security passes.

## Acceptance Criteria
- No 500s from AudioPlayer; language selection works with validated errors for unsupported.
- Global player resumes audio across routes.
- Notifications deliver realtime, reflect preferences, support grouping and unread counts.
- Blog editor validates, autosaves, versions content; large posts perform well.
- Analytics provide accurate, realtime metrics with charts.
- Tests pass; docs updated; no secrets logged.