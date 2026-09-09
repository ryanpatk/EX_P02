# TODO

Working checklist to keep memex moving. Updated 2026-09-07 — prune freely as things land.

## 🔑 Your action items (need your credentials / accounts — code is ready and waiting)

These unlock everything built this session. Roughly 10 minutes total, in order:

- [ ] **Apply the Notes to Self + per-space super favorite migrations** — `supabase db push` (adds `self_messages` and `profile_links.is_super_favorite`; until then the Notes to Self panel shows an empty feed and sending fails)
- [x] **Migrate legacy Notes to Self** — 322 messages migrated into Home ✓ 2026-09-07 (`node --env-file=.env.migrate scripts/migrate-self-messages.mjs --email …`; `.env.migrate` holds the keys, gitignored — keep it for the notes migration, delete after)
- [x] **Migrate legacy notes** — 85 notes migrated into the root, no space association by decision ✓ 2026-09-07 (`scripts/migrate-notes.mjs`; legacy collections ignored). `.env.migrate` can be deleted now unless more legacy data is coming.
- [x] **Apply the token migration** — `supabase db push` ✓ 2026-09-06
- [ ] **Deploy the scraper** — `cd scraper && npx wrangler login && npm run deploy`
  - [ ] Add your production app origin to `ALLOWED_ORIGINS` in `scraper/wrangler.jsonc` first
  - [ ] Set `VITE_SCRAPER_URL` in `.env` (a commented line is already there) and in your production host's env
  - [ ] Re-test a Pinterest pin through the *deployed* worker (worked locally; datacenter IPs can differ — fallback plan is in `scraper/README.md`)
- [ ] **Deploy the API worker** — `cd api && npx wrangler secret put SUPABASE_SERVICE_KEY` (paste service-role key), set `SCRAPER_URL` in `api/wrangler.jsonc` to the deployed scraper URL, then `npm run deploy`
- [ ] **Create an access token** — in memex: Settings → Access tokens… → create, copy
- [ ] **Install the extension** — `chrome://extensions` → Developer mode → Load unpacked → `extension/` → open its options → paste API address + token → Test connection
- [ ] **Backfill old links** — `SUPABASE_URL=… SUPABASE_SERVICE_ROLE_KEY=… SCRAPER_URL=… node scripts/backfill-metadata.mjs --dry-run` (then without `--dry-run`)
- [ ] **Rotate the GitHub OAuth secret** — `.env` has `VITE_GITHUB_CLIENT_SECRET` in it; `VITE_`-prefixed vars are bundled into the client, so treat it as exposed. Rotate it in GitHub and keep the secret out of frontend env

## ✅ Verify after setup

- [x] Save a new link in the app → real title/description + preview image ✓ verified locally 2026-09-06, **including a Pinterest pin** (re-verify once against the deployed worker)
- [ ] ⌘⇧S on any page → saved via extension, Undo works, blip plays
- [ ] Dev server boots clean (the QueryClient crash is fixed; confirm no console errors)

## ☁️ Cloudflare migration (config done — run these in order)

- [x] Scraper deployed (`memex-scraper.joyfulsystems.workers.dev`) ✓
- [x] `.env.production` filled with deployed scraper URL ✓
- [x] App live at `https://memex.joyfulsystems.workers.dev` ✓
- [x] Scraper `ALLOWED_ORIGINS` includes production origin ✓
- [x] Verified live: scraper working on the deployed domain ✓ 2026-09-07
- [x] DigitalOcean app deleted ✓ 2026-09-07
- [ ] **Custom domain (Namecheap)**: add domain to Cloudflare (free plan) → switch nameservers at Namecheap → attach custom domain to the memex worker → update Supabase auth URLs + scraper `ALLOWED_ORIGINS` for the new origin → redeploy scraper

## 🔨 Next build tasks (ask Claude, no credentials needed)

- [ ] **Notes to Self polish** (landed 2026-09-07): edit-in-place for a message, move a message between scopes, optional unread dot on the header bubble, markdown-lite in bubbles
- [ ] **Stream refinements** (layout refactor landed 2026-09-07): visual pass on note/task cards vs. the link card; ~~space rename/delete from the sidebar~~ ✓ 2026-09-08; empty-space onboarding copy; keyboard nav across cards
- [ ] **Remove list-view leftovers** — `ViewToggleFab`, `useViewMode`, `LinksList`, `LinkListRow`/`NoteListRow`/`TaskListRow`, `BookmarkOmnibar` now only serve `/styleguide` (and `LinkDetailsPanel` uses `LinkListRow` for its preview row); update the styleguide to showcase `StreamCard`
- [ ] **Deep-link check** — old `/notes?note=<id>` links now redirect to `/home?type=note&note=<id>`; confirm the extension/API don't hardcode `/links`

- [ ] Extension Phase 2: context menus (save link/image), save-selection-as-note, already-saved badge, offline queue (`docs/browser-extension-plan.md`)
- [ ] Post-capture tag/space editing in the extension popup (API already supports `spaceId`/`tagIds`)
- [x] Sound design pass in the app (confirm/dismiss/error/move/toggle via `src/utils/sound.ts`, mute in Settings) ✓ 2026-09-08 — listen-test the mix; the palette is retunable in one map
- [ ] Image proxy route on the scraper worker if preview hotlinking breaks for some domains
- [ ] Per-device token names/revocation polish (Settings modal exists; lean per-device early)

## 🗺 Standing roadmap (from VISION.md / CLAUDE.md)

- [ ] Profiles → spaces rename (DB + UI)
- [ ] Attach-to-space modals; retire legacy project views
- [ ] Cross-primitive search
- [ ] Supabase exit: grow `api/` worker into the real backend (D1/Neon + auth) — extension already routes through it, so clients won't notice
- [ ] Encryption, mobile polish
- [ ] Testing setup (Vitest + Playwright) — still none configured

## 📌 Parking lot / open questions

- [x] Hosting move DigitalOcean → Cloudflare — config in place (root `wrangler.jsonc`, `npm run deploy`); see ☁️ checklist above
- [ ] Extension distribution: stay load-unpacked or publish to Chrome Web Store?
- [ ] Old canvas swatch IDs (blush, lilac…) silently fall back to grey — fine, or add a migration toast?
