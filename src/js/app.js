// load parameters
const pathname = window.location.pathname.match(/^.*[\/]/)[0] // until the trailing slash, do not include the filename

// set up editor
ace.config.set("loadWorkerFromBlob", false)

const editor = ace.edit("editor")

editor.setTheme("ace/theme/monokai")
editor.session.setMode("ace/mode/javascript")

// Remap ACE Editor's find command from Ctrl+F to Ctrl+Shift+F
// This allows Ctrl+F to trigger the browser's native find feature
editor.commands.addCommand({
  name: 'find',
  bindKey: {win: 'Ctrl-Shift-F', mac: 'Command-Shift-F'},
  exec: function(editor) {
    editor.execCommand('find');
  }
});

// Track if we loaded content from URL (to prevent overwriting with default)
let loadedFromUrl = false

// Track current renderer state
let currentRenderer = 'frontend' // 'frontend' or 'backend'

// Track last saved content for change detection
let lastSavedContent = ''

// Track current diagram name for this tab (not shared across tabs)
let currentDiagramName = null

// Load shared diagram from URL fragment (new format: #/${encoded})
const hash = window.location.hash
if (hash && hash.startsWith('#/')) {
  const encoded = hash.substring(2) // Remove '#/'
  try {
    const decoded = decodePlantuml(encoded)
    if (decoded) {
      editor.setValue(decoded, -1)
      loadedFromUrl = true
    }
  } catch (error) {
    console.error('Failed to decode shared diagram:', error)
  }
}
editor.focus()

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

function debounce(func, delay = 400) {
  let timerId

  return (...args) => {
    clearTimeout(timerId)
    timerId = setTimeout(() => {
      func.apply(this, args)
    }, delay)
  };
}

const debouncedRender = debounce(() => _render())

// ============================================================================
// THEME TOGGLER
// ============================================================================

/**
 * Initialize theme based on saved preference or system preference
 */
function initializeTheme() {
  try {
    const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = savedTheme || (prefersDark ? 'dark' : 'light');
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
  } catch (error) {
    console.error('Error reading theme preference:', error);
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    const currentTheme = prefersDark ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', currentTheme);
    updateThemeIcon(currentTheme);
  }
}

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

/**
 * Initialize copyright year with current year
 */
function initializeCopyrightYear() {
  const copyrightYearSpan = document.getElementById('copyright-year');
  if (copyrightYearSpan) {
    copyrightYearSpan.textContent = new Date().getFullYear();
  }
}

/**
 * Set theme and update icon
 * @param {string} theme - 'light' or 'dark'
 */
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  try {
    localStorage.setItem(STORAGE_KEYS.THEME, theme);
  } catch (error) {
    console.error('Error saving theme preference:', error);
  }
  updateThemeIcon(theme);
}

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

/**
 * Update theme toggle button icon
 * @param {string} theme - 'light' or 'dark'
 */
function updateThemeIcon(theme) {
  const themeIcon = document.getElementById('theme-icon')
  if (!themeIcon) return

  if (theme === 'dark') {
    // Show sun icon (clicking will switch to light)
    themeIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
      </svg>
    `
  } else {
    // Show moon icon (clicking will switch to dark)
    themeIcon.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" class="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
      </svg>
    `
  }
}

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

/**
 * Update window title with diagram name
 * @param {string} diagramName - Name of the current diagram, or null/undefined to reset
 */
function updateWindowTitle(diagramName) {
  if (diagramName && diagramName.trim()) {
    document.title = `PlantUML Editor - ${diagramName}`
  } else {
    document.title = 'PlantUML Editor'
  }
}

async function loadFromUrl(url){
  window.location.hash = `#example=${url}`

  const response = await fetch(url)
  const pumlContent = await response.text()

  editor.setValue(pumlContent, -1)
  editor.focus()
}

const debouncedLoadFromUrl = debounce((url) => loadFromUrl(url))
const jarPath = "/app" + pathname + "jar"

// ============================================================================
// SHARE FUNCTIONALITY
// ============================================================================

/**
 * Encode PlantUML content using URL-safe base64 encoding
 * @param {string} text - PlantUML text to encode
 * @returns {string} URL-safe base64 encoded string
 */
