# Top War Moderator Portal - PRD

## Original Problem Statement
Add Japanese (Hiragana/Natural Japanese) translation to the full website except application form and viewing/voting on applications. Translation toggled via flag buttons (Japanese Flag for Japanese, Great British Flag for English). Flags should be in navigation consistently across pages. Menus should change language when toggle is selected.

## Architecture

### Translation System
- **LanguageContext** (`/src/contexts/LanguageContext.js`) - React context for language state management
- **Translations** (`/src/i18n/translations.js`) - Comprehensive English/Japanese translation mappings
- **useTranslation Hook** (`/src/hooks/useTranslation.js`) - Custom hook for accessing translations
- **LanguageToggle** (`/src/components/LanguageToggle.js`) - Flag button component (🇬🇧 / 🇯🇵)

### Translated Pages
- ✅ Landing.js - Hero section, mission brief, buttons
- ✅ ModeratorLogin.js - Form labels, buttons, password requirements
- ✅ ModeratorPortal.js - Quick actions, announcements, feature requests
- ✅ ServerAssignments.js - Page titles, form labels, table headers
- ✅ Navigation.js - All menu items (Portal, Apps, Servers, Polls, etc.)

### Excluded from Translation (per user request)
- ApplicationForm.js - Keeps original English for form content
- ModeratorDashboard.js - Application viewing/voting remains English

## User Personas
- **Applicants**: Japanese or English speakers applying for moderator positions
- **Moderators**: Team members using portal in preferred language
- **Admins**: Managing announcements, settings in preferred language

## Core Requirements
- [x] Japanese translation toggle using flag buttons
- [x] Great Britain flag for English
- [x] Japan flag for Japanese  
- [x] Language preference persisted in localStorage
- [x] Consistent flag placement in navigation across all pages
- [x] Natural Japanese (Hiragana + Katakana + Kanji mix)

## What's Been Implemented
**Date: March 2026**
- Created translation system with React Context
- Implemented LanguageToggle component with SVG flags
- Added comprehensive Japanese translations for:
  - Navigation menu items
  - Landing page content
  - Login page form and labels
  - Moderator Portal quick actions and sections
  - Server Assignments page titles and labels
  - Settings, Polls, Changelog, Audit Log sections
- Updated 5 main components/pages to use translations
- Language persists across sessions via localStorage

## Prioritized Backlog

### P0 - Critical (Done)
- [x] Language toggle in navigation
- [x] Landing page translation
- [x] Login page translation
- [x] Portal menu buttons translation

### P1 - High Priority
- [ ] Complete Settings.js translation integration
- [ ] Complete Polls.js translation integration
- [ ] Complete Changelog.js translation integration
- [ ] Complete AuditLog.js translation integration

### P2 - Nice to Have
- [ ] Auto-detect browser language preference
- [ ] Add more languages (e.g., Chinese, Korean)
- [ ] Translate form placeholders
- [ ] Translate toast messages

## Next Tasks
1. Apply useTranslation to remaining pages (Settings, Polls, Changelog, AuditLog)
2. Consider adding browser language auto-detection
3. Test on mobile devices for flag button usability
