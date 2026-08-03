# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EX_P02 is the codebase for **memex**, a personal working-memory system built as a React web app with a Supabase backend. Today the app is its **Links module**: a bookmark manager / new-tab launchpage with a frosted-glass omnilist, profile (→ space) and tag filter rails, omnibar capture, and user-selectable canvas theming. The production vision (see `VISION.md`) grows this into four modules — **Notes** (markdown), **Links**, **Tasks**, and **Spaces** — behind a persistent left sidebar, where notes/links/tasks are data primitives and spaces are the cross-cutting contexts that filter and compose them.

## Documentation Map

- `VISION.md` — production vision: modules, primitives, spaces model, data-model evolution, phasing. Product truth for where we're going.
- `PRODUCT.md` — positioning, users, brand personality, design principles.
- `DESIGN.md` — design-system truth. The live Links dashboard is the canonical surface and the template every new module inherits. When code and `DESIGN.md` diverge, the dashboard implementation wins; update the doc.
- `SETUP.md` — local development setup.
- `docs/ex_p02_prd.md` — original PRD, superseded by `VISION.md` (kept for history).
- `docs/database-migrations.md` — Supabase CLI migration workflow.

## Development Commands

```bash
npm run dev                # Start development server with Vite
npm run build              # Build for production (TypeScript check + Vite build)
npm run lint               # Run ESLint with TypeScript support
npm run preview            # Preview production build locally

# Environment Setup — create .env with:
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
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
- **Dashboard**: `src/pages/DashboardPage.tsx` — the Links module and canonical design surface
- **Filtering model**: profile (→ space) rail on the left, tag rail on the right; empty selection = show all; tag rail scopes to the selected profile
- **Canvas theming**: user-selected OKLCH swatch drives active/prominent/hover surfaces (`src/utils/canvasColor.ts`, `src/constants/canvasColors.ts`); dark mode via `data-theme`

### Key Files
- `/src/components/ui/` — shared design-system primitives (FilterChip, ActionChip, FrostedStack, EmptyState, FeedbackToast, InlineCreateForm); compose these for new surfaces
- `/src/pages/StyleguidePage.tsx` — component catalog at `/styleguide` (auth-protected, unlinked); keep it updated when primitives change
- `/src/router/index.tsx` — route definitions with nested protected routes
- `/src/pages/DashboardPage.tsx` — dashboard layout (rails | frosted omnilist | rails)
- `/src/components/BookmarkOmnibar.tsx` — search + URL-detecting capture bar
- `/src/components/ProfileFilterBar.tsx`, `/src/components/TagFilterBar.tsx` — filter rails
- `/src/components/LinksList.tsx`, `/src/components/LinkListRow.tsx` — virtualized list
- `/src/types/database.ts` — Supabase schema types
- `/src/supabase/index.ts` — Supabase client
- `/src/Providers.tsx` — provider composition

### Data Schema (current)
All tables user-scoped via RLS:
- **links** — URL + metadata (title, description, favicon, preview image), super-favorite flag, ordering
- **tags** / **link_tags** — shared tag vocabulary, many-to-many with links
- **profiles** / **profile_links** — link groupings; these become **spaces** in the memex vision (rename + generalization, joins per primitive)
- **projects** — legacy from the original PRD; superseded by spaces, slated for retirement

Planned (per `VISION.md`): **notes** (markdown body), **tasks**, and per-primitive space/tag join tables mirroring `profile_links` / `link_tags`.

### Design System
- Aesthetic: "The Operator's Desk" — user-tinted canvas gradient, frosted-glass stacks, hairline dividers, pill chips
- Typography: **Two Weekend Go** throughout (13px UI / 12px caption, italic lowercase `memex` brand)
- Color: theme-first — interactive emphasis derives from the user's canvas swatch, never a fixed product color
- Every new surface must use `--bookmark-*` tokens and the existing component vocabulary (chips at 40px height, 6.75rem action chips, `app-modal` dialogs, bottom-right toasts)
- Honor `prefers-reduced-motion` and `prefers-reduced-transparency`

## Development Notes

### Current State
The Links module is live and polished: omnibar capture with URL detection, virtualized link list, profile/tag filtering with bulk assign, super favorites, canvas theming, dark mode, GitHub OAuth. The app shell (left sidebar, module routes) is in place. The Tasks module (applied migration `20260801120000_add_tasks.sql`) and Notes module (migration `20260801140000_add_notes.sql` — apply with `supabase db push`) are implemented; hooks return empty lists until their migrations are applied. Notes use `react-markdown` + `remark-gfm` for the reading view; note bodies are plain markdown text. Legacy project views still exist and are slated for retirement.

### Direction of Travel (per VISION.md phasing)
1. ~~App shell (left sidebar)~~ done; profiles → spaces rename still pending
2. ~~Tasks module~~ done (post-capture tag/space editing still to come)
3. ~~Notes module~~ done (markdown editor with focus-driven edit/read, auto-save; post-capture tag/space editing still to come)
4. ~~Spaces module~~ done as a conglomerate stream (notes+links+tasks interleaved by updated_at); attach-to-space modals and retiring legacy projects still to come
5. Cross-primitive search, encryption, mobile polish

### Conventions
- New features integrate with existing auth, routing, and React Query patterns; add providers in `src/Providers.tsx`
- Reuse the dashboard anatomy (rails | frosted stack | omnibar) for any new module surface
- Database changes go through Supabase CLI migrations (`docs/database-migrations.md`)
- Notes are stored as plain markdown text — keep them portable and encryptable

### Testing Strategy
No testing framework is currently configured. Consider Vitest for unit tests and Playwright for E2E as the app grows.