function encodePlantuml(text) {
  // Use browser's built-in btoa with UTF-8 handling
  const utf8Bytes = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (_match, p1) => {
    return String.fromCharCode('0x' + p1)
  })
  const base64 = btoa(utf8Bytes)
  // Make it URL-safe
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

/**
 * Decode PlantUML content from URL-safe base64 encoding
 * @param {string} encoded - URL-safe base64 encoded string
 * @returns {string} Decoded PlantUML text
 */
function decodePlantuml(encoded) {
  // Restore base64 format
  let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
  // Add padding if needed
  while (base64.length % 4) {
    base64 += '='
  }
  // Decode
  const utf8Bytes = atob(base64)
  return decodeURIComponent(utf8Bytes.split('').map(c => {
    return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)
  }).join(''))
}

/**
 * Generate shareable URL with encoded PlantUML content
 * @returns {string} Full shareable URL
 */
function generateShareUrl() {
  // Check if editor exists
  if (!editor || typeof editor.getValue !== 'function') {
    console.error('Editor not initialized')
    return null
  }

  const plantumlContent = editor.getValue()
  const encoded = encodePlantuml(plantumlContent)
  const baseUrl = window.location.origin + window.location.pathname
  const fullUrl = `${baseUrl}#/${encoded}`

  // Warn if URL is getting too long (browsers typically support ~2000-8000 chars)
  const MAX_SAFE_URL_LENGTH = 6000
  if (fullUrl.length > MAX_SAFE_URL_LENGTH) {
    console.warn(`Generated URL is ${fullUrl.length} characters. Some browsers may have issues with URLs over ${MAX_SAFE_URL_LENGTH} characters.`)
  }

  return fullUrl
}

/**
 * Copy text to clipboard using modern Clipboard API
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
    return false
  }
}

// Track auto-dismiss timer to prevent race conditions
let shareModalTimer = null
let notificationTimer = null

/**
 * Show share notification modal with URL
 * @param {string} url - Shareable URL
 * @param {boolean} copySuccess - Whether clipboard copy succeeded
 */
function showShareNotification(url, copySuccess = true) {
  const shareModal = document.getElementById('share-modal')
  const shareUrlInput = document.getElementById('share-url')
  const successMessage = document.getElementById('share-success-message')
  const errorMessage = document.getElementById('share-error-message')

  // Clear any existing timer to prevent race conditions
  if (shareModalTimer !== null) {
    clearTimeout(shareModalTimer)
    shareModalTimer = null
  }

  // Set URL in input
  shareUrlInput.value = url

  // Show appropriate message
  if (copySuccess) {
    successMessage.classList.remove('hidden')
    errorMessage.classList.add('hidden')
  } else {
    successMessage.classList.add('hidden')
    errorMessage.classList.remove('hidden')
    // Auto-select text for manual copy if clipboard failed
    shareUrlInput.select()
  }

  // Show modal
  shareModal.classList.remove('hidden')

  // Auto-dismiss after 3 seconds
  shareModalTimer = setTimeout(() => {
    closeShareModal()
    shareModalTimer = null
  }, 3000)
}

/**
 * Close share modal
 */
function closeShareModal() {
  const shareModal = document.getElementById('share-modal')
  shareModal.classList.add('hidden')
  // Clear timer if modal is manually closed
  if (shareModalTimer !== null) {
    clearTimeout(shareModalTimer)
    shareModalTimer = null
  }
}

/**
 * Show notification message in bottom-left corner
 * @param {string} message - Notification message to display
 * @param {string} type - Notification type: 'success' or 'error'
 */
function showNotification(message, type = 'success') {
  const notification = document.getElementById('notification')
  const notificationMessage = document.getElementById('notification-message')

  if (!notification || !notificationMessage) {
    console.error('Notification elements not found')
    return
  }

  // Clear any existing timer to prevent race conditions
  if (notificationTimer !== null) {
    clearTimeout(notificationTimer)
    notificationTimer = null
  }

  // Set message
  notificationMessage.textContent = message

  // Set styling based on type
  const notificationDiv = notification.querySelector('div')
  if (type === 'success') {
    notificationDiv.className = 'px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 bg-green-100 text-green-800'
  } else if (type === 'error') {
    notificationDiv.className = 'px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 bg-red-100 text-red-800'
  } else {
    notificationDiv.className = 'px-4 py-3 rounded-lg shadow-lg flex items-center gap-2 bg-gray-100 text-gray-800'
  }

  // Show notification
  notification.classList.remove('hidden')

  // Auto-dismiss after 3 seconds
  notificationTimer = setTimeout(() => {
    notification.classList.add('hidden')
    notificationTimer = null
  }, 3000)
}

