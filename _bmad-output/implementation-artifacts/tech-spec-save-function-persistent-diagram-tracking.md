---
title: 'Save Function with Persistent Diagram Tracking'
slug: 'save-function-persistent-diagram-tracking'
created: '2026-03-06'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4, 5]
tech_stack: ['Vanilla JavaScript', 'Tailwind CSS', 'Ace Editor', 'PlantUML (CheerpJ)', 'localStorage']
files_to_modify: ['src/js/app.js', 'index.html']
code_patterns: ['Functional programming with pure functions', 'Event delegation and DOM manipulation', 'localStorage with STORAGE_KEYS constant pattern', 'Debounced functions for performance optimization', 'Modal system for user interactions', 'Auto-save with 2-second delay', 'File metadata management with timestamps']
test_patterns: ['No test framework - manual testing only']

# Tech-Spec: Save Function with Persistent Diagram Tracking

**Created:** 2026-03-06

## Overview

### Problem Statement

Currently, Ctrl+S is mapped to Save As, which always shows a dialog requiring the user to select or enter a diagram name. This interrupts the workflow when users want to quickly save changes to the diagram they're currently working on. Users need a quick Save function (Ctrl+S) that saves silently to the last chosen diagram without showing any dialog, improving workflow efficiency for iterative editing.

### Solution

Remap keyboard shortcuts (Ctrl+S → Save, Ctrl+Shift+S → Save As, Ctrl+Shift+U → Share), implement localStorage-based tracking of the current save target diagram, add success notifications in the bottom-left corner (only when content changes), update window titles with diagram names after successful saves, show a confirmation dialog when Save As would overwrite an existing diagram, and maintain multi-tab support with state persistence across browser refreshes.

### Scope

**In Scope:**
- Keyboard shortcut remapping (Ctrl+S for Save, Ctrl+Shift+S for Save As, Ctrl+Shift+U for Share)
- Save function that persists to the last chosen diagram without dialog
- localStorage tracking of current save target diagram
- Success notification system (bottom-left corner, only when content changes)
- Window title updates to "PlantUML Editor - <diagram name>" after successful saves
- Save As overwrite confirmation dialog (when user selects existing diagram)
- Opening diagrams (Ctrl+O) updates the current save target
- Multi-tab support for working on different diagrams simultaneously
- State persistence across browser refreshes (preserve current editor state if possible, otherwise restore saved content)
- Auto-save functionality continues to work unchanged

**Out of Scope:**
- Removing the Save As button (should remain for Ctrl+Shift+S access)
- Server-side diagram storage
- Diagram history/versioning functionality
- Changes to the Share, New, or Open features
- Modifying the existing auto-save behavior

## Context for Development

### Codebase Patterns

**localStorage Storage Keys Pattern:**
The codebase uses a `STORAGE_KEYS` constant object for localStorage key management. Current keys include:
- `STORAGE_KEYS.FILES` - Stores array of file metadata objects
- `STORAGE_KEYS.DEFAULT` - Stores default diagram content
- `STORAGE_KEYS.THEME` - Stores theme preference
- `STORAGE_KEYS.RENDERER` - Stores renderer preference

New keys will be added:
- `STORAGE_KEYS.CURRENT_DIAGRAM` - Track the active save target diagram name
- `STORAGE_KEYS.EDITOR_STATE` - Preserve editor state across refreshes (current content + diagram name)

**Modal Pattern:**
File operations (Save As, Open) use a modal system with `openFilePanel(mode)` function that shows a file list and input field. The modal uses:
- `modalContainer` element
- `fileListContainer` for displaying file buttons
- `fileNameInput` for entering new file names
- Mode parameter: 'save' or 'open'

**Keyboard Shortcut Handling:**
Keyboard shortcuts are handled via event listeners on buttons. Current shortcuts:
- `Ctrl+S` → Save As (needs remapping)
- `Ctrl+O` → Open
- `Ctrl+Alt+N` → New
- `Ctrl+Shift+S` → Save As
- `Ctrl+Shift+U` → Share
- `Alt+T` → Toggle Theme
- `Alt+R` → Toggle Renderer

**File Management System:**
Files are stored with metadata structure:
```javascript
{
  name: string,
  content: string,
  updatedAt: timestamp
}
```

Helper functions:
- `getAllFiles()` - Retrieves files array from localStorage
- `saveAllFiles(files)` - Persists files array to localStorage
- `saveDefaultFile(content)` - Saves to default quick-access key
- `loadDefaultFile()` - Loads default diagram content

