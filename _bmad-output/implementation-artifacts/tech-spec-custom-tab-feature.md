---
title: 'Custom Tab Feature for Multiple Diagrams'
slug: 'custom-tab-feature'
created: '2026-03-19T03:28:20+07:00'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4, 5]
tech_stack: ['Vanilla JavaScript (ES6+)', 'Vite 5.0.0', 'Tailwind CSS v4.1.18', 'ACE Editor', 'PlantUML']
files_to_modify: ['src/js/app.js', 'src/css/app.css', 'index.html']
code_patterns: ['LocalStorage with JSON serialization', 'CSS variables with theme selector', 'Event-driven architecture', 'Debounced functions', 'Modal z-index layering', 'Single ACE Editor instance', 'Keyboard shortcuts with preventDefault']
test_patterns: ['No test framework currently in use - manual testing required']
---

# Tech-Spec: Custom Tab Feature for Multiple Diagrams

**Created:** 2026-03-19T03:28:20+07:00

## Overview

### Problem Statement

Currently, the PlantUML Editor can only edit one diagram at a time per browser tab. Users need to work with multiple diagrams simultaneously within a single browser tab for better productivity and workflow efficiency.

### Solution

Implement a custom tab system that allows opening and managing multiple diagrams in a single browser tab. Tabs will be displayed horizontally at the top of the code panel (like VS Code), storing lightweight references to localStorage files. The system will integrate seamlessly with existing keyboard shortcuts (Ctrl+S, Ctrl+O, Ctrl+N) and respect the app's dark/light theme.

### Scope

**In Scope:**
- Horizontal tab strip at top of code panel (VS Code-style)
- Tab data model storing references to localStorage files
- Ctrl+O always opens diagram in a new tab
- Close buttons (×) visible on hover for each tab
- Tab limit: **15 tabs maximum** (recommended for UX performance)
- Dark/light theme styling with `cursor: pointer`
- Ctrl+S saves to the active tab's diagram
- Ctrl+O opens selected diagram as a new tab
- Ctrl+N creates a new unnamed tab with prompt for diagram name
- Keep window title as "PlantUML Editor" only (no diagram name suffix)
- Active/inactive tab styling to match app's theme

**Out of Scope:**
- Tab reordering (drag and drop)
- Tab pinning/favoriting
- Tab groups or nesting
- Cross-browser tab synchronization
- Persistence of tab order across page refreshes
- Tab history/undo for closed tabs

## Context for Development

### Codebase Patterns

**LocalStorage File Management:**
- Files stored with metadata structure: `{id, name, content, createdAt, lastModified}`
- Storage keys defined in `STORAGE_KEYS` constant: `FILES`, `DEFAULT`, `RENDERER`, `THEME`, `EDITOR_STATE`
- Functions: `getAllFiles()`, `saveFile()`, `loadFileIntoEditor()`, `deleteFile()`
- JSON serialization with error handling for quota exceeded

**Theme System:**
- CSS variables: `--preview-bg`, `--preview-text`, `--preview-border`
- Dark mode selector: `[data-theme="dark"]`
- Functions: `setTheme()`, `initializeTheme()`, `updateThemeIcon()`
- Theme stored in localStorage with key `plantuml-theme`

**Event-Driven Architecture:**
- Keyboard shortcuts via `document.addEventListener('keydown')`
- Pattern: `preventDefault()`, `stopPropagation()`, early returns
- Current shortcuts: Ctrl+S (save), Ctrl+O (open), Ctrl+Alt+N (new), Ctrl+Shift+S (save as)

**Modal System:**
- Visibility via `.hidden` class (opacity: 0, pointer-events: none)
- Z-index layering: file modal (1000), share modal (1001), overwrite modal (1002)
- Functions: `openFilePanel()`, `closeModal()`, `renderFileList()`

**ACE Editor Integration:**
- Single global instance: `const editor = ace.edit("editor")`
- Content management: `editor.setValue(content, -1)`, `editor.getValue()`
- Theme: `"ace/theme/monokai"`, mode: `"ace/mode/javascript"`

**Current State Tracking:**
- `currentDiagramName` - tracks active diagram for this browser tab
- `lastSavedContent` - tracks content for change detection
- `loadedFromUrl` - tracks if content was loaded from URL fragment

**Notification System:**
- Toast notifications with 3-second auto-dismiss
- Functions: `showNotification(message, type)` where type is 'success' or 'error'
- Timer tracking to prevent race conditions

