## Objectives
- Audit all backend API endpoints and cross-check usage throughout the frontend.
- Fix endpoint mismatches and inconsistent auth usage that can break functionality.
- Establish automated tests to verify critical flows end-to-end (server + client).

## Scope Covered
- Server: Express app and routers in `server/src/routes/*.js`, controllers under relevant modules.
- Client: API layer (`client/src/services/*`), constants (`client/src/constants/apiConfig.js`), auth context/hooks, key components/pages.

## Key Findings
- Inconsistent auth token for TTS generation
  - `client/src/components/audio/AudioPlayer.jsx:139-146` uses `fetch` and `localStorage.getItem('token')` while the app stores `accessToken`. This often results in 401.
  - Server requires auth for `POST /api/blogs/:id/tts` in `server/src/blog/blog.routes.js:69-75`.
- User service endpoint mismatches
  - `client/src/services/userService.js:186` calls `GET /search`; server defines `GET /users/search` in `server/src/user/user.routes.js:44`.
  - `client/src/services/userService.js:213` calls `GET /leaderboard`; server defines `GET /users/leaderboard` in `server/src/user/user.routes.js:40`.
- Central API config is outdated/missing params
  - `client/src/constants/apiConfig.js:40-55` `BLOGS` entries like `PUBLISH`, `GET_BY_ID` lack `:id` placeholders; server provides `PUT /blogs/:id/publish` and `GET /blogs/:id` in `server/src/blog/blog.routes.js:58-64,26`.
- Notification unread-count endpoint not present
  - `client/src/services/notificationService.js:173-181` tries `GET /notifications/unread-count`; server routes (e.g., `server/src/notification/notification.routes.js`) have no such endpoint; current code falls back to pagination.
- Mixed usage of `fetch` vs centralized axios
  - Uploads in `client/src/pages/ProfileEditPage.jsx:145-151` use `fetch` to `/api/uploads/image` with manual headers; elsewhere axios interceptors already add auth and headers.

## Proposed Fixes
- Unify auth and HTTP usage
  - Refactor `AudioPlayer` to use the axios instance (`api`) and the stored `accessToken`. Replace raw `fetch` with `api.post('/blogs/:id/tts', ...)` so interceptors inject `Authorization` and device fingerprint.
- Correct user service endpoints
  - Update `searchUsers` to `GET /users/search` and `getLeaderboard` to `GET /users/leaderboard` in `client/src/services/userService.js`.
- Align API configuration
  - Update `client/src/constants/apiConfig.js` paramized routes to include `:id` placeholders where required. Ensure helpers like `getFullUrl()` are used consistently or remove unused/misleading entries to avoid future misuse.
- Notifications
  - Keep the fallback logic for unread count; optionally add a server endpoint later if needed.
- Uploads
  - Optional: Replace `fetch` usages with `api.post` in `ProfileEditPage` for consistency and shared error handling.

## Test Plan
- Server tests (Jest)
  - Run existing suites under `server/test/*.js` (auth, badges, series, notifications, AI, tts). Confirm green on `npm test` in `server/`.
  - Add a focused test to assert `/users/search` and `/users/leaderboard` if missing in current suites.
- Client tests
  - Add unit/integration tests for services using Jest or Vitest:
    - Auth: login, refresh, `getCurrentUser` via `authService`.
    - UserService: `searchUsers`, `getLeaderboard`, `updateProfile`.
    - SettingsService: `getAllSettings`, `updateProfileSection`.
    - SeriesService: `getSeriesById`, `uploadCoverImage`.
    - NotificationService: fetch, mark read, fallback unread count.
  - Component-level smoke tests:
    - `AudioPlayer`: calls TTS endpoint and handles success/error.
    - `ProfileTab`: avatar/cover upload flows call respective endpoints.
- E2E sanity (optional, future)
  - Wire a minimal Cypress flow: login → open blog → generate TTS → play audio → update profile avatar.

## Verification Steps
- Local run
  - Server: `npm install && npm run dev` in `server/` then validate `/health` and `/api/test`.
  - Client: `npm install && npm run dev` in `client/`; set `VITE_API_URL` if running on a non-default port.
- Automated
  - Server: `npm test` must pass.
  - Client: newly added test suite must pass (`npm run test` after adding test framework).
- Manual smoke
  - Generate blog TTS and play audio.
  - Run user search and leaderboard views.
  - Upload avatar and cover; confirm persistence and image render.

## Milestones
- Phase 1: Fixes
  - Implement `AudioPlayer` refactor and `userService` endpoint corrections.
  - Adjust `apiConfig` to reflect real server routes.
- Phase 2: Tests
  - Enable client test framework (Vitest preferred for Vite) and add service/component tests.
  - Ensure server test coverage includes user search/leaderboard.
- Phase 3: Validation
  - Run server and client test suites; manual smoke across critical paths.

## Risks & Assumptions
- Assumes backend routes stay stable; if versioning (`/v1`) is introduced, propagate through `BASE_URL`.
- Some client `jest` scripts exist but Jest isn’t in devDependencies; will add Vitest or Jest accordingly.

## Acceptance Criteria
- All corrected endpoints return expected responses in client and server tests.
- No 401 from `AudioPlayer` due to missing token; audio generates and plays.
- User search and leaderboard pages function without 404.
- Client and server test suites pass in CI.
