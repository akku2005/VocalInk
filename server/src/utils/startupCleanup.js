const fs = require('fs/promises');
const path = require('path');
const os = require('os');
const logger = require('./logger');

const HOURS_TO_MS = 60 * 60 * 1000;

const DEFAULT_TARGETS = [
  {
    label: 'audio',
    dir: path.join(__dirname, '../../public/audio'),
    retentionHours: parseInt(process.env.STARTUP_AUDIO_RETENTION_HOURS || '12', 10),
    maxFiles: parseInt(process.env.STARTUP_MAX_AUDIO_FILES || '200', 10),
  },
  {
    label: 'tts',
    dir: path.join(__dirname, '../../public/tts'),
    retentionHours: parseInt(process.env.STARTUP_TTS_RETENTION_HOURS || '12', 10),
    maxFiles: parseInt(process.env.STARTUP_MAX_TTS_FILES || '200', 10),
  },
  {
    label: 'temp-uploads',
    dir: path.join(__dirname, '../../public/uploads/tmp'),
    retentionHours: parseInt(process.env.STARTUP_TMP_RETENTION_HOURS || '24', 10),
    maxFiles: parseInt(process.env.STARTUP_MAX_TMP_FILES || '500', 10),
    optional: true,
  },
];

const fileAgeExceeded = (stats, retentionHours) => {
  if (!retentionHours || retentionHours <= 0) return false;
  const retentionMs = retentionHours * HOURS_TO_MS;
  return Date.now() - stats.mtimeMs > retentionMs;
};

const ensureDirectory = async (dir) => {
  try {
    await fs.mkdir(dir, { recursive: true });
    return true;
  } catch (error) {
    logger.warn('Unable to ensure cleanup directory exists', { dir, message: error.message });
    return false;
  }
};

const cleanupDirectory = async ({ dir, retentionHours, maxFiles, label }) => {
  const ensured = await ensureDirectory(dir);
  if (!ensured) return { removed: 0, retained: 0 };

  try {
    const entries = await fs.readdir(dir, { withFileTypes: true });
    const survivorFiles = [];
    let removed = 0;

    for (const entry of entries) {
      const filePath = path.join(dir, entry.name);
      let stats;
      try {
        stats = await fs.stat(filePath);
      } catch {
        continue;
      }
      if (!stats.isFile()) continue;

      if (fileAgeExceeded(stats, retentionHours)) {
        await fs.unlink(filePath).catch(() => {});
        removed += 1;
        continue;
      }

      survivorFiles.push({ path: filePath, mtime: stats.mtimeMs });
    }

    let retained = survivorFiles.length;

    if (maxFiles && survivorFiles.length > maxFiles) {
      survivorFiles.sort((a, b) => a.mtime - b.mtime);
      const filesToDelete = survivorFiles.slice(0, survivorFiles.length - maxFiles);
      for (const file of filesToDelete) {
        await fs.unlink(file.path).catch(() => {});
        removed += 1;
      }
      retained = maxFiles;
    }

    logger.info('Startup cleanup completed for directory', {
      label,
      dir,
      removed,
      remaining: retained,
    });

    return { removed, retained };
  } catch (error) {
    logger.warn('Startup directory cleanup failed', { dir, message: error.message });
    return { removed: 0, retained: 0 };
  }
};

const formatBytesToMB = (bytes) => Math.round((bytes / (1024 * 1024)) * 100) / 100;

const logMemoryUsage = (phase, usage) => {
  logger.info(`Memory usage ${phase}`, {
    rssMB: formatBytesToMB(usage.rss),
    heapTotalMB: formatBytesToMB(usage.heapTotal),
    heapUsedMB: formatBytesToMB(usage.heapUsed),
    externalMB: formatBytesToMB(usage.external),
    arrayBuffersMB: formatBytesToMB(usage.arrayBuffers),
    freeSystemMB: formatBytesToMB(os.freemem()),
  });
};

const runGarbageCollection = () => {
  if (typeof global.gc === 'function') {
    logger.info('Running manual garbage collection before server bootstrap');
    global.gc();
  } else {
    logger.debug('GC hook not available; start node with --expose-gc to enable manual cleanup');
  }
};

async function runStartupCleanup(targets = DEFAULT_TARGETS) {
  if (process.env.DISABLE_STARTUP_CLEANUP === 'true') {
    logger.info('Startup cleanup skipped via DISABLE_STARTUP_CLEANUP flag');
    return;
  }

  logMemoryUsage('before cleanup', process.memoryUsage());
  runGarbageCollection();

  for (const target of targets) {
    // Skip optional directories that don't exist
    if (target.optional) {
      try {
        await fs.access(target.dir);
      } catch {
        continue;
      }
    }
    await cleanupDirectory(target);
  }

  runGarbageCollection();
  logMemoryUsage('after cleanup', process.memoryUsage());
}

module.exports = {
  runStartupCleanup,
};
