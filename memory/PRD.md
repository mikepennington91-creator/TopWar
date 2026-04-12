# Top War Moderator Portal - PRD

## Original Problem Statement
User requested a CMod mode feature for user "Sian" where:
- A popup appears asking if Sian wants to enable CMod mode
- The popup appears every 3rd login (3, 6, 9, etc.)
- CMod mode transforms the site into a lime green theme
- Falling top hats 🎩 animate across the screen

## Architecture & Implementation

### Backend Changes
- **File**: `/app/backend/routes/auth.py`
  - Added `login_count` tracking for all users
  - Added `show_cmod_prompt` field in login response
  - Logic: Shows popup when `login_count % 3 == 0` for user "Sian"

- **File**: `/app/backend/models/schemas.py`
  - Added `show_cmod_prompt: bool = False` to Token model

### Frontend Changes
- **New Files**:
  - `/app/frontend/src/components/CModPrompt.js` - Popup dialog component
  - `/app/frontend/src/components/CModOverlay.js` - Falling top hats animation
  - `/app/frontend/src/hooks/useCMod.js` - Context for CMod state management

- **Modified Files**:
  - `/app/frontend/src/App.js` - Added CModProvider and CModOverlay
  - `/app/frontend/src/App.css` - Added lime green theme CSS (.cmod-theme)
  - `/app/frontend/src/pages/ModeratorLogin.js` - Added CMod prompt handling
  - `/app/frontend/src/components/Navigation.js` - Added disableCMod on logout
  - `/app/frontend/src/pages/ModeratorDashboard.js` - Added disableCMod on logout
  - `/app/frontend/src/pages/ModeratorPortal.js` - Added disableCMod import

## Core Requirements (Static)
- ✅ Popup appears every 3rd login for Sian
- ✅ Lime green theme applied to entire site when enabled
- ✅ Falling top hats animation visible
- ✅ CMod mode persists until logout
- ✅ CMod mode disabled on logout

## User Personas
- **Sian**: Special moderator user who receives CMod mode offer every 3rd login
- **Other Moderators**: Standard login flow without CMod prompt

## What's Been Implemented
- [2026-02-28] CMod mode feature for user Sian
  - Popup dialog on every 3rd login
  - Lime green theme transformation
  - Falling top hats animation
  - Proper cleanup on logout
- [2026-02-28] CMod bug fixes
  - CMod now tied to Sian account only — clears on other user login
  - Auto-disables after 60 seconds (timer with localStorage expiry)
  - Easter egg login flow clears stale CMod state
  - All dates on DevSecrets.js moved to post-April 1st (April Fools page)
  - Shadow Reaper: Q1 2026 -> April 2026
  - Phoenix Queen: Q1 2026 -> May 2026
  - Alliance Wars 2.0: March 2026 -> April 2026
  - Mercenary System: January 2026 -> April 2026
- [2026-02-28] Super Scientist Skill Progression Tree added to Dev Secrets
  - 4-tier skill tree: Foundation -> Applied Sciences -> Quantum Research -> Final Perk
  - Final perk: Invincible Bomb - penetrates shields when target has <50% shield time remaining
  - Visual progression with locked/unlocked states and animated glow effects
- [2026-02-28] Dev Secrets page overhaul (now /2026Roadmap)
  - Default language changed to Chinese with English toggle
  - Skill tree moved to top of page (most believable section)
  - Fake "游戏截图" (Game Screenshots) button with Chinese-only login popup (always fails)
  - URL changed from /dev-secrets to /2026Roadmap
  - Chinese OG meta tags for link preview: "2026 路线图 — 内部开发资料"
- [2026-02-28] OG meta tags & site descriptions
  - Main site: "Top War — Moderator Recruitment Portal" with proper description
  - /2026Roadmap: Chinese title/description for link embeds
  - Added react-helmet-async for per-route meta tags

## Prioritized Backlog
- P0: None
- P1: None
- P2: Optional settings to let users toggle CMod on/off manually

## Next Tasks
- User testing and feedback collection
- Consider adding CMod toggle in Settings for Sian