/**
 * Handle share button click - orchestrate share flow
 */
async function handleShare() {
  const url = generateShareUrl()

  // Check if URL generation failed
  if (!url) {
    alert('Unable to generate share link. Please try again.')
    return
  }

  const copySuccess = await copyToClipboard(url)
  showShareNotification(url, copySuccess)
}

/**
 * Handle New button click - reset editor to default template
 */
function handleNew() {
  const defaultTemplate = '@startuml\nBob -> Alice: Hello!\n@enduml';

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

// ============================================================================
// AUTO-SAVE FUNCTIONALITY
// ============================================================================

// Debounced auto-save (2 second delay)
const debouncedAutoSave = debounce(() => {
  const content = editor.getValue()
  saveDefaultFile(content)
}, 2000)

/**
 * Restore editor state from localStorage
 * @returns {boolean} True if state was restored, false otherwise
 */
function restoreEditorState() {
  try {
    const stateJson = localStorage.getItem(STORAGE_KEYS.EDITOR_STATE)
    if (!stateJson) {
      return false
    }

    const state = JSON.parse(stateJson)

    // Validate state structure
    if (!state.diagramName || !state.content || !state.timestamp) {
      console.warn('Invalid editor state structure')
      localStorage.removeItem(STORAGE_KEYS.EDITOR_STATE)
      return false
    }

    // Check if diagram still exists
    const files = getAllFiles()
    const diagramExists = files.some(f => f.name === state.diagramName)

    if (!diagramExists) {
      console.warn('Saved diagram no longer exists:', state.diagramName)
      localStorage.removeItem(STORAGE_KEYS.EDITOR_STATE)
      return false
    }

    // Restore state
    editor.setValue(state.content, -1)
    editor.focus()
    currentDiagramName = state.diagramName
    lastSavedContent = state.content
    updateWindowTitle(state.diagramName)

    return true
  } catch (error) {
    console.error('Error restoring editor state:', error)
    localStorage.removeItem(STORAGE_KEYS.EDITOR_STATE)
    return false
  }
}

// Load default file content on startup
function initializeDefaultFile() {
  const defaultContent = loadDefaultFile()
  editor.setValue(defaultContent, -1)
  editor.focus()
}

plantuml.initialize(jarPath).then(() => {
  // Try to restore editor state
  const restored = restoreEditorState()

  // Initialize default file content (only if not restored and not loaded from URL)
  if (!restored && !loadedFromUrl) {
    initializeDefaultFile()
  }

  // Initial render
  if (restored) {
    // Render the restored diagram
    debouncedRender()
  } else {
    // Initial render for new/loaded content
    debouncedRender()
  }

  // Initialize tab state for mobile
  initializeTabs()

  // Initialize theme
  initializeTheme()

  // Initialize renderer
  initializeRenderer()

  // Initialize copyright year
  initializeCopyrightYear()

  // Attach change listeners
  editor.session.on('change', function() {
    debouncedRender()   // Update preview
    debouncedAutoSave() // Auto-save to default file
  })
})

// Tab element references (must be defined before event listeners)
const sidePanel = document.querySelector('#sidePanel')
const mainPanel = document.querySelector('main')
const tabCode = document.getElementById('tab-code')
const tabPreview = document.getElementById('tab-preview')

// Tab state (must be defined before initializeTabs uses it)
let activeTab = 'code' // 'code' or 'preview'

// Tab switching event listeners
tabCode.addEventListener('click', () => switchTab('code'))
tabPreview.addEventListener('click', () => switchTab('preview'))

// Initialize tab state on page load
function initializeTabs() {
  // Check screen size
  if (window.innerWidth <= 810) {
    // Mobile: start with code tab active, hide preview
    switchTab('code')
  } else {
    // Desktop: ensure both panels visible, reset any hidden states
    sidePanel.classList.remove('hidden')
    mainPanel.classList.remove('hidden')
  }
}

// Handle screen resize/orientation changes
window.addEventListener('resize', () => {
  const isMobile = window.innerWidth <= 810

  if (isMobile && activeTab === 'code') {
    // Already on code tab, ensure preview is hidden
    mainPanel.classList.add('hidden')
  } else if (isMobile && activeTab === 'preview') {
    // Already on preview tab, ensure code is hidden
    sidePanel.classList.add('hidden')
  } else if (!isMobile) {
    // Switched to desktop: ensure both panels visible
    sidePanel.classList.remove('hidden')
    mainPanel.classList.remove('hidden')
  }
})

const element = document.querySelector('#right-panel-image-wrapper')

panzoom(element)

// ============================================================================
// RESPONSIVE TAB NAVIGATION
// ============================================================================

function switchTab(tab) {
  activeTab = tab
  let activeTabColor = 'border-[#B0B0B0]'
  let inactiveTabColor = 'border-transparent'

  if (tab === 'code') {
    // Show code panel, hide preview
    sidePanel.classList.remove('hidden')
    mainPanel.classList.add('hidden')

    // Update tab styles
    tabCode.classList.add(activeTabColor, 'text-white')
    tabCode.classList.remove(inactiveTabColor, 'text-gray-400')
    tabPreview.classList.remove(activeTabColor, 'text-white')
    tabPreview.classList.add(inactiveTabColor, 'text-gray-400')

    // Focus editor
    editor.focus()
  } else {
    // Show preview, hide code panel
    sidePanel.classList.add('hidden')
    mainPanel.classList.remove('hidden')

    // Update tab styles
    tabPreview.classList.add(activeTabColor, 'text-white')
    tabPreview.classList.remove(inactiveTabColor, 'text-gray-400')
    tabCode.classList.remove(activeTabColor, 'text-white')
    tabCode.classList.add(inactiveTabColor, 'text-gray-400')

    // Auto-render when switching to preview
    _render()
  }
}

const resizer = document.querySelector('#resizer')
const sidebar = document.querySelector('#sidebar')

resizer.addEventListener('mousedown', () => {
  // Only enable on desktop
  if (window.innerWidth > 810) {
    document.addEventListener('mousemove', resize, false)
    document.addEventListener('mouseup', () => {
      document.removeEventListener('mousemove', resize, false)
    }, false)
  }
})

function resize(e) {
  const x = Math.max(e.x, 200)
  const size = `${x}px`

  sidebar.style.width = size
  sidePanel.style.width = size
}

// ============================================================================
// FILE MANAGEMENT - LocalStorage Utility Functions
// ============================================================================

const STORAGE_KEYS = {
  FILES: 'plantuml-files',
  DEFAULT: 'plantuml-default',
  RENDERER: 'plantuml-renderer',
  THEME: 'plantuml-theme',
  EDITOR_STATE: 'plantuml_editor_state'
}

/**
 * Get all files from localStorage
 * @returns {Array} Array of file metadata objects
 */
function getAllFiles() {
  try {
    const filesJson = localStorage.getItem(STORAGE_KEYS.FILES)
    return filesJson ? JSON.parse(filesJson) : []
  } catch (error) {
    console.error('Error reading files from storage:', error)
    return []
  }
}

/**
 * Save all files metadata to localStorage
 * @param {Array} files - Array of file metadata objects
 */
function saveAllFiles(files) {
  try {
    localStorage.setItem(STORAGE_KEYS.FILES, JSON.stringify(files))
  } catch (error) {
    console.error('Error saving files to storage:', error)
    if (error.name === 'QuotaExceededError') {
      alert('LocalStorage quota exceeded. Please delete some old files to free up space.')
    }
  }
}

/**
 * Save content to the default file
 * @param {string} content - PlantUML content to save
 */
function saveDefaultFile(content) {
  try {
    // Save to quick access key
    localStorage.setItem(STORAGE_KEYS.DEFAULT, content)

    // Update metadata
    const files = getAllFiles()
    const now = new Date().toISOString()

    const defaultFileIndex = files.findIndex(f => f.id === 'default')

    if (defaultFileIndex >= 0) {
      // Update existing default file
      files[defaultFileIndex].content = content
      files[defaultFileIndex].lastModified = now
    } else {
      // Create default file if it doesn't exist
      files.unshift({
        id: 'default',
        name: 'default',
        content: content,
        createdAt: now,
        lastModified: now
      })
    }

    saveAllFiles(files)
  } catch (error) {
    console.error('Error saving default file:', error)
  }
}

/**
 * Handle Save (Ctrl+S) - Save to current diagram without dialog
 */
function handleSave() {
  // If no current diagram in this tab, fallback to Save As
  if (!currentDiagramName) {
    openFilePanel('save')
    return
  }

  const files = getAllFiles()
  const diagramIndex = files.findIndex(f => f.name === currentDiagramName)

  // Validate diagram still exists
  if (diagramIndex === -1) {
    showNotification(`Current diagram '${currentDiagramName}' no longer exists`, 'error')
    currentDiagramName = null
    localStorage.removeItem(STORAGE_KEYS.EDITOR_STATE)
    updateWindowTitle(null)
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
      showNotification(`Saved to '${currentDiagramName}'`, 'success')
      lastSavedContent = content
    }

    // Save editor state for refresh recovery
    const editorState = {
      diagramName: currentDiagramName,
      content: content,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEYS.EDITOR_STATE, JSON.stringify(editorState))

    // Update window title
    updateWindowTitle(currentDiagramName)
  } catch (error) {
    console.error('Error saving diagram:', error)
    showNotification('Failed to save diagram', 'error')
  }
}

