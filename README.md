# memex

**A personal working-memory system.** memex holds the three things you accumulate during knowledge work — **notes** (markdown), **links**, and **tasks** — and organizes them around **spaces**, the contexts your work happens in.

Today the app is its Links module: a fast bookmark workbench / new-tab launchpage with omnibar capture, space and tag filter rails, a frosted-glass list, and user-tinted canvas theming. The full vision grows this into four peer modules behind a shared shell — see [`VISION.md`](VISION.md).

## Stack

- React 19 + TypeScript + Vite
- Supabase (PostgreSQL, Auth, RLS)
- React Query + Zustand
- React Router v7
- Custom CSS design system (`--bookmark-*` tokens, Two Weekend Go type)

## Getting Started

1. Install dependencies: `npm install`
2. Create `.env` from the template:
   ```
   VITE_SUPABASE_URL=
   VITE_SUPABASE_ANON_KEY=
   ```
3. Run the app: `npm run dev`

Full setup (database schema, OAuth) is in [`SETUP.md`](SETUP.md).

## Documentation

| Doc | Purpose |
| --- | --- |
| [`VISION.md`](VISION.md) | Production vision — modules, primitives, spaces, phasing |
| [`PRODUCT.md`](PRODUCT.md) | Positioning, users, brand, design principles |
| [`DESIGN.md`](DESIGN.md) | Design-system truth (the Links dashboard is canonical) |
| [`SETUP.md`](SETUP.md) | Local development setup |
| [`CLAUDE.md`](CLAUDE.md) | Guidance for Claude Code sessions |
| [`docs/`](docs/) | Original PRD (historical), migration workflow, feature notes |
