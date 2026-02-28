---
title: 'Back-end PlantUML Renderer Toggle'
slug: 'backend-renderer-toggle'
created: '2026-02-28T00:00:00.000Z'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4, 5]
tech_stack: ['Vanilla JavaScript (ES6+)', 'Vite', 'Tailwind CSS v4', 'CheerpJ (PlantUML runtime)', 'Ace Editor', 'pako@2.1.0 (CDN)']
files_to_modify: ['index.html', 'src/js/app.js', 'src/css/app.css']
code_patterns: ['LocalStorage with STORAGE_KEYS constant object', 'Button styling with Tailwind utility classes', 'Event listeners attached after initialization', 'SVG icons in span wrappers', 'Debounced render pattern']
test_patterns: ['Manual testing required (no automated test suite present)']
---

# Tech-Spec: Back-end PlantUML Renderer Toggle

**Created:** 2026-02-28

## Overview

### Problem Statement

Users currently only have front-end rendering available via the `plantuml.renderPng()` function, which uses CheerpJ to run PlantUML locally in the browser. This may have limitations with complex diagrams or performance constraints. Adding back-end rendering provides an alternative using PlantUML's official server for potentially faster or more reliable rendering.

### Solution

Add a toggle button in the header that allows users to switch between:
- **Front-end rendering** (default): Uses existing `plantuml.renderPng()` with local CheerpJ execution
- **Back-end rendering**: Uses PlantUML.com official server endpoint at `https://www.plantuml.com/plantuml/png/<encoded-compressed-plantuml>`

The back-end renderer will:
- Encode PlantUML content using deflate compression (pako library)
- Use custom base64 encoding per PlantUML specification
- Fetch the PNG response from PlantUML.com
- Display the image in the existing preview panel

### Scope

**In Scope:**
- Add "Toggle Renderer" button to header (rightmost position, after Theme button)
- Implement back-end rendering using PlantUML.com endpoint
- Add pako@2.1.0 library via CDN for deflate compression
- Implement PlantUML-specific encoding (encode64 function)
- Store renderer preference in localStorage (persistent across sessions)
- Default to front-end rendering
- Display actual image response from endpoint (including any error images from PlantUML server)

**Out of Scope:**
- Modifying existing front-end rendering logic
- Changing other buttons or features
- Adding loading indicators
- Server-side caching or optimization
- Error handling for network failures (endpoint returns error images)

## Context for Development

### Codebase Patterns

**LocalStorage Pattern:**
- Uses constant object `STORAGE_KEYS` at module level (line 433 in app.js)
- Pattern: `const STORAGE_KEYS = { FILES: 'plantuml-files', DEFAULT: 'plantuml-default' }`
- Access pattern: `localStorage.getItem(STORAGE_KEYS.KEY)` with try-catch error handling
- Need to add: `RENDERER: 'plantuml-renderer'` with values `'frontend'` or `'backend'`

**Button Styling Pattern:**
- Tailwind utility classes: `px-3 py-1 bg-{color}-600 hover:bg-{color}-700 text-white text-sm rounded transition-colors cursor-pointer flex items-center gap-1`
- Current button colors: Save (blue), Open (green), Share (orange), Theme (purple)
- Icons in `<span id="{button}-icon">` wrapper containing SVG
- New renderer button should use unique color (e.g., `teal-600`, `indigo-600`, or `pink-600`)

**Event Listener Pattern:**
- Attached via `document.getElementById('btn-{id}').addEventListener('click', handlerFunction)`
- Event listeners attached after `plantuml.initialize()` completes (inside `.then()` block at line 303)
- Theme toggle listener at line 825 as reference pattern

**State Initialization Pattern:**
- Theme initialization (lines 59-64): Check system preference → set attribute → update icon
- Called in `plantuml.initialize().then()` block before change listeners (line 316)
- Need similar pattern: Check localStorage → set renderer state → update button icon

**Render Function Pattern:**
- Current `_render()` (lines 31-37): Calls `plantuml.renderPng(editor.getValue())` → gets blob → sets `#render-image.src`
- Uses `debouncedRender()` wrapper (400ms delay, line 50)
- Need to modify: Check current renderer state → call front-end OR back-end render function

