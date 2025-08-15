// File: tts-smoke.js

require('dotenv').config();
const path = require('path');

/* TTS Smoke Test: generates a small audio clip and logs the resulting URL */
(async () => {
	try {
		const TTSService = require(path.resolve(__dirname, '../src/services/TTSService'));
		const service = new TTSService();
		const result = await service.generateSpeech('Hi This is a Backblaze B2 upload test from VocalInk.', {
			provider: 'gtts',
			language: 'en'
		});
		console.log(JSON.stringify({ ok: true, result }, null, 2));
		process.exit(0);
	} catch (err) {
		console.error('Smoke test failed:', err && err.message);
		process.exit(1);
	}
})();
