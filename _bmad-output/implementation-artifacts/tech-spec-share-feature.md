# Tech-Spec: Share Feature - Client-Side URL Sharing

**Created:** 2026-01-03
**Status:** Implementation Complete

## Overview

### Problem Statement

Users need a way to share their PlantUML diagrams with others. Currently, there's no easy way to send a diagram to a colleague or collaborate on a design. The existing `encodedString` URL parameter is not user-friendly and lacks a proper UI for generating shareable links.

### Solution

Add a **Share** button that:
1. Encodes the current PlantUML code from the editor
2. Generates a URL with the encoded content in the hash fragment: `https://plantuml.aristorinjuang.com/#/${encodedPlantUML}`
3. Copies the URL to the user's clipboard
4. Shows a beautiful modal notification confirming the action
5. Works entirely client-side (no server required)

### Scope (In/Out)

**IN Scope:**
- Share button between "Open" and "Theme Toggle" buttons
- URL encoding using existing `plantumlEncoder` library
- Clipboard copy functionality
- Modal notification with success message
- URL decoding on page load to restore shared diagrams
- Replacement of existing `encodedString=` parameter format

**OUT of Scope:**
- Server-side URL shortening
- Social media sharing integration
- QR code generation
- Export to image/file sharing
- URL analytics or tracking

## Context for Development

### Codebase Patterns

**Existing URL Parameter Handling (`src/js/app.js:2-9`):**
```javascript
const pathname = window.location.pathname.match(/^.*[\/]/)[0]
const hashParams = window.location.hash.substring(1).split('&').reduce(function (res, item) {
  var parts = item.split('=')
  res[parts[0]] = parts[1]
  return res
}, {})

if(hashParams['encodedString']){
  editor.setValue(plantumlEncoder.decode(hashParams['encodedString']), -1)
}
```
**→ This will be replaced with new `#/${encoded}` format**

**Existing Modal Pattern (`index.html:104-138`):**
```html
<div id="file-modal" class="fixed inset-0 bg-black bg-opacity-70 hidden">
  <div class="flex items-center justify-center h-full">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4">
      <!-- Modal content -->
    </div>
  </div>
</div>
```
**→ Reuse this pattern for share notification modal**

**Button Pattern (index.html:58-70):**
```html
<button id="btn-save" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors cursor-pointer">
  Save
</button>
<button id="btn-open" class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors cursor-pointer">
  Open
</button>
<button id="btn-theme" class="px-3 py-1 bg-purple-600 hover:bg-purple-700 text-white text-sm rounded transition-colors cursor-pointer">
  ...
</button>
```
**→ Add Share button between Open and Theme using similar styling**

### Files to Reference

| File | Purpose | Key Sections |
|------|---------|--------------|
| `index.html` | Add Share button and notification modal | Lines 58-70 (button container), Lines 103-138 (modal pattern) |
| `src/js/app.js` | Implement share logic, URL decoding, event listeners | Lines 2-9 (URL params), Lines 662-684 (keyboard shortcuts) |
| `src/css/app.css` | Optional: Add any Share-specific styles | Modal styles, button hover states |

### Technical Decisions

**1. URL Format: `#/${encodedPlantUML}`**
- **Why?** Clean, GitHub-style URL fragments
- **Tradeoff:** Slightly unusual to have slash after `#`, but provides clear visual separation
- **Alternative considered:** `#${encoded}` (no slash) - rejected for user requirement

**2. Replace vs. Support Both Formats**
- **Decision:** Replace existing `encodedString=` format entirely
- **Why?** Simpler codebase, single source of truth, cleaner URLs
- **Risk:** Old shared links will break
- **Mitigation:** This is a small project; breaking changes are acceptable early

**3. Clipboard API**
- **Use:** `navigator.clipboard.writeText()` (modern, async)
- **Fallback:** Consider `document.execCommand('copy')` if needed for older browsers
- **Decision:** Start with modern API, add fallback if testing shows issues

**4. Modal Auto-Dismiss**
- **Decision:** Modal should auto-dismiss after 3 seconds OR on click outside
- **Why?** Better UX, doesn't block user workflow

**5. Button Styling**
- **Color:** Orange (`bg-orange-500 hover:bg-orange-600`) to differentiate from Save (blue), Open (green), Theme (purple)
- **Icon:** Share icon (SVG)
- **Position:** Between Open and Theme buttons

## Implementation Plan

### Tasks

- [x] **Task 1: Add Share Button to Header**
  - Insert button HTML between `btn-open` and `btn-theme` in `index.html`
  - Use orange color scheme and share icon SVG
  - Add `title` attribute for tooltip: "Share (Ctrl+Shift+S)"

- [x] **Task 2: Create Share Notification Modal**
  - Add new modal HTML to `index.html` (after file-modal)
  - Include: success message, copied URL display, dismiss button
  - Use existing modal pattern (full-screen overlay, centered white box)

- [x] **Task 3: Implement Share Functionality in JS**
  - Create `generateShareUrl()` function: encode current editor content, build full URL
  - Create `copyToClipboard(text)` function: use `navigator.clipboard.writeText()`
  - Create `showShareNotification(url)` function: display modal, populate URL, set auto-dismiss timer
  - Create `handleShare()` orchestration function

- [x] **Task 4: Replace URL Parameter Handling**
  - Remove existing `hashParams` parsing logic (lines 2-9 in `app.js`)
  - Replace with new fragment parsing: extract `#/${encoded}` format
  - Update decode logic to use new format
  - Test: Load page with shared URL, verify editor content loads correctly

