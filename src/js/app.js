// load parameters
const pathname = window.location.pathname.match(/^.*[\/]/)[0] // until the trailing slash, do not include the filename

// set up editor
ace.config.set("loadWorkerFromBlob", false)

const editor = ace.edit("editor")

editor.setTheme("ace/theme/monokai")
editor.session.setMode("ace/mode/javascript")

// Track if we loaded content from URL (to prevent overwriting with default)
let loadedFromUrl = false

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

function _render(){
  plantuml.renderPng(editor.getValue()).then((blob) => {
    document.getElementById('render-image').src = window.URL.createObjectURL(blob)
  }).catch((error) => {
    console.log(error)
  })
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
 * Initialize theme based on system preference
 */
function initializeTheme() {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
  const currentTheme = prefersDark ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', currentTheme)
  updateThemeIcon(currentTheme)
}

/**
 * Set theme and update icon
 * @param {string} theme - 'light' or 'dark'
 */
function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme)
  updateThemeIcon(theme)
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
  const utf8Bytes = encodeURIComponent(text).replace(/%([0-9A-F]{2})/g, (match, p1) => {
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
 * Copy text to clipboard using modern Clipboard API with fallback
 * @param {string} text - Text to copy
 * @returns {Promise<boolean>} True if successful, false otherwise
 */
async function copyToClipboard(text) {
  // Try modern Clipboard API first
  if (navigator.clipboard && navigator.clipboard.writeText) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (error) {
      console.error('Clipboard API failed, trying fallback:', error)
    }
  }

  // Fallback: Use document.execCommand('copy')
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-9999px'
    textArea.style.top = '-9999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()

    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)

    return successful
  } catch (error) {
    console.error('Fallback clipboard copy also failed:', error)
    return false
  }
}

// Track auto-dismiss timer to prevent race conditions
let shareModalTimer = null

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

// ============================================================================
// AUTO-SAVE FUNCTIONALITY
// ============================================================================

// Debounced auto-save (2 second delay)
const debouncedAutoSave = debounce(() => {
  const content = editor.getValue()
  saveDefaultFile(content)
}, 2000)

// Load default file content on startup
function initializeDefaultFile() {
  const defaultContent = loadDefaultFile()
  editor.setValue(defaultContent, -1)
  editor.focus()
}

plantuml.initialize(jarPath).then(() => {
  // Initialize default file content (only if not loaded from URL)
  if (!loadedFromUrl) {
    initializeDefaultFile()
  }

  // Initial render
  debouncedRender()

  // Initialize tab state for mobile
  initializeTabs()

  // Initialize theme
  initializeTheme()

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

  if (tab === 'code') {
    // Show code panel, hide preview
    sidePanel.classList.remove('hidden')
    mainPanel.classList.add('hidden')

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

    // Update tab styles
    tabPreview.classList.add('border-blue-500', 'text-white')
    tabPreview.classList.remove('border-transparent', 'text-gray-400')
    tabCode.classList.remove('border-blue-500', 'text-white')
    tabCode.classList.add('border-transparent', 'text-gray-400')

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
  DEFAULT: 'plantuml-default'
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
function validateFileName(name, files = null) {
  if (!name || name.trim() === '') {
    return { valid: false, error: 'File name cannot be empty' }
  }

  if (name === 'default') {
    return { valid: false, error: 'Reserved file name' }
  }

  if (files === null) {
    files = getAllFiles()
  }

  if (files.some(f => f.name === name)) {
    return { valid: false, error: 'File name already exists' }
  }

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
            class="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded transition-colors"
          >
            Delete
          </button>
        ` : ''}
        <button
          onclick="handleOpenFile('${file.id}')"
          class="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded transition-colors"
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

  // Get current content from editor
  const content = editor.getValue()

  // Save file
  const newFile = saveFile(name, content)
  if (newFile) {
    console.log('File saved:', newFile.name)
    closeModal()
  } else {
    nameError.textContent = 'Failed to save file'
    nameError.classList.remove('hidden')
  }
}

/**
 * Handle Open File action
 * @param {string} fileId - ID of file to open
 */
function handleOpenFile(fileId) {
  const success = loadFileIntoEditor(fileId)
  if (success) {
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

// Theme toggle event listener
document.getElementById('btn-theme').addEventListener('click', () => {
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light'
  const newTheme = currentTheme === 'dark' ? 'light' : 'dark'
  setTheme(newTheme)
})

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
    handleSaveAs()
  }
})

// Make functions global for onclick handlers
window.handleDeleteFile = handleDeleteFile
window.handleOpenFile = handleOpenFile

// ============================================================================
// KEYBOARD SHORTCUTS
// ============================================================================

document.addEventListener('keydown', (e) => {
  // Ctrl+S - Save As
  if (e.ctrlKey && e.key === 's') {
    e.preventDefault()
    openFilePanel('save')
  }

  // Ctrl+O - Open File
  if (e.ctrlKey && e.key === 'o') {
    e.preventDefault()
    openFilePanel('open')
  }

  // Ctrl+Shift+S - Share (or Cmd+Shift+S on Mac)
  if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'S') {
    e.preventDefault()
    handleShare()
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
})
