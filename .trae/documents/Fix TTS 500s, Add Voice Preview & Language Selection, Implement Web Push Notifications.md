## Immediate Fixes
- TTS 500 error: Ensure the server uses ElevenLabs when configured; update fallback order to prefer gTTS over eSpeak and disable eSpeak on Windows to avoid "espeak is not recognized" errors.
- Pass language to backend: Confirm `AudioPlayer` sends `language` and `provider: 'elevenlabs'`.
- Voice preview: Fetch voices from `/api/tts/voices?provider=elevenlabs` and add a preview play button so users can hear examples before generating.

## Implementation Steps
### 1) Backend TTS
- Update `TTSService.generateSpeech` fallback: ElevenLabs → GoogleCloud → gTTS → eSpeak (only if not win32). Return clear 4xx for unsupported languages.
- Keep language whitelist validation in `TTSEnhancedService`.

### 2) Frontend Audio UI
- Fetch voices dynamically and populate dropdown with `previewUrl`.
- Add Language dropdown and provider selection (default: ElevenLabs).
- Add Preview button to play voice sample inline; display an error if preview missing.
- When Generate completes, push track into a global audio queue (already implemented) so users can listen anywhere.

### 3) Web Push Notifications
- Add server endpoints:
  - `POST /api/notifications/push/subscribe` to store browser subscription.
  - `POST /api/notifications/push/test` (admin) to send a test push.
- Add `PushService` using VAPID keys (`VAPID_PUBLIC_KEY`/`VAPID_PRIVATE_KEY`) via `web-push` library.
- Client: Register a service worker, subscribe to push, send subscription to backend, and handle notifications.
- Keep socket realtime as a fallback (already in deps) when push is unavailable.

### 4) Verification
- TTS: Generate English and Spanish audio using ElevenLabs; verify no 500s. Test with ElevenLabs disabled → gTTS fallback works.
- Voice preview: dropdown loads voices; clicking preview plays sample.
- Web push: with valid VAPID keys, send test push and receive in the browser.

### 5) Security & Config
- Do not hardcode API keys; only use `.env`. Keys you provided must be stored locally, not in the repo.

## Acceptance
- Audio generation succeeds across languages without `espeak` errors.
- Users can preview voices and select languages.
- Web push subscriptions are stored and test notifications are received.
- Realtime fallback via sockets remains operational.