# Tech-Spec: Responsive Layout with Mobile Tabs

**Created:** 2025-12-30
**Status:** done

## Overview

### Problem Statement

The PlantUML Editor currently uses a fixed two-panel layout (code editor + preview side-by-side) with a draggable resizer. This layout doesn't work well on mobile devices or small screens (≤ 810px), where users have to pinch/zoom or deal with cramped panels. The mobile experience is poor, making it difficult to edit diagrams on-the-go.

### Solution

Implement a responsive layout that adapts to screen size:
- **Desktop (> 810px):** Keep existing two-panel side-by-side layout with resizer
- **Mobile (≤ 810px):** Single-panel layout with tab switching between Code and Preview
- Tabs allow users to focus on one task at a time (editing or viewing)
- Auto-render diagram when switching to Preview tab
- Enhanced touch targets for better mobile usability

### Scope (In/Out)

**IN:**
- Responsive breakpoint at 810px width
- Mobile tab navigation (Code / Preview tabs)
- Tab state management (JavaScript)
- Hide/show panels based on active tab on mobile
- Auto-render when switching to Preview tab
- Enhanced touch-friendly button sizes for mobile
- Responsive toolbar adjustments for better mobile UX
- Hide resizer on mobile (not needed with tabs)
- CSS media queries or Tailwind responsive utilities

**OUT:**
- Orientation-specific layouts (use breakpoint only)
- State persistence across tab switches (no need)
- Different breakpoints for tablet/mobile (use 810px for all)
- Landscape vs portrait optimizations
- Mobile-specific gestures (swipe to switch tabs)
- Mobile-only features
- Desktop layout changes

## Context for Development

### Codebase Patterns

**File Structure:**
```
plantuml-editor/
├── index.html              # Main HTML layout (two-panel structure)
├── src/
│   ├── js/
│   │   └── app.js          # Main application logic (editor, rendering, file management)
│   └── css/
│       └── app.css         # Styles using Tailwind CSS
├── package.json            # Vite-based project
└── vite.config.ts
```

**Key Patterns:**
- **Debounced Functions:** Existing `debounce()` utility pattern
- **Direct DOM Manipulation:** `document.getElementById()`, `querySelector()`, `classList` operations
- **Ace Editor API:** `editor.getValue()`, `editor.setValue()`, `editor.focus()`
- **Event Listeners:** `addEventListener()` for UI interactions
- **Tailwind CSS:** Utility classes for styling
- **Vanilla JavaScript:** No frameworks, simple DOM manipulation
- **Responsive Layout:** Currently minimal - uses `w-3/5` for left panel, `w-full` for right
- **Rendering:** `_render()` function generates PNG from PlantUML code

**Existing Code Patterns:**
```javascript
// Debounce pattern (from app.js:31-40)
function debounce(func, delay = 400) {
  let timerId
  return (...args) => {
    clearTimeout(timerId)
    timerId = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  }
}

// Render function (app.js:23-29)
function _render(){
  plantuml.renderPng(editor.getValue()).then((blob) => {
    document.getElementById('render-image').src = window.URL.createObjectURL(blob)
  }).catch((error) => {
    console.log(error)
  })
}

// Resizer logic (app.js:92-109)
const resizer = document.querySelector('#resizer')
const sidebar = document.querySelector('#sidebar')
const sidePanel = document.querySelector('#sidePanel')

resizer.addEventListener('mousedown', () => {
  document.addEventListener('mousemove', resize, false)
  document.addEventListener('mouseup', () => {
    document.removeEventListener('mousemove', resize, false)
  }, false)
})

function resize(e) {
  const x = Math.max(e.x, 200)
  const size = `${x}px`
  sidebar.style.width = size
  sidePanel.style.width = size
}
```

