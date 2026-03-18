---
title: 'Remap Ctrl+F to Enable Browser Native Find'
slug: 'remap-ctrl-f-browser-native-find'
created: '2026-03-19'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['Vanilla JavaScript (ES6+)', 'ACE Editor', 'Vite', 'Tailwind CSS v4.1.18', 'CheerpJ (Java runtime)']
files_to_modify: ['src/js/app.js']
code_patterns: ['JSDoc comments for functions', 'camelCase naming convention', 'const for immutable variables', 'Section dividers using "// ============', 'Event listeners via getElementById().addEventListener()', 'Global keyboard shortcuts in document keydown handler', 'Try-catch error handling with console.error']
test_patterns: ['No test framework in project - manual testing only']
---

# Tech-Spec: Remap Ctrl+F to Enable Browser Native Find

**Created:** 2026-03-19

## Overview

### Problem Statement

- Pressing `Ctrl+F` (or `Cmd+F` on Mac) does not show the browser's built-in Find feature
- ACE Editor captures `Ctrl+F` for its internal find dialog, preventing the browser's native find functionality from working
- Users cannot use the familiar browser find feature to search across the entire page

### Solution

- Remap ACE Editor's find command from `Ctrl+F` to `Ctrl+Shift+F` (or `Cmd+Shift+F` on Mac)
- This allows `Ctrl+F` to fall through to the browser, triggering the native find dialog
- Preserve all ACE Editor find functionality (regex, case-sensitive search, etc.) at the new shortcut

### Scope

**In Scope:**
- Remap ACE Editor's find dialog command from `Ctrl+F`/`Cmd+F` to `Ctrl+Shift+F`/`Cmd+Shift+F`
- Apply ACE Editor command remapping globally (affects entire app)
- Preserve all existing ACE find functionality at the new keyboard shortcut
- Ensure `Ctrl+F`/`Cmd+F` triggers browser's native find feature

**Out of Scope:**
- Changes to other keyboard shortcuts (Ctrl+S, Ctrl+O, etc.)
- Changes to ACE Editor's other commands or features
- UI/UX changes to find dialogs or their appearance
- Changes to the global keyboard shortcut handler in document keydown listener

## Context for Development

### Codebase Patterns

**File Structure (src/js/app.js - 1385 lines):**
- Clear section organization with `// ============` dividers separating major functionality areas
- Early initialization: ACE Editor setup happens at lines 4-10 (top of file)
- Sequential pattern: Constants/variables → Utility functions → Feature functions → Event listeners (at end)
- No existing `editor.commands` calls in codebase - this will be the first ACE command binding

**ACE Editor Initialization Pattern:**
- ACE Editor initialized at line 6: `const editor = ace.edit("editor")`
- Configuration immediately follows: `editor.setTheme()` and `editor.session.setMode()` at lines 9-10
- `ace.config.set("loadWorkerFromBlob", false)` at line 5 to disable web workers
- Editor focus called at line 38: `editor.focus()`

**Coding Style Patterns:**
- **JSDoc Comments**: All functions use JSDoc format with `@param` and `@returns` annotations
- **Naming Conventions**: camelCase for variables and functions (e.g., `currentRenderer`, `initializeTheme()`)
- **Constants**: `const` for immutable values, `let` for variables that change
- **Error Handling**: Try-catch blocks with `console.error()` for localStorage operations
- **Functions**: Pure functions preferred, side effects clearly documented

**Global State Management:**
- Uses `const` for global application state (lines 12-22): `loadedFromUrl`, `currentRenderer`, `lastSavedContent`, `currentDiagramName`
- `STORAGE_KEYS` object at line 679 centralizes localStorage key strings
- Theme/renderer preferences stored in localStorage with error handling

**ACE Command Binding Pattern:**
- Standard ACE API: `editor.commands.addCommand({ name, bindKey, exec })`
- Cross-platform key binding: `{win: 'Ctrl-...', mac: 'Command-...'}`
- Command can invoke ACE built-in commands via `editor.execCommand('commandName')`

**Keyboard Shortcut Pattern:**
- Global shortcuts handled via `document.addEventListener('keydown', ...)` at line 1318
- Pattern: Check modifiers (`e.ctrlKey`, `e.metaKey`, `e.shiftKey`, `e.altKey`), then `e.key` or `e.code`
- Use `e.preventDefault()` and `e.stopPropagation()` to override default behavior
- Early returns to prevent fallthrough
- Existing shortcuts: Ctrl+S (save), Ctrl+O (open), Ctrl+Shift+S (save as), Ctrl+Alt+N (new), Ctrl+Shift+U (share), Alt+T (theme), Alt+R (renderer), Escape (close modals)

**Event Listener Pattern:**
- Event listeners added via `document.getElementById('id').addEventListener('event', handler)`
- Event listeners grouped at end of file (lines 1267-1295)
- Global functions attached to `window` object for onclick handlers (lines 1310-1312)

### Files to Reference

