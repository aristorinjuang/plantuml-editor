---
title: 'Google Firebase Authentication for AI Generation'
slug: 'firebase-auth-ai-generation'
created: '2026-03-23T00:00:00.000Z'
status: 'implementation-complete'
stepsCompleted: [1, 2, 3, 4, 5]
tech_stack: ['JavaScript (ES Modules)', 'Firebase Auth SDK v12.11.0', 'Firebase App SDK v12.11.0', 'Tailwind CSS v4', 'Vite', 'Ace Editor']
files_to_modify: ['index.html', 'src/js/app.js', 'src/css/app.css']
code_patterns: ['JSDoc function documentation', 'LocalStorage with STORAGE_KEYS constant', 'Try-catch with error logging', 'Event listeners conditionally attached based on configuration', 'showNotification(message, type) for user feedback', '.hidden class for visibility toggle', 'CSS custom properties for theming', 'Tailwind utility classes with responsive breakpoints']
test_patterns: ['No test framework found - manual testing required']
---

# Tech-Spec: Google Firebase Authentication for AI Generation

**Created:** 2026-03-23

## Overview

### Problem Statement

The AI Generation feature in the PlantUML Editor is currently accessible to all users without authentication. To secure the backend API endpoint and potentially track usage, we need to require Google Firebase authentication before allowing users to access the AI generation feature.

### Solution

Implement Google Firebase Authentication with sign-in/sign-out functionality. The AI Generation feature will only be available to authenticated users. The Firebase ID token will be automatically included in the Authorization header for each generation request to the backend. The UI will dynamically show/hide the AI prompt interface based on authentication state.

### Scope

**In Scope:**
- Add Firebase Authentication module (`getAuth`, `GoogleAuthProvider`, `signInWithPopup`) to existing Firebase setup in `index.html`
- Implement Google sign-in with popup functionality
- Replace AI prompt textarea with login button for unsigned users
- Display "Sign in to use AI Generation" message when not logged in
- Add logged-in indicator with logout button in the AI panel header
- Modify `/generate` API call to include Firebase ID token in Authorization header
- Implement automatic token refresh on 401 authentication errors
- Handle authentication state changes (show/hide textarea vs login button)
- Preserve editor content on logout (disable AI generation only)

**Out of Scope:**
- User profile management or settings
- Usage tracking/analytics implementation
- Backend authentication validation (this spec is frontend-only)
- Other authentication providers (Google sign-in only)
- User session persistence beyond Firebase's default behavior
- Authentication for other features (only AI generation)

## Context for Development

### Codebase Patterns

**Function Documentation:**
- All functions use JSDoc comments (`@param`, `@returns`)
- Example from `generatePlantUML` function (line 231-235)

**LocalStorage Pattern:**
- Centralized `STORAGE_KEYS` constant object (lines 1051-1058)
- Keys: `FILES`, `DEFAULT`, `RENDERER`, `AI_PANEL_EXPANDED`, `EDITOR_STATE`
- Try-catch wrappers with error logging for all localStorage operations
- Functions: `getAllFiles()`, `saveAllFiles()`, `saveDefaultFile()`, `loadDefaultFile()`

**UI State Management:**
- `hidden` class for visibility toggle (CSS transitions opacity 0-1)
- Functions check configuration before enabling features (see `isBackendConfigured()` at lines 161-164)
- Event listeners conditionally attached based on configuration (lines 1651-1724 for AI panel)
- Modal dialogs use fixed positioning with z-index layering (1000-1003)

**Error Handling:**
- `showNotification(message, type)` function for user feedback (line 730)
- Type can be `'success'` or `'error'`
- Try-catch blocks with specific error messages and console.error logging
- Example: `showNotification('Maximum tab limit reached', 'error')`

**CSS Architecture:**
- Tailwind CSS v4 with custom `@theme` breakpoint (810px)
- CSS custom properties for theming (`--preview-bg`, `--preview-text`, etc.)
- Dark theme via `[data-theme="dark"]` attribute selector
- Mobile responsiveness using `.max-w-810:*` utility classes
- Smooth transitions (0.2s-0.3s ease) for state changes

**API Integration:**
- Environment variables via `import.meta.env.VITE_*`
- Fetch API with AbortSignal for cancellable requests
- `generatePlantUML(prompt, signal)` function at line 236
- Error handling for HTTP 400, 500, and other status codes

### Files to Reference

