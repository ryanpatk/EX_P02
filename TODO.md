# TODO

Working checklist to keep memex moving. Updated 2026-10-18 — prune freely as things land.

## 🔑 Your action items (need your credentials / accounts — code is ready and waiting)

These unlock everything built this session. Roughly 10 minutes total, in order:

- [x] **Apply the Notes to Self + per-space super favorite migrations** — applied (the Journal loads real jots, seen 2026-10-15)
- [x] **Migrate legacy Notes to Self** — 322 messages migrated into Home ✓ 2026-09-07 (`node --env-file=.env.migrate scripts/migrate-self-messages.mjs --email …`; `.env.migrate` holds the keys, gitignored — keep it for the notes migration, delete after)
- [x] **Migrate legacy notes** — 85 notes migrated into the root, no space association by decision ✓ 2026-09-07 (`scripts/migrate-notes.mjs`; legacy collections ignored). `.env.migrate` can be deleted now unless more legacy data is coming.
- [x] **Apply the token migration** — `supabase db push` ✓ 2026-09-06
- [ ] **Deploy the scraper** — `cd scraper && npx wrangler login && npm run deploy`
  - [ ] Add your production app origin to `ALLOWED_ORIGINS` in `scraper/wrangler.jsonc` first
  - [ ] Set `VITE_SCRAPER_URL` in `.env` (a commented line is already there) and in your production host's env
  - [ ] Re-test a Pinterest pin through the *deployed* worker (worked locally; datacenter IPs can differ — fallback plan is in `scraper/README.md`)
- [ ] **Browser extension v0.2 setup** — full checklist in `docs/browser-extension-plan.md` → “Ops checklist”: `supabase db push` (adds `links.source`), deploy `api/` (service key secret + `SCRAPER_URL`), create an access token, `cd extension && npm install && npm run build`, load `extension/.output/chrome-mv3` unpacked, paste API address + token
- [ ] **Backfill old links** — `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… SCRAPER_URL=… node scripts/backfill-metadata.mjs --dry-run` (then without `--dry-run`)
- [ ] **Rotate the GitHub OAuth secret** — `.env` has `VITE_GITHUB_CLIENT_SECRET` in it; `VITE_`-prefixed vars are bundled into the client, so treat it as exposed. Rotate it in GitHub and keep the secret out of frontend env

## ✅ Verify after setup

- [x] Save a new link in the app → real title/description + preview image ✓ verified locally 2026-09-06, **including a Pinterest pin** (re-verify once against the deployed worker)
- [ ] Extension on real sites (⌘⇧S, X bookmark, Pinterest save, offline queue) — checklist in `docs/browser-extension-plan.md` → “Verify on the real sites"
- [ ] Dev server boots clean (the QueryClient crash is fixed; confirm no console errors)

## ☁️ Cloudflare migration (config done — run these in order)

- [x] Scraper deployed (`memex-scraper.joyfulsystems.workers.dev`) ✓
- [x] `.env.production` filled with deployed scraper URL ✓
- [x] App live at `https://memex.joyfulsystems.workers.dev` ✓
- [x] Scraper `ALLOWED_ORIGINS` includes production origin ✓
- [x] Verified live: scraper working on the deployed domain ✓ 2026-09-07
- [x] DigitalOcean app deleted ✓ 2026-09-07
- [ ] **Custom domain (Namecheap)**: add domain to Cloudflare (free plan) → switch nameservers at Namecheap → attach custom domain to the memex worker → update Supabase auth URLs + scraper `ALLOWED_ORIGINS` for the new origin → redeploy scraper

## 🎨 UX redesign (decided 2026-10-15 via `/mocks`, built same day)

