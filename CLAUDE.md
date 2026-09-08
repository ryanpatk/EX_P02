# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EX_P02 is the codebase for **memex**, a personal working-memory system built as a React web app with a Supabase backend. The app is a single **mixed stream** of notes, links, and tasks rendered as one grid of cards inside a frosted-glass stack, with element-type and tag filter chips above the grid and omnibar capture. The left sidebar is **Home** (everything) followed by the list of **spaces**; selecting a space scopes the stream and the header's super favorites to that space. Notes/links/tasks are data primitives; spaces are the cross-cutting contexts that filter and compose them (see `VISION.md`).

## Documentation Map

- `TODO.md` — living checklist: the user's pending ops steps (deploys, migrations, secrets) and next build tasks. Check it at session start; update it as work lands.
- `VISION.md` — production vision: modules, primitives, spaces model, data-model evolution, phasing. Product truth for where we're going.
- `PRODUCT.md` — positioning, users, brand personality, design principles.
- `DESIGN.md` — design-system truth. The live Links dashboard is the canonical surface and the template every new module inherits. When code and `DESIGN.md` diverge, the dashboard implementation wins; update the doc.
- `JOYFUL_SYSTEMS.md` — the abstract JOYFUL_SYSTEMS design language (palette, spacing, radius, contrast, motion, sound). Product-agnostic; memex's canvas swatches and future color decisions derive from it.
- `SETUP.md` — local development setup.
- `docs/ex_p02_prd.md` — original PRD, superseded by `VISION.md` (kept for history).
- `docs/database-migrations.md` — Supabase CLI migration workflow.
- `docs/browser-extension-plan.md` — planned browser extension (one-click capture) and the `memex-api` worker/token auth approach that decouples it from Supabase.
- `scraper/README.md` — memex-scraper Cloudflare Worker (link metadata: title/description/preview image); deploy + backfill instructions.
- `api/README.md` — memex-api Cloudflare Worker: token-authenticated capture API for the extension (routes, deploy, security model). Tokens are managed in Settings → Access tokens (`api_tokens` migration).
- `extension/README.md` — memex capture browser extension (MV3, no build step); install + configure.

## Development Commands

```bash
npm run dev                # Start development server with Vite
npm run build              # Build for production (TypeScript check + Vite build)
npm run lint               # Run ESLint with TypeScript support
npm run preview            # Preview production build locally
npm run deploy             # Build + deploy to Cloudflare (Workers static assets, root wrangler.jsonc; .env.production overrides .env at build)

# Environment Setup — create .env with:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
# VITE_SCRAPER_URL=your_memex_scraper_worker_url   (optional; enables link metadata + preview images)
```

## Architecture Overview

### Technology Stack
- **Frontend**: React 19 + TypeScript + Vite
- **Styling**: Custom CSS with design tokens (`--bookmark-*` custom properties in `src/index.css`)
- **Backend**: Supabase (PostgreSQL + Auth + RLS)
- **State Management**: Zustand global store
- **Data Fetching**: React Query (TanStack Query)
- **Routing**: React Router v7

### Core Structure
- **Authentication**: Supabase Auth (email/password + GitHub OAuth); session flows through `SessionProvider` / `useSession` (`src/context/SessionContext.tsx`); `AuthProtectedRoute` guards authenticated routes
- **Stream**: `src/pages/StreamPage.tsx` — the one surface; mounted at `/home` (everything) and `/spaces/:spaceId` (one space). `/links`, `/notes`, `/tasks` redirect into Home with the matching type filter (`src/router/LegacyModuleRedirect.tsx`)
- **Filtering model**: type chips (Notes · Links · Tasks) and tag chips above the grid (`src/components/StreamFilterBar.tsx`); empty selection = show all; both live in the URL (`?type=`, `?tags=`, `?untagged=1`); the open note is `?note=<id>`. Space scoping comes from the route, not a rail
- **Notes to Self**: chat-bubble toggle in the header opens `src/components/NotesToSelfPanel.tsx` docked right of the grid (desktop) or as a slide-over sheet (mobile); scoped to Home or the current space via the route; open state persisted in localStorage
- **Selection / bulk assign**: selection state lives in the Zustand store so the sidebar's spaces become bulk-assign targets while items are selected; tag chips apply to the selection likewise
- **Canvas theming**: user-selected OKLCH swatch drives active/prominent/hover surfaces (`src/utils/canvasColor.ts`, `src/constants/canvasColors.ts`); dark mode via `data-theme`