**Debounced Functions:**
- Pattern: `const debouncedRender = debounce(() => _render())` (400ms delay)
- Auto-save: `debouncedAutoSave` (2 second delay)

**Mobile Responsiveness:**
- Breakpoint at 811px (`max-w-810` Tailwind classes)
- Mobile code/preview tabs with `switchTab()` function
- Existing tab system uses: `activeTab = 'code' | 'preview'`

### Files to Reference

| File | Purpose | Key Functions/Patterns |
| ---- | ------- | ---------------------- |
| `src/js/app.js` | Main application logic (1396 lines) | Tab system integration, file management, keyboard shortcuts, state management |
| `src/css/app.css` | Theme variables and modal states (116 lines) | CSS custom properties, dark mode selector, modal visibility |
| `index.html` | DOM structure and modal containers | Tab strip container placement, button layout, modal structure |
| `vite.config.ts` | Vite build configuration | Entry points, output naming, Tailwind plugin |

### Technical Decisions

**Tab System Architecture:**
- **Data Model**: Array of tab objects storing localStorage file references (lightweight)
  ```javascript
  // Tab structure: { id, fileId, name, isActive, isUnsaved }
  let tabs = []
  let activeTabId = null
  ```
- **Tab Limit**: 15 tabs maximum (enforce with user notification)
- **Placement**: Horizontal strip at top of code panel (inside `#sidebar`, above `#editor`)
- **Close Button**: Visible on hover only (maintains clean UI)

**Theme Integration:**
- Use existing CSS variables: `--preview-bg`, `--preview-text`, `--preview-border`
- Add new tab-specific variables if needed
- Follow existing `[data-theme="dark"]` selector pattern
- Maintain brand color consistency: `#1A4F63` (primary), `#4A8E4D` (header green)

**Keyboard Shortcut Modifications:**
- **Ctrl+S**: Save to active tab's diagram (update `handleSave()` to use active tab)
- **Ctrl+O**: Open as new tab (modify `handleOpenFile()` to create tab instead of replacing)
- **Ctrl+Alt+N**: Create new tab with name prompt (modify `handleNew()` to prompt for name)
- **Ctrl+W**: Close current tab (new shortcut, optional enhancement)

**Window Title Behavior:**
- Remove diagram name suffix from `updateWindowTitle()` function
- Keep title as "PlantUML Editor" only
- Update function to always return static title

**Content Management:**
- Before tab switch: Save current content to current tab's localStorage file
- After tab switch: Load new tab's content via `editor.setValue()`
- Update `currentDiagramName` to match active tab
- Maintain existing auto-save behavior (2-second debounce)

## Implementation Plan

### Tasks

**Task 1: Add tab data model and state management variables**
- File: `src/js/app.js`
- Location: After line 32 (after `currentDiagramName` declaration)
- Action: Add the following code:
  ```javascript
  // Custom tab system for managing multiple diagrams
  const MAX_TABS = 15
  let tabs = [] // Array of tab objects: { id, fileId, name, isUnsaved }
  let activeTabId = null // ID of currently active tab
  ```
- Notes: These variables will track the tab state. Place them after the existing state tracking variables for consistency.