**CSS Responsive Pattern:**
- Buttons targeted by ID in mobile media query (lines 192-199 in app.css)
- Must add new renderer button ID to this selector for proper mobile touch targets

### Files to Reference

| File | Purpose | Key Lines |
| ---- | ------- | ---------|
| `index.html` | Add pako script tag, add renderer toggle button after Theme button | Lines 30-34 (scripts), 68-74 (buttons) |
| `src/js/app.js` | Add renderer toggle logic, encoding functions, modified _render() | Lines 31-37 (_render), 433 (STORAGE_KEYS), 59-64 (init pattern), 825 (event listener pattern) |
| `src/css/app.css` | Add renderer button to mobile responsive styles | Lines 192-199 |
| `src/js/plantuml.js` | External library - NO CHANGES (front-end rendering) | N/A |

### Technical Decisions

1. **CDN Dependency**: Load pako@2.1.0 from CDN (`https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js`) following existing pattern with ace.js (line 31 in index.html)

2. **Encoding Method**: Use PlantUML's custom base64 encoding with deflate compression:
   - Custom alphabet: `0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_`
   - NOT standard base64 - uses PlantUML-specific encoding
   - Must encode using `pako.deflateRaw()` then custom `encode64()` function

3. **State Storage**: Extend `STORAGE_KEYS` object with `RENDERER: 'plantuml-renderer'`
   - Values: `'frontend'` (default) or `'backend'`
   - Use localStorage with try-catch following existing pattern (lines 444-448)

4. **Default State**: Front-end renderer - check localStorage on init, default to `'frontend'` if not set

5. **Error Display**: PlantUML.com endpoint returns error images as PNG response - display directly without additional error handling

6. **Button Styling**:
   - Use teal-600 color to distinguish from existing buttons
   - Include icon span: `<span id="renderer-icon">` containing SVG
   - Add to mobile responsive CSS selector list

7. **Render Logic**:
   - Modify `_render()` to check `currentRenderer` state
   - Front-end: Use existing `plantuml.renderPng()`
   - Back-end: Call new `_renderBackend()` function that encodes and fetches from PlantUML.com

## Implementation Plan

### Tasks

#### Task 1: Add Pako CDN Script
- [x] Task 1: Add pako@2.1.0 CDN script to HTML head section
  - File: `index.html`
  - Action: Add `<script src="https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js"></script>` after line 33 (after plantuml.js script tag)
  - Notes: Follows existing pattern for CDN libraries (ace.js, panzoom, plantuml.js)

#### Task 2: Add Renderer Toggle Button to Header
- [x] Task 2: Add renderer toggle button to header
  - File: `index.html`
  - Action: Add new button after the Theme button (after line 74) with:
    ```html
    <button id="btn-renderer" class="px-3 py-1 bg-teal-600 hover:bg-teal-700 text-white text-sm rounded transition-colors cursor-pointer flex items-center gap-1" title="Toggle renderer" aria-label="Toggle PlantUML renderer">
      <span id="renderer-icon">
        <!-- SVG icon will be set by updateRendererIcon() function -->
      </span>
    </button>
    ```
  - Notes: Uses teal-600 color to distinguish from existing buttons, positioned as rightmost button

#### Task 3: Add Renderer to STORAGE_KEYS Constant
- [x] Task 3: Extend STORAGE_KEYS object with RENDERER key
  - File: `src/js/app.js`
  - Action: Modify line 433 to add RENDERER property:
    ```javascript
    const STORAGE_KEYS = {
      FILES: 'plantuml-files',
      DEFAULT: 'plantuml-default',
      RENDERER: 'plantuml-renderer'
    }
    ```
  - Notes: Follows existing pattern for localStorage key management

#### Task 4: Add Global Renderer State Variable
- [x] Task 4: Add currentRenderer state variable at module level
  - File: `src/js/app.js`
  - Action: Add after line 12 (after `let loadedFromUrl = false`):
    ```javascript
    let currentRenderer = 'frontend' // 'frontend' or 'backend'
    ```
  - Notes: Tracks active renderer, initialized to default value

