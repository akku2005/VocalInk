# Accessibility Guidelines for VocalInk

This document outlines accessibility best practices and utilities available in the VocalInk codebase to ensure WCAG 2.1 Level AA compliance.

## Table of Contents
- [Core Principles](#core-principles)
- [Available Utilities](#available-utilities)
- [Common Patterns](#common-patterns)
- [Testing Checklist](#testing-checklist)
- [Examples](#examples)

## Core Principles

### 1. Keyboard Navigation
All interactive elements must be accessible via keyboard:
- Tab/Shift+Tab for navigation
- Enter/Space for activation
- Escape to close modals/menus
- Arrow keys for lists and dropdowns

### 2. Screen Reader Support
- Use semantic HTML elements (`<button>`, `<nav>`, `<main>`, etc.)
- Provide aria-labels for icon-only buttons
- Use aria-live regions for dynamic content
- Hide decorative elements with `aria-hidden="true"`

### 3. Visual Accessibility
- Maintain 4.5:1 contrast ratio for normal text
- Maintain 3:1 contrast ratio for large text
- Ensure focus indicators are clearly visible
- Support high contrast themes

## Available Utilities

### accessibility.js
Located at `client/src/utils/accessibility.js`

#### Functions

```javascript
// Generate unique IDs for form elements
const id = generateId('input');

// Announce to screen readers
announceToScreenReader('Your changes have been saved', 'polite');
announceToScreenReader('Error: Form submission failed', 'assertive');

// Trap focus within modal
const cleanup = trapFocus(modalElement);
// Call cleanup() when closing modal

// Check if element is focusable
if (isFocusable(element)) {
  element.focus();
}

// Handle keyboard navigation in lists
handleListKeyboard(event, items, currentIndex, onSelect);
```

#### Constants

```javascript
import { ariaLabels, keyboardKeys } from './utils/accessibility';

// Use predefined aria-labels
<button aria-label={ariaLabels.close}>
  <X className="w-4 h-4" />
</button>

// Check keyboard keys
if (isKey(event, 'ESCAPE')) {
  closeModal();
}
```

## Common Patterns

### Icon-Only Buttons

```jsx
// ❌ Bad - No label
<button onClick={handleEdit}>
  <Edit className="w-4 h-4" />
</button>

// ✅ Good - Has aria-label
<button onClick={handleEdit} aria-label="Edit profile">
  <Edit className="w-4 h-4" />
</button>

// ✅ Even better - Use predefined labels
import { ariaLabels } from '@/utils/accessibility';

<button onClick={handleEdit} aria-label={ariaLabels.edit}>
  <Edit className="w-4 h-4" />
</button>
```

### Modals and Dialogs

```jsx
import { trapFocus } from '@/utils/accessibility';

function Modal({ isOpen, onClose, children }) {
  const modalRef = useRef(null);
  
  useEffect(() => {
    if (isOpen && modalRef.current) {
      const cleanup = trapFocus(modalRef.current);
      return cleanup;
    }
  }, [isOpen]);
  
  return (
    <div
      ref={modalRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <h2 id="modal-title">Modal Title</h2>
      {children}
      <button onClick={onClose} aria-label={ariaLabels.close}>
        Close
      </button>
    </div>
  );
}
```

### Forms and Labels

```jsx
import { generateId } from '@/utils/accessibility';

function FormField() {
  const id = useMemo(() => generateId('email'), []);
  
  return (
    <div>
      <label htmlFor={id}>Email Address</label>
      <input
        id={id}
        type="email"
        aria-required="true"
        aria-invalid={hasError ? "true" : "false"}
        aria-describedby={hasError ? `${id}-error` : undefined}
      />
      {hasError && (
        <span id={`${id}-error`} role="alert">
          Please enter a valid email address
        </span>
      )}
    </div>
  );
}
```

### Dynamic Content Announcements

```jsx
import { announceToScreenReader } from '@/utils/accessibility';

function TodoList() {
  const handleDelete = async (id) => {
    await deleteTodo(id);
    announceToScreenReader('Todo deleted successfully', 'polite');
  };
  
  const handleError = () => {
    announceToScreenReader('Error: Failed to save changes', 'assertive');
  };
  
  // ...
}
```

### Skip to Content Link

Already implemented in `App.jsx`:

```jsx
<SkipToContent />
<Layout>
  <main id="main-content">
    {/* Your content */}
  </main>
</Layout>
```

### Dropdown Menus

```jsx
import { keyboardKeys } from '@/utils/accessibility';

function Dropdown({ items, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  
  const handleKeyDown = (event) => {
    handleListKeyboard(event, items, selectedIndex, (item, index) => {
      setSelectedIndex(index);
      if (event.key === keyboardKeys.ENTER || event.key === keyboardKeys.SPACE) {
        onSelect(item);
        setIsOpen(false);
      }
    });
  };
  
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        aria-haspopup="menu"
        aria-expanded={isOpen ? "true" : "false"}
      >
        Menu
      </button>
      {isOpen && (
        <ul role="menu" onKeyDown={handleKeyDown}>
          {items.map((item, index) => (
            <li
              key={item.id}
              role="menuitem"
              tabIndex={index === selectedIndex ? 0 : -1}
            >
              {item.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
```

## Testing Checklist

### Keyboard Navigation
- [ ] All interactive elements are reachable via Tab key
- [ ] Focus order is logical and follows visual layout
- [ ] Focus indicators are clearly visible
- [ ] Escape key closes modals and dropdowns
- [ ] Enter/Space activate buttons and links
- [ ] Arrow keys navigate lists and menus

### Screen Reader Testing
- [ ] Test with NVDA (Windows) or VoiceOver (Mac)
- [ ] All images have alt text or are marked decorative
- [ ] Icon-only buttons have aria-labels
- [ ] Form fields have associated labels
- [ ] Error messages are announced
- [ ] Dynamic content changes are announced
- [ ] Skip to content link works

### Visual Testing
- [ ] Test with browser zoom at 200%
- [ ] Test in high contrast mode
- [ ] Check color contrast ratios
- [ ] Verify focus indicators are visible
- [ ] Test with CSS animations disabled

### Mobile Accessibility
- [ ] Touch targets are at least 44x44px
- [ ] Swipe gestures have keyboard alternatives
- [ ] Form inputs are properly labeled on mobile
- [ ] Modal focus trap works on mobile

## Examples from VocalInk

### EngagementButtons Component
Good example of comprehensive aria-labels with dynamic state:

```jsx
<button
  onClick={handleLike}
  aria-label={isLiked ? `Unlike this post (${likes} likes)` : `Like this post (${likes} likes)`}
>
  <Heart className="w-4 h-4" />
  <span aria-hidden="true">{likes}</span>
</button>
```

### Header Component
Good example of semantic navigation and aria attributes:

```jsx
<button
  onClick={() => setUserMenuOpen(!userMenuOpen)}
  aria-label="User menu"
  aria-haspopup="menu"
  aria-expanded={userMenuOpen ? "true" : "false"}
>
  <User className="w-5 h-5" />
</button>
```

### ProfilePage Component
Good example of action button labels:

```jsx
<Button
  variant="outline"
  onClick={handleSettings}
  aria-label="Open settings"
>
  <Settings className="w-4 h-4" />
</Button>
```

## Resources

### Official Documentation
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)
- [ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/en-US/docs/Web/Accessibility)

### Testing Tools
- [WAVE Browser Extension](https://wave.webaim.org/extension/)
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [NVDA Screen Reader](https://www.nvaccess.org/) (Windows)
- [VoiceOver](https://www.apple.com/accessibility/voiceover/) (Mac)

### Color Contrast
- [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)
- [Contrast Ratio](https://contrast-ratio.com/)

## Contributing

When adding new features to VocalInk:

1. **Always** add aria-labels to icon-only buttons
2. **Always** ensure keyboard navigation works
3. **Test** with screen readers before committing
4. **Check** color contrast for new UI elements
5. **Document** any new accessibility patterns you create

## Questions?

If you're unsure about accessibility requirements:
- Review this guide
- Check existing implementations in the codebase
- Use the utilities in `accessibility.js`
- Test with actual assistive technologies
- Refer to WCAG 2.1 guidelines

Remember: Accessibility is not optional—it's a requirement for all features in VocalInk.