**Task 2: Add tab CRUD functions**
- File: `src/js/app.js`
- Location: After line 113 (after `updateWindowTitle()` function, before `loadFromUrl()`)
- Action: Add the following functions:
  ```javascript
  /**
   * Generate a unique tab ID
   * @returns {string} Unique tab ID
   */
  function generateTabId() {
    return 'tab-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11)
  }

  /**
   * Create a new tab
   * @param {string} fileId - localStorage file ID
   * @param {string} name - Tab display name
   * @returns {string} New tab ID
   */
  function createTab(fileId, name) {
    if (tabs.length >= MAX_TABS) {
      showNotification(`Maximum tab limit (${MAX_TABS}) reached`, 'error')
      return null
    }

    const tabId = generateTabId()
    const newTab = {
      id: tabId,
      fileId: fileId,
      name: name,
      isUnsaved: false
    }

    tabs.push(newTab)
    return tabId
  }

  /**
   * Switch to a different tab
   * @param {string} tabId - ID of tab to switch to
   */
  function switchToTab(tabId) {
    const tab = tabs.find(t => t.id === tabId)
    if (!tab) {
      console.error('Tab not found:', tabId)
      return
    }

    // Save current tab content before switching
    if (activeTabId) {
      const currentTab = tabs.find(t => t.id === activeTabId)
      if (currentTab) {
        // Save current content to the tab's file
        const content = editor.getValue()
        const files = getAllFiles()
        const fileIndex = files.findIndex(f => f.id === currentTab.fileId)

        if (fileIndex >= 0) {
          files[fileIndex].content = content
          files[fileIndex].lastModified = new Date().toISOString()
          saveAllFiles(files)
        }
      }
    }

    // Load new tab's content
    const files = getAllFiles()
    const file = files.find(f => f.id === tab.fileId)

    if (file) {
      editor.setValue(file.content, -1)
      currentDiagramName = file.name
      lastSavedContent = file.content
    }

    // Update active tab
    activeTabId = tabId

    // Re-render tabs
    renderTabs()
    debouncedRender()
  }

  /**
   * Close a tab
   * @param {string} tabId - ID of tab to close
   */
  function closeTab(tabId) {
    const tabIndex = tabs.findIndex(t => t.id === tabId)
    if (tabIndex === -1) return

    // Don't allow closing the last tab
    if (tabs.length === 1) {
      showNotification('Cannot close the last tab', 'error')
      return
    }

    const wasActive = tabId === activeTabId

    // Remove the tab
    tabs.splice(tabIndex, 1)

    // If we closed the active tab, switch to another
    if (wasActive) {
      const newActiveIndex = Math.min(tabIndex, tabs.length - 1)
      activeTabId = tabs[newActiveIndex].id
      switchToTab(activeTabId)
    } else {
      renderTabs()
    }
  }

  /**
   * Get the active tab object
   * @returns {Object|null} Active tab object or null
   */
  function getActiveTab() {
    return tabs.find(t => t.id === activeTabId) || null
  }
  ```
- Notes: These functions provide the core tab management functionality. They integrate with the existing localStorage file system.

**Task 3: Add tab rendering function**
- File: `src/js/app.js`
- Location: After the tab CRUD functions (after Task 2)
- Action: Add the following function:
  ```javascript
  /**
   * Render the tab strip UI
   */
  function renderTabs() {
    const tabsContainer = document.getElementById('diagram-tabs')
    if (!tabsContainer) return

    if (tabs.length === 0) {
      tabsContainer.innerHTML = ''
      return
    }

    tabsContainer.innerHTML = tabs.map(tab => {
      const isActive = tab.id === activeTabId
      const activeClass = isActive ? 'tab-active' : 'tab-inactive'

      return `
        <div class="diagram-tab ${activeClass}" data-tab-id="${tab.id}">
          <span class="tab-name">${escapeHtml(tab.name)}</span>
          <button class="tab-close" onclick="closeTab('${tab.id}')" title="Close tab">×</button>
        </div>
      `
    }).join('')
  }

  // Make closeTab globally accessible for onclick handlers
  window.closeTab = closeTab
  ```
- Notes: This function generates the HTML for the tab strip. It uses the existing `escapeHtml()` function for XSS prevention.

**Task 4: Add tab strip container to HTML**
- File: `index.html`
- Location: Inside `#sidebar`, after the header container (after line 91), before the editor div
- Action: Add the following HTML:
  ```html
  <!-- Custom Tab Strip for Multiple Diagrams -->
  <div id="diagram-tabs" class="diagram-tabs-container">
    <!-- Tabs will be rendered here by JavaScript -->
  </div>
  ```
- Notes: Place this container between the header buttons and the editor div. It should be inside the `.flex.flex-col.h-full.text-white` div.