### Files to Reference

| File | Purpose | Lines of Interest |
| ---- | ------- | ----------------- |
| `src/js/app.js` | Main application logic with all file operations, localStorage patterns, modal system, keyboard handlers | 1-1079 (entire file) |
| `src/js/app.js:584-589` | STORAGE_KEYS constant definition - pattern for adding new keys | STORAGE_KEYS object |
| `src/js/app.js:595-603` | getAllFiles() - localStorage read pattern | Helper function |
| `src/js/app.js:609-618` | saveAllFiles(files) - localStorage write pattern with error handling | Helper function |
| `src/js/app.js:624-654` | saveDefaultFile(content) - auto-save implementation | Auto-save logic |
| `src/js/app.js:824-852` | openFilePanel(mode) - modal system implementation | Modal pattern |
| `src/js/app.js:906-935` | handleSaveAs() - current Save As implementation | Existing save logic |
| `src/js/app.js:1021-1078` | Keyboard shortcuts document-level listener | Shortcut pattern |
| `src/js/app.js:347-394` | showShareNotification() - notification modal pattern | Reference for notifications |
| `src/js/app.js:436-439` | debouncedAutoSave - auto-save debounce pattern | Debounce utility |
| `index.html:63` | Save button with title attribute | Update to "Save As (Ctrl+Shift+S)" |
| `index.html:122-159` | Share modal HTML structure | Reference for notification UI |
| `src/css/app.css:63-89` | Modal transition and hover styles | Styling patterns |

### Technical Decisions

**Storage Strategy:**
- Add `STORAGE_KEYS.CURRENT_DIAGRAM = 'plantuml_current_diagram'` to store the active diagram name
- Add `STORAGE_KEYS.EDITOR_STATE = 'plantuml_editor_state'` to preserve editor state across refreshes
- Store editor state as JSON: `{ diagramName: string, content: string, timestamp: number }`
- Follow existing error handling pattern from `saveAllFiles()` (try-catch with QuotaExceededError alert)

**Keyboard Shortcut Implementation:**
- Modify line 1023 in `src/js/app.js`: Change `Ctrl+S` from `openFilePanel('save')` to new `handleSave()` function
- Add new keyboard shortcut handler: `Ctrl+Shift+S` calls `openFilePanel('save')`
- Use existing pattern: `if (e.ctrlKey && e.shiftKey && e.key === 'S')`
- Update button title attribute in `index.html:63` from "Save As (Ctrl+S)" to "Save As (Ctrl+Shift+S)"
- Update Share shortcut from `Ctrl+Shift+S` to `Ctrl+Shift+U`

**Notification System:**
- Create `showNotification(message, type)` function following `showShareNotification()` pattern (lines 347-394)
- Add notification container to `index.html` after share modal (around line 160)
- Position fixed at bottom-left: `position: fixed; bottom: 20px; left: 20px; z-index: 1002;`
- Auto-dismiss after 3 seconds using `setTimeout` pattern (line 377)
- Use existing Tailwind classes: `bg-green-100 text-green-800` for success, `bg-red-100 text-red-800` for errors
- Add CSS transitions matching existing modal pattern (lines 92-100 in `app.css`)

**Window Title Management:**
- Create `updateWindowTitle(diagramName)` function following existing icon update patterns (`updateThemeIcon`, `updateRendererIcon`)
- Update `document.title` (not the h1 element) to format: `"PlantUML Editor - ${diagramName}"`
- Fallback to `"PlantUML Editor"` when no diagram is active
- Call after successful saves in `handleSave()` and when opening files in `handleOpenFile()`

**Content Change Detection:**
- Add module-level variable: `let lastSavedContent = ''` (follows pattern of `currentRenderer` on line 16)
- Update `lastSavedContent` after each successful save
- Compare before showing notification: `if (editor.getValue() !== lastSavedContent)`

**Multi-tab State Persistence:**
- Add `restoreEditorState()` function called in initialization block (after line 467)
- Check `STORAGE_KEYS.EDITOR_STATE` exists and diagram is still in `STORAGE_KEYS.FILES`
- If valid, load content and update title; otherwise fall back to `initializeDefaultFile()`
- Update state in `handleSave()` and `handleOpenFile()` using pattern from `setTheme()` (lines 152-160)

