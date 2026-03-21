---
title: 'AI-Powered PlantUML Generation Feature'
slug: 'ai-powered-plantuml-generation'
created: '2026-03-21T00:00:00+07:00'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4, 5]
tech_stack: ['Vanilla JavaScript (ES6+)', 'Vite 5.0.0', 'Tailwind CSS v4.1.18', 'ACE Editor', 'PlantUML']
files_to_modify: ['src/js/app.js', 'src/css/app.css', 'index.html', '.env.development', '.env.production']
code_patterns: ['LocalStorage with JSON serialization', 'CSS variables with theme selector', 'Event-driven architecture', 'Modal z-index layering', 'Floating Action Button (FAB) pattern', 'Collapsible panel with transition', 'AbortController for fetch cancellation', 'showNotification() for error handling']
test_patterns: ['No test framework currently in use - manual testing required']
---

# Tech-Spec: AI-Powered PlantUML Generation Feature

**Created:** 2026-03-21

## Overview

### Problem Statement

Users need a faster way to create PlantUML diagrams without manually writing all the code. An AI-powered generation feature will allow users to describe diagrams in natural language and have the AI generate the PlantUML code automatically.

### Solution

Add an AI prompt interface with a collapsible panel at the bottom of the code sidebar. Users enter natural language descriptions, and the app sends prompts to a backend AI service that returns generated PlantUML code, which is then inserted into the editor.

### Scope

**In Scope:**
- Collapsible AI prompt panel at bottom of sidebar (below ACE editor)
- Textarea for entering AI prompts
- Floating Action Button (FAB) positioned inside textarea (bottom-right)
- Loading modal with cancel button (abort capability)
- POST request to `{{VITE_BACKEND_BASE_URL}}/generate` with JSON payload `{"prompt": "<user input>"}`
- Replace editor content with generated PlantUML code on success
- Error handling via `showNotification()` for 400/500 errors
- Environment variable refactoring:
  - Rename `VITE_BACKEND_BASE_URL` → `VITE_PLANTUML_BASE_URL` (default: `http://localhost:8080`)
  - Add new `VITE_BACKEND_BASE_URL` for AI service (default: `http://localhost:8081`)

**Out of Scope:**
- AI prompt history/suggestions
- Prompt templates or examples
- Streaming responses (expect full response)
- Rate limiting or retry logic
- Multi-language support for prompts
- AI service implementation (frontend only)

## Context for Development

### Codebase Patterns

**Modal System:**
- Visibility via `.hidden` class (opacity: 0, pointer-events: none)
- Z-index layering: file modal (1000), share modal (1001), overwrite modal (1002)
- Pattern: `<div id="modal-name" class="hidden fixed inset-0 bg-black bg-opacity-70">`
- New loading modal should use z-index 1003 (above all existing modals)
- Event listeners: Close button (×), backdrop click, ESC key for dismissal
- Functions: `closeShareModal()`, `closeModal()` - follow this pattern for `closeGenerateLoadingModal()`

**Notification System:**
- Function: `showNotification(message, type = 'success')` - line 573 in app.js
- Toast notifications with 3-second auto-dismiss via `notificationTimer`
- Styles: 'success' (green), 'error' (red), 'default' (gray)
- Timer management: Clear existing timer before showing new notification to prevent race conditions
- Error handling: Check if notification elements exist before manipulation

**LocalStorage Pattern:**
- All storage keys defined in `STORAGE_KEYS` constant object (line 891)
- Keys: `FILES`, `DEFAULT`, `RENDERER`, `THEME`, `EDITOR_STATE`
- Add new key: `AI_PANEL_EXPANDED: 'plantuml-ai-panel-expanded'`
- Pattern: `localStorage.getItem(STORAGE_KEYS.AI_PANEL_EXPANDED)` for reading
- Pattern: `localStorage.setItem(STORAGE_KEYS.AI_PANEL_EXPANDED, value)` for writing
- Error handling: Wrap in try-catch for quota exceeded errors

**Theme System:**
- CSS variables defined in `:root`: `--preview-bg`, `--preview-text`, `--preview-border`, `--button-bg`, `--button-text`, `--button-hover`, `--button-border`
- Dark mode override: `[data-theme="dark"]` selector with inverted values
- Theme switching: `document.documentElement.setAttribute('data-theme', theme)`
- Theme storage: `localStorage.getItem(STORAGE_KEYS.THEME)` - returns 'light' or 'dark'
- Apply to AI panel: Use `background-color: var(--preview-bg)` for backgrounds, `color: var(--preview-text)` for text