**Task 5: Add tab styling to CSS**
- File: `src/css/app.css`
- Location: After the responsive overrides section (after line 115)
- Action: Add the following CSS:
  ```css
  /* ============================================================================
     CUSTOM TAB STRIP FOR MULTIPLE DIAGRAMS
     ============================================================================ */

  /* Tab container - horizontal strip */
  .diagram-tabs-container {
    display: flex;
    flex-direction: row;
    overflow-x: auto;
    overflow-y: hidden;
    background-color: #1a3a4a;
    border-bottom: 1px solid var(--preview-border, #e5e7eb);
    gap: 2px;
    padding: 4px 8px 0 8px;
    min-height: 36px;
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  }

  /* Dark theme tab container */
  [data-theme="dark"] .diagram-tabs-container {
    background-color: #0d1f2a;
    border-bottom: 1px solid var(--preview-border, #333333);
  }

  /* Individual tab */
  .diagram-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 6px 12px;
    border-radius: 4px 4px 0 0;
    cursor: pointer;
    user-select: none;
    white-space: nowrap;
    transition: background-color 0.2s ease;
    min-width: 100px;
    max-width: 200px;
  }

  /* Tab name - truncate with ellipsis */
  .diagram-tab .tab-name {
    flex: 1;
    overflow: hidden;
    text-overflow: ellipsis;
    font-size: 13px;
  }

  /* Tab close button - hidden by default, visible on hover */
  .diagram-tab .tab-close {
    display: none;
    background: none;
    border: none;
    color: inherit;
    font-size: 18px;
    line-height: 1;
    padding: 0;
    width: 16px;
    height: 16px;
    cursor: pointer;
    opacity: 0.7;
    transition: opacity 0.2s ease;
  }

  .diagram-tab:hover .tab-close {
    display: block;
  }

  .diagram-tab .tab-close:hover {
    opacity: 1;
  }

  /* Active tab styling */
  .diagram-tab.tab-active {
    background-color: #2d5a6a;
    color: #ffffff;
    border-bottom: 2px solid #4A8E4D;
  }

  /* Dark theme active tab */
  [data-theme="dark"] .diagram-tab.tab-active {
    background-color: #1a3a4a;
    color: #f1f5f9;
    border-bottom: 2px solid #4A8E4D;
  }

  /* Inactive tab styling */
  .diagram-tab.tab-inactive {
    background-color: #1a3a4a;
    color: #d1d5db;
  }

  [data-theme="dark"] .diagram-tab.tab-inactive {
    background-color: #0d1f2a;
    color: #9ca3af;
  }

  /* Hover effects for inactive tabs */
  .diagram-tab.tab-inactive:hover {
    background-color: #244a58;
  }

  [data-theme="dark"] .diagram-tab.tab-inactive:hover {
    background-color: #1a3a4a;
  }

  /* Mobile responsiveness for tabs */
  @media (max-width: 810px) {
    .diagram-tabs-container {
      min-height: 40px;
      padding: 6px 8px 0 8px;
    }

    .diagram-tab {
      padding: 8px 12px;
      min-width: 80px;
    }

    .diagram-tab .tab-name {
      font-size: 12px;
    }
  }

  /* Custom scrollbar for tab container */
  .diagram-tabs-container::-webkit-scrollbar {
    height: 6px;
  }

  .diagram-tabs-container::-webkit-scrollbar-track {
    background: transparent;
  }

  .diagram-tabs-container::-webkit-scrollbar-thumb {
    background-color: rgba(255, 255, 255, 0.2);
    border-radius: 3px;
  }

  .diagram-tabs-container::-webkit-scrollbar-thumb:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
  ```
- Notes: This styling integrates with the existing theme system using CSS variables. The tabs match the app's color scheme and include proper dark/light mode support.

**Task 6: Add tab click event delegation**
- File: `src/js/app.js`
- Location: After the `renderTabs()` function (after Task 3)
- Action: Add the following event listener:
  ```javascript
  // Add click event delegation for tabs
  document.addEventListener('DOMContentLoaded', () => {
    const tabsContainer = document.getElementById('diagram-tabs')
    if (tabsContainer) {
      tabsContainer.addEventListener('click', (e) => {
        const tab = e.target.closest('.diagram-tab')
        if (tab && !e.target.classList.contains('tab-close')) {
          const tabId = tab.getAttribute('data-tab-id')
          if (tabId) {
            switchToTab(tabId)
          }
        }
      })
    }
  })
  ```
- Notes: This uses event delegation to handle tab clicks efficiently. It checks if the click is on a tab (but not the close button) before switching.

**Task 7: Initialize tab system on page load**
- File: `src/js/app.js`
- Location: Inside the `plantuml.initialize()` promise (around line 577), after the editor is initialized
- Action: Add the following code after `initializeCopyrightYear()`:
  ```javascript
  // Initialize custom tab system
  initializeTabs()
  ```
- Notes: This should be added after the other initialization functions. Note that `initializeTabs()` already exists for mobile code/preview tabs, so we need to rename the new function to avoid conflicts. Let's call it `initializeDiagramTabs()` instead.