**Current Layout Structure (index.html:17-62):**
```html
<div class="container">
  <div class="flex">
    <div class="h-full w-screen flex flex-row">
      <!-- Left Panel: Code Editor -->
      <aside class="w-3/5" id="sidePanel">
        <div id="sidebar" class="bg-gray-900 h-screen md:block ...">
          <!-- Toolbar with Save/Open buttons -->
          <!-- Ace Editor container -->
        </div>
      </aside>

      <!-- Resizer -->
      <div id="resizer" class="vertical bg-gray-50"></div>

      <!-- Right Panel: Preview -->
      <main class="p-4 w-full h-full">
        <div id="right-panel-image-wrapper">
          <img id="render-image" src="/images/loading.png" />
        </div>
      </main>
    </div>
  </div>
</div>
```

### Files to Reference

**Files to Modify:**
- `index.html` (lines 17-62) - Add tab navigation UI, adjust layout structure
- `src/js/app.js` (after line 91, before resizer code) - Add tab switching logic
- `src/css/app.css` - Add responsive styles, tab styles, touch target enhancements

**Key Dependencies:**
- `ace.js` - Editor API (already loaded)
- `tailwindcss` - Styling utilities (already imported)
- No new dependencies needed

### Technical Decisions

**1. Breakpoint Strategy**

Use CSS custom breakpoint with Tailwind arbitrary values or custom CSS:

```css
/* Custom breakpoint in app.css */
@media (max-width: 810px) {
  /* Mobile styles */
}
```

**Decision Rationale:**
- 810px is specific requirement (between standard tablet 768px and desktop 1024px)
- Tailwind doesn't have 810px breakpoint built-in
- Custom media query gives precise control
- Can use Tailwind utilities within the media query

**2. Tab UI Structure**

Add tab navigation that only shows on mobile:

```html
<!-- Tab Navigation (mobile only, hidden on desktop) -->
<div id="tab-navigation" class="hidden md:hidden bg-gray-800 flex">
  <button id="tab-code" class="flex-1 py-3 text-white font-medium border-b-2 border-blue-500">
    Code
  </button>
  <button id="tab-preview" class="flex-1 py-3 text-gray-400 font-medium border-b-2 border-transparent">
    Preview
  </button>
</div>
```

**Decision Rationale:**
- Simple two-tab design (Code / Preview)
- Active tab visual feedback (border color + text color)
- Uses Tailwind utilities: `hidden` (desktop), `md:hidden` (mobile)
- `flex-1` makes tabs equal width
- Border-bottom indicates active state

**3. Panel Visibility Management**

JavaScript to show/hide panels based on active tab:

```javascript
let activeTab = 'code' // 'code' or 'preview'

const sidePanel = document.querySelector('#sidePanel')
const mainPanel = document.querySelector('main')
const resizer = document.querySelector('#resizer')
const tabCode = document.getElementById('tab-code')
const tabPreview = document.getElementById('tab-preview')

function switchTab(tab) {
  activeTab = tab

  if (tab === 'code') {
    // Show code panel, hide preview
    sidePanel.classList.remove('hidden')
    mainPanel.classList.add('hidden')
    resizer.classList.add('hidden')

    // Update tab styles
    tabCode.classList.add('border-blue-500', 'text-white')
    tabCode.classList.remove('border-transparent', 'text-gray-400')
    tabPreview.classList.remove('border-blue-500', 'text-white')
    tabPreview.classList.add('border-transparent', 'text-gray-400')

    // Focus editor
    editor.focus()
  } else {
    // Show preview, hide code panel
    sidePanel.classList.add('hidden')
    mainPanel.classList.remove('hidden')
    resizer.classList.add('hidden')

    // Update tab styles
    tabPreview.classList.add('border-blue-500', 'text-white')
    tabPreview.classList.remove('border-transparent', 'text-gray-400')
    tabCode.classList.remove('border-blue-500', 'text-white')
    tabCode.classList.add('border-transparent', 'text-gray-400')

    // Auto-render when switching to preview
    _render()
  }
}
```

**Decision Rationale:**
- Use `hidden` class to toggle visibility (Tailwind utility)
- Track active tab state in variable
- Auto-call `_render()` when switching to preview
- Focus editor when switching to code tab
- Hide resizer on mobile (not needed)
- Update tab visual states

