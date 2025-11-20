const USAGE_LABELS = {
  summary: 'summaries',
  audio: 'audio generations',
};

const LIMIT_MESSAGES = {
  summary: 'Daily summary limit reached. Try again tomorrow.',
  audio: 'Daily audio generation limit reached. Try again tomorrow.',
};

const QUOTA_TITLES = {
  summary: 'Summary quota',
  audio: 'Audio quota',
};

export const buildQuotaToastPayload = ({ usage, type, isError = false }) => {
  if (!usage) {
    return null;
  }

  const label = USAGE_LABELS[type] || 'uses';
  const title = QUOTA_TITLES[type] || 'Quota';
  const timeoutLabel = usage.nextReset || null;

  if (isError) {
    return {
      title,
      message: LIMIT_MESSAGES[type] || 'Daily quota reached. Try again tomorrow.',
      countdownExpiresAt: timeoutLabel,
    };
  }

  return {
    title,
    message: `You have ${usage.remaining}/${usage.limit} ${label} remaining today.`,
    countdownExpiresAt: timeoutLabel,
  };
};

export default {
  buildQuotaToastPayload,
};