| File | Purpose | Key Sections |
| ---- | ------- | ------------ |
| `index.html` | Firebase initialization, AI panel HTML structure | Lines 275-297 (Firebase module), 98-130 (AI panel) |
| `src/js/app.js` | Main application logic, AI generation, event listeners | Lines 161-164 (isBackendConfigured), 236-280 (generatePlantUML), 730-750 (showNotification), 1051-1058 (STORAGE_KEYS), 1651-1724 (AI panel event listeners) |
| `src/css/app.css` | Styling for AI panel, themes, responsive design | Lines 346-444 (AI panel styles) |

### Technical Decisions

**Firebase Auth Integration:**
- Add imports to existing module script in `index.html` (lines 275-297):
  - `import { getAuth } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js"`
  - `import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js"`
- Initialize auth with existing app: `const auth = getAuth(app);`
- Store `auth` instance globally (attach to `window.auth`) for access in `app.js`

**Token Management:**
- Call `auth.currentUser.getIdToken()` before each `/generate` API call
- Firebase SDK automatically handles token refresh (tokens expire after 1 hour)
- On 401 response: attempt `getIdToken(true)` to force refresh, retry once, then show error
- Example from user's requirements: `const token = await auth.currentUser.getIdToken();`

**UI State Management:**
- Create `isAuthenticated()` helper following `isBackendConfigured()` pattern (lines 161-164)
- Use `onAuthStateChanged(auth, callback)` to update UI in real-time
- Replace textarea (lines 111-117) with login button when `!auth.currentUser`
- Add user info + logout button to AI panel header (after line 103) when authenticated
- Use existing `.hidden` class and CSS transitions for smooth state changes

**HTML Structure Changes:**
- AI panel content (lines 108-129) needs two states:
  1. **Not authenticated:** Login button + "Sign in to use AI Generation" message
  2. **Authenticated:** Textarea + generate button + logout button in header

## Implementation Plan

### Tasks

- [x] **Task 1: Add Firebase Authentication imports to index.html**
  - File: `index.html`
  - Action: Add Firebase Auth imports to the existing module script (lines 275-297)
  - Code to add after line 278:
    ```javascript
    import { getAuth } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
    import { GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js";
    ```
  - Initialize auth instance after line 296:
    ```javascript
    const auth = getAuth(app);
    window.auth = auth; // Make available globally for app.js
    ```
  - Notes: Use existing Firebase app instance, no need to reinitialize

- [x] **Task 2: Add authentication helper functions to app.js**
  - File: `src/js/app.js`
  - Action: Add helper functions after the `isBackendConfigured()` function (after line 164)
  - Functions to add:
    1. `isAuthenticated()` - Check if user is logged in (similar pattern to `isBackendConfigured`)
    2. `async handleLogin()` - Handle Google sign-in with popup
    3. `async handleLogout()` - Handle sign-out
  - Use JSDoc comments following existing pattern
  - Use try-catch with `showNotification()` for errors
  - Notes: Follow existing error handling and notification patterns

- [x] **Task 3: Add HTML structure for authentication states in AI panel**
  - File: `index.html`
  - Action: Modify AI panel content section (lines 108-129) to support two states
  - Add two container divs with IDs:
    1. `#ai-auth-required` - Login prompt (shown when not authenticated)
    2. `#ai-authenticated` - Textarea + generate button (shown when authenticated)
  - Add logout button in AI panel header (after line 103) with ID `#btn-logout`
  - Add user info display element with ID `#user-info`
  - Apply `.hidden` class to one container based on auth state
  - Notes: Preserve existing Tailwind classes and styling

- [x] **Task 4: Add CSS styles for authentication UI elements**
  - File: `src/css/app.css`
  - Action: Add styles for new authentication UI elements
  - Add styles after AI panel section (after line 444):
    - Login button styles (match existing button patterns)
    - User info display styles
    - Logout button styles
    - Auth state transition animations
  - Follow existing CSS patterns (transitions, hover states, responsive breakpoints)
  - Notes: Use existing color scheme and responsive patterns

- [x] **Task 5: Modify generatePlantUML function to include auth token**
  - File: `src/js/app.js`
  - Action: Modify the `generatePlantUML()` function (line 236) to include Firebase ID token
  - Changes:
    1. Add token retrieval: `const token = await auth.currentUser.getIdToken();`
    2. Add Authorization header: `Authorization: \`Bearer ${token}\``
    3. Add 401 error handling with token refresh and retry logic
    4. Update JSDoc comments to document auth requirement
  - Preserve existing error handling for 400, 500, and other status codes
  - Notes: Firebase auto-handles token refresh; only force refresh on 401

