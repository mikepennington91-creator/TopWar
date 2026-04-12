# Top War Moderator Portal - PRD

## Original Problem Statement
1. Unsuccessful applications should receive the comment the person rejecting places into the comment box (same as successful applicants)
2. A warning stating "Whatever you write here, will be sent to the applicant" should appear when rejecting
3. Applications should be filterable by ones you have not voted on

## Architecture & Implementation

### Backend Changes
- **File**: `/app/backend/utils/email.py`
  - `send_application_rejected_email` now accepts `manager_comment` parameter
  - Comment is included in rejection email body under "Message from the Moderation Team:"

- **File**: `/app/backend/routes/applications.py`
  - Line 258: `send_application_rejected_email` now passes `update.comment` to the email function

### Frontend Changes
- **File**: `/app/frontend/src/pages/ModeratorDashboard.js`
  - Warning banner now appears for BOTH "approved" AND "rejected" statuses in the status change dialog
  - Warning text: "Whatever you write here, will be sent to the applicant."
  - Added "Not Voted" filter button in the position filter row
  - Filter uses `notVotedFilter` state to hide applications the current user has already voted on

## Previous Implementations
- [2026-02-28] CMod mode feature for user Sian (popup every 3rd login, lime green theme, falling top hats)
- [2026-02-28] CMod bug fixes (auto-disable after 60s, tied to Sian only)
- [2026-02-28] Super Scientist Skill Progression Tree on Dev Secrets
- [2026-02-28] Dev Secrets page overhaul (/2026Roadmap)
- [2026-02-28] OG meta tags & site descriptions

## What's Been Implemented
- [2026-04-12] Rejection comment included in applicant email
- [2026-04-12] Warning banner for rejection status change dialog
- [2026-04-12] "Not Voted" filter for applications

## Prioritized Backlog
- P0: None
- P1: None
- P2: Optional settings to let users toggle CMod on/off manually

## Next Tasks
- User testing and feedback