**Save Function Implementation:**
- Create `handleSave()` function that:
  1. Checks if `STORAGE_KEYS.CURRENT_DIAGRAM` exists
  2. If no current diagram, shows error notification or falls back to Save As
  3. If current diagram exists, validates diagram still exists in files
  4. Saves content to the diagram (update existing file in `STORAGE_KEYS.FILES`)
  5. Compares content with `lastSavedContent` and shows notification if changed
  6. Updates `lastSavedContent` and saves editor state
  7. Updates window title
- Follow existing file update pattern from `saveDefaultFile()` (lines 624-654)

**Overwrite Confirmation:**
- Modify `handleSaveAs()` (lines 906-935) to check if file name exists
- If exists, call `confirmOverwrite(diagramName)` which:
  - Creates a modal following `showShareNotification()` pattern
  - Shows message: "File '{name}' already exists. Overwrite?"
  - Has "Cancel" and "Overwrite" buttons
  - On confirm, updates the file and sets `STORAGE_KEYS.CURRENT_DIAGRAM`
  - On cancel, returns to modal input
- Only set `STORAGE_KEYS.CURRENT_DIAGRAM` after successful overwrite or new file creation

## Implementation Plan

### Tasks

- [x] **Task 1: Add new localStorage keys to STORAGE_KEYS constant**
  - File: `src/js/app.js`
  - Action: Add two new keys to the STORAGE_KEYS object (around line 589):
    - `CURRENT_DIAGRAM: 'plantuml_current_diagram'`
    - `EDITOR_STATE: 'plantuml_editor_state'`
  - Notes: Follow existing naming convention and position after existing keys

- [x] **Task 2: Add content change tracking variable**
  - File: `src/js/app.js`
  - Action: Add module-level variable after line 16 (after `currentRenderer`):
    - `let lastSavedContent = ''`
  - Notes: This variable will track the last saved content to detect changes

- [x] **Task 3: Create notification system**
  - File: `src/js/app.js`
  - Action: Create `showNotification(message, type)` function following the pattern of `showShareNotification()` (lines 347-394):
    - Accept parameters: `message` (string), `type` ('success' | 'error')
    - Create fixed-position notification container at bottom-left
    - Auto-dismiss after 3 seconds using setTimeout
    - Use Tailwind classes: `bg-green-100 text-green-800` for success, `bg-red-100 text-red-800` for error
    - Add fade-in/fade-out transitions
  - Notes: Ensure z-index is 1002 to appear above modals

- [x] **Task 4: Create window title management function**
  - File: `src/js/app.js`
  - Action: Create `updateWindowTitle(diagramName)` function (around line 200, after `updateRendererIcon`):
    - Update `document.title` to format: `"PlantUML Editor - ${diagramName}"`
    - Fallback to `"PlantUML Editor"` when diagramName is null/undefined
    - Handle empty string case
  - Notes: Do NOT modify the h1 element in the sidebar

- [x] **Task 5: Create handleSave function**
  - File: `src/js/app.js`
  - Action: Create `handleSave()` function (around line 600, after `saveDefaultFile`):
    - Retrieve current diagram name from `localStorage.getItem(STORAGE_KEYS.CURRENT_DIAGRAM)`
    - If no current diagram exists, call `openFilePanel('save')` (fallback to Save As)
    - Validate the current diagram still exists in `getAllFiles()`
    - If diagram doesn't exist, show error notification and clear current diagram tracking
    - Get current editor content: `editor.getValue()`
    - Find the file in `getAllFiles()` array and update its content and lastModified timestamp
    - Save updated files array using `saveAllFiles()`
    - Compare content with `lastSavedContent` - only show notification if changed
    - Update `lastSavedContent` with new content
    - Save editor state to `STORAGE_KEYS.EDITOR_STATE` with format: `{ diagramName, content, timestamp }`
    - Call `updateWindowTitle(diagramName)`
    - Show success notification: `"Saved to '{diagramName}'"`
  - Notes: Follow the file update pattern from `saveDefaultFile()` (lines 624-654)

- [x] **Task 6: Create confirmOverwrite function**
  - File: `src/js/app.js`
  - Action: Create `confirmOverwrite(diagramName)` function (around line 940, after `handleSaveAs`):
    - Create and show a confirmation modal following the share modal pattern
    - Display message: `"File '{diagramName}' already exists. Overwrite?"`
    - Add two buttons: "Cancel" and "Overwrite"
    - On Cancel: Close modal, return to Save As input field
    - On Overwrite: Update the existing file's content and timestamp, set `STORAGE_KEYS.CURRENT_DIAGRAM`, close modal, show success notification
    - Use Tailwind classes for styling
  - Notes: Use modal HTML structure similar to share modal (index.html lines 122-159)

