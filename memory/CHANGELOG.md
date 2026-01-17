# Changelog

All notable changes to the Top War Moderator Management Portal.

---

## [2026-01-16] - Application Management Enhancements

### Added
- **Dashboard Tabs** - Applications now organized into 4 separate tabs:
  - **Pending** - Applications awaiting review or needing votes
  - **Approved** - Fully approved applications
  - **Waiting** - Approved but no vacancy (waitlisted)
  - **Rejected** - Rejected applications

- **"Waiting" Application Status** - New status for approved candidates when no vacancy:
  - Automatic email notification to applicant explaining they're on priority waiting list
  - "Convert to Approved" button when vacancy opens
  - Celebratory email sent when converting from waiting to approved

- **Application Control Toggle** (Admin Settings):
  - New "Accept New Applications" toggle in Settings
  - When disabled: `/apply` shows "Applications Currently Closed" page
  - Friendly messaging with tips for applicants to check back later

- **Updated Stats Cards** - Dashboard now shows counts for all 4 statuses:
  - Needs Review, Approved, Waiting, Rejected

### Changed
- Final Decision section now shows 3 buttons: Approve, Waiting List, Reject
- Status change dialog shows informative message for waiting list option
- Improved email templates with warmer, more professional messaging

### API Endpoints Added
- `GET /api/applications/settings/status` - Public endpoint to check if applications enabled
- `GET /api/applications/settings/admin` - Admin endpoint for full settings
- `PATCH /api/applications/settings/admin` - Toggle applications on/off

---

## [2026-01-15] - Sian Appreciation Page

### Added
- Secret appreciation page for moderator Sian at `/sian-appreciation`
- AI-generated cartoon image using Gemini
- Animated text and rotating fun facts
- Easter egg login: `Sianx` / `SmileTime`

---

## [Previous] - Core Features

### Authentication & Roles
- JWT-based authentication system
- Role hierarchy: Admin > Senior Moderator > Moderator > MMOD
- Training Manager special permissions flag

### Application System
- Public application form at `/apply`
- Voting system (approve/reject)
- Comments on applications
- Email notifications (confirmation, approval, rejection)
- Export to Excel functionality

### Admin Features
- User management (add/remove moderators)
- Password reset capabilities
- Easter egg page management
- Audit logging