**4. Desktop Layout Preservation**

Ensure desktop (> 810px) layout remains unchanged:

```css
@media (min-width: 811px) {
  #tab-navigation {
    display: none !important;
  }

  #sidePanel,
  main {
    display: block !important;
  }

  #resizer {
    display: block !important;
  }
}
```

**Decision Rationale:**
- Explicitly hide tabs on desktop
- Force show both panels on desktop
- Ensure resizer works on desktop
- `!important` overrides inline styles from JS
- Prevents layout breakage

**5. Touch Target Enhancement**

Make buttons larger for mobile:

```css
@media (max-width: 810px) {
  /* Toolbar buttons */
  #btn-save,
  #btn-open {
    min-height: 44px; /* iOS human interface guideline minimum */
    padding: 0.75rem 1rem; /* Larger padding */
    font-size: 1rem; /* Larger text */
  }

  /* Tab buttons */
  #tab-code,
  #tab-preview {
    min-height: 48px; /* Larger tap targets */
    font-size: 1.125rem; /* Larger text */
  }
}
```

**Decision Rationale:**
- 44px minimum recommended by iOS HIG
- 48px for tabs (more prominent)
- Larger padding makes tapping easier
- Doesn't break desktop UI (media query scoped)
- Balances usability with space efficiency

**6. Toolbar Layout Adjustment**

Optimize toolbar for mobile:

```css
@media (max-width: 810px) {
  /* Adjust logo title */
  #logo-title {
    font-size: 1rem; /* Smaller on mobile */
    padding-left: 2.5rem; /* Adjust for background image */
  }

  /* Adjust button container */
  .flex.items-center.justify-between {
    gap: 0.5rem; /* Reduce gap between logo and buttons */
  }
}
```

**Decision Rationale:**
- Smaller font saves horizontal space
- Maintain background image positioning
- Tighter gap prevents overflow
- Still readable on mobile
- Preserves visual hierarchy

**7. Panel Full-Width on Mobile**

Ensure active panel takes full width:

```css
@media (max-width: 810px) {
  #sidePanel {
    width: 100% !important;
  }

  main {
    width: 100% !important;
    padding: 1rem; /* Add padding for preview */
  }

  #editor {
    height: calc(100vh - 48px); /* Subtract tab height */
  }
}
```

**Decision Rationale:**
- Full width for better mobile experience
- Editor height accounts for tab navigation (48px)
- Preview padding prevents edge-to-edge content
- `!important` overrides inline styles from resizer
- Maintains vertical layout

**8. Initial State Management**

Set initial tab state on page load:

```javascript
// Initialize tab state (after editor initialization)
function initializeTabs() {
  // Check screen size
  if (window.innerWidth <= 810px) {
    // Mobile: start with code tab active
    switchTab('code')
  }
  // Desktop: tabs hidden, default layout applies
}

// Call after plantuml.initialize()
plantuml.initialize(jarPath).then(() => {
  initializeDefaultFile()
  debouncedRender()
  initializeTabs() // NEW

  editor.session.on('change', function() {
    debouncedRender()
    debouncedAutoSave()
  })
})
```

**Decision Rationale:**
- Default to code tab on mobile (editing first)
- Check window.innerWidth to detect mobile
- Desktop uses default behavior (no tabs)
- Runs after editor is ready
- Doesn't interfere with existing flow

**9. Resizer Disable on Mobile**

Prevent resizer from interfering on mobile:

```javascript
// Modify existing resizer event listener
resizer.addEventListener('mousedown', () => {
  // Only enable on desktop
  if (window.innerWidth > 810) {
    document.addEventListener('mousemove', resize, false)
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', resize, false)
    }, false)
  }
})
```

**Decision Rationale:**
- Resizer hidden on mobile via CSS
- This check prevents mouse events from attaching
- Performance optimization (no unused listeners)
- Cleaner separation of mobile/desktop