- [x] **Task 7: Modify handleSaveAs to check for existing files**
  - File: `src/js/app.js`
  - Action: Modify `handleSaveAs()` function (lines 906-935):
    - After validating the file name, check if a file with that name already exists in `getAllFiles()`
    - If exists: Call `confirmOverwrite(name)` and return early
    - If not exists: Continue with existing logic to create new file
    - After successful save (new or overwrite), set `STORAGE_KEYS.CURRENT_DIAGRAM` to the file name
    - Save editor state to `STORAGE_KEYS.EDITOR_STATE`
    - Call `updateWindowTitle(name)`
  - Notes: Ensure the current diagram is only updated after successful save

- [x] **Task 8: Modify handleOpenFile to update current diagram tracking**
  - File: `src/js/app.js`
  - Action: Modify `handleOpenFile(fileId)` function (lines 941-947):
    - After loading file content into editor (line 745), add:
      - Get the file object from `getAllFiles()` using the fileId
      - Set `STORAGE_KEYS.CURRENT_DIAGRAM` to `file.name`
      - Save editor state to `STORAGE_KEYS.EDITOR_STATE`
      - Update `lastSavedContent` with loaded content
      - Call `updateWindowTitle(file.name)`
  - Notes: This ensures opening a file makes it the active save target

- [x] **Task 9: Create restoreEditorState function**
  - File: `src/js/app.js`
  - Action: Create `restoreEditorState()` function (around line 450, before `plantuml.initialize`):
    - Try to read editor state from `localStorage.getItem(STORAGE_KEYS.EDITOR_STATE)`
    - If no state exists, return false
    - Parse JSON and validate it has `diagramName`, `content`, `timestamp`
    - Check if the diagram still exists in `getAllFiles()`
    - If diagram exists: Load content into editor, set `STORAGE_KEYS.CURRENT_DIAGRAM`, update `lastSavedContent`, call `updateWindowTitle()`, return true
    - If diagram doesn't exist: Clear `STORAGE_KEYS.EDITOR_STATE`, return false
  - Notes: Return boolean indicating success

- [x] **Task 10: Integrate restoreEditorState into initialization**
  - File: `src/js/app.js`
  - Action: Modify the initialization block inside `plantuml.initialize().then()` (lines 448-474):
    - Before `initializeDefaultFile()` call (line 451), add:
      - Call `restored = restoreEditorState()`
      - Only call `initializeDefaultFile()` if `!restored && !loadedFromUrl`
    - After all initialization, if state was restored, call `debouncedRender()` to render the loaded diagram
  - Notes: This ensures saved state is restored on page load

- [x] **Task 11: Update keyboard shortcuts**
  - File: `src/js/app.js`
  - Action: Modify keyboard shortcuts section (lines 1021-1078):
    - Change line 1023-1026 from `Ctrl+S` calling `openFilePanel('save')` to calling `handleSave()`
    - Add new shortcut after line 1026: `Ctrl+Alt+S` calls `openFilePanel('save')`
      - Use pattern: `if (e.ctrlKey && e.altKey && e.key === 's')`
  - Notes: This remaps Ctrl+S to Save and adds Ctrl+Alt+S for Save As

- [x] **Task 12: Update Save button title attribute**
  - File: `index.html`
  - Action: Modify line 63:
    - Change `title="Save As (Ctrl+S)"` to `title="Save As (Ctrl+Alt+S)"`
  - Notes: This reflects the new keyboard shortcut

- [x] **Task 13: Add notification container to HTML**
  - File: `index.html`
  - Action: Add notification container HTML after the share modal (after line 159):
    ```html
    <!-- Notification Container -->
    <div id="notification" class="fixed bottom-5 left-5 hidden transition-opacity duration-300" style="z-index: 1002;">
      <div class="px-4 py-3 rounded-lg shadow-lg flex items-center gap-2">
        <span id="notification-message"></span>
      </div>
    </div>
    ```
  - Notes: Container will be populated by `showNotification()` function

- [x] **Task 14: Add notification styles to CSS**
  - File: `src/css/app.css`
  - Action: Add notification styles after share modal styles (after line 100):
    ```css
    /* Notification Styles */
    #notification {
      transition: opacity 0.3s ease-in-out;
    }
    #notification.hidden {
      opacity: 0;
      pointer-events: none;
    }
    #notification:not(.hidden) {
      opacity: 1;
      pointer-events: auto;
    }
    ```
  - Notes: Follow existing modal transition pattern

