# Sequence — Email Outreach Console

A clean, modern frontend for running and tracking cold-email **sequences**, built from
the *AI Event Tracking System* Google Sheet (the World AI Summit partnership outreach).

It turns the raw sheet — Master / Workflows / Email_Templates / Report / Bounced_Emails /
Tracking_Logs — into a usable product: a dashboard, a visual sequence builder, a template
editor, a recipients table, and a live activity feed.

![views: Dashboard · Sequences · Templates · Recipients · Activity]

## What's inside

| View | What it does |
|------|--------------|
| **Dashboard** | KPI cards (sent / open / click / reply / bounced), engagement funnel, most-engaged leaderboard, activity-over-time chart, recent events, and per-step sequence performance. |
| **Sequences** | Visual cadence builder. Each workflow is a vertical timeline of steps (Initial Email → Follow-ups). Edit the template and wait-days per step, add/remove follow-ups, pause/resume, see how many recipients reached each step, and create new sequences. |
| **Templates** | Card library + editor with **live preview**, HTML source toggle, merge-variable chips (`{Name}`, `{Organization}`, …), sender, subject, and attachments. Google-Doc-linked templates are detected and linked. |
| **Recipients** | Searchable, filterable table (198 contacts). Status pills (Sent / Opened / Clicked / Replied / Bounced), follow-up progress dots, opens/clicks. Click a row for a full **engagement timeline** drawer. Add recipients into a sequence. |
| **Activity** | Live tracking feed (opens & clicks) with filters, the bounced-email list, and an event breakdown. |

## Data

Seeded from the original workbook into [`src/data/seed.json`](src/data/seed.json):

- **198** recipients with full send/open/click/reply tracking
- **1** sequence (`World_AI`): Initial → FU1 (+1d) → FU2 (+2d) → FU3 (+1d) → FU4 (+1d)
- **5** templates · **9** bounced addresses · **3,198** tracked events (recent 400 kept for the feed, plus daily aggregates)

All edits (sequences, templates, recipients) persist to `localStorage`.
Use **Reset to imported data** in the sidebar to restore the original sheet.

## Run it

```bash
npm install
npm run dev      # http://localhost:5176
npm run build    # typecheck + production bundle into dist/
```

Stack: **Vite + React + TypeScript + Tailwind v4 + lucide-react**. No backend required.

## Connecting the sending engine (next step)

The actual sends are handled by the existing **Google Apps Script web app** (its deployment
URL is in `seed.campaign.webAppUrl`, linked from the top bar as *Sending engine*). To make this
console live rather than read-only, point a thin API layer at that web app: `doGet`/`doPost`
endpoints that return the Master/Report rows as JSON and accept new recipients / sequence edits —
then swap `loadState()` in [`src/lib/store.tsx`](src/lib/store.tsx) from the bundled seed to a fetch.
