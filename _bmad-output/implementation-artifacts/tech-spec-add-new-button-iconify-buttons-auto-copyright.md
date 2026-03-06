---
title: 'Add New Button, Iconify Save/Open Buttons, Auto-Generate Copyright Year'
slug: 'add-new-button-iconify-buttons-auto-copyright'
created: '2026-03-06'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4, 5]
tech_stack: ['Vanilla JavaScript (ES6+)', 'Tailwind CSS v4.1.18', 'Vite', 'Ace Editor']
files_to_modify: ['index.html', 'src/js/app.js', 'src/css/app.css']
code_patterns: ['Tailwind utility classes for styling', 'Event listeners via getElementById', 'Keyboard shortcuts in single keydown handler', 'Native confirm() for confirmations', 'Mobile touch targets in CSS media queries']
test_patterns: ['No test framework in project']
---

# Tech-Spec: Add New Button, Iconify Save/Open Buttons, Auto-Generate Copyright Year

**Created:** 2026-03-06

## Overview

### Problem Statement

- No quick way to reset the editor and start fresh with a new diagram
- Save/Open buttons use text labels instead of icons, creating visual inconsistency with other buttons (Share, Theme, Renderer)
- Copyright year is hardcoded as 2025, requiring manual updates each year

### Solution

- Add a "New" button (with plus icon) to the left of the Save button
- Implement confirmation dialog before resetting editor to default template
- Replace Save/Open button text with Heroicons-style SVG icons (floppy disk for Save, folder for Open)
- Auto-generate copyright year using JavaScript for future-proofing

### Scope

**In Scope:**
- Add New button with confirmation dialog (always asks before resetting)
- Iconify Save button (floppy disk icon)
- Iconify Open button (folder icon)
- Auto-generate copyright year with JavaScript
- Add keyboard shortcut (Ctrl+N or Cmd+N) for New functionality

**Out of Scope:**
- Changes to existing file management system (Save As, Open File modals)
- Changes to other buttons (Share, Theme, Renderer)
- Changes to existing keyboard shortcuts

## Context for Development

### Codebase Patterns

**Button Styling Pattern:**
- Buttons use Tailwind CSS utility classes: `px-3 py-1 bg-{color}-600 hover:bg-{color}-700 text-white text-sm rounded transition-colors cursor-pointer`
- Icon buttons use flex container with `flex items-center gap-1` class
- SVG icons use `class="h-4 w-4"` for consistent sizing
- Icons use Heroicons-style SVG paths with `stroke-width="2"`

**Event Handler Pattern:**
- Event listeners use `document.getElementById('btn-id').addEventListener('click', handlerFunction)`
- Handler functions are defined before event listeners
- Global functions are attached to `window` object for onclick handlers

**Confirmation Dialog Pattern:**
- Use `confirm()` for simple confirmations
- Use custom modals for complex interactions (Share modal, File modal exist)

**Default Template Pattern:**
- Default PlantUML content is: `@startuml\nBob -> Alice: Hello!\n@enduml`
- Default content is loaded from localStorage or falls back to hardcoded value

### Files to Reference

| File | Purpose | Key Lines |
| ---- | ------- | --------- |
| `index.html` | Button definitions (lines 58-80), copyright text (line 104) | Add New button, replace text with icons |
| `src/js/app.js` | Event handlers (lines 927-941), keyboard shortcuts (lines 973-1010) | Add New handler, Ctrl+N shortcut, copyright generator |
| `src/css/app.css` | Mobile touch targets (lines 192-200) | Add #btn-new to media query |

### Technical Decisions

1. **Icon Choice**: Use Heroicons-style SVGs matching existing button style
   - Save: Floppy disk icon (heroicon: `document-arrow-down` or similar)
   - Open: Folder icon (heroicon: `folder-open`)
   - New: Plus icon (heroicon: `plus`)

2. **Confirmation Approach**: Use browser's native `confirm()` dialog for simplicity (consistent with delete confirmation at line 907 of app.js)

