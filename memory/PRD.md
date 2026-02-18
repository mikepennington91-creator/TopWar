# Top War Moderator Portal - PRD

## Original Problem Statement
Add position filters (In-Game, Discord, Both) to the moderator dashboard as additional filters underneath the existing tab filters. These should be multiselect buttons (not dropdown), and include an "All" option to show all applications.

## Architecture
- **Frontend**: React.js with Tailwind CSS
- **Backend**: FastAPI with Python
- **Database**: MongoDB
- **Authentication**: JWT-based auth

## Core Requirements (Static)
1. Position filtering should be separate from status/tab filtering
2. Position filters must be multiselect (can select multiple simultaneously)
3. Filters should appear underneath existing tabs, not in dropdown
4. "All" filter shows all applications regardless of position

## What's Been Implemented (Feb 18, 2026)
- Added `positionFilter` state with default value `["all"]`
- Added `togglePositionFilter` function for multiselect logic
- Added position filter UI with 4 buttons: All, Discord, In-Game, Both
- Integrated position filtering into useEffect dependency array
- Position filter applied in application filtering logic
- Proper styling with active/inactive states for each button
- Each button has unique color scheme:
  - All: Slate/gray
  - Discord: Indigo/purple
  - In-Game: Cyan/teal
  - Both: Amber/orange

## User Personas
- **Moderators**: Review and vote on applications
- **Training Managers**: Special permissions for approving
- **Discord/In-Game Leaders**: Team-specific approval capabilities
- **Admins**: Full system access

## Prioritized Backlog
### P0 (Complete)
- [x] Position multiselect filters

### P1 (Future)
- [ ] Export filtered applications to CSV
- [ ] Bulk actions on filtered applications

### P2 (Backlog)
- [ ] Save filter preferences per user
- [ ] Filter presets

## Next Tasks
1. Visual testing when preview environment is available
2. End-to-end testing of filter functionality
