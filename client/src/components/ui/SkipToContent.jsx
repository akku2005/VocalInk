import { useEffect, useState } from 'react';

/**
 * Skip to Content Link
 * Provides keyboard users with a way to skip navigation and jump to main content
 * Follows WCAG 2.1 guidelines for accessibility
 */
const SkipToContent = ({ targetId = 'main-content' }) => {
  const [isVisible, setIsVisible] = useState(false);

  const handleClick = (e) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  const handleFocus = () => setIsVisible(true);
  const handleBlur = () => setIsVisible(false);

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      onFocus={handleFocus}
      onBlur={handleBlur}
      className={`
        fixed top-4 left-4 z-[9999]
        px-4 py-2 
        bg-primary-600 text-white 
        rounded-md 
        font-medium
        focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2
        transition-transform duration-200
        ${isVisible ? 'translate-y-0' : '-translate-y-20'}
      `}
      style={{
        // Ensure it's only visible when focused
        clip: isVisible ? 'auto' : 'rect(1px, 1px, 1px, 1px)',
        clipPath: isVisible ? 'none' : 'inset(50%)',
        height: isVisible ? 'auto' : '1px',
        width: isVisible ? 'auto' : '1px',
        overflow: isVisible ? 'visible' : 'hidden',
        position: 'fixed',
        whiteSpace: isVisible ? 'normal' : 'nowrap',
      }}
    >
      Skip to main content
    </a>
  );
};

export default SkipToContent;
