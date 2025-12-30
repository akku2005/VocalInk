const fs = require('fs');

// Delete temporary test files
try {
    if (fs.existsSync('test-gemini.js')) fs.unlinkSync('test-gemini.js');
    if (fs.existsSync('update-env.js')) fs.unlinkSync('update-env.js');
    if (fs.existsSync('update-env-full.js')) fs.unlinkSync('update-env-full.js');
    console.log('Cleanup complete');
} catch (e) {
    console.error(e);
}