**10. Orientation Change Handling**

Handle screen resize/orientation changes:

```javascript
// Optional: Handle resize events
window.addEventListener('resize', () => {
  const isMobile = window.innerWidth <= 810

  if (isMobile && activeTab === undefined) {
    // Switched from desktop to mobile
    switchTab('code')
  } else if (!isMobile) {
    // Switched from mobile to desktop
    // Ensure both panels visible
    sidePanel.classList.remove('hidden')
    mainPanel.classList.remove('hidden')
    resizer.classList.remove('hidden')
  }
})
```

**Decision Rationale:**
- Smooth transitions when rotating device
- Resets to default state on desktop
- Optional enhancement (can defer if not critical)
- Uses same breakpoint logic

## Implementation Plan

### Tasks

- [x] **Task 1: Add tab navigation HTML structure**
  - Add tab navigation div after container, before flex wrapper
  - Create Code and Preview tab buttons with proper IDs
  - Add Tailwind classes for mobile-only visibility (`hidden md:hidden`)
  - Add visual state classes (border, text colors)

- [x] **Task 2: Implement tab switching JavaScript logic**
  - Create `activeTab` state variable
  - Create `switchTab(tab)` function with show/hide logic
  - Add tab visual state updates (border-blue-500, text-white, etc.)
  - Add auto-render call when switching to preview tab
  - Add editor focus call when switching to code tab
  - Hide resizer on mobile via JS

- [x] **Task 3: Add responsive CSS for mobile layout**
  - Create `@media (max-width: 810px)` query in app.css
  - Style tab navigation (flex layout, colors, borders)
  - Make panels full-width on mobile (100% width)
  - Adjust editor height to account for tab navigation
  - Hide resizer on mobile via CSS (`display: none`)
  - Add padding to preview panel on mobile

- [x] **Task 4: Enhance touch targets for mobile**
  - Increase button tap targets to 44px minimum (Save/Open buttons)
  - Increase tab button height to 48px
  - Add larger padding to toolbar buttons
  - Adjust font sizes for better readability
  - Ensure touch targets don't break desktop layout

- [x] **Task 5: Optimize toolbar layout for mobile**
  - Reduce logo title font size on mobile
  - Adjust logo background positioning
  - Reduce gap between logo and buttons
  - Ensure buttons fit within screen width
  - Test on narrow screens (320px minimum)

- [x] **Task 6: Ensure desktop layout preservation**
  - Create `@media (min-width: 811px)` query
  - Force hide tab navigation on desktop
  - Force show both panels on desktop
  - Force show resizer on desktop
  - Use `!important` to override inline styles
  - Test that resizer still works on desktop

- [x] **Task 7: Add initialization logic**
  - Create `initializeTabs()` function
  - Check screen width on page load
  - Set initial tab state (code tab on mobile)
  - Integrate with existing `plantuml.initialize()` promise chain
  - Ensure no conflicts with existing initialization

- [x] **Task 8: Add tab switching event listeners**
  - Add click listener to Code tab button → `switchTab('code')`
  - Add click listener to Preview tab button → `switchTab('preview')`
  - Place listeners after DOM elements are defined
  - Test tab switching works correctly

- [x] **Task 9: Disable resizer on mobile**
  - Modify existing resizer `mousedown` listener
  - Add screen width check before attaching mousemove events
  - Prevent resizer functionality on mobile
  - Ensure resizer still works on desktop

- [x] **Task 10: Handle screen resize/orientation changes (optional)**
  - Add window `resize` event listener
  - Detect mobile → desktop transition
  - Detect desktop → mobile transition
  - Reset panel visibility accordingly
  - Test with device rotation

### Acceptance Criteria

