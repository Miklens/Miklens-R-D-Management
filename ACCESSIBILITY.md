# Accessibility Guidelines

This document outlines accessibility standards and guidelines for the Miklens R&D Platform.

## Overview

The Miklens R&D Platform aims to comply with **WCAG 2.1 Level AA** standards to ensure the application is accessible to all users, including those with disabilities.

---

## WCAG 2.1 Compliance

### Perceivable
- **Color Contrast**: Text must have sufficient contrast ratio (4.5:1 for normal text, 3:1 for large text)
- **Text Alternatives**: Images must have descriptive alt text
- **Adaptable**: Content must be available in different formats
- **Distinguishable**: Visual presentation must not rely solely on color

### Operable
- **Keyboard Accessible**: All functionality must be accessible via keyboard
- **Enough Time**: Users must have enough time to read and use content
- **Seizures**: Avoid content that causes seizures (rapid flashing)
- **Navigable**: Users must be able to navigate easily

### Understandable
- **Readable**: Use clear language and simple sentence structure
- **Predictable**: Navigation and behavior must be consistent
- **Input Assistance**: Forms must provide error messages and recovery options
- **Error Prevention**: Help users avoid and correct mistakes

### Robust
- **Compatible**: Use semantic HTML and proper ARIA attributes
- **Standards**: Follow web standards and best practices

---

## Implementation Guidelines

### 1. ARIA Labels & Attributes

Always provide ARIA labels for icon-only buttons:

```tsx
// ❌ BAD - No accessible label
<button>
  <Heart className="w-5 h-5" />
</button>

// ✅ GOOD - Has aria-label
<button aria-label="Add to favorites">
  <Heart className="w-5 h-5" />
</button>

// ✅ GOOD - Has accessible text
<button>
  <Heart className="w-5 h-5" aria-hidden="true" />
  <span>Add to favorites</span>
</button>
```

### 2. Keyboard Navigation

Ensure all interactive elements are keyboard accessible:

```tsx
// Use native HTML elements (button, a, input, select)
<button onClick={handleClick}>Click me</button>

// For custom components, handle keyboard events
<div
  role="button"
  onClick={handleClick}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleClick();
    }
  }}
  tabIndex={0}
>
  Custom Button
</div>
```

### 3. Form Accessibility

Labels must be associated with inputs:

```tsx
// ❌ BAD - Label not connected to input
<label>Email</label>
<input type="email" />

// ✅ GOOD - htmlFor connects label to input
<label htmlFor="email">Email</label>
<input id="email" type="email" />

// ✅ GOOD - Error messages are announced
<label htmlFor="password">Password</label>
<input
  id="password"
  type="password"
  aria-describedby="password-error"
/>
{error && <span id="password-error" role="alert">{error}</span>}
```

### 4. Color Contrast

Maintain sufficient color contrast:

```tsx
// ✅ GOOD - 4.5:1 contrast ratio (normal text)
<p className="text-gray-900 dark:text-white">Dark text on light background</p>

// ⚠️ CHECK - May not pass contrast requirements
<p className="text-gray-500">Ensure contrast ratio is at least 4.5:1</p>
```

### 5. Skip Links

Provide skip navigation link at top of page:

```tsx
<a href="#main-content" className="sr-only focus:not-sr-only">
  Skip to main content
</a>

<main id="main-content">
  {/* Page content */}
</main>
```

### 6. Semantic HTML

Use semantic HTML for better structure:

```tsx
// ✅ GOOD - Semantic structure
<header>
  <nav>{/* Navigation */}</nav>
</header>
<main>
  <article>
    <h1>Title</h1>
    <p>Content</p>
  </article>
</main>
<footer>
  {/* Footer */}
</footer>

// ❌ BAD - Non-semantic divs
<div>
  <div>{/* Navigation */}</div>
</div>
<div>
  <div>
    <div>Title</div>
    <div>Content</div>
  </div>
</div>
<div>
  {/* Footer */}
</div>
```

### 7. Focus Management

Visible focus indicators on all interactive elements:

```css
/* CSS in src/index.css */
:focus-visible {
  outline: 2px solid currentColor;
  outline-offset: 2px;
}

/* Ensure visible focus in all browsers */
button:focus {
  outline: 2px solid #0066cc;
  outline-offset: 2px;
}
```

### 8. Motion Preferences

Respect `prefers-reduced-motion`:

```tsx
// CSS approach
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}

// JavaScript approach
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

{!prefersReducedMotion && <AnimatedComponent />}
```

### 9. Alternative Text for Images

Always provide meaningful alt text:

```tsx
// ✅ GOOD - Descriptive alt text
<img
  src="trial-results.png"
  alt="Field trial results showing 89% fungal inhibition rate over 30 days"
/>

// ❌ BAD - Generic or missing alt text
<img src="image.png" alt="Image" />
<img src="chart.png" /> {/* No alt text */}
```