**Collapsible Elements:**
- Pattern from mobile tabs: use class-based toggling with transitions
- Transition: `transition-transform duration-300 ease-in-out`

**ACE Editor Integration:**
- Single global instance: `const editor = ace.edit("editor")` - defined at line 7
- Content replacement: `editor.setValue(content, -1)` where -1 moves cursor to start
- Content retrieval: `editor.getValue()` for current editor content
- Editor theme: `"ace/theme/monokai"`, mode: `"ace/mode/javascript"`

**Event Handling:**
- Global keyboard handler: `document.addEventListener('keydown', (e) => { ... })` at line 1526
- Pattern: `if (e.ctrlKey && e.key === 's') { e.preventDefault(); ... }`
- PreventDefault: Always call to stop default browser behavior
- StopPropagation: Use to prevent event bubbling when needed
- Button events: `document.getElementById('btn-id').addEventListener('click', handler)`
- Modal click-outside: Check `if (e.target.id === 'modal-id')` for backdrop clicks

**Fetch with Abort:**
- Pattern: `const controller = new AbortController()`
- Pass signal to fetch: `fetch(url, { signal: controller.signal })`
- On cancel: `controller.abort()` - this triggers catch block with AbortError
- Error handling: Check `if (error.name === 'AbortError')` to detect user cancellation

**Environment Variables:**
- Vite prefix: `import.meta.env.VITE_*`
- Current: `VITE_BACKEND_BASE_URL` used for PlantUML rendering
- New pattern: `VITE_PLANTUML_BASE_URL` for rendering, `VITE_BACKEND_BASE_URL` for AI

**Floating Action Button (FAB):**
- Position: `absolute bottom-4 right-4`
- Style: Circular button with icon, shadow, hover effects
- Z-index: Higher than textarea but lower than modals

### Files to Reference

| File | Purpose | Key Details |
| ---- | ------- | ------------- |
| `src/js/app.js` | Main application logic, add AI generation functions | STORAGE_KEYS at line 891, showNotification at line 573, _renderBackend at line 80 |
| `src/css/app.css` | Add AI panel styles, FAB styles, modal styles | Theme variables at top, modal visibility patterns line 67-98, responsive utilities line 142-194 |
| `index.html` | Add AI panel HTML, loading modal HTML | Sidebar structure line 50-104, modals after line 126, #sidePanel is main container |
| `.env.development` | Update environment variables for dev | Currently has VITE_BACKEND_BASE_URL at line 6 |
| `.env.production` | Update environment variables for production | Currently has VITE_BACKEND_BASE_URL at line 6 |

### Technical Decisions

**Panel Placement:**
- Location in HTML: Inside `#sidebar` div (after `.header-container`, after `#diagram-tabs`, before closing `</div>` of sidebar)
- Current structure: Header → Tabs → Editor div → [NEW: AI Panel goes here]
- Panel must be inside the flex container to respect sidebar layout
- Collapsed state: Add collapsed class that hides textarea content, shows only toggle bar
- Expanded state: Remove collapsed class, show full textarea with FAB

**FAB Design:**
- Positioned absolutely inside textarea container (bottom-right: 1rem)
- Icon: Magic wand or sparkles (✨) using emoji or SVG
- Disabled when textarea is empty or request is in-flight

**Loading Modal:**
- Follow existing modal pattern from share-modal (line 127) and file-modal (line 173)
- HTML structure:
  ```html
  <div id="generate-loading-modal" class="hidden fixed inset-0 bg-black bg-opacity-70" style="z-index: 1003;">
    <div class="flex items-center justify-center h-full">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md mx-4">
        <!-- Header with close button -->
        <!-- Body with spinner and text -->
        <!-- Footer with cancel button -->
      </div>
    </div>
  </div>
  ```
- CSS: Add `.hidden` class styles (opacity: 0, pointer-events: none) following existing pattern
- Loading spinner: Use Tailwind's built-in spinner or add custom CSS animation
- Abort handlers: Close button (×), backdrop click, ESC key (existing pattern at line 1571-1586)

**API Integration:**
- Endpoint: `POST {VITE_BACKEND_BASE_URL}/generate`
- Request body: `{"prompt": "user's text"}`
- Success response: `{"status": "success", "data": {"plantuml": "@startuml...\n@enduml"}}`
- Error response: Show message from response body or generic error

**Environment Variable Migration:**
- This is a breaking change for rendering
- Must update all references to `VITE_BACKEND_BASE_URL` → `VITE_PLANTUML_BASE_URL`
- Add new `VITE_BACKEND_BASE_URL` with default `http://localhost:8081` for AI service

## Implementation Plan

### Tasks