- [x] **AC 1:** Given the screen width is ≤ 810px, when the page loads, then the Code tab is active and the code panel is visible
- [x] **AC 2:** Given the screen width is ≤ 810px, when the page loads, then the Preview tab is visible and the preview panel is hidden
- [x] **AC 3:** Given the screen width is ≤ 810px, when the user clicks the Preview tab, then the preview panel becomes visible and the code panel hides
- [x] **AC 4:** Given the screen width is ≤ 810px, when the user switches to the Preview tab, then the diagram is auto-rendered
- [x] **AC 5:** Given the screen width is ≤ 810px, when the user clicks the Code tab, then the code panel becomes visible and the preview panel hides
- [x] **AC 6:** Given the screen width is ≤ 810px, when the user switches to the Code tab, then the editor receives focus
- [x] **AC 7:** Given the screen width is ≤ 810px, when viewing either panel, then the panel takes full width (100%)
- [x] **AC 8:** Given the screen width is ≤ 810px, when viewing the layout, then the resizer is not visible
- [x] **AC 9:** Given the screen width is ≤ 810px, when viewing the tab navigation, then both Code and Preview tabs are visible at the top
- [x] **AC 10:** Given the screen width is ≤ 810px, when the Code tab is active, then the tab has blue border and white text
- [x] **AC 11:** Given the screen width is ≤ 810px, when the Preview tab is active, then the tab has blue border and white text
- [x] **AC 12:** Given the screen width is ≤ 810px, when a tab is inactive, then the tab has transparent border and gray text
- [x] **AC 13:** Given the screen width is > 810px, when the page loads, then the tab navigation is not visible
- [x] **AC 14:** Given the screen width is > 810px, when the page loads, then both the code panel and preview panel are visible side-by-side
- [x] **AC 15:** Given the screen width is > 810px, when the page loads, then the resizer is visible and functional
- [x] **AC 16:** Given any screen width, when viewing on mobile, then the Save and Open buttons have minimum 44px touch targets
- [x] **AC 17:** Given any screen width, when viewing on mobile, then the tab buttons have minimum 48px touch targets
- [x] **AC 18:** Given the screen width changes from > 810px to ≤ 810px, when the resize occurs, then the layout adapts to show tabs (if resize handler implemented)
- [x] **AC 19:** Given the screen width changes from ≤ 810px to > 810px, when the resize occurs, then the layout adapts to two-panel view (if resize handler implemented)
- [x] **AC 20:** Given the user is on mobile, when typing in the editor, then the auto-render and auto-save functionality still work as expected

## Additional Context

### Dependencies

**No new dependencies required.**
- All existing dependencies (Ace Editor, Tailwind CSS, PlantUML renderer) are sufficient
- Browser native APIs: `window.innerWidth`, `matchMedia()`, CSS media queries
- Existing `_render()` function handles diagram generation

**Browser Compatibility:**
- CSS media queries supported in all modern browsers
- Tailwind responsive utilities work across all modern browsers
- No polyfills needed for modern browser target

### Testing Strategy

**Manual Testing Checklist:**

**Desktop Testing (> 810px):**
1. Verify two-panel layout remains unchanged
2. Verify resizer still works (drag to resize panels)
3. Verify tab navigation is hidden
4. Verify Save/Open buttons work
5. Verify auto-render on typing
6. Verify file management (Ctrl+S, Ctrl+O)

**Mobile Testing (≤ 810px):**
1. Verify Code tab is active on page load
2. Verify only code panel is visible initially
3. Verify tab navigation is visible at top
4. Verify Preview tab is visible but inactive
5. Click Preview tab → verify preview shows and code hides
6. Verify diagram renders when switching to Preview tab
7. Click Code tab → verify code shows and preview hides
8. Verify editor receives focus when switching to Code tab
9. Verify resizer is hidden
10. Verify panels take full width
11. Verify touch targets are large enough (44px+)
12. Verify toolbar layout fits on screen
13. Verify Save/Open buttons still work
14. Verify auto-save still works
15. Verify file panel modal opens correctly

**Responsive Transition Testing:**
1. Resize browser window from desktop to mobile → verify tabs appear
2. Resize browser window from mobile to desktop → verify two-panel returns
3. Rotate mobile device → verify layout adapts correctly
4. Test at exactly 810px width → verify correct layout