| File | Purpose | Key Lines | Context |
| ---- | ------- | --------- | ------- |
| `src/js/app.js` | Main application logic, ACE Editor setup, keyboard shortcuts | Lines 4-10 (ACE initialization), Line 38 (editor focus), Line 679-685 (STORAGE_KEYS), Lines 1318-1385 (global keyboard shortcuts) | **Target file for changes** - Add command binding after line 10. File is 1385 lines with clear section organization. No existing `editor.commands` calls. |

### Technical Decisions

1. **Implementation Approach**: Use ACE Editor's `commands.addCommand()` API to bind the find command to `Ctrl+Shift+F`
   - This is the standard ACE way to override default keyboard bindings
   - More reliable than trying to capture and prevent the default `Ctrl+F` at the document level

2. **Key Binding**: Use `{win: 'Ctrl-Shift-F', mac: 'Command-Shift-F'}` for cross-platform compatibility
   - `Ctrl-Shift-F` is the standard "Find in Files" shortcut in many IDEs (VSCode, Sublime Text)
   - Mac users expect `Cmd` instead of `Ctrl` for keyboard shortcuts

3. **Command Name**: Use existing ACE command name `find` to ensure all find functionality works
   - ACE has built-in find functionality that we're just remapping
   - No need to implement custom find logic

4. **Placement**: Add command binding immediately after editor initialization (after line 9)
   - Ensures binding happens before editor is fully loaded and user interactions
   - Consistent with existing codebase pattern of configuring editor early

## Implementation Plan

### Tasks

- [x] **Task 1: Add ACE Editor command binding for find with new keyboard shortcut**
  - **File:** `src/js/app.js`
  - **Location:** After line 9 (after `editor.session.setMode("ace/mode/javascript")`)
  - **Action:** Add `editor.commands.addCommand()` call to bind find command to `Ctrl+Shift+F`
  - **Code to add:**
    ```javascript
    editor.commands.addCommand({
      name: 'find',
      bindKey: {win: 'Ctrl-Shift-F', mac: 'Command-Shift-F'},
      exec: function(editor) {
        editor.execCommand('find');
      }
    });
    ```

### Acceptance Criteria

**Scenario 1: User presses Ctrl+F (or Cmd+F on Mac)**
- **Given:** User is on any page in the application
- **When:** User presses `Ctrl+F` (Windows/Linux) or `Cmd+F` (Mac)
- **Then:** Browser's native find dialog appears
- **And:** ACE Editor's internal find dialog does NOT appear

**Scenario 2: User presses Ctrl+Shift+F (or Cmd+Shift+F on Mac)**
- **Given:** User is on any page in the application
- **When:** User presses `Ctrl+Shift+F` (Windows/Linux) or `Cmd+Shift+F` (Mac)
- **Then:** ACE Editor's internal find dialog appears
- **And:** All ACE find features are available (regex, case-sensitive, etc.)
- **And:** Browser's native find dialog does NOT appear

**Scenario 3: Verify other keyboard shortcuts still work**
- **Given:** Application is loaded
- **When:** User presses other keyboard shortcuts (Ctrl+S, Ctrl+O, Ctrl+Shift+S, etc.)
- **Then:** All existing keyboard shortcuts continue to work as before

## Additional Context

### Dependencies

- **ACE Editor**: Must be loaded and initialized before adding commands (already present at line 6)
- **No external dependencies required**: Uses ACE's built-in command system

### Testing Strategy

**Manual Testing Required:**
1. **Browser Native Find Test:**
   - Open application in browser
   - Press `Ctrl+F` (or `Cmd+F` on Mac)
   - Verify browser's native find dialog appears
   - Test searching for text on the page

2. **ACE Editor Find Test:**
   - Press `Ctrl+Shift+F` (or `Cmd+Shift+F` on Mac)
   - Verify ACE Editor's find dialog appears at the bottom of the editor
   - Test find features: regex mode, case-sensitive, whole word options

3. **Cross-Platform Test:**
   - Test on Windows/Linux (Ctrl key)
   - Test on Mac (Cmd key)
   - Verify shortcuts work correctly on each platform

4. **Regression Test:**
   - Verify all existing keyboard shortcuts still work (Ctrl+S, Ctrl+O, Ctrl+Shift+S, Ctrl+Alt+N, Ctrl+Shift+U, Alt+T, Alt+R)
   - Verify no unintended side effects on other functionality

**Browsers to Test:**
- Chrome/Chromium
- Firefox
- Safari (Mac)
- Edge (Windows)

### Notes

- ACE Editor's default `Ctrl+F` binding will be automatically overridden by the new command binding
- No changes needed to the global keyboard shortcut handler at line 1318 (ACE handles this internally)
- The `editor.execCommand('find')` call invokes ACE's built-in find functionality, ensuring all existing features work
- This is a non-breaking change - users can still access ACE find, just at a different shortcut
- Consider adding a tooltip or help text to inform users of the new shortcut (optional enhancement, not in scope)