### Acceptance Criteria

- [x] **AC 1:** Given a user has previously saved a diagram named "MyDiagram", when the user presses `Ctrl+S`, then the current editor content is saved to "MyDiagram" without showing any dialog
- [x] **AC 2:** Given a user has never saved a diagram (no current diagram tracking), when the user presses `Ctrl+S`, then the Save As modal opens
- [x] **AC 3:** Given a user has saved to diagram "MyDiagram" and makes changes, when the user presses `Ctrl+S`, then a success notification appears in the bottom-left corner saying "Saved to 'MyDiagram'"
- [x] **AC 4:** Given a user has saved to diagram "MyDiagram" and makes no changes, when the user presses `Ctrl+S`, then no notification appears (content unchanged)
- [x] **AC 5:** Given a user is working on a diagram, when the user looks at the browser tab title, then it shows "PlantUML Editor - MyDiagram"
- [x] **AC 6:** Given a user has never saved a diagram, when the user looks at the browser tab title, then it shows "PlantUML Editor" (no diagram name)
- [x] **AC 7:** Given a user presses `Ctrl+Shift+S`, when the keyboard shortcut is triggered, then the Save As modal opens
- [x] **AC 8:** Given a user is in the Save As modal and enters a file name that already exists, when the user clicks Save, then a confirmation dialog appears asking "File '{name}' already exists. Overwrite?"
- [x] **AC 9:** Given a user sees the overwrite confirmation dialog, when the user clicks "Overwrite", then the file is updated, becomes the current save target, and the modal closes
- [x] **AC 10:** Given a user sees the overwrite confirmation dialog, when the user clicks "Cancel", then the modal returns to the Save As input field
- [x] **AC 11:** Given a user opens an existing diagram using `Ctrl+O`, when the file loads, then it becomes the current save target for future `Ctrl+S` saves
- [x] **AC 12:** Given a user has saved changes to "MyDiagram" and refreshes the browser, when the page reloads, then the editor content and diagram name are restored
- [x] **AC 13:** Given a user has "MyDiagram" open in one browser tab, when the user opens "MyDiagram" in a second tab and makes changes, when the user refreshes the first tab, then the first tab shows its own state (not the second tab's changes)
- [x] **AC 14:** Given a user tries to save but the current diagram was deleted, when the user presses `Ctrl+S`, then an error notification appears and the current diagram tracking is cleared
- [x] **AC 15:** Given a user is editing a diagram, when 2 seconds pass without edits, then auto-save still saves to the default file (not to the tracked diagram)
- [x] **AC 16:** Given a user manually saves with `Ctrl+S`, when the save completes, then the editor state (diagram name + content) is persisted to localStorage for refresh recovery

## Additional Context

### Dependencies

**External Libraries:**
- None - all functionality uses existing libraries (Ace Editor, PlantUML/CheerpJ, pako for compression)

**Internal Dependencies:**
- `STORAGE_KEYS` constant object (lines 584-589)
- `getAllFiles()` function (lines 595-603)
- `saveAllFiles(files)` function (lines 609-618)
- `saveDefaultFile(content)` function (lines 624-654)
- `loadDefaultFile()` function (lines 660-667)
- `openFilePanel(mode)` function (lines 824-852)
- `handleSaveAs()` function (lines 906-935)
- `handleOpenFile(fileId)` function (lines 941-947)
- `handleDeleteFile(fileId)` function (lines 953-960)
- `editor` global variable from Ace Editor (line 7)
- `debouncedRender()` function (line 99)

**Prerequisite Tasks:**
- None - this is a standalone feature

### Testing Strategy

**Unit Testing:**
- No automated unit tests - codebase uses manual testing only
- Each function should be tested manually in browser DevTools console

**Integration Testing:**
- Test the complete Save workflow: Save As → Save → Refresh cycle
- Test keyboard shortcuts don't conflict with existing shortcuts
- Test localStorage quota handling (try saving many large diagrams)
- Test multi-tab scenario: Open same diagram in multiple tabs, make different changes, refresh each tab

**Manual Testing Checklist:**
1. **Basic Save Functionality:**
   - Create new diagram, use Save As to save as "Test1"
   - Make changes, press Ctrl+S - should save without dialog
   - Close and reopen browser - should restore "Test1"

2. **Keyboard Shortcuts:**
   - Press Ctrl+S - should trigger Save (not Save As)
   - Press Ctrl+Shift+S - should open Save As modal
   - Press Ctrl+O - should open File modal
   - Verify all existing shortcuts still work (Ctrl+Alt+N, Ctrl+Shift+U, Alt+T, Alt+R)

3. **Notifications:**
   - Save with changed content - should see green notification
   - Save without changes - should see no notification
   - Try to save when current diagram was deleted - should see red error notification

4. **Window Title:**
   - Save a diagram - title should show "PlantUML Editor - {name}"
   - Create new diagram (Ctrl+Alt+N) - title should show "PlantUML Editor"
   - Open existing file - title should update to that file's name

5. **Overwrite Confirmation:**
   - Save As with existing file name - should show confirmation dialog
   - Click Cancel - should return to input
   - Click Overwrite - should update file and close modal

6. **Multi-tab Support:**
   - Open app in two tabs
   - In Tab 1: Save as "Tab1Diagram", make changes, save
   - In Tab 2: Save as "Tab2Diagram", make changes, save
   - Refresh both tabs - each should restore its own diagram
   - Verify tabs don't interfere with each other's localStorage

7. **Auto-save Preservation:**
   - Edit a diagram for 3 seconds without saving
   - Check localStorage - default file should be updated
   - Manual Ctrl+S should save to tracked diagram, not default

8. **Error Handling:**
   - Fill localStorage to quota (if possible) - should show QuotaExceededError alert
   - Delete current diagram from localStorage, then try Ctrl+S - should show error and clear tracking
   - Try loading corrupted editor state - should fall back to default file

**Browser Compatibility:**
- Test in Chrome, Firefox, Safari, and Edge
- Verify localStorage operations work in all browsers
- Verify keyboard shortcuts work on all platforms (Windows/Mac/Linux)

### Notes

**High-Risk Items:**
- **localStorage Quota Exceeded:** If user has many large diagrams, saving could fail. Mitigation: Existing error handling in `saveAllFiles()` shows alert to user.
- **Race Conditions in Multi-tab:** Multiple tabs writing to same localStorage keys simultaneously could cause state corruption. Mitigation: Each tab maintains its own editor state, but they share the same file array. Last write wins.
- **Lost Diagram Reference:** If user deletes the current diagram file while it's still open, subsequent Ctrl+S will fail. Mitigation: Handle this gracefully by clearing current diagram tracking and showing error notification.

**Known Limitations:**
- **No Conflict Resolution:** If two tabs have the same diagram open and both save, last save wins. No merge or conflict detection.
- **Storage Size:** localStorage has ~5-10MB limit. Large diagrams or many files could hit quota.
- **No Undo:** Once a file is overwritten, there's no way to recover previous version.
- **Browser Tab Isolation:** While each tab maintains its own editor state, the underlying file array is shared. Changes to files are immediately visible to all tabs.

**Future Considerations:**
- **Auto-save to Tracked Diagram:** Currently auto-save only saves to default file. Could add option to auto-save to tracked diagram.
- **Recent Files List:** Add a "Recent Files" dropdown in the sidebar for quick access.
- **Export/Import:** Add ability to export all diagrams as JSON and import on another machine.
- **Cloud Storage:** Integrate with cloud storage (Google Drive, Dropbox) for cross-device sync.
- **Diagram History:** Add version history for each diagram with time travel.
- **Conflict Detection:** Warn user if the file was modified in another tab since they opened it.
- **Keyboard Shortcut Customization:** Allow users to remap keyboard shortcuts.

**Performance Considerations:**
- Reading/writing localStorage is synchronous and could block UI if large files. Mitigation: Files are small text, should be fast.
- `editor.getValue()` on every keystroke (for auto-save) is expensive but debounced by 2 seconds.
- Notification DOM manipulation is minimal and should be fast.

**Security Considerations:**
- All data stored in localStorage is accessible by any JavaScript on the same domain.
- No sensitive data is stored - only PlantUML diagram text.
- XSS protection: Use `escapeHtml()` when rendering file names in modals (line 967).
- No server communication - all client-side, reducing attack surface.

**Accessibility:**
- Notification should be announced to screen readers (add `role="alert"` and `aria-live="polite"`).
- Keyboard navigation should work for all modals and buttons.
- Focus management: When Save As opens, focus should be on the input field.