/**
 * Load content from the default file
 * @returns {string} Content of the default file
 */
function loadDefaultFile() {
  try {
    return localStorage.getItem(STORAGE_KEYS.DEFAULT) || '@startuml\nBob -> Alice: Hello!\n@enduml'
  } catch (error) {
    console.error('Error loading default file:', error)
    return '@startuml\nBob -> Alice: Hello!\n@enduml'
  }
}

/**
 * Create a new snapshot file
 * @param {string} name - Name for the new file
 * @param {string} content - Content to save
 * @returns {Object|null} Created file object or null if failed
 */
function saveFile(name, content) {
  try {
    const files = getAllFiles()
    const now = new Date().toISOString()

    // Generate unique ID
    const id = 'file-' + Date.now() + '-' + Math.random().toString(36).substring(2, 11)

    const newFile = {
      id: id,
      name: name,
      content: content,
      createdAt: now,
      lastModified: now
    }

    files.push(newFile)
    saveAllFiles(files)

    return newFile
  } catch (error) {
    console.error('Error saving file:', error)
    return null
  }
}

/**
 * Delete a file by ID (cannot delete default file)
 * @param {string} fileId - ID of file to delete
 * @returns {boolean} True if deleted, false otherwise
 */
function deleteFile(fileId) {
  if (fileId === 'default') {
    alert('Cannot delete the default file.')
    return false
  }

  try {
    const files = getAllFiles()
    const filteredFiles = files.filter(f => f.id !== fileId)

    if (filteredFiles.length === files.length) {
      console.warn('File not found:', fileId)
      return false
    }

    saveAllFiles(filteredFiles)
    return true
  } catch (error) {
    console.error('Error deleting file:', error)
    return false
  }
}

