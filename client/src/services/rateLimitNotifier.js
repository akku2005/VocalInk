const handlers = new Set();

const subscribe = (fn) => {
  handlers.add(fn);
  return () => handlers.delete(fn);
};

const notify = (details) => {
  handlers.forEach((fn) => {
    try {
      fn(details);
    } catch (error) {
      console.error('Rate limit notifier failed:', error);
    }
  });
};

export default {
  subscribe,
  notify,
};