- [x] **Task 6: Add authentication state change listener**
  - File: `src/js/app.js`
  - Action: Add `onAuthStateChanged` listener to update UI in real-time
  - Add listener after existing initialization functions (around line 320)
  - Listener should:
    1. Toggle visibility of `#ai-auth-required` and `#ai-authenticated`
    2. Update user info display when authenticated
    3. Show/hide logout button
    4. Enable/disable generate button
  - Use existing `showNotification()` for auth state changes (optional)
  - Notes: Follow existing patterns for conditional event listener attachment

- [x] **Task 7: Wire up event listeners for auth buttons**
  - File: `src/js/app.js`
  - Action: Add event listeners for login and logout buttons
  - Add listeners in the AI panel event listeners section (around line 1694)
  - Wire up:
    1. Login button click → `handleLogin()`
    2. Logout button click → `handleLogout()`
  - Follow existing event listener patterns (conditional attachment based on `isBackendConfigured()`)
  - Add error handling with user feedback
  - Notes: Only attach listeners if backend is configured

- [x] **Task 8: Update AI panel initialization to check auth state**
  - File: `src/js/app.js`
  - Action: Modify `initializeAIPanel()` function (line 176) to check authentication
  - Add auth state check alongside existing `isBackendConfigured()` check
  - Set initial visibility of auth containers based on `auth.currentUser`
  - Preserve existing AI panel hiding logic if backend not configured
  - Notes: This runs on app load to set initial UI state

### Acceptance Criteria

- [ ] **AC 1: Given a user is not authenticated, when the AI panel loads, then the login prompt is displayed instead of the textarea**
  - Precondition: Backend is configured (`VITE_BACKEND_BASE_URL` is set)
  - Action: User opens the application
  - Expected: `#ai-auth-required` is visible, `#ai-authenticated` is hidden, textarea is not shown

- [ ] **AC 2: Given a user is not authenticated, when they click the "Sign in with Google" button, then a Google sign-in popup appears**
  - Precondition: User is not logged in, AI panel shows login prompt
  - Action: User clicks login button
  - Expected: Google sign-in popup opens, no console errors

- [ ] **AC 3: Given a user completes Google sign-in successfully, when authentication completes, then the AI textarea and generate button are displayed**
  - Precondition: User completed Google authentication flow
  - Action: Authentication state changes to logged in
  - Expected: `#ai-auth-required` is hidden, `#ai-authenticated` is visible, textarea is shown, user info is displayed, logout button is visible

- [ ] **AC 4: Given a user is authenticated, when they type a prompt and click generate, then the request includes a valid Firebase ID token in the Authorization header**
  - Precondition: User is logged in, textarea has content
  - Action: User clicks generate button
  - Expected: API call to `/generate` includes `Authorization: Bearer ${token}` header, token is valid

- [ ] **AC 5: Given the backend returns a successful response, when the AI generation completes, then the editor is updated with the generated PlantUML code**
  - Precondition: Authenticated user, valid prompt, backend returns success
  - Action: API call succeeds with PlantUML code
  - Expected: Editor content is replaced with generated code, success notification shown

- [ ] **AC 6: Given the backend returns 401 Unauthorized, when the error is received, then the token is refreshed and the request is retried once**
  - Precondition: Authenticated user, token has expired
  - Action: API call returns 401 status
  - Expected: `getIdToken(true)` is called to force refresh, request is retried with new token

- [ ] **AC 7: Given the backend returns 401 after token refresh, when the retry fails, then an error message is displayed and the user is asked to sign in again**
  - Precondition: Token refresh and retry both failed
  - Action: Second API call also returns 401
  - Expected: Error notification shown, AI generation disabled, user prompted to sign in

- [ ] **AC 8: Given a user is authenticated, when they click the logout button, then the user is signed out and the login prompt is displayed**
  - Precondition: User is logged in, AI panel shows textarea
  - Action: User clicks logout button
  - Expected: User is signed out, `#ai-authenticated` is hidden, `#ai-auth-required` is visible, editor content is preserved

- [ ] **AC 9: Given a user is not authenticated, when they try to use AI generation, then the feature is disabled and they are prompted to sign in**
  - Precondition: User is not logged in
  - Action: User attempts to interact with AI generation
  - Expected: Generate button is disabled, login prompt is shown

