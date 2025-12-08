const FALLBACK_SITE_URL = 'http://localhost:5173';

export const getSiteUrl = () => {
  const envUrl = import.meta.env?.VITE_SITE_URL;
  if (envUrl) {
    try {
      return new URL(envUrl).origin;
    } catch {
      // Ignore invalid env URL and fall back below
    }
  }

  if (typeof window !== 'undefined' && window.location?.origin) {
    return window.location.origin;
  }

  return FALLBACK_SITE_URL;
};

export const buildAbsoluteUrl = (path = '') => {
  const base = getSiteUrl();
  const trimmed = `${path}`.trim();
  if (!trimmed) return base;

  try {
    // If it's already a valid absolute URL, return as-is
    return new URL(trimmed).href;
  } catch {
    const baseNormalized = base.endsWith('/') ? base.slice(0, -1) : base;
    const normalizedPath = trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
    return `${baseNormalized}${normalizedPath}`;
  }
};

export default getSiteUrl;
