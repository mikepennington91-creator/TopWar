# Top War Moderator Management Portal - PRD

## Original Problem Statement
Build a moderator management portal for Top War game with application submission, voting, and admin management features.

## Core User Personas
1. **Applicants** - Submit applications via public form
2. **Moderators** - Review and vote on applications
3. **Senior Moderators/Training Managers** - Make final decisions on applications
4. **Admins** - Full control including user management, settings

## Implemented Features

### Authentication & Roles
- [x] JWT-based authentication
- [x] Role hierarchy: Admin > Senior Moderator > Moderator > MMOD
- [x] Training Manager flag for special permissions
- [x] Easter egg secret pages (Sian appreciation page)

### Application Management
- [x] Public application form at `/apply`
- [x] Application statuses: awaiting_review, pending, approved, rejected, **waiting** (NEW)
- [x] Voting system with approve/reject votes
- [x] Comments system on applications
- [x] Email notifications for status changes
- [x] Dashboard tabs: Pending, Approved, Waiting, Rejected (NEW - Jan 16, 2026)
- [x] Admin toggle to enable/disable new applications (NEW - Jan 16, 2026)
- [x] "No Vacancies" page when applications disabled (NEW - Jan 16, 2026)
- [x] Convert waiting applications to approved when vacancy opens (NEW - Jan 16, 2026)

### Dashboard Features
- [x] Stats cards showing application counts by status
- [x] Search and filter functionality
- [x] Sort by date (newest/oldest)
- [x] Tab-based filtering (Pending/Approved/Waiting/Rejected)
- [x] Application detail dialog with full info
- [x] Voting interface
- [x] Final Decision section (Approve/Waiting List/Reject)
- [x] Export to Excel

### Settings & Admin
- [x] Change password
- [x] Reset other users' passwords (admin)
- [x] Add new moderators (admin)
- [x] View/manage moderator list
- [x] Application Control toggle (admin) - NEW
- [x] Easter egg management

### Email Notifications
- [x] Application confirmation email
- [x] Approval email (with manager comment)
- [x] Rejection email
- [x] Waitlist email (NEW - Jan 16, 2026)
- [x] Waitlist to Approved email (NEW - Jan 16, 2026)

## API Endpoints

### Applications
- `GET /api/applications` - List all applications
- `GET /api/applications/{id}` - Get single application
- `POST /api/applications` - Submit new application
- `PATCH /api/applications/{id}` - Update status (with comment)
- `POST /api/applications/{id}/vote` - Cast vote
- `POST /api/applications/{id}/comment` - Add comment
- `DELETE /api/applications/{id}` - Delete application (admin)
- `GET /api/applications/settings/status` - Public: check if apps enabled
- `GET /api/applications/settings/admin` - Admin: get full settings
- `PATCH /api/applications/settings/admin` - Admin: update settings

### Auth
- `POST /api/auth/login` - Login
- `POST /api/auth/change-password` - Change own password
- `POST /api/auth/admin/reset-password` - Reset user password
- `POST /api/moderators/easter-egg` - Easter egg login

## Tech Stack
- **Backend**: FastAPI (Python)
- **Frontend**: React with Tailwind CSS, Shadcn/UI
- **Database**: MongoDB
- **Email**: Gmail SMTP (smtplib)
- **Image Generation**: Gemini via emergentintegrations (for Sian page)

## Test Credentials
- **Admin**: username: `admin`, password: `Admin123!@`
- **MMOD**: username: `testmmod`, password: `testmmod123`
- **Sian Page**: username: `Sianx`, password: `SmileTime`

## Recent Changes (Jan 16, 2026)
1. Added dashboard tabs (Pending/Approved/Waiting/Rejected) to separate applications
2. Added "Waiting" status for approved applications when no vacancy
3. Added automatic waitlist email when application set to waiting
4. Added "Convert to Approved" button for waiting applications
5. Added Application Control section in Settings with enable/disable toggle
6. Added "No Vacancies" page when applications are disabled
7. Updated stats cards to show all 4 statuses

## Backlog / Future Tasks

### P1 - Important
- [ ] Code refactoring: Split `/app/backend/server.py` into router/service structure
- [ ] Code refactoring: Break down `/app/frontend/src/pages/Settings.js`

### P2 - Nice to Have
- [ ] Bulk actions on applications
- [ ] Application search history
- [ ] Email templates management in UI
- [ ] Dashboard analytics/charts