- [ ] **AC 10: Given the backend is not configured, when the app loads, then the AI panel is completely hidden**
  - Precondition: `VITE_BACKEND_BASE_URL` is not set or empty
  - Action: Application loads
  - Expected: Entire AI panel is hidden (existing behavior maintained)

## Additional Context

### Dependencies

**External Dependencies:**
- Firebase Auth SDK v12.11.0 (CDN: `https://www.gstatic.com/firebasejs/12.11.0/firebase-auth.js`)
- Firebase App SDK v12.11.0 (already installed)
- Google Auth Provider (included in Firebase Auth SDK)

**Internal Dependencies:**
- `VITE_BACKEND_BASE_URL` environment variable must be configured
- Backend API endpoint `/generate` must validate Firebase ID tokens
- Existing Firebase configuration in `index.html` (lines 284-292)
- Existing UI components: AI panel, notification system, modal dialogs

**Browser Requirements:**
- Modern browser with ES6 module support
- Popup blocker must allow Firebase Auth popups
- Third-party cookies enabled for Firebase Auth (in some browsers)

### Testing Strategy

**Manual Testing Checklist:**

1. **Authentication Flow:**
   - [ ] Test sign-in with valid Google account
   - [ ] Test sign-in with Google account that doesn't have permission (if applicable)
   - [ ] Test sign-out functionality
   - [ ] Test page refresh - auth state should persist
   - [ ] Test login popup blocked by browser - show user-friendly error

2. **AI Generation with Auth:**
   - [ ] Test successful AI generation with valid token
   - [ ] Test expired token scenario (simulate 401 response)
   - [ ] Test token refresh and retry logic
   - [ ] Test backend completely unavailable (network error)
   - [ ] Test backend returns 400, 500 errors (existing handlers)

3. **UI State Transitions:**
   - [ ] Test login → textarea appears smoothly
   - [ ] Test logout → login prompt appears smoothly
   - [ ] Test mobile responsive design (≤810px breakpoint)
   - [ ] Test dark theme compatibility
   - [ ] Test keyboard navigation (tab order, enter key)

4. **Edge Cases:**
   - [ ] Test when backend is not configured (AI panel hidden)
   - [ ] Test concurrent login attempts (rapid button clicks)
   - [ ] Test network timeout during sign-in
   - [ ] Test user denies permission in Google popup
   - [ ] Test editor content preserved on logout

5. **Cross-browser Testing:**
   - [ ] Chrome/Edge (Chromium)
   - [ ] Firefox
   - [ ] Safari (if available)
   - [ ] Mobile browsers (iOS Safari, Chrome Mobile)

**No Automated Tests:**
- No test framework is currently set up in the project
- Manual testing is required for all scenarios
- Consider adding test framework in future iterations

### Notes

**Implementation Risks:**
- **Token Expiry Handling:** Firebase tokens expire after 1 hour. The retry logic must handle edge cases where force refresh also fails.
- **Popup Blockers:** Some browsers may block the Firebase Auth popup. Consider showing a user-friendly message to enable popups.
- **Race Conditions:** Multiple rapid generate clicks could trigger multiple token refresh attempts. Debouncing may be needed.
- **Auth State Timing:** UI must initialize correctly before `onAuthStateChanged` fires on first load.

**Known Limitations:**
- Only Google authentication is supported (no email/password, social providers, etc.)
- Backend token validation is out of scope (assumed to be implemented)
- No user profile management or settings
- No usage analytics or tracking (though Firebase Analytics is available)

**Future Considerations:**
- Add email/password authentication alternative
- Implement user profile page with settings
- Add usage tracking and rate limiting
- Support for other auth providers (GitHub, Facebook, etc.)
- Persistent user preferences across sessions
- Multi-factor authentication (MFA) support

**Firebase Configuration Details:**
- Project: `plantuml-editor-256fc`
- Auth Domain: `plantuml-editor-256fc.firebaseapp.com`
- API Key: `AIzaSyDho8GgAccQwGM6vWmBa0lZgr_2RbWAWHY`
- Note: Ensure Google Sign-In provider is enabled in Firebase Console

**Backend Integration Requirements:**
- Backend must verify Firebase ID tokens using Firebase Admin SDK
- Expected header format: `Authorization: Bearer ${firebaseIdToken}`
- On validation failure, backend should return 401 Unauthorized
- Backend should decode token and extract user info for logging/tracking