**[x] Task 1: Update Environment Variables**
- File: `.env.development` ✅
- File: `.env.production` ✅
- Action:
  - Rename `VITE_BACKEND_BASE_URL` to `VITE_PLANTUML_BASE_URL` (keep PlantUML.com URL)
  - Add new `VITE_BACKEND_BASE_URL="http://localhost:8081"` (for AI service)
- Order: First (enables Task 2)

**[x] Task 2: Refactor Backend Rendering References**
- File: `src/js/app.js` ✅
- Action:
  - Find all `import.meta.env.VITE_BACKEND_BASE_URL` references
  - Replace with `import.meta.env.VITE_PLANTUML_BASE_URL`
  - Location: `_renderBackend()` function (line ~88)
- Order: Second (depends on Task 1)

**[x] Task 3: Add AI Panel HTML Structure**
- File: `index.html` ✅
- Action:
  - Add collapsible AI panel container at bottom of `#sidePanel`
  - Structure: toggle bar + textarea container + FAB
  - Add loading modal HTML after existing modals
- Order: Third (foundation for UI)

**[x] Task 4: Add AI Panel and Modal Styles**
- File: `src/css/app.css` ✅
- Action:
  - Add collapsible panel styles (collapsed/expanded states)
  - Add FAB styles (position, hover, disabled states)
  - Add loading modal styles (z-index 1003)
  - Ensure theme support (dark/light mode)
- Order: Fourth (enables Task 5)

**[x] Task 5: Implement AI Panel Toggle Logic**
- File: `src/js/app.js` ✅
- Action:
  - Add state variable: `let aiPanelExpanded = true`
  - Add function: `toggleAIPanel()`
  - Add event listener to toggle bar
  - Persist state to localStorage: `STORAGE_KEYS.AI_PANEL_EXPANDED`
- Order: Fifth (makes panel interactive)

**[x] Task 6: Implement AI Generation Function**
- File: `src/js/app.js` ✅
- Action:
  - Add function: `async function generatePlantUML(prompt)`
  - Use `AbortController` for cancellable requests
  - POST to `${import.meta.env.VITE_BACKEND_BASE_URL}/generate`
  - Handle success: extract plantuml, call `editor.setValue()`
  - Handle error: call `showNotification(message, 'error')`
  - Handle network errors gracefully
- Order: Sixth (core business logic)

**[x] Task 7: Implement Loading Modal Logic**
- File: `src/js/app.js` ✅
- Action:
  - Add state variable: `let generateAbortController = null`
  - Add function: `showGenerateLoadingModal(controller)`
  - Add function: `closeGenerateLoadingModal()`
  - Add function: `cancelGeneration()`
  - Wire up cancel button, backdrop click, ESC key
- Order: Seventh (depends on Task 6)

**[x] Task 8: Wire Up FAB Event Handler**
- File: `src/js/app.js` ✅
- Action:
  - Add click listener to generate button
  - Validate textarea not empty
  - Create AbortController
  - Show loading modal
  - Call `generatePlantUML(prompt)`
  - On complete: close modal, enable button
  - On error: show notification, close modal, enable button
- Order: Eighth (integrates all pieces)

**[x] Task 9: Add Keyboard Shortcuts (Optional Enhancement)**
- File: `src/js/app.js` ✅
- Action:
  - Consider adding shortcut like `Ctrl+G` to focus AI textarea
  - Follow existing keyboard shortcut pattern (preventDefault, stopPropagation)
- Order: Ninth (nice to have, can defer)

**[x] Task 10: Initialize AI Panel State**
- File: `src/js/app.js` ✅
- Action:
  - Add `initializeAIPanel()` function
  - Read from localStorage on page load
  - Set initial expanded/collapsed state
  - Call from main initialization
- Order: Tenth (completes feature)

### Acceptance Criteria

**AC1: Environment Variables Refactored**
- **Given:** The application starts up
- **When:** I check the environment configuration
- **Then:**
  - `VITE_PLANTUML_BASE_URL` exists and points to PlantUML rendering service
  - `VITE_BACKEND_BASE_URL` exists and points to AI service
  - PlantUML rendering still works (no regression)

**AC2: AI Panel Displays and Collapses**
- **Given:** I am on the PlantUML editor page
- **When:** I look at the code panel
- **Then:**
  - AI prompt panel is visible at bottom of sidebar (below editor)
  - Toggle bar/trigger is visible
  - When I click toggle, panel collapses/animates smoothly
  - When I click toggle again, panel expands
  - Panel state persists across page reloads