**Correction for Task 7:**
- File: `src/js/app.js`
- Location: Inside the `plantuml.initialize()` promise (around line 570), after `initializeCopyrightYear()`
- Action: Add the following function before the plantuml.initialize() call, then call it:
  ```javascript
  /**
   * Initialize custom diagram tab system
   */
  function initializeDiagramTabs() {
    // Create initial tab with default content or restored state
    const files = getAllFiles()
    const defaultFile = files.find(f => f.id === 'default')

    if (defaultFile) {
      const tabId = createTab('default', 'Untitled')
      if (tabId) {
        activeTabId = tabId
      }
    }

    renderTabs()
  }
  ```
- Then add the call after `initializeCopyrightYear()`:
  ```javascript
  // Initialize custom diagram tab system
  initializeDiagramTabs()
  ```

**Task 8: Modify handleSave() to save to active tab**
- File: `src/js/app.js`
- Location: Modify the `handleSave()` function (around line 765)
- Action: Update the function to use the active tab:
  ```javascript
  function handleSave() {
    const activeTab = getActiveTab()

    // If no active tab or tab has no file, fallback to Save As
    if (!activeTab) {
      openFilePanel('save')
      return
    }

    const files = getAllFiles()
    const diagramIndex = files.findIndex(f => f.id === activeTab.fileId)

    // Validate diagram still exists
    if (diagramIndex === -1) {
      showNotification(`Current diagram '${activeTab.name}' no longer exists`, 'error')
      closeTab(activeTab.id)
      return
    }

    const content = editor.getValue()

    // Update file content and timestamp
    files[diagramIndex].content = content
    files[diagramIndex].lastModified = new Date().toISOString()

    try {
      saveAllFiles(files)

      // Compare content with last saved content
      if (content !== lastSavedContent) {
        showNotification(`Saved to '${activeTab.name}'`, 'success')
        lastSavedContent = content
      }

      // Save editor state for refresh recovery
      const editorState = {
        diagramName: activeTab.name,
        content: content,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEYS.EDITOR_STATE, JSON.stringify(editorState))

      // Update window title (keep it static)
      updateWindowTitle(null)
    } catch (error) {
      console.error('Error saving diagram:', error)
      showNotification('Failed to save diagram', 'error')
    }
  }
  ```
- Notes: This modifies the existing function to use the active tab instead of `currentDiagramName`. The window title is kept static as per requirements.

**Task 9: Modify handleOpenFile() to open in new tab**
- File: `src/js/app.js`
- Location: Modify the `handleOpenFile()` function (around line 1223)
- Action: Update the function to create a new tab:
  ```javascript
  function handleOpenFile(fileId) {
    const files = getAllFiles()
    const file = files.find(f => f.id === fileId)

    if (!file) {
      console.warn('File not found:', fileId)
      return
    }

    // Create a new tab for this file
    const tabId = createTab(fileId, file.name)

    if (!tabId) {
      // Tab limit reached or other error
      return
    }

    // Switch to the new tab
    switchToTab(tabId)

    // Close the modal
    closeModal()
    debouncedRender()
  }
  ```
- Notes: This changes the behavior from replacing the current tab to always creating a new tab.

**Task 10: Modify handleNew() to prompt for diagram name**
- File: `src/js/app.js`
- Location: Modify the `handleNew()` function (around line 465)
- Action: Update the function to prompt for a name:
  ```javascript
  function handleNew() {
    const defaultTemplate = '@startuml\nBob -> Alice: Hello!\n@enduml';

    // Prompt for diagram name
    const diagramName = prompt('Enter a name for the new diagram:', 'Untitled Diagram')

    // Cancel if user cancels or enters empty name
    if (!diagramName || diagramName.trim() === '') {
      return
    }

    // Create a new file in localStorage
    const newFile = saveFile(diagramName.trim(), defaultTemplate)

    if (!newFile) {
      showNotification('Failed to create new diagram', 'error')
      return
    }

    // Create a new tab for this file
    const tabId = createTab(newFile.id, newFile.name)

    if (!tabId) {
      return
    }

    // Switch to the new tab
    switchToTab(tabId)
    editor.focus()
  }
  ```
- Notes: This changes from a confirmation dialog to a prompt for the diagram name, then creates both a file and a tab.