- [x] **Stream** — masonry (1A) ⇄ reading list (1C) toggle; `?view=list`, remembered per browser. Tasks are a checklist band (grid) or inline rows (list), time-grouped in list view
- [x] **Link preview cards** — 7C image-first with frosted caption on hover; Settings → “Link cards” picks Hover (7C), Overlay (7A), or Inset (7E). Default lives in `src/utils/linkCaptions.ts`
- [x] **Pinned sites** — 2C labelled launcher row under the page heading; footer bar removed, settings at the sidebar foot (phones: wordmark → drawer)
- [x] **Link details** — 3C expand in place (`?link=`), neighbours animate via `MasonryLayout`. *Evaluate the feel; fallback is 3A side panel*
- [x] **Search & capture** — 4A command palette (`CommandBar`): ⌘↵ note, ⇧⌘↵ task, Add link for URLs, cross-type results, “/” to focus
- [x] **Note editor** — 5A document column, large title, metadata line, “Saved” as text, ··· menu
- [x] **Spaces** — 6A colour dot (swatch palette, creation order) + space heading with count and Edit space
- [x] **Undo** — deletes hide immediately and commit after 6s unless undone (no confirm dialogs)
- [ ] **Per-space colour picker / description** — needs `profiles.color` / `profiles.description` columns (migration)
- [ ] **“Why I saved this” note on links** — needs a `links.note` column (migration)
- [x] **Retire** `LinkDetailsPanel`, `Omnibar`, `TaskGridCard`, the old `.memex-grid` CSS ✓ 2026-10-16 — `/mocks` still to go once the new surfaces settle
- [x] **Notes to Self → Journal** (10B: continuous jot list by day with each day's activity folded; jot → note/task; 9A labelled header button, shortcut J) ✓ 2026-10-15; replaced the short-lived 8D Today column; `NotesToSelfPanel` / `TodayPanel` removed
- [ ] **Round 4 mocks** — mobile layout, tags (ship or remove), swatch presence

## 🔨 Next build tasks (ask Claude, no credentials needed)

- [ ] **Journal polish**: edit a jot in place, move a jot between scopes, jots in the command palette, markdown-lite in jots
- [x] **JOYFUL pass** ✓ 2026-09-08: color model (hue-keyed neutrals, paper-first canvas, tint pairs), Geist Mono for data, press travel, canvas grain, capture pop-in — listen/look test in both themes; next candidates: a hue per space, haptics on mobile
- [ ] **Stream refinements** (layout refactor landed 2026-09-07): ~~visual pass on note/task cards vs. the link card~~ ✓ 2026-10-16 (one card surface, shared selection check, note cards show last-edited, keyboard-selectable task rows); ~~space rename/delete from the sidebar~~ ✓ 2026-09-08; empty-space onboarding copy; keyboard nav across cards
- [x] **Remove list-view leftovers** ✓ 2026-10-16 — components deleted, styleguide shows the live stream cards
- [x] **Prune dead CSS** ✓ 2026-10-16 — `index.css` 8.6k → 4.6k lines; computed styles identical across 12 app states
- [x] **Surface audit** ✓ 2026-10-16 — one ghost icon button, Journal toggle on the shared secondary button, outline colours, complete type roles, note-editor CSS ownership
- [x] **Multi-select polish** ✓ 2026-10-16 — selection bar (count, Add to space, Delete + Undo), ⌘/Ctrl-click, Shift range, ⌘A, Esc; selection survives filters; calmer grid; sidebar spaces keep their dots
- [ ] **Multi-select follow-ups** — long-press to start selecting on touch; bulk "Remove from this space" and "Mark done" if wanted
- [ ] **Surface audit leftovers** — `memex-pin-toggle` / `memex-space-chip` keep their own toggle treatment (coherent, option-badge tint for pinned); `index.css` still holds live structure under legacy `bookmark-*` names (rename with the profiles → spaces pass)
- [x] **Deep-link check** — the extension opens saved links at `/home?link=<id>`; the API doesn't hardcode routes ✓ 2026-10-18

- [x] **Browser extension v0.2** ✓ 2026-10-18 — WXT rewrite, automatic X-bookmark + Pinterest-save capture, context menus, offline queue, server-side dedupe, `links.source`
- [ ] **Browser extension next steps** — tracked in `docs/browser-extension-plan.md` (already-saved badge, post-capture space/tags, selection → note, show `source` in the app, app-side dedupe, store listing)
- [x] Sound design pass in the app (confirm/dismiss/error/move/toggle via `src/utils/sound.ts`, mute in Settings) ✓ 2026-09-08 — listen-test the mix; the palette is retunable in one map
- [ ] Image proxy route on the scraper worker if preview hotlinking breaks for some domains
- [ ] Per-device token names/revocation polish (Settings modal exists; lean per-device early)

## 🗺 Standing roadmap (from VISION.md / CLAUDE.md)

- [ ] Profiles → spaces rename (DB + UI)
- [ ] Attach-to-space modals; retire legacy project views
- [ ] Cross-primitive search
- [ ] Supabase exit: grow `api/` worker into the real backend (D1/Neon + auth) — extension already routes through it, so clients won't notice
- [ ] Encryption; mobile polish (PWA hardening landed 2026-09-19 — re-add to home screen to pick up the new manifest/meta; test bottom bar, safe areas, and input zoom on device)
- [ ] Testing setup (Vitest + Playwright) — still none configured

## 📌 Parking lot / open questions

- [x] Hosting move DigitalOcean → Cloudflare — config in place (root `wrangler.jsonc`, `npm run deploy`); see ☁️ checklist above
- [ ] Extension distribution: stay load-unpacked or publish to Chrome Web Store?
- [ ] Old canvas swatch IDs (blush, lilac…) silently fall back to grey — fine, or add a migration toast?
