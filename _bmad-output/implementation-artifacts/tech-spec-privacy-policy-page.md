---
title: 'Privacy Policy Page'
slug: 'privacy-policy-page'
created: '2026-03-23T22:41:27+07:00'
status: 'Implementation Complete'
stepsCompleted: [1, 2, 3, 4]
tech_stack: ['HTML5', 'Tailwind CSS (custom theme)', 'Vanilla JavaScript', 'Firebase Authentication']
files_to_modify: ['/index.html (footer link)', '/privacy-policy.html (new file)']
code_patterns: ['Single-page app structure', 'Tailwind utility classes', 'Custom CSS variables for theming', 'Mobile-first responsive design (810px breakpoint)']
test_patterns: ['Manual testing - no test framework detected']
---

# Tech-Spec: Privacy Policy Page

**Created:** 2026-03-23T22:41:27+07:00

## Overview

### Problem Statement

The application needs a Privacy Policy page to inform users about data collection and usage practices, particularly around Firebase user ID tracking for the AI Generation feature.

### Solution

Create a new `/privacy-policy.html` page with clear content about data practices, and add a footer link to it from the main application.

### Scope

**In Scope:**
- Create `/privacy-policy.html` with privacy policy content covering:
  - PlantUML diagrams are stored locally in users' web browsers (not on servers)
  - Firebase user ID and AI Generation request counts are collected for abuse prevention and service improvement
  - No emails or personal profile data are collected
- Add a link to the Privacy Policy in the footer of `index.html` after the copyright notice
- Format: "&copy; 2026 Aristo Rinjuang | Privacy Policy"

**Out of Scope:**
- No changes to Firebase authentication implementation
- No changes to local storage implementation
- No other legal pages (Terms of Service, etc.)

## Context for Development

### Codebase Patterns

**HTML Structure:**
- Single-page application (SPA) with embedded modals
- Semantic HTML5 with Tailwind CSS utility classes
- Font family: Poppins (Google Font)
- Mobile-first responsive design with custom 810px breakpoint

**CSS Styling:**
- Tailwind CSS imported via `@import "tailwindcss"` in `/src/css/app.css`
- Custom CSS variables for theme switching (light/dark mode):
  - `--preview-bg`, `--preview-text`, `--preview-border`
- Inline styles mixed with Tailwind classes
- Footer uses `<small>` tag with specific positioning

**Footer Details:**
- Location: Lines 172-182 in `/index.html`
- Current structure:
  ```html
  <p class="space-x-2 flex absolute bottom-3 right-1 opacity-40 hover:opacity-100 text-right">
    <span class="italic">
      <small>
        Powered by <a href="...">CheerpJ</a>...
        <br>
        Feel free to contribute...
        <br>
        &copy; <span id="copyright-year">2026</span> <a href="https://aristorinjuang.com">Aristo Rinjuang</a>
      </small>
    </span>
  </p>
  ```

**JavaScript:**
- Vanilla JavaScript (no frameworks)
- Firebase Authentication for Google Sign-in
- Local browser storage for PlantUML diagrams

### Files to Reference

| File | Purpose | Key Details |
| ---- | ------- | ----------- |
| `/index.html` | Main application HTML - footer to modify | Lines 172-182: Footer with copyright |
| `/src/css/app.css` | Application styles | Tailwind + custom theme variables |
| `/privacy-policy.html` | NEW - Privacy Policy page | To be created |
| `/src/js/app.js` | Application JavaScript | For reference on patterns |

### Technical Decisions

**Privacy Policy Page Structure:**
- Create as standalone `/privacy-policy.html` in project root
- Use simple, clean HTML structure matching the application's style
- Include proper meta tags (charset, viewport, description)
- Link to the same CSS file for consistent styling: `/src/css/app.css`
- Use the same font (Poppins) and responsive patterns

**Footer Link Placement:**
- Add "Privacy Policy" link after the copyright name
- Format: `| Privacy Policy` (pipe separator as requested)
- Place on same line as copyright within the `<small>` tag
- Current: `&copy; 2026 Aristo Rinjuang`
- Target: `&copy; 2026 Aristo Rinjuang | Privacy Policy`
- Use `<a href="/privacy-policy.html">` for the link

## Implementation Plan

### Tasks

- [x] Task 1: Create `/privacy-policy.html` file structure
  - File: `/privacy-policy.html` (NEW)
  - Action: Create new HTML file in project root with:
    - DOCTYPE html declaration
    - `<html lang="en">` root element
    - Meta tags: charset="UTF-8", viewport content="width=device-width,initial-scale=1"
    - Meta description tag for SEO
    - Title tag: "Privacy Policy - PlantUML Editor"
    - Link to favicon: `<link rel="shortcut icon" type="image/x-icon" href="favicon.ico">`
    - Link to CSS: `<link href="/src/css/app.css" rel="stylesheet">`
  - Notes: Follow same HTML structure patterns as `/index.html` for consistency

- [x] Task 2: Create Privacy Policy page content structure
  - File: `/privacy-policy.html`
  - Action: Add body content with:
    - Container div with class `container` (full width like main app)
    - Main content area with max-width constraint for readability (e.g., `max-w-4xl mx-auto px-4 py-8`)
    - Page heading: `<h1 class="text-3xl font-bold text-gray-800 mb-6">Privacy Policy</h1>`
    - Last updated date: `<p class="text-sm text-gray-500 mb-8">Last updated: March 2026</p>`
    - Content sections using semantic HTML (`<section>`, `<h2>`, `<p>`, `<ul>`)
  - Notes: Use Tailwind utility classes for styling consistent with main app

