/**
 * Accessibility Utilities
 * Helper functions and constants for improving accessibility
 */

/**
 * Generate unique IDs for form elements
 * Ensures proper label-input association
 */
let idCounter = 0;
export function generateId(prefix = 'a11y') {
  return `${prefix}-${++idCounter}`;
}

/**
 * Announce message to screen readers
 * Uses ARIA live regions to announce dynamic content changes
 */
export function announceToScreenReader(message, priority = 'polite') {
  const liveRegion = document.getElementById('sr-live-region') || createLiveRegion();
  
  // Set the priority
  liveRegion.setAttribute('aria-live', priority);
  
  // Clear and set new message
  liveRegion.textContent = '';
  setTimeout(() => {
    liveRegion.textContent = message;
  }, 100);
}

function createLiveRegion() {
  const region = document.createElement('div');
  region.id = 'sr-live-region';
  region.className = 'sr-only';
  region.setAttribute('role', 'status');
  region.setAttribute('aria-live', 'polite');
  region.setAttribute('aria-atomic', 'true');
  document.body.appendChild(region);
  return region;
}

/**
 * Trap focus within a modal or dialog
 */
export function trapFocus(element) {
  const focusableElements = element.querySelectorAll(
    'a[href], button:not([disabled]), textarea:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex]:not([tabindex="-1"])'
  );
  
  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  const handleTabKey = (e) => {
    if (e.key !== 'Tab') return;

    if (e.shiftKey) {
      if (document.activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }
    } else {
      if (document.activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    }
  };

  element.addEventListener('keydown', handleTabKey);

  // Focus first element
  firstElement?.focus();

  // Return cleanup function
  return () => {
    element.removeEventListener('keydown', handleTabKey);
  };
}

/**
 * Check if element is visible and focusable
 */
export function isFocusable(element) {
  if (!element) return false;
  
  return (
    element.tabIndex >= 0 &&
    !element.disabled &&
    element.offsetWidth > 0 &&
    element.offsetHeight > 0 &&
    window.getComputedStyle(element).visibility !== 'hidden'
  );
}

/**
 * Common ARIA labels for icon-only buttons
 */
export const ariaLabels = {
  close: 'Close',
  menu: 'Open menu',
  search: 'Search',
  settings: 'Open settings',
  notifications: 'View notifications',
  profile: 'View profile',
  edit: 'Edit',
  delete: 'Delete',
  save: 'Save',
  cancel: 'Cancel',
  back: 'Go back',
  next: 'Next',
  previous: 'Previous',
  play: 'Play',
  pause: 'Pause',
  share: 'Share',
  like: 'Like',
  bookmark: 'Bookmark',
  comment: 'Comment',
  more: 'More options',
  expand: 'Expand',
  collapse: 'Collapse',
  refresh: 'Refresh',
  download: 'Download',
  upload: 'Upload',
  filter: 'Filter',
  sort: 'Sort',
  add: 'Add',
  remove: 'Remove',
  home: 'Go to home',
};

/**
 * Keyboard navigation helpers
 */
export const keyboardKeys = {
  ENTER: 'Enter',
  SPACE: ' ',
  ESCAPE: 'Escape',
  TAB: 'Tab',
  ARROW_UP: 'ArrowUp',
  ARROW_DOWN: 'ArrowDown',
  ARROW_LEFT: 'ArrowLeft',
  ARROW_RIGHT: 'ArrowRight',
  HOME: 'Home',
  END: 'End',
  PAGE_UP: 'PageUp',
  PAGE_DOWN: 'PageDown',
};

/**
 * Check if element matches keyboard event
 */
export function isKey(event, key) {
  return event.key === keyboardKeys[key] || event.key === key;
}

/**
 * Handle keyboard navigation for lists
 */
export function handleListKeyboard(event, items, currentIndex, onSelect) {
  const key = event.key;
  
  switch (key) {
    case keyboardKeys.ARROW_DOWN:
      event.preventDefault();
      const nextIndex = (currentIndex + 1) % items.length;
      onSelect(items[nextIndex], nextIndex);
      break;
      
    case keyboardKeys.ARROW_UP:
      event.preventDefault();
      const prevIndex = (currentIndex - 1 + items.length) % items.length;
      onSelect(items[prevIndex], prevIndex);
      break;
      
    case keyboardKeys.HOME:
      event.preventDefault();
      onSelect(items[0], 0);
      break;
      
    case keyboardKeys.END:
      event.preventDefault();
      onSelect(items[items.length - 1], items.length - 1);
      break;
      
    case keyboardKeys.ENTER:
    case keyboardKeys.SPACE:
      event.preventDefault();
      onSelect(items[currentIndex], currentIndex);
      break;
  }
}

/**
 * Get appropriate role for interactive element
 */
export function getRole(element, defaultRole = 'button') {
  if (element.tagName === 'BUTTON') return undefined; // Native button
  if (element.tagName === 'A' && element.href) return undefined; // Native link
  return defaultRole;
}

export default {
  generateId,
  announceToScreenReader,
  trapFocus,
  isFocusable,
  ariaLabels,
  keyboardKeys,
  isKey,
  handleListKeyboard,
  getRole,
};