**Task 11: Remove diagram name from window title**
- File: `src/js/app.js`
- Location: Modify the `updateWindowTitle()` function (around line 246)
- Action: Simplify the function to always return the static title:
  ```javascript
  /**
   * Update window title (always static now)
   * @param {string} diagramName - Ignored, kept for backward compatibility
   */
  function updateWindowTitle(_diagramName) {
    document.title = 'PlantUML Editor'
  }
  ```
- Notes: The parameter is renamed with underscore to indicate it's intentionally unused, maintaining backward compatibility with existing calls.

**Task 12: Add Ctrl+W shortcut to close current tab**
- File: `src/js/app.js`
- Location: In the keyboard shortcuts event listener (around line 1328)
- Action: Add the following case after the Ctrl+Alt+N handler:
  ```javascript
  // Ctrl+W - Close current tab
  if (e.ctrlKey && !e.altKey && !e.shiftKey && e.key === 'w') {
    e.preventDefault()
    const activeTab = getActiveTab()
    if (activeTab) {
      closeTab(activeTab.id)
    }
    return
  }
  ```
- Notes: This is an optional enhancement for better UX, following common tab management patterns.

### Acceptance Criteria

**Tab System Initialization:**
- [ ] AC-1: Given the user has the PlantUML Editor open, when the page loads, then a default tab should be displayed with "Untitled" name and default template content
- [ ] AC-2: Given the user has the PlantUML Editor open with previously saved state, when the page loads, then the last active tab should be restored with its content

**Tab Creation:**
- [ ] AC-3: Given the user has the editor open with one or more tabs, when the user presses Ctrl+O and selects a diagram from the file list, then a new tab should open with that diagram's content, the new tab should become active, and the file modal should close
- [ ] AC-4: Given the user has the editor open, when the user presses Ctrl+N and enters a diagram name in the prompt, then a new file should be created in localStorage, a new tab should open with default template content, and the new tab should become active
- [ ] AC-5: Given the user has 15 tabs open, when the user attempts to open a 16th tab (via Ctrl+O or Ctrl+N), then a notification should display "Maximum tab limit (15) reached" and no new tab should be created

**Tab Switching:**
- [ ] AC-6: Given the user has multiple tabs open with different content, when the user clicks on an inactive tab, then that tab should become active, the editor should load that tab's diagram content, and the active tab should be visually distinct (different background color and bottom border)
- [ ] AC-7: Given the user has multiple tabs open and has made unsaved changes to the current tab, when the user switches to a different tab, then the unsaved changes should be automatically saved to the current tab's localStorage file before switching

**Tab Closure:**
- [ ] AC-8: Given the user has multiple tabs open, when the user hovers over any tab, then a close button (×) should appear on that tab with proper opacity and cursor styling
- [ ] AC-9: Given the user has multiple tabs open, when the user clicks the close button on an inactive tab, then that tab should be removed from the tab strip and the currently active tab should remain active
- [ ] AC-10: Given the user has multiple tabs open, when the user clicks the close button on the active tab, then that tab should be closed and another tab should become active (prioritize the tab to the right, or left if closing the rightmost tab)
- [ ] AC-11: Given the user has only one tab open, when the user attempts to close it, then a notification should display "Cannot close the last tab" and the tab should remain open
- [ ] AC-12: Given the user has multiple tabs open, when the user presses Ctrl+W, then the current tab should close using the same logic as clicking the close button

**Save Functionality:**
- [ ] AC-13: Given the user has multiple tabs open, when the user presses Ctrl+S, then only the active tab's diagram should be saved to localStorage, a success notification should display "Saved to '{diagram name}'", and the window title should remain "PlantUML Editor"
- [ ] AC-14: Given the user has a newly created tab that hasn't been saved yet, when the user presses Ctrl+S, then the Save As modal should open to prompt for a file name

**Window Title:**
- [ ] AC-15: Given the user has any tab open (saved or unsaved), when the user views the browser window title, then it should always display "PlantUML Editor" without any diagram name suffix