- [x] Task 3: Add Privacy Policy content sections
  - File: `/privacy-policy.html`
  - Action: Add the following content sections:
    1. **Information We Collect**
       - Firebase user ID (anonymous identifier)
       - AI Generation request count (for abuse prevention)
    2. **How We Use Your Information**
       - Prevent abuse of AI Generation feature
       - Improve service quality
    3. **Data Storage**
       - PlantUML diagrams are stored locally in your browser
       - We do NOT store your PlantUML diagrams on our servers
    4. **Information We Don't Collect**
       - We do NOT collect your email address
       - We do NOT collect personal profile data
    5. **Contact**
       - Link to GitHub issues for questions/concerns
  - Notes: Use clear, simple language. Each section should have descriptive `<h2>` headings.

- [x] Task 4: Add "Back to Editor" link to Privacy Policy page
  - File: `/privacy-policy.html`
  - Action: Add a prominent back link at the top and bottom of the page:
    ```html
    <a href="/" class="inline-block mb-6 text-[#1A4F63] hover:text-[#2d6a7f] underline">
      &larr; Back to Editor
    </a>
    ```
  - Notes: Match the brand color (#1A4F63) used in the main application

- [x] Task 5: Update footer in `/index.html` with Privacy Policy link
  - File: `/index.html`
  - Action: Modify line 179 (the copyright line) to add Privacy Policy link:
    - Current: `&copy; <span id="copyright-year">2026</span> <a href="https://aristorinjuang.com">Aristo Rinjuang</a>`
    - Target: `&copy; <span id="copyright-year">2026</span> <a href="https://aristorinjuang.com">Aristo Rinjuang</a> | <a href="/privacy-policy.html">Privacy Policy</a>`
  - Notes: Maintain the exact existing structure, just append ` | <a href="/privacy-policy.html">Privacy Policy</a>` after the Aristo Rinjuang link

### Acceptance Criteria

- [x] AC 1: Given a user navigates to `/privacy-policy.html`, when the page loads, then the page displays with proper HTML structure including meta tags, title, and CSS styling
- [x] AC 2: Given a user is on the Privacy Policy page, when viewing the content, then all required sections are present (Information We Collect, How We Use Your Information, Data Storage, Information We Don't Collect, Contact)
- [x] AC 3: Given a user is on the Privacy Policy page, when reading the Data Storage section, then it clearly states that PlantUML diagrams are stored locally in the browser and NOT on servers
- [x] AC 4: Given a user is on the Privacy Policy page, when reading the Information We Don't Collect section, then it clearly states that emails and personal profile data are NOT collected
- [x] AC 5: Given a user is on the Privacy Policy page, when they click the "Back to Editor" link, then they are navigated to the home page (`/`)
- [x] AC 6: Given a user is on the main PlantUML Editor page, when they scroll to the footer, then they see "© 2026 Aristo Rinjuang | Privacy Policy" with a clickable Privacy Policy link
- [x] AC 7: Given a user is on the main PlantUML Editor page, when they click the Privacy Policy link in the footer, then they are navigated to `/privacy-policy.html`
- [x] AC 8: Given the Privacy Policy page, when viewed on mobile (≤810px), then the content is responsive and readable without horizontal scrolling
- [x] AC 9: Given the Privacy Policy page, when viewed in dark mode (if app theme is dark), then the text colors remain readable (text uses colors that work with both light/dark themes)

## Additional Context

### Dependencies

**No external dependencies** - This feature uses only existing resources:
- Existing CSS file: `/src/css/app.css`
- Existing favicon: `/favicon.ico`
- No new libraries, frameworks, or services required
- No changes to Firebase configuration or authentication flow

### Testing Strategy

**Manual Testing Approach** (consistent with project's existing testing patterns):

1. **Functional Testing:**
   - Verify Privacy Policy page loads at `/privacy-policy.html`
   - Verify all content sections are displayed correctly
   - Verify "Back to Editor" link navigates to home page
   - Verify footer Privacy Policy link is visible and clickable
   - Verify footer Privacy Policy link navigates to Privacy Policy page

2. **Responsive Testing:**
   - Test on mobile viewport (≤810px breakpoint)
   - Test on tablet viewport (768px - 1024px)
   - Test on desktop viewport (>1024px)
   - Verify no horizontal scrolling on any device

3. **Cross-Browser Testing:**
   - Test in Chrome, Firefox, Safari, Edge
   - Verify consistent rendering across browsers

4. **Theme Testing:**
   - Verify readability in light mode
   - Verify readability in dark mode (if user has dark theme enabled)
   - Verify text colors work with CSS theme variables

5. **Accessibility Testing:**
   - Verify semantic HTML structure
   - Verify heading hierarchy (h1 > h2)
   - Verify links have descriptive text
   - Verify sufficient color contrast

### Notes

**Content Considerations:**
- The Privacy Policy content should be reviewed for legal accuracy before deployment
- Consider adding a "Last updated" date that can be easily maintained
- The content is written in plain language for user accessibility

**Future Considerations (Out of Scope):**
- Consider adding a Terms of Service page in the future
- Consider adding a "Cookie Policy" if cookies are added later
- Consider multilingual support if the app expands to other languages

**Implementation Notes:**
- The footer link format uses a pipe separator (`|`) as specifically requested
- The Privacy Policy page is standalone and doesn't require JavaScript functionality
- The page uses the same CSS file as the main app for visual consistency