/**
 * Load file content into the editor (copies to default)
 * @param {string} fileId - ID of file to load
 * @returns {boolean} True if loaded, false otherwise
 */
function loadFileIntoEditor(fileId) {
  try {
    const files = getAllFiles()
    const file = files.find(f => f.id === fileId)

    if (!file) {
      console.warn('File not found:', fileId)
      return false
    }

    // Load content into editor
    editor.setValue(file.content, -1)
    editor.focus()

    // Update default file with loaded content
    saveDefaultFile(file.content)

    return true
  } catch (error) {
    console.error('Error loading file into editor:', error)
    return false
  }
}

/**
 * Validate file name
 * @param {string} name - File name to validate
 * @param {Array} files - Existing files array
 * @returns {Object} Validation result {valid: boolean, error: string}
 */
function validateFileName(name, _files = null) {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'File name cannot be empty' }
  }

  if (name === 'default') {
    return { valid: false, error: 'Reserved file name' }
  }

  // Note: We no longer check if file already exists here
  // handleSaveAs() handles existing files with a confirmation dialog

  return { valid: true }
}

/**
 * Format ISO date string for display
 * @param {string} isoString - ISO date string
 * @returns {string} Formatted date string
 */
function formatDate(isoString) {
  try {
    const date = new Date(isoString)
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

    const month = months[date.getMonth()]
    const day = String(date.getDate()).padStart(2, '0')
    const year = date.getFullYear()
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')

    return `${month} ${day}, ${year} ${hours}:${minutes}`
  } catch (error) {
    console.error('Error formatting date:', error)
    return isoString
  }
}