#### Task 5: Implement PlantUML-Specific Base64 Encoding Function
- [x] Task 5: Add encode64 function for PlantUML encoding
  - File: `src/js/app.js`
  - Action: Add after line 29 (before `function _render()`):
    ```javascript
    /**
     * Encode data using PlantUML's custom base64 alphabet
     * @param {Uint8Array} data - Binary data to encode
     * @returns {string} PlantUML-encoded string
     */
    function encode64(data) {
      const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-_";
      let result = "";
      for (let i = 0; i < data.length; i += 3) {
        const b1 = data[i];
        const b2 = i + 1 < data.length ? data[i + 1] : 0;
        const b3 = i + 2 < data.length ? data[i + 2] : 0;
        const c1 = b1 >> 2;
        const c2 = ((b1 & 0x3) << 4) | (b2 >> 4);
        const c3 = ((b2 & 0xf) << 2) | (b3 >> 6);
        const c4 = b3 & 0x3f;
        result += alphabet[c1] + alphabet[c2] + alphabet[c3] + alphabet[c4];
      }
      return result;
    }
    ```
  - Notes: PlantUML-specific encoding, NOT standard base64. Uses custom alphabet per PlantUML specification.

#### Task 6: Implement Back-end Rendering Function
- [x] Task 6: Add _renderBackend function for back-end rendering
  - File: `src/js/app.js`
  - Action: Add after the encode64 function (before `function _render()`):
    ```javascript
    /**
     * Render PlantUML diagram using back-end service (PlantUML.com)
     * @param {string} uml - PlantUML text content
     */
    function _renderBackend(uml) {
      try {
        // Encode using deflate compression
        const utf8 = new TextEncoder().encode(uml);
        const compressed = pako.deflateRaw(utf8);
        const encoded = encode64(compressed);

        // Build URL and fetch image
        const url = `https://www.plantuml.com/plantuml/png/${encoded}`;
        document.getElementById('render-image').src = url;
      } catch (error) {
        console.error('Back-end render error:', error);
      }
    }
    ```
  - Notes: Uses pako.deflateRaw for compression, sets image src directly to PlantUML.com URL

#### Task 7: Modify _render Function to Support Both Renderers
- [x] Task 7: Modify _render function to check currentRenderer state
  - File: `src/js/app.js`
  - Action: Replace lines 31-37 with:
    ```javascript
    function _render(){
      if (currentRenderer === 'backend') {
        // Back-end rendering
        _renderBackend(editor.getValue());
      } else {
        // Front-end rendering (existing logic)
        plantuml.renderPng(editor.getValue()).then((blob) => {
          document.getElementById('render-image').src = window.URL.createObjectURL(blob);
        }).catch((error) => {
          console.log(error);
        });
      }
    }
    ```
  - Notes: Conditional rendering based on currentRenderer state, preserves existing front-end logic

#### Task 8: Implement updateRendererIcon Function
- [x] Task 8: Add updateRendererIcon function to update button icon
  - File: `src/js/app.js`
  - Action: Add after updateThemeIcon function (after line 98):
    ```javascript
    /**
     * Update renderer toggle button icon
     * @param {string} renderer - 'frontend' or 'backend'
     */
    function updateRendererIcon(renderer) {
      const rendererIcon = document.getElementById('renderer-icon');
      if (!rendererIcon) return;

      if (renderer === 'backend') {
        // Show server/backend icon
        rendererIcon.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 12h14M5 12a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v4a2 2 0 01-2 2M5 12a2 2 0 00-2 2v4a2 2 0 002 2h14a2 2 0 002-2v-4a2 2 0 00-2-2m-2-4h.01M17 16h.01" />
          </svg>
        `;
      } else {
        // Show client/front-end icon
        rendererIcon.innerHTML = `
          <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
        `;
      }
    }
    ```
  - Notes: Server icon for back-end, computer icon for front-end rendering

#### Task 9: Implement initializeRenderer Function
- [x] Task 9: Add initializeRenderer function to load and apply renderer preference
  - File: `src/js/app.js`
  - Action: Add after initializeTheme function (after line 64):
    ```javascript
    /**
     * Initialize renderer preference from localStorage or default
     */
    function initializeRenderer() {
      try {
        const savedRenderer = localStorage.getItem(STORAGE_KEYS.RENDERER);
        currentRenderer = savedRenderer || 'frontend';
      } catch (error) {
        console.error('Error reading renderer preference:', error);
        currentRenderer = 'frontend';
      }
      updateRendererIcon(currentRenderer);
    }
    ```
  - Notes: Loads from localStorage with try-catch, defaults to 'frontend', updates button icon

#### Task 10: Implement toggleRenderer Function
- [x] Task 10: Add toggleRenderer function to switch between renderers
  - File: `src/js/app.js`
  - Action: Add after toggleRenderer function would be (after setTheme function):
    ```javascript
    /**
     * Toggle between front-end and back-end renderers
     */
    function toggleRenderer() {
      currentRenderer = currentRenderer === 'frontend' ? 'backend' : 'frontend';
      try {
        localStorage.setItem(STORAGE_KEYS.RENDERER, currentRenderer);
      } catch (error) {
        console.error('Error saving renderer preference:', error);
      }
      updateRendererIcon(currentRenderer);
      debouncedRender(); // Re-render with new renderer
    }
    ```
  - Notes: Toggles state, saves to localStorage, updates icon, triggers re-render

#### Task 11: Initialize Renderer on Startup
- [x] Task 11: Call initializeRenderer in initialization sequence
  - File: `src/js/app.js`
  - Action: Add after line 316 (after `initializeTheme()`):
    ```javascript
    // Initialize renderer
    initializeRenderer();
    ```
  - Notes: Must be called before change listeners to ensure correct initial state

#### Task 12: Add Renderer Toggle Event Listener
- [x] Task 12: Add event listener for renderer toggle button
  - File: `src/js/app.js`
  - Action: Add after line 829 (after theme toggle event listener):
    ```javascript
    // Renderer toggle event listener
    document.getElementById('btn-renderer').addEventListener('click', toggleRenderer);
    ```
  - Notes: Follows existing pattern for button event listeners

#### Task 13: Add Renderer Button to Mobile Responsive Styles
- [x] Task 13: Update mobile responsive CSS for renderer button
  - File: `src/css/app.css`
  - Action: Modify line 195 selector to include #btn-renderer:
    ```css
    /* Enhanced touch targets (Task 4) */
    /* Toolbar buttons - 44px minimum for iOS HIG */
    #btn-save,
    #btn-open,
    #btn-share,
    #btn-theme,
    #btn-renderer {
      min-height: 44px;
      padding: 0.75rem 1rem;
      font-size: 1rem;
    }
    ```
  - Notes: Ensures proper touch target size on mobile devices

### Acceptance Criteria

#### Functional Requirements

- [x] AC 1: Given a user on the PlantUML Editor page, when the page loads, then the renderer should default to front-end rendering and the renderer button should show a computer icon (front-end indicator)

- [x] AC 2: Given a user with front-end rendering active, when the user edits PlantUML code, then the diagram should render using the local CheerpJ runtime (existing behavior)

- [x] AC 3: Given a user with front-end rendering active, when the user clicks the renderer toggle button, then the renderer should switch to back-end, the button should show a server icon, the preference should be saved to localStorage, and the diagram should re-render using PlantUML.com

- [x] AC 4: Given a user with back-end rendering active, when the user edits PlantUML code, then the diagram should render by encoding the content with deflate compression, fetching from PlantUML.com, and displaying the response image

- [x] AC 5: Given a user with back-end rendering active, when the user clicks the renderer toggle button, then the renderer should switch to front-end, the button should show a computer icon, the preference should be saved to localStorage, and the diagram should re-render using local CheerpJ

- [x] AC 6: Given a user with a saved renderer preference, when the user refreshes the page or opens a new session, then the saved renderer preference should be loaded and applied automatically

- [x] AC 7: Given a user on a mobile device (≤810px width), when viewing the header buttons, then the renderer button should have proper touch target sizing (minimum 44px height)

- [x] AC 8: Given the renderer toggle button in the header, when viewing the button layout, then the renderer button should be positioned as the rightmost button (after the Theme button)

#### Edge Cases

- [x] AC 9: Given a user with back-end rendering active, when PlantUML.com returns an error image, then the error image should be displayed directly in the preview panel without additional error handling

- [x] AC 10: Given localStorage access is blocked or fails, when initializing the renderer, then the renderer should default to front-end rendering and log an error to console

- [x] AC 11: Given a user with a very large PlantUML diagram, when using back-end rendering, then the diagram should be encoded and fetched (PlantUML.com may have size limits - this is acceptable behavior)

## Additional Context

### Dependencies

**External Libraries:**
- **pako@2.1.0**: Deflate compression library for PlantUML encoding
  - CDN URL: `https://cdn.jsdelivr.net/npm/pako@2.1.0/dist/pako.min.js`
  - Required for: Back-end rendering compression
  - Load method: CDN script tag in HTML head

**External Services:**
- **PlantUML.com API**: Official PlantUML rendering server
  - Endpoint: `https://www.plantuml.com/plantuml/png/<encoded-diagram>`
  - Usage: Back-end rendering alternative
  - Rate limits: May apply (acceptable per requirements)
  - Size limits: May apply (acceptable per requirements)

**Internal Dependencies:**
- Existing `plantuml.js` library for front-end rendering (no changes required)
- Existing `ace.js` editor for code editing
- Existing localStorage utilities for persistence

### Testing Strategy

**Manual Testing Required** (no automated test suite present in project):

1. **Smoke Tests** (verify basic functionality):
   - Load page and verify renderer button appears as rightmost button
   - Verify default front-end rendering works (existing behavior)
   - Click renderer toggle and verify icon changes to server icon
   - Verify diagram re-renders after toggle
   - Refresh page and verify preference persists

2. **Functional Tests** (verify feature behavior):
   - Test front-end rendering with various PlantUML diagrams
   - Test back-end rendering with various PlantUML diagrams
   - Test localStorage persistence across browser sessions
   - Test button positioning in header (rightmost)
   - Test button on mobile responsive layout (≤810px width)

3. **Edge Case Tests** (verify error handling):
   - Test with invalid PlantUML syntax (both renderers)
   - Test with very large diagrams
   - Test with localStorage disabled/blocked
   - Test with network offline (back-end renderer)
   - Test PlantUML.com error responses

4. **Browser Compatibility**:
   - Test in Chrome/Edge (Chromium)
   - Test in Firefox
   - Test in Safari (if available)
   - Test on mobile browsers (responsive layout)

5. **Regression Tests** (verify existing features):
   - Verify Save button still works
   - Verify Open button still works
   - Verify Share button still works
   - Verify Theme toggle still works
   - Verify all keyboard shortcuts still work

### Notes

**Implementation Risks:**
- **PlantUML.com availability**: Back-end rendering depends on external service. If PlantUML.com is down or rate-limited, users will see error images. This is acceptable per requirements.
- **Encoding complexity**: PlantUML uses custom base64 encoding (not standard). Ensure the encode64 function is implemented exactly as specified.
- **pako library availability**: CDN dependency must load before PlantUML initialization. Script order in HTML is critical.

**Known Limitations:**
- No loading indicator for back-end rendering (per requirements)
- No fallback to front-end if back-end fails (per requirements)
- PlantUML.com may have rate limits or size limits (acceptable per requirements)
- No error handling for network failures (endpoint returns error images)

**Future Considerations** (out of scope):
- Add loading spinner for back-end rendering
- Implement automatic fallback if back-end fails
- Cache back-end rendered images in localStorage
- Add user preference for automatic renderer selection
- Support additional PlantUML output formats (SVG, TXT)

**Code Organization Notes:**
- All new functions in `app.js` should follow existing JSDoc comment pattern
- Maintain consistent indentation (2 spaces per existing codebase)
- Keep renderer-related functions grouped together for maintainability
- Follow existing naming conventions (camelCase for functions/variables)