### 10. Error Messages

Clear, specific error messages help users:

```tsx
// ✅ GOOD - Specific error message
<span role="alert" aria-live="polite" className="text-red-600">
  Email must be in the format: name@example.com
</span>

// ❌ BAD - Generic error
<span className="text-red-600">Invalid input</span>
```

---

## Testing Accessibility

### Automated Testing

Run accessibility checks:

```bash
# Install axe DevTools browser extension
# Run tests in components

# Or use CLI tools
npx axe-core src/
```

### Manual Testing

1. **Keyboard Navigation**
   - Tab through all interactive elements
   - Ensure focus is always visible
   - Test keyboard shortcuts

2. **Screen Reader Testing**
   - Use NVDA (free), JAWS (paid), or VoiceOver (Mac)
   - Test page structure and reading order
   - Verify form labels and error messages

3. **Color Contrast**
   - Use WebAIM Contrast Checker
   - Test in different lighting conditions
   - Verify sufficient contrast ratios

4. **Zoom & Scaling**
   - Test at 200% zoom
   - Ensure content remains readable
   - Check for layout shifts

### Browser DevTools

Modern browsers have accessibility inspection tools:

1. **Chrome DevTools**
   - Right-click → Inspect
   - Accessibility tab shows ARIA tree
   - Color picker shows contrast ratios

2. **Firefox Developer Tools**
   - Inspector tab shows accessibility panel
   - Highlights accessibility issues

---

## Common Issues & Fixes

### Issue: Icon Button Not Accessible

```tsx
// ❌ Before
<button>
  <Heart />
</button>

// ✅ After
<button aria-label="Add to favorites">
  <Heart aria-hidden="true" />
</button>
```

### Issue: Form Input Without Label

```tsx
// ❌ Before
<input type="email" placeholder="Enter email" />

// ✅ After
<label htmlFor="user-email">Email Address</label>
<input id="user-email" type="email" placeholder="example@domain.com" />
```

### Issue: Color-Only Indicator

```tsx
// ❌ Before - Red indicates error
<input className="border-red-500" />

// ✅ After - Text + color indicates error
<input className="border-red-500" aria-invalid="true" aria-describedby="error" />
<span id="error" className="text-red-500">Required field</span>
```

### Issue: No Keyboard Navigation

```tsx
// ❌ Before
<div onClick={handleClick}>Click me</div>

// ✅ After
<button onClick={handleClick}>Click me</button>

// Or if using div:
<div
  role="button"
  onClick={handleClick}
  onKeyDown={(e) => e.key === 'Enter' && handleClick()}
  tabIndex={0}
>
  Click me
</div>
```

---

## Accessibility Tools

### Browser Extensions
- **axe DevTools**: Automated accessibility testing
- **WAVE**: Web Accessibility Evaluation Tool
- **Lighthouse**: Google's audit tool (built into Chrome)

### Online Tools
- **WebAIM Contrast Checker**: https://webaim.org/resources/contrastchecker/
- **WAVE Online**: https://wave.webaim.org/
- **Color Oracle**: Simulates colorblindness

### CLI Tools
- **axe-core**: Automated testing
- **pa11y**: Command-line accessibility checker
- **npm audit --audit-level=moderate**: Check dependencies

---

## Accessibility Checklist

- [ ] All buttons and interactive elements are keyboard accessible (Tab key)
- [ ] Focus indicators are clearly visible on all interactive elements
- [ ] All images have descriptive alt text
- [ ] Form labels are properly associated with inputs (`htmlFor` attribute)
- [ ] Error messages are clear and specific
- [ ] Color is not the only way to convey information
- [ ] Text has sufficient contrast (4.5:1 normal, 3:1 large)
- [ ] Page structure uses semantic HTML (header, nav, main, footer)
- [ ] Motion respects `prefers-reduced-motion` preference
- [ ] Skip navigation link is present
- [ ] All form errors are communicated to screen readers (`role="alert"`)
- [ ] No content relies solely on color
- [ ] Links have descriptive text (not just "Click here")
- [ ] Videos/audio have captions or transcripts
- [ ] Zoom at 200% doesn't break layout

---

## Resources

- **WCAG 2.1**: https://www.w3.org/WAI/WCAG21/quickref/
- **ARIA Authoring Practices Guide**: https://www.w3.org/WAI/ARIA/apg/
- **WebAIM Articles**: https://webaim.org/articles/
- **A11y Project**: https://www.a11yproject.com/

---

## Questions?

For accessibility questions or to report issues:
1. Check this guide first
2. Review WCAG 2.1 specifications
3. File an issue with accessibility label
4. Contact the development team

Remember: **Accessibility is not a feature, it's a requirement.**
