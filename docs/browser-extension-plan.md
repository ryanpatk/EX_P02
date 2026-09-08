# memex Browser Extension — Plan

**Status:** Phase 1 built (2026-09-06) — `api/` worker, `api_tokens` migration + Settings UI, and the MVP extension in `extension/` (vanilla MV3, load-unpacked). Remaining Phase 1 ops: apply migration, deploy worker, install extension. Phases 2–3 below are still open.
**Goal:** save the current tab to memex in one click — no copy/paste — and grow into a general capture surface for the app.

## Why

Capture friction is the biggest leak in a working-memory system. Today saving a link means: switch to memex, focus the omnibar, paste. The extension collapses that to a single click or shortcut from anywhere in the browser, which is the difference between "I save everything interesting" and "I save things when I remember to."

## Phase 1 — one-click save (MVP)

- **Manifest V3** extension (Chrome first; Firefox once stable — MV3 APIs now overlap enough).
- Toolbar action: click → saves the active tab's URL + title + favicon to the default library. Badge flashes a checkmark on success; a click sound per JOYFUL_SYSTEMS.
- Keyboard shortcut (`⌘⇧S` or similar) doing the same.
- Popup (small, JOYFUL_SYSTEMS-styled) shown on click with the save already in flight — displays what was saved and offers optional space/tag assignment, Undo, and a note field. Closing it without touching anything is the happy path.
- Metadata (description, preview image) comes from the **memex-scraper worker** — the extension doesn't scrape; it reuses `scraper/` exactly as the web app does.

## Auth & API — the key decision

The extension should **not** talk to Supabase directly. Reasons:

1. We are actively planning to migrate off Supabase; baking `supabase-js` + its session model into a separately-shipped extension creates a second migration surface with an app-store review cycle attached.
2. Extension storage of a full Supabase session is a larger credential than the job needs.

**Plan:** a small **`memex-api` Cloudflare Worker** (sibling of `scraper/`) exposing exactly what the extension needs:

```
POST /api/capture   { url, title?, note?, spaceId?, tagIds? }   → creates a link
GET  /api/spaces                                                → id + name list
GET  /api/tags                                                  → id + name list
```

- Authenticated with a **personal access token** the user generates in memex Settings and pastes into the extension once. The worker maps token → user and (for now) writes through to Supabase with a service-role key held only in the worker. When the database moves, only the worker changes; the extension is untouched.
- This worker is also the natural first brick of the eventual post-Supabase backend — the extension work and the migration work compound rather than compete.

## Phase 2 — capture ergonomics

- Context-menu items: "Save link to memex" (on any anchor), "Save image to memex" (sets preview image).
- Select text → "Save to memex as note" (markdown, with source URL attached).
- Duplicate detection: badge indicates when the current page is already saved; clicking opens/edits the existing link instead of duplicating.
- Offline queue: captures made offline persist in `chrome.storage` and flush when back online.

## Phase 3 — memex at hand

- Popup search over your links/notes/tasks (via the API worker) — a mini-omnibar in the browser chrome.
- New-tab page option: the memex dashboard as your new tab (the launchpage vision, without needing the hosted app loaded).
- Task capture ("turn this page into a task").

## Technical shape

- **Repo layout:** `extension/` directory in this repo (like `scraper/`), own `package.json`.
- **Tooling:** [WXT](https://wxt.dev) (Vite-based MV3 framework — HMR, cross-browser builds) or plain Vite + CRXJS. Decide at build time; WXT preferred.
- **Design:** JOYFUL_SYSTEMS tokens (near-white popup, palette accents, 4px spacing, soft radii, ≤250ms animations, click/confirm sounds). The popup is a real JOYFUL_SYSTEMS surface, not an afterthought.
- **Shared types:** the capture payload and API response types live with the API worker and are imported by the extension (copy or workspace reference — decide when `memex-api` exists).

## Order of work

1. `memex-api` worker: token auth + `POST /api/capture` (writes to Supabase behind the scenes).
2. Settings UI in memex: generate/revoke personal access token.
3. Extension MVP: action click + shortcut + popup, calling the worker.
4. Phase 2 items, prioritized by actual friction encountered.

## Open questions

- Token UX: single long-lived token vs. per-device tokens with names/revocation (lean: per-device, it's cheap to do early and painful to retrofit).
- Firefox/Safari timing — Safari requires an Xcode wrapper; defer until asked for.
- Whether Phase 3's new-tab page replaces or embeds the hosted dashboard.
