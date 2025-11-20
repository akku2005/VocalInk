import { useState, useEffect } from 'react';

const STORAGE_KEY = 'vocalink_analytics_prefs';

export const useAnalyticsPreferences = () => {
  const [timeRange, setTimeRange] = useState('30d');
  const [preferredMetric, setPreferredMetric] = useState('views');

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.timeRange) setTimeRange(parsed.timeRange);
        if (parsed.preferredMetric) setPreferredMetric(parsed.preferredMetric);
      }
    } catch (error) {
      console.warn('Failed to load analytics preferences:', error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ timeRange, preferredMetric })
      );
    } catch (error) {
      console.warn('Failed to save analytics preferences:', error);
    }
  }, [timeRange, preferredMetric]);

  return {
    timeRange,
    setTimeRange,
    preferredMetric,
    setPreferredMetric,
  };
};

export default useAnalyticsPreferences;