// ============================================================================
// FILE PANEL MODAL
// ============================================================================

let currentMode = 'open' // 'save' or 'open'

const fileModal = document.getElementById('file-modal')
const modalTitle = document.getElementById('modal-title')
const saveInputContainer = document.getElementById('save-input-container')
const fileNameInput = document.getElementById('file-name-input')
const nameError = document.getElementById('name-error')
const fileListContainer = document.getElementById('file-list')

/**
 * Open file panel modal in specified mode
 * @param {string} mode - 'save' or 'open'
 */
function openFilePanel(mode) {
  currentMode = mode

  // Show modal
  fileModal.classList.remove('hidden')

  // Clear previous state
  nameError.classList.add('hidden')
  fileNameInput.value = ''
  fileNameInput.classList.remove('border-red-500')

  if (mode === 'save') {
    modalTitle.textContent = 'Save As'
    saveInputContainer.classList.remove('hidden')
    fileNameInput.focus()
  } else {
    modalTitle.textContent = 'Open File'
    saveInputContainer.classList.add('hidden')
    // Focus the first file item or close button
    const firstButton = fileListContainer.querySelector('button')
    if (firstButton) {
      firstButton.focus()
    } else {
      document.getElementById('close-modal').focus()
    }
  }

  renderFileList()
}

/**
 * Close file panel modal
 */
function closeModal() {
  fileModal.classList.add('hidden')
  currentMode = 'open'
  nameError.classList.add('hidden')
  fileNameInput.value = ''
}

/**
 * Render file list in modal
 */
function renderFileList() {
  const files = getAllFiles()

  if (files.length === 0) {
    fileListContainer.innerHTML = '<p class="text-gray-500 text-center py-4">No files saved yet</p>'
    return
  }

  fileListContainer.innerHTML = files.map(file => `
    <div class="flex items-center justify-between py-3 border-b last:border-b-0">
      <div class="flex-1">
        <h3 class="font-medium text-gray-800">${escapeHtml(file.name)}</h3>
        <p class="text-sm text-gray-500">
          Created: ${formatDate(file.createdAt)} | Modified: ${formatDate(file.lastModified)}
        </p>
      </div>
      <div class="flex gap-2">
        ${file.id !== 'default' ? `
          <button
            onclick="handleDeleteFile('${file.id}')"
            class="px-3 py-1 bg-white hover:bg-gray-100 text-[#1A4F63] text-sm rounded transition-colors border border-gray-300"
          >
            Delete
          </button>
        ` : ''}
        <button
          onclick="handleOpenFile('${file.id}')"
          class="px-3 py-1 bg-white hover:bg-gray-100 text-[#1A4F63] text-sm rounded transition-colors border border-gray-300"
        >
          ${file.id === 'default' ? 'Reload' : 'Open'}
        </button>
      </div>
    </div>
  `).join('')
}

/**
 * Handle Save As action
 */
