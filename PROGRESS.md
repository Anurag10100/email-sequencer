# Build Roadmap — Sequence SaaS

Self-paced build loop. Goal: a sophisticated, modern, "real SaaS" email sequencing product.
Each iteration must leave the app building (`npm run build` clean) and verified in preview.

## Status legend: ✅ done · 🔄 in progress · ⬜ todo

### Foundation (shipped before the loop)
- ✅ Vite + React + TS + Tailwind v4 scaffold
- ✅ 5 views: Dashboard, Sequences, Templates, Recipients, Activity
- ✅ Seeded from real World_AI export (198 contacts, 5 templates, 3198 events)
- ✅ localStorage persistence + reset

### Iteration 1 — Product shell & feedback ✅ (verified in preview, build clean)
- ✅ Toast notification system (global, wired into all mutations) — `src/lib/toast.tsx`
- ✅ Command palette (⌘K) — navigate + quick actions via UI intent bus — `src/lib/ui.tsx`, `CommandPalette.tsx`
- ✅ Settings view — sender identity, daily cap, sending window, tracking, unsubscribe, deliverability score ring
- 🔄 Dark mode — infra in place (theme state + `.dark` class); DEFERRED proper semantic-token pass to a later iteration so it's not low-contrast

### Iteration 2 — Make it feel alive (Inbox + CSV import shipped early in iter 1)
- ✅ Inbox / Replies view (unified reply management, thread bubbles, mock reply) — `Inbox.tsx`
- ✅ CSV import for recipients (paste / upload, dedupe preview, column mapping) — `Contacts.tsx` ImportModal
- ✅ Send simulation engine — `src/lib/sim.tsx`: "Simulate sends (N)" / "Queue test batch & run" on the
  Sequences header, live topbar pill, reactive dashboard/inbox/funnel updates, reply toasts. Verified live
  (click 42.9%→55.6%, reply 0.5%→3.5%, inbox badge 1→7 climbing in real time), then Reset restores baseline.

### Iteration 3 — Analytics depth ✅ (verified)
- ✅ Dedicated Analytics view with per-sequence breakdown — `Analytics.tsx`
- ✅ Step-by-step drop-off funnel per sequence
- ✅ Best send-time heatmap (hour x weekday from tracking logs)
- ✅ Engagement-by-organization table

### Iteration 4 — Onboarding & polish
- ⬜ Landing / sign-in gate → workspace
- ⬜ Empty states everywhere, loading skeletons
- ⬜ Keyboard shortcuts help (?), micro-interactions

### Iteration 5 — Depth & realism
- ⬜ Per-contact email thread view
- ⬜ Suppression list / unsubscribe handling
- ⬜ A/B variants on a sequence step
- ⬜ Export reports (CSV)
- ⬜ Sequence templates gallery (pre-built cadences)

## Notes for the next iteration
- Keep everything persisted in the store (localStorage) so reloads are stable.
- After each chunk: `npm run build` must pass, then verify in preview (server name `email-sequencer`, port 5176).
- Flip the checkboxes above as items land; this file is the source of truth across loop iterations.
- UI intent bus: `useUI()` → `runAction('view:action')` (e.g. `contacts:import`). Toasts: `useToast()`.
- Preview console retains stale HMR-churn errors after edits — trust a fresh reload + screenshots over the console buffer.

### NEXT UP (in priority order)
1. **Dark mode (proper)** — convert core surfaces to semantic CSS-variable tokens (`--surface`, `--border`,
   `--text`, `--text-muted`, `--canvas`) defined at `:root` and `.dark`, applied via `@theme`/utility classes,
   so `Card`, `inputCls`, topbar, tables, and primary text all flip cleanly. Then re-expose the toggle in the
   topbar + command palette (theme state already lives in `src/lib/ui.tsx`).
2. **Iteration 4 polish** — empty states + loading skeletons; `?` keyboard-shortcuts help sheet; subtle
   micro-interactions; optional landing/sign-in gate → workspace.
3. **Iteration 5 depth** — per-contact thread view, suppression list, A/B step variants, CSV export, sequence gallery.

### Templates page redesign ✅ (verified)
- Rich **rendered email thumbnails** per card (scaled live HTML preview) — `Templates.tsx`
- White-text follow-up emails now render on a **dark canvas** (`prefersDark`) instead of being invisible
- Broken-image fallback (`useImageFallback`), Google-Doc placeholder thumbnail, step badges, Doc/HTML tags,
  hover Edit/Duplicate actions, "Unused" flag, and a dashed "New template" tile
- Editor preview upgraded to a realistic **email-client frame** (`EmailPreview`: sender avatar, from/to, subject, body)

### Housekeeping done this tick
- Consolidated to a single dev port **5176** (`vite.config.ts` strictPort + README) and killed the stray 5173
  duplicate server that was confusing which URL to open.

### Design-system elevation ✅ (verified)
- Loaded **Inter** (variable, optical sizing) + refined type scale, tracking, tabular numerals
- Token system in `index.css`: layered shadows (`shadow-soft/lift/glow`), refined radii, a soft two-glow canvas, `.glass`, skeleton + motion
- Premium **gradient sidebar** with grouped nav (Overview / Build / Engage), glowing active indicator, workspace header, live campaign card
- Glassmorphic topbar; refined `Card` (hairline ring + soft shadow), gradient/glow `Button`, ring focus inputs, deeper modal
- Dashboard KPI cards: bold tabular figures, gradient icon tiles, hover lift + accent glow

### Still open for a future pass
- **Dark mode (proper)** — biggest remaining "modern SaaS" gap; needs the semantic-token migration so every surface flips cleanly, then re-expose the ⌘K/topbar toggle.

## LOOP STOPPED by user request (do not auto-reschedule). Resume only on an explicit new request.