**AC3: AI Prompt Textarea and FAB**
- **Given:** The AI panel is expanded
- **When:** I view the panel
- **Then:**
  - Textarea is present and accepts text input
  - FAB (✨ icon) is positioned bottom-right of textarea
  - FAB is disabled when textarea is empty
  - FAB is enabled when textarea has text
  - FAB has hover effect

**AC4: Loading Modal Shows**
- **Given:** I have entered a prompt and clicked generate
- **When:** The request is in-flight
- **Then:**
  - Full-screen loading modal appears
  - Backdrop blur effect is visible
  - Loading spinner is displayed
  - "Generating diagram..." message is shown
  - Cancel button is visible and clickable

**AC5: Successful Generation**
- **Given:** The backend returns success response
- **When:** The response is received
- **Then:**
  - Loading modal closes
  - Editor content is replaced with generated PlantUML code
  - Code is automatically rendered (debounced render fires)
  - Success notification is NOT shown (silent success is fine)
  - FAB is re-enabled

**AC6: Error Handling**
- **Given:** The backend returns 400 or 500 error
- **When:** The error response is received
- **Then:**
  - Loading modal closes
  - Error notification appears via `showNotification()`
  - Error message from backend is displayed (or generic message if not available)
  - Editor content is NOT changed
  - FAB is re-enabled

**AC7: Cancel Functionality**
- **Given:** The loading modal is displayed
- **When:** I click the cancel button
- **Then:**
  - Fetch request is aborted (AbortController)
  - Loading modal closes immediately
  - No changes to editor content
  - FAB is re-enabled

**AC8: Keyboard Cancel (ESC)**
- **Given:** The loading modal is displayed
- **When:** I press the ESC key
- **Then:**
  - Fetch request is aborted
  - Loading modal closes
  - No changes to editor content

**AC9: Theme Support**
- **Given:** I am using dark mode
- **When:** I view the AI panel and loading modal
- **Then:**
  - AI panel background respects theme
  - Textarea colors respect theme
  - Loading modal respects theme
  - No visual glitches in either theme

**AC10: Mobile Responsive**
- **Given:** I am on a mobile device (< 810px width)
- **When:** I view the AI panel
- **Then:**
  - Panel fits within mobile viewport
  - FAB remains clickable (touch-friendly size)
  - Modal is properly sized for mobile
  - No horizontal scroll is introduced

## Additional Context

### Dependencies

**Backend API Requirements:**
- Endpoint must accept POST requests at `/generate`
- Must accept JSON body: `{"prompt": "string"}`
- Must return JSON response: `{"status": "success", "data": {"plantuml": "string"}}`
- Must return appropriate HTTP status codes (200, 400, 500)
- Must handle AbortController signal (standard fetch behavior)
- CORS must be configured if backend is on different port

**External Libraries:**
- No new dependencies required
- Uses existing: ACE Editor, PlantUML (CheerpJ), Pako

### Testing Strategy

**Manual Testing Checklist:**
1. Test environment variable renaming (rendering still works)
2. Test AI panel collapse/expand
3. Test successful generation with valid prompt
4. Test error handling with 400/500 responses (use backend errors)
5. Test cancel button during generation
6. Test ESC key during generation
7. Test empty textarea (FAB disabled)
8. Test theme switching (light/dark)
9. Test mobile responsive design
10. Test page reload (panel state persists)
11. Test network errors (backend offline)
12. Test very long prompts
13. Test very long generated code
14. Test rapid clicking (prevent duplicate requests)

**Edge Cases to Consider:**
- User clicks generate multiple times rapidly
- Backend returns malformed JSON
- Backend times out
- Generated code is empty or invalid
- User cancels after response received
- Network error during request

### Notes

**Performance Considerations:**
- FAB should be disabled during request to prevent duplicate submissions
- AbortController ensures no memory leaks from cancelled requests
- Consider adding request timeout (e.g., 30 seconds) for UX

**Future Enhancements (Out of Scope):**
- Prompt history/suggestions
- Prompt templates (e.g., "Create a sequence diagram for...")
- Streaming responses for faster feedback
- Rate limiting for API quota management
- Multi-language prompt support

**Accessibility:**
- Ensure FAB has proper ARIA label
- Ensure textarea has proper label
- Ensure loading modal has proper ARIA attributes
- Ensure keyboard navigation works (tab order)
- Ensure focus management (return focus to textarea after modal closes)

**Security:**
- Prompt text should be sanitized before sending (prevent XSS if logging)
- Consider prompt length limits to prevent abuse
- Ensure no sensitive data in prompts is logged

---

*This spec is ready for implementation. All tasks are ordered by dependency and include complete context.*