- [x] **Task 5: Wire Up Event Listeners**
  - Add click listener for Share button
  - Add keyboard shortcut: `Ctrl+Shift+S` (or `Cmd+Shift+S` on Mac)
  - Add click-outside-to-dismiss for share modal
  - Add Escape key handler to close share modal

- [x] **Task 6: Add Share-Specific CSS (Optional)**
  - Style share notification modal (if needed beyond existing patterns)
  - Add any button hover states or transitions
  - Ensure responsive behavior on mobile

### Acceptance Criteria

- [x] **AC 1: Share Button Visible and Positioned**
  Given: User is on any page
  When: Page loads
  Then: Share button appears between Open and Theme buttons
  And: Button has orange color scheme
  And: Button includes share icon

- [x] **AC 2: Generate and Copy Share URL**
  Given: User has PlantUML code in the editor
  When: User clicks Share button or presses Ctrl+Shift+S
  Then: App encodes the current PlantUML content
  And: App generates URL: `https://plantuml.aristorinjuang.com/#/${encodedPlantUML}`
  And: URL is copied to clipboard
  And: Share notification modal appears with success message

- [x] **AC 3: Share Notification Modal**
  Given: Share action was triggered
  When: Modal appears
  Then: Modal shows "Link copied to clipboard!" message
  And: Modal displays the full URL
  And: Modal auto-dismisses after 3 seconds
  And: Modal dismisses on click outside
  And: Modal dismisses on Escape key

- [x] **AC 4: Load Shared Diagram from URL**
  Given: User opens URL with encoded PlantUML in fragment (e.g., `#/${encoded}`)
  When: Page loads
  Then: App decodes the PlantUML from URL fragment
  And: Editor is populated with decoded content
  And: Diagram renders automatically
  And: Old `encodedString=` format is NOT supported (replaced)

- [x] **AC 5: Error Handling**
  Given: Clipboard copy fails (e.g., permission denied, HTTP context)
  When: Share action is triggered
  Then: App shows error message in modal: "Failed to copy to clipboard. Please copy manually."
  And: URL is still displayed in modal for manual copy

- [x] **AC 6: Keyboard Shortcuts**
  Given: User is on any page
  When: User presses Ctrl+Shift+S (or Cmd+Shift+S)
  Then: Share action triggers (same as button click)
  And: Default browser save dialog is prevented

- [x] **AC 7: Mobile Responsive**
  Given: User is on mobile device (≤ 810px)
  When: Share button is visible
  Then: Button maintains 44px minimum touch target
  And: Modal is properly sized and scrollable
  And: All interactions work via touch

## Additional Context

### Dependencies

**External Libraries:**
- `plantumlEncoder` - Already loaded via `/js/plantuml-decoder.min.js`
  - `.encode(text)` - Encode PlantUML to URL-safe string
  - `.decode(encoded)` - Decode URL string back to PlantUML

**Browser APIs:**
- `navigator.clipboard.writeText()` - Copy text to clipboard (requires HTTPS or localhost)
- `window.location.hash` - Read URL fragment
- `window.location.href` - Get base URL for share link

**No npm packages to install** - using existing plantumlEncoder

### Testing Strategy

**Manual Testing Checklist:**

1. **Basic Share Flow:**
   - [ ] Click Share button → modal appears
   - [ ] Verify URL in clipboard (paste into text editor)
   - [ ] Open shared URL in new tab → editor loads content

2. **URL Decoding:**
   - [ ] Test with simple diagram (sequence, class, use case)
   - [ ] Test with complex diagram (lots of text, special characters)
   - [ ] Test with empty editor
   - [ ] Test with malformed encoded URL (should fail gracefully)

3. **Clipboard:**
   - [ ] Test in modern browser (Chrome, Firefox, Safari, Edge)
   - [ ] Test with denied clipboard permissions (if possible)
   - [ ] Test on HTTP (if applicable) - should show error

4. **Modal Behavior:**
   - [ ] Auto-dismiss after 3 seconds
   - [ ] Click outside to dismiss
   - [ ] Escape key to dismiss
   - [ ] Multiple rapid clicks (shouldn't show multiple modals)

5. **Keyboard Shortcuts:**
   - [ ] Ctrl+Shift+S works
   - [ ] Cmd+Shift+S works (Mac)
   - [ ] Doesn't interfere with existing Ctrl+S (Save As)

6. **Mobile:**
   - [ ] Share button visible and touchable
   - [ ] Modal fits on small screens
   - [ ] Touch interactions work

**Edge Cases:**
- Very long PlantUML diagrams (URL length limits: browsers support ~2000+ chars in hash)
- Special characters in PlantUML (`@startuml`, Chinese characters, emojis)
- User clicks Share before editor is initialized

### Notes

**Base URL Construction:**
- Build dynamically: `window.location.origin + window.location.pathname + '#/' + encoded`
- Example: `https://plantuml.aristorinjuang.com/#/${encoded}`

**Encoding Format:**
- The `plantumlEncoder.encode()` function returns a URL-safe string
- No need for additional `encodeURIComponent()`

**Modal Reusability:**
- Consider extracting modal logic into reusable functions if more modals are added in future
- For now, duplicate the pattern for simplicity

**Security:**
- PlantUML code in URL is client-side only, no server processing
- No XSS risk since we're not rendering the URL content as HTML
- Decode operation is safe (plantumlEncoder handles escaping)

**Future Enhancements (Out of Scope):**
- QR code generation for mobile sharing
- "Copy as Markdown" option for embedding in docs
- Social media share buttons (Twitter, LinkedIn, etc.)
- URL shortening service integration