**Theme Integration:**
- [ ] AC-16: Given the user has dark theme enabled, when viewing tabs, then tabs should use dark theme colors (background: #0d1f2a for inactive, #1a3a4a for active), text should be #f1f5f9 for active and #9ca3af for inactive, borders should use #333333, and the active tab should have a #4A8E4D bottom border
- [ ] AC-17: Given the user has light theme enabled, when viewing tabs, then tabs should use light theme colors (background: #1a3a4a for inactive, #2d5a6a for active), text should be #ffffff for active and #d1d5db for inactive, borders should use #e5e7eb, and the active tab should have a #4A8E4D bottom border
- [ ] AC-18: Given the user is viewing tabs in either theme, when the user toggles between light and dark themes, then the tab colors should immediately update to match the new theme

**Tab Styling and Interaction:**
- [ ] AC-19: Given the user is viewing any tab, when the user hovers over an inactive tab, then the tab background should lighten slightly and the cursor should change to pointer
- [ ] AC-20: Given the user is viewing any tab, when the user hovers over the close button (×), then the close button opacity should increase to 100%
- [ ] AC-21: Given the user has many tabs open that exceed the visible width, when the user views the tab strip, then a horizontal scrollbar should appear (using theme-appropriate styling) to allow navigation to all tabs

**Mobile Responsiveness:**
- [ ] AC-22: Given the user is on a mobile device (screen width ≤ 810px), when viewing tabs, then the tab strip should maintain proper touch targets (minimum 40px height), tab names should use appropriate font size (12px), and close buttons should remain accessible on touch

**Error Handling:**
- [ ] AC-23: Given the user attempts to switch to a tab whose file has been deleted from localStorage, when the switch is attempted, then an error notification should display "Current diagram '{name}' no longer exists", the tab should be closed, and another tab should become active
- [ ] AC-24: Given the user attempts to save a tab and localStorage quota is exceeded, when the save is attempted, then an error notification should display "LocalStorage quota exceeded. Please delete some old files to free up space" and the save should fail gracefully

## Additional Context

### Dependencies

**Internal Dependencies:**
- Existing localStorage file management system (`STORAGE_KEYS`, `getAllFiles()`, `saveFile()`, `loadFileIntoEditor()`, `deleteFile()`)
- ACE Editor instance (`const editor = ace.edit("editor")`)
- Theme CSS variables (`--preview-bg`, `--preview-text`, `--preview-border`)
- Modal system (`openFilePanel()`, `closeModal()`, `renderFileList()`)
- Notification system (`showNotification(message, type)`)
- Keyboard shortcut event listener (`document.addEventListener('keydown')`)
- Debounced render function (`debouncedRender()`)

**External Dependencies:**
- ACE Editor library (already loaded via `/js/ace.js`)
- Tailwind CSS v4.1.18 (already configured)
- Vite build system (already configured)

**Task Dependencies:**
- Task 1 (data model) must be completed before Task 2 (tab CRUD functions)
- Task 2 (tab CRUD functions) must be completed before Task 3 (renderTabs function)
- Task 4 (HTML container) and Task 5 (CSS styling) can be done in parallel with JavaScript tasks
- Task 6 (event delegation) requires Task 3 to be completed
- Task 7 (initialization) requires all previous tasks to be completed
- Tasks 8-12 (modifications to existing functions) can be done in any order after Task 7

### Testing Strategy

**Manual Testing Checklist:**

**1. Tab Creation and Initialization:**
- [ ] Open the application - verify a default "Untitled" tab appears
- [ ] Press Ctrl+O, select a diagram - verify new tab opens and becomes active
- [ ] Press Ctrl+N, enter a name - verify new tab is created with that name
- [ ] Try to create a 16th tab - verify error notification appears

**2. Tab Switching:**
- [ ] Create 3 tabs with different content
- [ ] Click between tabs - verify content switches correctly
- [ ] Make changes in one tab, switch to another, then back - verify changes were saved
- [ ] Verify the active tab has distinct visual styling (different background, bottom border)

**3. Tab Closure:**
- [ ] Hover over tabs - verify close button (×) appears
- [ ] Close an inactive tab - verify it closes and active tab remains
- [ ] Close the active tab - verify it closes and another tab becomes active
- [ ] Try to close the last tab - verify error notification appears
- [ ] Press Ctrl+W - verify current tab closes
- [ ] Close a tab whose file was deleted - verify error notification and tab closure

**4. Save Functionality:**
- [ ] Create content in one tab, press Ctrl+S - verify "Saved to '{name}'" notification
- [ ] Verify only active tab is saved (check other tabs' content is unchanged)
- [ ] Create new tab without saving, press Ctrl+S - verify Save As modal opens
- [ ] Verify window title always shows "PlantUML Editor" (no diagram name)

**5. Theme Integration:**
- [ ] Switch to dark theme - verify tabs use dark colors
- [ ] Switch to light theme - verify tabs use light colors
- [ ] Toggle themes back and forth - verify tab colors update immediately
- [ ] Verify active tab is visually distinct in both themes

**6. Keyboard Shortcuts:**
- [ ] Ctrl+S - verify saves active tab only
- [ ] Ctrl+O - verify opens in new tab
- [ ] Ctrl+N - verify prompts for name and creates new tab
- [ ] Ctrl+W - verify closes current tab

**7. Mobile Responsiveness:**
- [ ] Resize browser to mobile width (≤810px)
- [ ] Verify tabs are properly sized and accessible
- [ ] Verify close buttons remain tappable
- [ ] Verify horizontal scrollbar appears when needed

**8. Edge Cases:**
- [ ] Open the same diagram multiple times - verify each creates a new tab
- [ ] Switch tabs rapidly - verify no race conditions or content corruption
- [ ] Fill localStorage to quota limit - verify graceful error handling
- [ ] Reload page after creating tabs - verify default tab appears (persistence not required)

**Unit Testing (Future Enhancement):**
- No test framework currently in use
- Consider adding Jest or Vitest for future development
- Unit tests should cover:
  - Tab CRUD functions (`createTab()`, `switchToTab()`, `closeTab()`, `getActiveTab()`)
  - Tab limit enforcement
  - Theme variable application
  - XSS prevention in `escapeHtml()` for tab names

### Notes

**High-Risk Items (Pre-Mortem Analysis):**
1. **Name Conflict**: Existing mobile tab system uses `activeTab` variable - must avoid conflicts with custom diagram tabs. **Mitigation**: Use `activeTabId` for diagram tabs and keep `activeTab` for mobile code/preview tabs.
2. **Race Conditions**: Rapid tab switching could cause content corruption if auto-save interferes. **Mitigation**: The current auto-save has a 2-second debounce, which should prevent most conflicts. Tab switching saves synchronously before loading new content.
3. **Memory Leaks**: Not cleaning up event listeners when tabs close. **Mitigation**: Use event delegation (single listener on container) rather than per-tab listeners.
4. **XSS Vulnerability**: Tab names are rendered as HTML. **Mitigation**: Use existing `escapeHtml()` function for all user-provided tab names.

**Known Limitations:**
1. **No Persistence**: Tabs don't persist across page refreshes. Each load starts with a single "Untitled" tab.
2. **No Tab Reordering**: Users cannot drag tabs to reorder them.
3. **No Duplicate Detection**: Opening the same file multiple times creates duplicate tabs.
4. **No Unsaved Changes Indicator**: No visual indicator shows which tabs have unsaved changes.
5. **Mobile Tab Bar**: On very small screens, many tabs may crowd the interface.

**Future Enhancements (Out of Scope):**
1. **Tab Reordering**: Drag and drop to reorder tabs
2. **Tab Persistence**: Save/restore tab state across page refreshes
3. **Unsaved Changes Indicator**: Visual dot or asterisk for unsaved tabs
4. **Tab Pinning**: Pin important tabs to prevent accidental closure
5. **Tab Groups**: Organize tabs into groups for complex workflows
6. **Keyboard Navigation**: Ctrl+Tab / Ctrl+Shift+Tab to cycle through tabs
7. **Tab Context Menu**: Right-click menu with options like "Close Other Tabs", "Close Tabs to Right"

**Performance Considerations:**
- Tab rendering uses efficient DOM updates (rebuild innerHTML on changes)
- Tab content is loaded from localStorage only when switching (not preloaded)
- Event delegation minimizes listener overhead
- CSS transitions are GPU-accelerated (opacity and transform properties)
- Horizontal scrollbar uses native browser implementation for smooth scrolling

**Accessibility Considerations:**
- Tabs should be keyboard accessible (add tabindex, keyboard navigation)
- Close buttons should have proper aria-labels
- Active tab should have aria-selected="true"
- Tab strip should have role="tablist"
- Individual tabs should have role="tab"
- Consider adding keyboard shortcuts: Ctrl+1-9 for quick tab access

**Browser Compatibility:**
- Requires ES6+ (spread operator, template literals, arrow functions)
- CSS custom properties (supported in all modern browsers)
- Flexbox (supported in all modern browsers)
- Test in Chrome, Firefox, Safari, and Edge
- Mobile Safari may have special handling needed for touch events
