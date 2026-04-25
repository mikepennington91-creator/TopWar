# PRD — Kyrios Appreciation Page (TW Applications)

## Problem Statement
Create a team appreciation page for Kyrios, a Discord moderator on the Twapplications.com mod portal. Page must match the existing site's design patterns and be an addition to the existing codebase pulled from GitHub.

## Architecture
- **Frontend**: React + Tailwind CSS (existing Twapplications.com codebase)
- **Backend**: FastAPI with MongoDB (unchanged — static page, no API needed)
- **Routing**: react-router-dom, page at `/kyrios-appreciation`
- **Meta Tags**: react-helmet-async for per-page OG/Twitter tags
- **Favicon**: Custom katana-themed SVG at `/favicons/kyrios.svg`

## What's Been Implemented (Jan 2026)
- Pulled latest code from GitHub (`mikepennington91-creator/TopWar`, main branch)
- Created `/app/frontend/src/pages/KyriosPage.js` matching existing page patterns (GarudaPage, SethPage, SianPage)
- Hero section with samurai avatar, shimmer name, Discord Moderator badge
- Main team quote card + 2 additional quote cards
- Rotating fun facts (6 facts, auto-rotating every 4s)
- 6 achievement badge cards with colored gradients
- 4 Intel Report cards with left/right reveal animations
- Thank You section with emojis
- Scroll-triggered entrance animations via IntersectionObserver (reveal, reveal-scale, reveal-left, reveal-right)
- OG meta tags via react-helmet-async for Discord/social embeds
- Custom katana-themed favicon SVG
- useFavicon.js mapping for title and favicon
- Route added to App.js, import added
- Back to Login button navigating to /moderator/login
- 26 data-testid attributes, all tests passed (100%)

## Files Changed
- `frontend/src/pages/KyriosPage.js` (NEW)
- `frontend/src/App.js` (added import + route)
- `frontend/src/hooks/useFavicon.js` (added favicon + title mapping)
- `frontend/public/favicons/kyrios.svg` (NEW)

## Backlog
- P3: Add a "Share on Discord" button that copies a formatted link
