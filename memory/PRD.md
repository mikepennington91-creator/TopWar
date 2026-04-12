# Top War Moderator Portal - PRD

## Original Problem Statement
1. Unsuccessful applications should receive the comment the person rejecting places into the comment box (same as successful applicants)
2. A warning stating "Whatever you write here, will be sent to the applicant" should appear when rejecting
3. Applications should be filterable by ones you have not voted on
4. All emails converted to branded HTML with Top War Battle Game logo by RiverGames + re-apply link

## Architecture & Implementation

### Backend Changes
- **File**: `/app/backend/utils/email.py` — Full rewrite to HTML email templates
  - All application emails now use branded HTML with Top War logo from RiverGames
  - `send_application_rejected_email` accepts `manager_comment` and includes it in styled comment box
  - Rejection email includes "Re-Apply When Ready" button linking to `/apply`
  - Approval emails include manager comment in styled box
  - Waitlist, confirmation, password reset all converted to HTML
  - Logo: `https://www.rivergame.net/en/res/img/comm/home/topcover/title.png`

- **File**: `/app/backend/routes/applications.py`
  - Rejection status change now passes `update.comment` to email function

### Frontend Changes
- **File**: `/app/frontend/src/pages/ModeratorDashboard.js`
  - Warning banner for BOTH "approved" AND "rejected" status changes
  - "Not Voted" filter button to find applications user hasn't voted on

## Previous Implementations
- [2026-02-28] CMod mode feature for user Sian
- [2026-02-28] Super Scientist Skill Progression Tree on Dev Secrets
- [2026-02-28] Dev Secrets page overhaul (/2026Roadmap)
- [2026-02-28] OG meta tags & site descriptions

## What's Been Implemented
- [2026-04-12] Rejection comment included in applicant email
- [2026-04-12] Warning banner for rejection status change dialog
- [2026-04-12] "Not Voted" filter for applications
- [2026-04-12] All emails converted to branded HTML with Top War logo + re-apply link

## Prioritized Backlog
- P0: None
- P1: None
- P2: Optional settings to let users toggle CMod on/off manually

## Next Tasks
- User testing and feedback