### Key Files
- `/src/components/ui/` — shared design-system primitives (FilterChip, ActionChip, FrostedStack, EmptyState, FeedbackToast, InlineCreateForm); compose these for new surfaces
- `/src/pages/StyleguidePage.tsx` — component catalog at `/styleguide` (auth-protected, unlinked); keep it updated when primitives change
- `/src/router/index.tsx` — route definitions with nested protected routes
- `/src/pages/StreamPage.tsx` — the mixed stream (header | frosted stack: omnibar → filter chips → card grid)
- `/src/components/MemexSidebar.tsx` — Home + spaces navigation (also bulk-assign targets)
- `/src/components/StreamCard.tsx` — the single card anatomy every primitive renders through; `LinkGridCard` / `NoteGridCard` / `TaskGridCard` only fill its slots
- `/src/components/StreamFilterBar.tsx` — type + tag chip rows
- `/src/components/NotesToSelfPanel.tsx`, `/src/hooks/useSelfMessages.ts` — Notes to Self feed + data
- `/src/components/ui/Omnibar.tsx` — search + multi-action capture bar (Add link / New note / New task)
- `/src/utils/streamItems.ts` — `StreamItem` union, tag merging, search matching
- `/src/constants/modules.ts` — routes, item types, URL param names
- `/src/types/database.ts` — Supabase schema types
- `/src/supabase/index.ts` — Supabase client
- `/src/Providers.tsx` — provider composition

### Data Schema (current)
All tables user-scoped via RLS:
- **links** — URL + metadata (title, description, favicon, preview image), global super-favorite flag (Home header), ordering
- **tags** / **link_tags** / **note_tags** / **task_tags** — shared tag vocabulary, many-to-many with each primitive
- **self_messages** — "Notes to Self": short chat-style messages, `profile_id` NULL = Home feed, otherwise one feed per space; `legacy_id` marks rows migrated from the legacy app (migration `20260907150000_add_self_messages.sql`, script `scripts/migrate-self-messages.mjs`)
- **profiles** / **profile_links** / **profile_notes** / **profile_tasks** — spaces (still named profiles in the DB) and their membership joins; `profile_links.is_super_favorite` pins a link to the header inside that space (migration `20260907120000_add_profile_link_super_favorite.sql`)
- **projects** — legacy from the original PRD; superseded by spaces, slated for retirement

Planned (per `VISION.md`): **notes** (markdown body), **tasks**, and per-primitive space/tag join tables mirroring `profile_links` / `link_tags`.

### Design System
- Aesthetic: "The Operator's Desk" — user-tinted canvas gradient, frosted-glass stacks, hairline dividers, pill chips
- Typography: **Two Weekend Go** for app chrome (13px UI / 12px caption, italic lowercase `memex` brand); **Inter** (`--bookmark-font-content`) for content surfaces — stream cards, link details panel, note editor
- Color: theme-first — interactive emphasis derives from the user's canvas swatch, never a fixed product color
- Every new surface must use `--bookmark-*` tokens and the existing component vocabulary (chips at 40px height, 6.75rem action chips, `app-modal` dialogs, bottom-right toasts)
- Honor `prefers-reduced-motion` and `prefers-reduced-transparency`

## Development Notes

### Current State
The per-module tabs (Links / Notes / Tasks / Spaces pages) were replaced on 2026-09-07 by one `StreamPage`: a mixed, grid-only stream with type and tag chips, omnibar capture that offers Add link / New note / New task, link details overlay, in-stack note editor, task check-off with a collapsible Done section, selection mode with bulk tag/space assign, and per-context super favorites in the header. Sidebar = Home + spaces (new-space inline). Canvas theming, dark mode, GitHub OAuth unchanged. Notes use `react-markdown` + `remark-gfm`; bodies are plain markdown. `LinksList` and `LinkPreviewPopover` were removed 2026-09-07 along with the retired scraped-display cache (`scrapedDataMap` / `getCachedScrapedData`) — cards and search read metadata from the stored link rows only. The remaining list-view leftovers (`ViewToggleFab`, `useViewMode`, the `*ListRow` components) only serve `/styleguide` and `LinkDetailsPanel` and are candidates for removal. Legacy project views still exist and are slated for retirement.

### Direction of Travel
1. ~~App shell~~ → ~~per-module tabs~~ → **unified stream** done; profiles → spaces rename (DB + copy) still pending
2. Refine the stream: card polish per type, space rename/delete from the sidebar, post-capture tag/space editing, keyboard navigation
3. Attach-to-space flows beyond selection mode; retire legacy projects and list-view components
4. Cross-primitive search is now inherent to the stream; next: encryption, mobile polish

### Conventions
- New features integrate with existing auth, routing, and React Query patterns; add providers in `src/Providers.tsx`
- Any new item type renders through `StreamCard` (leading slot · meta · title · excerpt · tags · hover actions) and joins the `StreamItem` union; don't invent a second card or list anatomy
- Database changes go through Supabase CLI migrations (`docs/database-migrations.md`)
- Notes are stored as plain markdown text — keep them portable and encryptable

### Testing Strategy
No testing framework is currently configured. Consider Vitest for unit tests and Playwright for E2E as the app grows.
