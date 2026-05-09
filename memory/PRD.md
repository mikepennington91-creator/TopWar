# PRD — Top War Moderator Portal

## Latest Feature: Moderator Organogram (Jan 2026)

### Problem Statement
Pull latest code from https://github.com/mikepennington91-creator/TopWar and add an Admin-managed Organogram (org chart) section. Hierarchical mod ranks (CMod → MMod → SMod → LMod → Mod), assignable to portal users with profile picture upload, parent→child reporting structure, multiple mods of the same rank share a row.

### User Choices
- Hierarchy: CMod (top) → MMod → SMod → LMod → Mod (bottom)
- Permissions: Admin + CMod (organogram-rank) can edit
- Portal user assignment: dropdown of existing portal users
- Profile pictures: base64 stored in MongoDB
- Layout: tiered with parent→child connecting lines

### Architecture
- Backend: FastAPI + MongoDB collection `organogram_nodes`
- Routes module: `/app/backend/routes/organogram.py` (mounted at `/api/organogram`)
- Frontend page: `/app/frontend/src/pages/Organogram.js` at `/moderator/organogram`
- SVG connectors computed via refs + `getBoundingClientRect`
- Permission rule: `is_admin == true` OR user has organogram node with `rank == "CMod"`

### Endpoints
- `GET /api/organogram/nodes` (any auth)
- `GET /api/organogram/portal-users` (any auth) — list assignable users with `is_assigned`
- `GET /api/organogram/can-edit` (any auth) — boolean
- `POST /api/organogram/nodes` (admin / CMod) — create node
- `PATCH /api/organogram/nodes/{id}` (admin / CMod) — update rank/parent/display_name/profile_picture
- `DELETE /api/organogram/nodes/{id}` (admin / CMod) — delete; children reparent to deleted node's parent

### What's Been Implemented
- Pulled latest TopWar repo into `/app`, configured backend/frontend `.env`, restored services
- Seeded test users: Admin, CModUser, SampleSMod, SampleLMod, SampleMod1, SampleMod2
- New `organogram_nodes` collection with cycle prevention, rank-vs-parent validation, duplicate user guard
- Frontend Organogram page: tiered layout (5 rank rows), SVG connectors, profile picture preview, base64 upload, admin/CMod edit/delete with always-visible icons, view-only for everyone else
- Bio (≤400 chars) + Team (in_game / discord / both) per node, rendered on cards
- Drag-and-drop re-parenting with cycle/rank validation; "drop to make root" zone during drag
- Export PNG via `html-to-image` (2x pixel ratio)
- **Discord webhook integration**: admin-configurable webhook URL stored in `app_settings`; Share to Discord button posts the chart PNG with rich embed (member count, CMod count, custom message, amber color, timestamp)
- Added `Org Chart` to navigation menu and Moderator Portal quick actions
- Permission gate `can-edit` exposed via API and used in UI to toggle admin controls
- 23/23 backend pytest pass; all frontend flows verified by testing agent

### Files Changed/Added
- NEW `/app/backend/routes/organogram.py` (nodes CRUD + webhook config + share endpoint)
- MOD `/app/backend/server.py` (router include)
- NEW `/app/frontend/src/pages/Organogram.js`
- MOD `/app/frontend/src/App.js` (route + import)
- MOD `/app/frontend/src/components/Navigation.js` (Network nav item)
- MOD `/app/frontend/src/pages/ModeratorPortal.js` (quick action button)
- MOD `/app/frontend/package.json` (`html-to-image` dependency)
- NEW `/app/backend/tests/test_organogram.py` (regression suite)

### Tree Layout & Mobile Polish — Feb 2026
- Refactored chart to absolute-positioned tree layout (Reingold-Tilford-style):
  children sit directly under their primary parent; siblings cluster.
- Connectors now drawn as right-angle (orthogonal) elbow lines instead of curves.
- Each parent gets a deterministic color from a 16-tone palette so 15+ reporting
  lines from a single parent are visually distinguishable.
- Mobile pinch-to-zoom + zoom in/out/reset toolbar (range 40%–200%).
- Auto-fit on initial mobile load if the chart is wider than the viewport.
- PNG export & Discord share now capture at zoom=1, producing a tighter, more
  Discord-mobile-friendly image.
- Webhook config + Share dialogs reflowed for narrow screens (stacked buttons,
  dynamic max-width).

### Backlog
- P2: Server-side cap on profile_picture size to prevent abuse via direct API
- P3: Filter org chart by Team (e.g. "Show only Discord team")
- P3: Click-card to open profile dialog showing full bio + recent activity
- P3: Send a Discord message when nodes are added/promoted (auto-publish events)
- P3: Componentize `Organogram.js` (1,400+ lines) — split layout/dialogs/SVG into modules