function handleSaveAs() {
  const name = fileNameInput.value.trim()
  const files = getAllFiles()

  // Validate name
  const validation = validateFileName(name, files)
  if (!validation.valid) {
    nameError.textContent = validation.error
    nameError.classList.remove('hidden')
    fileNameInput.classList.add('border-red-500')
    return
  }

  // Clear error
  nameError.classList.add('hidden')
  fileNameInput.classList.remove('border-red-500')

  // Check if file already exists
  const existingFile = files.find(f => f.name === name)
  if (existingFile) {
    // Show overwrite confirmation
    confirmOverwrite(name)
    return
  }

  // Get current content from editor
  const content = editor.getValue()

  // Save file
  const newFile = saveFile(name, content)
  if (newFile) {
    console.log('File saved:', newFile.name)

    // Set as current diagram in this tab
    currentDiagramName = name

    // Save editor state
    const editorState = {
      diagramName: name,
      content: content,
      timestamp: Date.now()
    }
    localStorage.setItem(STORAGE_KEYS.EDITOR_STATE, JSON.stringify(editorState))

    // Update tracking
    lastSavedContent = content
    updateWindowTitle(name)

    closeModal()
  } else {
    nameError.textContent = 'Failed to save file'
    nameError.classList.remove('hidden')
  }
}

/**
 * Show confirmation dialog for overwriting existing file
 * @param {string} diagramName - Name of the diagram to overwrite
 */
function confirmOverwrite(diagramName) {
  // Create confirmation modal
  const confirmModal = document.createElement('div')
  confirmModal.id = 'confirm-overwrite-modal'
  confirmModal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center'
  confirmModal.style.zIndex = '1002' // Higher than file modal (1000) and share modal (1001)

  // Create modal content safely (avoid XSS by using textContent for dynamic content)
  const modalContent = document.createElement('div')
  modalContent.className = 'bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4'

  const title = document.createElement('h3')
  title.className = 'text-lg font-semibold text-gray-900 mb-2'
  title.textContent = 'Overwrite File?'

  const message = document.createElement('p')
  message.className = 'text-gray-600 mb-6'
  message.textContent = `File '${diagramName}' already exists. Overwrite?`

  const buttonContainer = document.createElement('div')
  buttonContainer.className = 'flex justify-end gap-3'

  const cancelBtn = document.createElement('button')
  cancelBtn.className = 'px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition cursor-pointer'
  cancelBtn.textContent = 'Cancel'

  const confirmBtn = document.createElement('button')
  confirmBtn.className = 'px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition cursor-pointer'
  confirmBtn.textContent = 'Overwrite'

  buttonContainer.appendChild(cancelBtn)
  buttonContainer.appendChild(confirmBtn)

  modalContent.appendChild(title)
  modalContent.appendChild(message)
  modalContent.appendChild(buttonContainer)

  confirmModal.appendChild(modalContent)
  document.body.appendChild(confirmModal)

  // Add event listeners
  cancelBtn.addEventListener('click', () => {
    document.body.removeChild(confirmModal)
    // Return to Save As input field
    fileNameInput.focus()
  })

  confirmBtn.addEventListener('click', () => {
    const content = editor.getValue()
    const files = getAllFiles()
    const fileIndex = files.findIndex(f => f.name === diagramName)

    if (fileIndex >= 0) {
      // Update existing file
      files[fileIndex].content = content
      files[fileIndex].lastModified = new Date().toISOString()
      saveAllFiles(files)

      // Set as current diagram in this tab
      currentDiagramName = diagramName

      // Save editor state
      const editorState = {
        diagramName: diagramName,
        content: content,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEYS.EDITOR_STATE, JSON.stringify(editorState))

      // Update tracking
      lastSavedContent = content
      updateWindowTitle(diagramName)

      // Show success notification
      showNotification(`Saved to '${diagramName}'`, 'success')

      // Remove confirmation modal
      document.body.removeChild(confirmModal)

      // Close the Save As modal
      closeModal()
    }
  })

  // Handle Enter key to confirm
  confirmBtn.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      e.stopPropagation()
      confirmBtn.click()
    }
  })

  // Focus on the confirm button after a small delay to ensure modal is rendered
  // and to prevent the previous Enter key event from triggering it
  setTimeout(() => {
    confirmBtn.focus()
  }, 100)
}

/**
 * Handle Open File action
 * @param {string} fileId - ID of file to open
 */
function handleOpenFile(fileId) {
  const success = loadFileIntoEditor(fileId)
  if (success) {
    // Get the file object to retrieve its name
    const files = getAllFiles()
    const file = files.find(f => f.id === fileId)

    if (file) {
      // Set as current diagram in this tab
      currentDiagramName = file.name

      // Save editor state
      const editorState = {
        diagramName: file.name,
        content: file.content,
        timestamp: Date.now()
      }
      localStorage.setItem(STORAGE_KEYS.EDITOR_STATE, JSON.stringify(editorState))

      // Update tracking
      lastSavedContent = file.content
      updateWindowTitle(file.name)
    }

    closeModal()
    debouncedRender()
  }
}