3. **Copyright Implementation**: Use JavaScript to auto-generate year and inject into DOM on page load
   - Add `id="copyright-year"` attribute to copyright span in index.html
   - Create `initializeCopyrightYear()` function in app.js
   - Call function on page load (similar to `initializeTheme()` and `initializeRenderer()`)

4. **New Button Position**: Place immediately before Save button in button container (lines 58-63 in index.html)

5. **Mobile Compliance**: Must add `#btn-new` to CSS media query at line 192-200 of app.css for iOS HIG 44px touch target compliance

## Implementation Plan

### Tasks

- [x] **Task 1: Add copyright span ID to index.html**
  - **File:** `index.html`
  - **Action:** Locate line 104 (`&copy; 2025 <a href="https://aristorinjuang.com">Aristo Rinjuang</a>`) and wrap the year in a span with ID
  - **Change:** Replace `&copy; 2025` with `&copy; <span id="copyright-year">2026</span>`
  - **Notes:** Provides a DOM element for JavaScript to update the year dynamically

- [x] **Task 2: Create initializeCopyrightYear() function in app.js**
  - **File:** `src/js/app.js`
  - **Action:** Add a new function after the `initializeRenderer()` function (around line 127)
  - **Implementation:**
    ```javascript
    function initializeCopyrightYear() {
      const copyrightYearSpan = document.getElementById('copyright-year');
      if (copyrightYearSpan) {
        copyrightYearSpan.textContent = new Date().getFullYear();
      }
    }
    ```
  - **Notes:** Follows the same pattern as `initializeTheme()` and `initializeRenderer()`

- [x] **Task 3: Call initializeCopyrightYear() on page load**
  - **File:** `src/js/app.js`
  - **Action:** Add `initializeCopyrightYear()` call in the `plantuml.initialize().then()` block (around line 421)
  - **Location:** Add after `initializeRenderer()` line
  - **Notes:** Ensures copyright year is set when the page loads

- [x] **Task 4: Add New button HTML to index.html**
  - **File:** `index.html`
  - **Action:** Add New button immediately before the Save button (before line 58)
  - **Implementation:**
    ```html
    <button id="btn-new" class="px-3 py-1 bg-red-600 hover:bg-red-700 text-white text-sm rounded transition-colors cursor-pointer flex items-center gap-1" title="New (Ctrl+N)">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
      </svg>
    </button>
    ```
  - **Notes:** Uses red color to distinguish from other buttons, Heroicons plus icon

- [x] **Task 5: Create handleNew() function in app.js**
  - **File:** `src/js/app.js`
  - **Action:** Add a new function after the `handleShare()` function (around line 386)
  - **Implementation:**
    ```javascript
    function handleNew() {
      const defaultTemplate = '@startuml\nBob -> Alice: Hello!\n@enduml';
      const currentContent = editor.getValue();

      // Always ask for confirmation
      const confirmed = confirm('Create a new diagram? Any unsaved changes will be lost.');

      if (confirmed) {
        editor.setValue(defaultTemplate, -1);
        editor.focus();
        debouncedRender();
        // Clear auto-save by resetting default file
        saveDefaultFile(defaultTemplate);
      }
    }
    ```
  - **Notes:** Uses native confirm() following the pattern of delete confirmation (line 907)

- [x] **Task 6: Add New button event listener in app.js**
  - **File:** `src/js/app.js`
  - **Action:** Add event listener after the Open button listener (after line 928)
  - **Implementation:** `document.getElementById('btn-new').addEventListener('click', handleNew)`
  - **Notes:** Follows the existing event handler pattern