**Device Testing (Ideal):**
- Test on actual mobile device (iPhone, Android)
- Test on tablet (iPad, Android tablet)
- Test with mobile browser dev tools

**Edge Cases to Test:**
- Very narrow screens (320px, 375px)
- Exactly 810px breakpoint
- Rapid tab switching
- Tab switching while rendering is in progress
- File panel modal while on mobile
- Keyboard shortcuts on mobile (if keyboard available)

**Browser DevTools Verification:**
- Use Chrome DevTools device emulation
- Test various device presets (iPhone SE, iPad, etc.)
- Verify media queries match in Elements panel
- Check for layout shifts or jank

**Accessibility Testing:**
- Verify tab buttons are keyboard accessible
- Verify tab buttons have proper ARIA roles (optional enhancement)
- Verify focus states are visible
- Verify screen reader announces tab changes (optional)

### Notes

**Performance Considerations:**
- Tab switching is instant (CSS display toggle)
- Auto-render on tab switch reuses existing `_render()` function
- No additional DOM manipulation overhead
- Media queries are performant (browser-optimized)

**UX Considerations:**
- Code tab as default aligns with primary use case (editing)
- Auto-render on Preview switch provides instant feedback
- Touch targets meet iOS HIG guidelines (44px minimum)
- Full-width panels maximize screen real estate
- Tab visual states provide clear feedback

**Accessibility Considerations:**
- Tab buttons should be keyboard accessible (native button elements)
- Focus management (editor focus on Code tab)
- Visual feedback for active tab (border + color)
- Consider ARIA roles for tab navigation (future enhancement)

**Future Enhancements (out of scope):**
- Swipe gestures to switch tabs
- Remember last active tab across sessions
- Animated transitions between tabs
- Landscape-specific optimizations
- Different breakpoints for different devices
- Tab-specific keyboard shortcuts
- Split view on tablets (both panels visible, but stacked)

**Development Order Suggestion:**
1. Start with Task 1 (HTML structure) - visual foundation
2. Task 3 (Responsive CSS) - layout behavior
3. Task 2 (Tab switching JS) - core functionality
4. Task 4 (Touch targets) - UX polish
5. Task 5 (Toolbar optimization) - mobile refinement
6. Task 6 (Desktop preservation) - ensure no regression
7. Task 7 (Initialization) - startup behavior
8. Task 8 (Event listeners) - wiring it up
9. Task 9 (Resizer disable) - cleanup
10. Task 10 (Resize handling) - optional polish

**Code Organization Tips:**
- Group tab-related functions together in app.js
- Add clear comment: `// ============================================================================
// RESPONSIVE TAB NAVIGATION
// ============================================================================`
- Keep CSS media queries at the bottom of app.css
- Use descriptive variable names (`activeTab`, `switchTab`)
- Follow existing code patterns (debounce, event listeners)

**Debugging Tips:**
- Use `console.log(window.innerWidth)` to verify breakpoint detection
- Use browser DevTools to test responsive breakpoints
- Comment out desktop media query to test mobile styles on desktop
- Test with actual mobile device for touch interactions
- Check for `!important` conflicts if layout breaks
- Verify z-index if tab nav overlaps other elements

**Potential Pitfalls:**
- Forgetting to hide resizer on mobile (CSS `display: none`)
- Inline styles from JS overriding responsive CSS (use `!important`)
- Editor height calculation including tab navigation (use `calc()`)
- Touch targets too small on mobile (use 44px minimum)
- Tab state not resetting on desktop transition
- Resizer events firing on mobile (add width check)
- Z-index conflicts with file panel modal (tab nav should be below modal)

**Integration with Existing Features:**
- File management (Save/Open) should work on both layouts
- Auto-save continues working regardless of layout
- Auto-render continues working on code changes
- Keyboard shortcuts (Ctrl+S, Ctrl+O) work on both layouts
- File panel modal appears above tab navigation (z-index: 1000 vs tab nav default)
