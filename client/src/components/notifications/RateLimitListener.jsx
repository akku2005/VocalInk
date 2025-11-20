import { useEffect } from 'react';
import { useToast } from '../../hooks/useToast';
import rateLimitNotifier from '../../services/rateLimitNotifier';

const formatRetryMessage = (seconds) => {
  if (!seconds || seconds <= 0) return 'a few minutes';
  if (seconds < 60) {
    return `${seconds} second${seconds === 1 ? '' : 's'}`;
  }
  const minutes = Math.ceil(seconds / 60);
  return `${minutes} minute${minutes === 1 ? '' : 's'}`;
};

const RateLimitListener = () => {
  const { showWarning } = useToast();

  useEffect(() => {
    const unsubscribe = rateLimitNotifier.subscribe(({ retryAfterSeconds, message }) => {
      const timeoutLabel = formatRetryMessage(retryAfterSeconds);
      showWarning(
        message || `API rate limit reached. Try again after ${timeoutLabel}.`,
        {
          title: 'Rate limit exceeded',
          countdownExpiresAt: retryAfterSeconds ? Date.now() + retryAfterSeconds * 1000 : undefined,
        }
      );
    });

    return () => {
      unsubscribe();
    };
  }, [showWarning]);

  return null;
};

export default RateLimitListener;