- [x] **Task 7: Add Ctrl+N keyboard shortcut in app.js**
  - **File:** `src/js/app.js`
  - **Action:** Add keyboard shortcut in the `document.addEventListener('keydown')` block (around line 973)
  - **Location:** Add after Ctrl+O handler (after line 984)
  - **Implementation:**
    ```javascript
    // Ctrl+N - New Diagram
    if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
      e.preventDefault()
      handleNew()
    }
    ```
  - **Notes:** Uses `e.metaKey` for Mac compatibility (Cmd+N), follows existing shortcut pattern

- [x] **Task 8: Replace Save button text with floppy disk icon in index.html**
  - **File:** `index.html`
  - **Action:** Replace the Save button (line 58-60) with icon-only version
  - **Implementation:**
    ```html
    <button id="btn-save" class="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded transition-colors cursor-pointer flex items-center gap-1" title="Save As (Ctrl+S)">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
      </svg>
    </button>
    ```
  - **Notes:** Uses Heroicons arrow-down/tray icon, maintains blue color

- [x] **Task 9: Replace Open button text with folder icon in index.html**
  - **File:** `index.html`
  - **Action:** Replace the Open button (line 61-63) with icon-only version
  - **Implementation:**
    ```html
    <button id="btn-open" class="px-3 py-1 bg-green-600 hover:bg-green-700 text-white text-sm rounded transition-colors cursor-pointer flex items-center gap-1" title="Open (Ctrl+O)">
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 19a2 2 0 01-2-2V7a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1M5 19h14a2 2 0 002-2v-5a2 2 0 00-2-2H9a2 2 0 00-2 2v5a2 2 0 01-2 2z" />
      </svg>
    </button>
    ```
  - **Notes:** Uses Heroicons folder icon, maintains green color

- [x] **Task 10: Add #btn-new to CSS mobile touch targets in app.css**
  - **File:** `src/css/app.css`
  - **Action:** Add `#btn-new,` to the media query selector list (line 192-200)
  - **Change:** Modify the selector from `#btn-save, #btn-open, #btn-share, #btn-theme, #btn-renderer` to `#btn-new, #btn-save, #btn-open, #btn-share, #btn-theme, #btn-renderer`
  - **Notes:** Ensures iOS HIG compliance (44px minimum touch target) on mobile devices

### Acceptance Criteria

- [x] **AC 1: New button resets editor to default template**
  - **Given** the editor contains any PlantUML code
  - **When** the user clicks the New button and confirms the dialog
  - **Then** the editor content is replaced with `@startuml\nBob -> Alice: Hello!\n@enduml`

- [x] **AC 2: New button shows confirmation dialog**
  - **Given** the editor contains any content
  - **When** the user clicks the New button
  - **Then** a confirmation dialog appears with the message "Create a new diagram? Any unsaved changes will be lost."

- [x] **AC 3: New button cancel preserves editor content**
  - **Given** the editor contains PlantUML code
  - **When** the user clicks the New button and cancels the dialog
  - **Then** the editor content remains unchanged

- [x] **AC 4: Ctrl+N keyboard shortcut triggers New**
  - **Given** the application is open
  - **When** the user presses Ctrl+N (or Cmd+N on Mac)
  - **Then** the confirmation dialog appears for creating a new diagram

- [x] **AC 5: Save button displays icon instead of text**
  - **Given** the application is loaded
  - **When** the user views the Save button
  - **Then** the button displays only a floppy disk icon (no text) with the tooltip "Save As (Ctrl+S)"

- [x] **AC 6: Open button displays icon instead of text**
  - **Given** the application is loaded
  - **When** the user views the Open button
  - **Then** the button displays only a folder icon (no text) with the tooltip "Open (Ctrl+O)"

- [x] **AC 7: New button displays icon with tooltip**
  - **Given** the application is loaded
  - **When** the user views the New button
  - **Then** the button displays a plus icon with the tooltip "New (Ctrl+N)"

- [x] **AC 8: Copyright year displays current year**
  - **Given** the application is loaded
  - **When** the user views the footer copyright text
  - **Then** the year displays as the current calendar year (e.g., 2026)