/**
 * Handle Delete File action
 * @param {string} fileId - ID of file to delete
 */
function handleDeleteFile(fileId) {
  if (confirm('Are you sure you want to delete this file?')) {
    const success = deleteFile(fileId)
    if (success) {
      renderFileList()
    }
  }
}

/**
 * Escape HTML to prevent XSS
 * @param {string} text - Text to escape
 * @returns {string} Escaped text
 */
function escapeHtml(text) {
  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}

// Event Listeners for Modal
document.getElementById('btn-save').addEventListener('click', () => openFilePanel('save'))
document.getElementById('btn-open').addEventListener('click', () => openFilePanel('open'))
document.getElementById('btn-new').addEventListener('click', handleNew)

// Theme toggle event listener
document.getElementById('btn-theme').addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light'
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
})

// Renderer toggle event listener
document.getElementById('btn-renderer').addEventListener('click', toggleRenderer)

// Share button event listener
document.getElementById('btn-share').addEventListener('click', handleShare)

// Share modal close buttons
document.getElementById('close-share-modal').addEventListener('click', closeShareModal)
document.getElementById('close-share-modal-x').addEventListener('click', closeShareModal)

// Click outside to dismiss share modal
document.getElementById('share-modal').addEventListener('click', (e) => {
  if (e.target.id === 'share-modal') {
    closeShareModal()
  }
})

// File modal close buttons
document.getElementById('close-modal').addEventListener('click', closeModal)
document.getElementById('close-modal-x').addEventListener('click', closeModal)

// Handle Enter key in file name input
fileNameInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault() // Prevent Enter from propagating to other elements
    handleSaveAs()

    // If confirmation modal was created, don't do anything else
    // The modal will handle the user's confirmation
  }
})

// Make functions global for onclick handlers
window.handleDeleteFile = handleDeleteFile
window.handleOpenFile = handleOpenFile

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

document.addEventListener('keydown', (e) => {
  // Ctrl+Shift+S - Save As (check before other combinations)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && !e.altKey && (e.key === 'S' || e.key === 's' || e.code === 'KeyS')) {
    e.preventDefault()
    e.stopPropagation()
    openFilePanel('save')
    return
  }

  // Ctrl+S - Save (only if Alt and Shift are NOT pressed)
  if (e.ctrlKey && !e.altKey && !e.shiftKey && (e.key === 's' || e.key === 'S')) {
    e.preventDefault()
    handleSave()
    return
  }

  // Ctrl+O - Open File
  if (e.ctrlKey && e.key === 'o') {
    e.preventDefault()
    openFilePanel('open')
  }

  // Ctrl+Alt+N - New Diagram
  if ((e.ctrlKey || e.metaKey) && e.altKey && e.key === 'n') {
    e.preventDefault()
    handleNew()
  }

  // Ctrl+Shift+U - Share URL (or Cmd+Shift+U on Mac)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'U' || e.key === 'u' || e.code === 'KeyU')) {
    e.preventDefault()
    handleShare()
    return
  }

  // Escape - Close modals (independent check for each modal)
  if (e.key === 'Escape') {
    const shareModal = document.getElementById('share-modal')
    const fileModalOpen = !fileModal.classList.contains('hidden')
    const shareModalOpen = !shareModal.classList.contains('hidden')

    if (fileModalOpen) {
      e.preventDefault()
      e.stopPropagation()
      closeModal()
    }

    if (shareModalOpen) {
      e.preventDefault()
      e.stopPropagation()
      closeShareModal()
    }
  }

  // Alt+T - Toggle Theme
  if (e.altKey && (e.key === 't' || e.key === 'T')) {
    e.preventDefault()
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light'
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
    setTheme(newTheme)
  }

  // Alt+R - Toggle Renderer
  if (e.altKey && (e.key === 'r' || e.key === 'R')) {
    e.preventDefault()
    toggleRenderer()
  }
})
