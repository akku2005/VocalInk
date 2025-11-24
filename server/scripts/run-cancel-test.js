const TTSService = require('../src/services/TTSService');

(async () => {
    process.env.NODE_ENV = 'test';
    const ttsService = new TTSService();
    const controller = new AbortController();
    const text = 'This is a long text that will be aborted.';
    const promise = ttsService.generateWithESpeak(text, {
        voice: 'en',
        speed: 100,
        signal: controller.signal,
    });
    // abort after a short delay
    setTimeout(() => {
        console.log('Aborting...');
        controller.abort();
    }, 100);
    try {
        const result = await promise;
        console.log('Unexpected success:', result);
    } catch (err) {
        console.log('Caught error as expected:', err.message);
    }
})();
