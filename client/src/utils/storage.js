const isBrowser = typeof window !== 'undefined';

const createStorageHelper = (source) => {
  const available = isBrowser && source in window && window[source];

  const safe = (fn, fallback = null) => {
    if (!available) return fallback;
    try {
      return fn(window[source]);
    } catch (error) {
      console.warn(`Failed to access ${source}:`, error);
      return fallback;
    }
  };

  return {
    available,
    getItem: (key) => safe((stor) => stor.getItem(key), null),
    setItem: (key, value) => safe((stor) => stor.setItem(key, value)),
    removeItem: (key) => safe((stor) => stor.removeItem(key)),
    clear: () => safe((stor) => stor.clear()),
  };
};

const storage = createStorageHelper('localStorage');
const sessionStorageHelper = createStorageHelper('sessionStorage');

const parseJSON = (value) => {
  if (!value) return null;
  try {
    return JSON.parse(value);
  } catch (error) {
    console.warn('Failed to parse JSON from storage', error);
    return null;
  }
};

const jsonStorage = {
  getItem: (key) => parseJSON(storage.getItem(key)),
  setItem: (key, value) => storage.setItem(key, JSON.stringify(value)),
};

const cookieStorage = {
  setItem: (name, value, options = {}) => {
    if (!isBrowser) return;
    const opts = [];
    if (options.expires) opts.push(`expires=${options.expires.toUTCString()}`);
    if (options.path) opts.push(`path=${options.path}`);
    if (options.domain) opts.push(`domain=${options.domain}`);
    if (options.sameSite) opts.push(`SameSite=${options.sameSite}`);
    if (options.secure) opts.push('secure');
    document.cookie = `${name}=${encodeURIComponent(value)}; ${opts.join('; ')}`;
  },
  getItem: (name) => {
    if (!isBrowser) return null;
    const cookies = document.cookie.split(';').map((cookie) => cookie.trim());
    const match = cookies.find((cookie) => cookie.startsWith(`${name}=`));
    if (!match) return null;
    return decodeURIComponent(match.split('=')[1] || '');
  },
  removeItem: (name, options = {}) => {
    cookieStorage.setItem(name, '', { ...options, expires: new Date(0) });
  },
};

export { storage, jsonStorage, sessionStorageHelper, cookieStorage };