- [x] **AC 9: Copyright year auto-updates annually**
  - **Given** the application code remains unchanged
  - **When** the calendar year changes to 2027
  - **Then** the copyright year automatically displays 2027 on page load (no code changes needed)

- [x] **AC 10: Buttons maintain visual consistency**
  - **Given** all three buttons (New, Save, Open) are displayed
  - **When** the user views the button group
  - **Then** all buttons use the same icon style (Heroicons SVG), same size (h-4 w-4), and same padding/layout

- [x] **AC 11: Mobile touch targets meet iOS HIG standards**
  - **Given** the application is viewed on a mobile device (≤810px width)
  - **When** the user views any button (including New)
  - **Then** each button has a minimum height of 44px for touch interaction

- [x] **AC 12: New button positioned before Save button**
  - **Given** the application is loaded
  - **When** the user views the button container
  - **Then** the buttons are ordered left-to-right as: New, Save, Open, Share, Theme, Renderer

## Additional Context

### Dependencies

- None (uses existing dependencies: Ace Editor, PlantUML, localStorage)

### Testing Strategy

**Manual Testing Required:**

1. **Functional Testing**
   - Click New button and verify confirmation dialog appears
   - Confirm New dialog and verify editor resets to default template
   - Cancel New dialog and verify editor content is preserved
   - Test Ctrl+N (Windows/Linux) and Cmd+N (Mac) keyboard shortcuts
   - Verify Save and Open buttons show icons instead of text
   - Verify all buttons have appropriate tooltips on hover

2. **Visual Regression Testing**
   - Verify button alignment in the button container
   - Verify icon consistency across all iconified buttons (New, Save, Open)
   - Check button styling matches existing icon buttons (Share, Theme)
   - Verify no text appears on Save and Open buttons

3. **Mobile Responsive Testing**
   - Test on mobile viewport (≤810px width)
   - Verify all buttons including New have minimum 44px touch target
   - Verify buttons are properly aligned on mobile layout
   - Test touch interactions on actual mobile device if possible

4. **Cross-Browser Testing**
   - Test in Chrome, Firefox, Safari, and Edge
   - Verify copyright year displays correctly in all browsers
   - Verify keyboard shortcuts work in all browsers
   - Verify icon rendering is consistent

5. **Accessibility Testing**
   - Verify all buttons have appropriate title/tooltip attributes
   - Verify keyboard navigation works (Tab through buttons)
   - Verify screen readers announce button labels correctly

**No Automated Testing:**
- Project does not have a test framework configured
- All testing must be manual

### Notes

**High-Risk Items (Pre-Mortem Analysis):**
- **Data Loss Risk:** The New button always clears the editor without checking if content was saved. This is intentional per user requirements but could lead to accidental data loss. Mitigation: Confirmation dialog is always shown.

**Known Limitations:**
- **No Undo:** Once the New button is confirmed, there is no undo functionality to restore the previous content
- **No Auto-Save Check:** The confirmation dialog does not check if there are unsaved changes - it always asks for confirmation regardless of whether content was modified

**Future Considerations (Out of Scope):**
- **Smart Confirmation:** Could detect if editor content differs from last saved state and only show confirmation when there are actual changes
- **Multiple Templates:** Could offer a selection of starter templates instead of just the basic "Bob -> Alice: Hello!" example
- **Keyboard Shortcut Customization:** Could allow users to customize keyboard shortcuts in settings
- **Button Customization:** Could allow users to show/hide button labels in accessibility settings

**Implementation Notes:**
- The copyright year uses JavaScript's `new Date().getFullYear()` which will automatically update each year without requiring code changes
- All icons use Heroicons SVG paths with consistent `stroke-width="2"` and `class="h-4 w-4"` for visual consistency
- The New button uses red color (`bg-red-600`) to distinguish it from other action buttons and indicate it's a destructive action
- Touch target compliance (44px minimum) ensures the app meets iOS Human Interface Guidelines for mobile devices

