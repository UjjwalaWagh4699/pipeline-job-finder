# Pipeline - Live Job & Internship Finder + Application Tracker

A full-stack app that pulls **live job and internship listings from public APIs**, lets you search and filter them, save the ones you like into a personal kanban tracker, and shows market insights.

## Features
- **Live data aggregator**: the Node server fetches listings from Remotive and Arbeitnow, normalizes them, stores them in SQLite and re-syncs every 30 minutes (plus a "Refresh now" button). The UI notices new syncs automatically.
- **Discover**: server-side search, type filter (internship / full-time / contract), remote filter, source filter, sorting and pagination
- **Tracker**: save any listing in one click, then move it through Saved, Applied, Interview, Offer, Rejected (drag and drop), with priority, follow-up dates and CSV export
- **Insights**: most requested skills, top hiring companies, listings per day, breakdown by type and source
- **Authentication**: register and log in; passwords hashed with scrypt, signed tokens (HMAC-SHA256); every user only sees their own applications
- Dark mode, responsive layout, loading and error states

## Tech stack
React 18, Vite, Node.js, Express, SQLite (`node:sqlite`), REST API, plain CSS

## Run locally (Node.js 22.13 or newer)
```bash
npm run setup
npm run dev
```
Open http://localhost:5173, create an account, and wait a few seconds for the first sync.

## API overview
| Method | Endpoint | Purpose |
|---|---|---|
| POST | /api/auth/register, /api/auth/login | Create account, log in |
| GET | /api/listings?q=&type=&remote=&source=&sort=&page= | Search live listings |
| GET / POST | /api/sync | Sync status / fetch fresh data now |
| GET | /api/insights | Aggregated market stats |
| GET, POST, PUT, DELETE | /api/jobs, /api/jobs/:id | Tracker CRUD |
| PATCH | /api/jobs/:id/stage | Move between stages |

## Deploying
Set the `JWT_SECRET` environment variable on the server. Host the API on Render and the client on Vercel.
