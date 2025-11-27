// Text utility functions for blogs

/**
 * Strip HTML tags from a string
 * @param {string} html - HTML string to strip
 * @returns {string} Plain text without HTML tags
 */
export const stripHtml = (html) => {
  if (!html) return '';

  // Create a temporary div element to parse HTML
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;

  // Extract text content
  const text = tmp.textContent || tmp.innerText || '';

  // Clean up extra whitespace
  return text.trim().replace(/\s+/g, ' ');
};

/**
 * Calculate reading time based on word count
 * Average reading speed: 200-250 words per minute
 * @param {string} content - The content to calculate reading time for
 * @param {number} wordsPerMinute - Reading speed (default: 200)
 * @returns {number} Reading time in minutes
 */
export const calculateReadTime = (content, wordsPerMinute = 200) => {
  if (!content || typeof content !== 'string') return 1;

  // Strip HTML tags
  const plainText = content.replace(/<[^>]*>/g, '');

  // Count words (split by whitespace and filter empty strings)
  const wordCount = plainText.trim().split(/\s+/).filter(word => word.length > 0).length;

  // Calculate reading time (minimum 1 minute)
  const readTime = Math.max(1, Math.ceil(wordCount / wordsPerMinute));

  return readTime;
};

/**
 * Strip HTML tags from text and return plain text
 * @param {string} html - HTML string
 * @param {number} maxLength - Maximum length of returned text
 * @returns {string} Plain text without HTML tags
 */
export const stripHtmlTags = (html, maxLength = null) => {
  if (!html || typeof html !== 'string') return '';

  // Remove HTML tags
  let text = html.replace(/<[^>]*>/g, '');

  // Decode HTML entities
  text = text
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'");

  // Trim and optionally truncate
  text = text.trim();

  if (maxLength && text.length > maxLength) {
    text = text.substring(0, maxLength) + '...';
  }

  return text;
};

/**
 * Get clean excerpt from blog content
 * @param {object} blog - Blog object
 * @param {number} maxLength - Maximum length of excerpt
 * @returns {string} Clean excerpt without HTML tags
 */
export const getCleanExcerpt = (blog, maxLength = 150) => {
  // Try excerpt first, then content, then description
  const text = blog?.excerpt || blog?.content || blog?.description || blog?.summary || '';
  return stripHtmlTags(text, maxLength);
};

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export const formatDate = (date, options = {}) => {
  if (!date) return '';

  const defaultOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };

  return new Date(date).toLocaleDateString('en-US', defaultOptions);
};

/**
 * Format a duration in milliseconds into a short human-readable string
 * @param {number} milliseconds - Duration in milliseconds
 * @returns {string} Formatted duration like "1h 5m" or "30s"
 */
export const formatDuration = (milliseconds) => {
  if (typeof milliseconds !== 'number' || milliseconds <= 0) {
    return '0s';
  }

  const totalSeconds = Math.ceil(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];

  if (hours) parts.push(`${hours}h`);
  if (minutes) parts.push(`${minutes}m`);
  if (!hours && !minutes && seconds >= 0) parts.push(`${seconds}s`);

  return parts.join(' ');
};

/**
 * Format relative time (e.g., "2 days ago")
 * @param {Date|string} date - Date to format
 * @returns {string} Relative time string
 */
export const formatRelativeTime = (date) => {
  if (!date) return '';

  const now = new Date();
  const past = new Date(date);
  const diffMs = now - past;
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffWeeks = Math.floor(diffDays / 7);
  const diffMonths = Math.floor(diffDays / 30);
  const diffYears = Math.floor(diffDays / 365);

  if (diffSecs < 60) return 'just now';
  if (diffMins < 60) return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
  if (diffHours < 24) return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
  if (diffDays < 7) return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
  if (diffWeeks < 4) return `${diffWeeks} week${diffWeeks !== 1 ? 's' : ''} ago`;
  if (diffMonths < 12) return `${diffMonths} month${diffMonths !== 1 ? 's' : ''} ago`;
  return `${diffYears} year${diffYears !== 1 ? 's' : ''} ago`;
};

/**
 * Truncate text to a specified length
 * @param {string} text - Text to truncate
 * @param {number} maxLength - Maximum length
 * @param {string} suffix - Suffix to add (default: '...')
 * @returns {string} Truncated text
 */
export const truncateText = (text, maxLength = 150, suffix = '...') => {
  if (!text) return '';
  if (text.length <= maxLength) return text;

  // Try to break at word boundary
  const truncated = text.substring(0, maxLength);
  const lastSpace = truncated.lastIndexOf(' ');

  if (lastSpace > maxLength * 0.8) {
    return truncated.substring(0, lastSpace) + suffix;
  }

  return truncated + suffix;
};

export default {
  stripHtml,
  stripHtmlTags,
  truncateText,
  getCleanExcerpt,
  calculateReadTime,
  formatDate,
  formatRelativeTime,
  formatDuration
};
