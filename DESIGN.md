---
name: memex
description: Personal working-memory system — canonical design is the Links dashboard (`/`), the template for all memex modules
colors:
  canvas: 'user-selected OKLCH swatch (default soft grey oklch(0.94 0.009 264))'
  surface: 'var(--bookmark-surface) / frosted white bubble'
  surface-muted: 'var(--bookmark-surface-muted)'
  border: 'var(--bookmark-border) — OKLCH neutral @ ~16% alpha'
  border-ink: 'var(--bookmark-border-ink) — full-strength neutral ink'
  text: 'var(--bookmark-text)'
  text-muted: 'var(--bookmark-muted)'
  secondary-text: 'var(--bookmark-secondary-text) — matches border ink grey'
  accent: 'var(--bookmark-accent) — focus & selection rings only'
  active-bg: 'var(--bookmark-active-bg) — canvas-derived theme chip fill'
  active-fg: 'var(--bookmark-active-fg)'
  prominent-bg: 'var(--bookmark-prominent-bg) — primary CTAs'
  prominent-fg: 'var(--bookmark-prominent-fg)'
typography:
  family: 'Two Weekend Go (+ system-ui stack)'
  brand:
    fontSize: 'clamp(21px, 2.2vw, 24px)'
    fontWeight: 500
    fontStyle: italic
    letterSpacing: '-0.03em'
  ui:
    fontSize: '13px (var(--bookmark-fs-ui))'
    fontWeight: '500 default chips/rows; 600 labels'
    lineHeight: 1.45
  caption:
    fontSize: '12px (var(--bookmark-fs-small))'
rounded:
  pill: '999px'
  card: '14px'
  input: '12px'
  brand-bubble: '10px'
  stack-outer: '10px'
spacing:
  toolbar-height: '52px'
  chip-height: '40px'
  action-chip-width: '6.75rem'
  feed-stack-inset: '12px'
  footer-offset-desktop: '28px'
components:
  button-prominent:
    backgroundColor: '{colors.prominent-bg}'
    textColor: '{colors.prominent-fg}'
    rounded: '{rounded.pill}'
    width: '6.75rem fixed (shared action chips)'
    minHeight: '40px'
  button-secondary-chip:
    backgroundColor: '{colors.control-bg}'
    textColor: '{colors.text}'
    border: '{colors.control-border}'
    rounded: '{rounded.pill}'
    width: '6.75rem fixed'
    minHeight: '40px'
  chip-secondary:
    default: 'transparent bg, grey text (--bookmark-secondary-text)'
    hover: 'soft bubble tint (--bookmark-chip-secondary-bg-soft)'
    selected: 'n/a for tags — see chip-primary'
  chip-primary:
    backgroundColor: '{colors.active-bg}'
    textColor: '{colors.active-fg}'
    border: 'brand bubble border'
    use: 'selected space/tag filters, active filter state'
---

# Design System: memex

**Status:** Current design truth for the project. The live bookmark dashboard (the **Links module**) is the canonical surface; auth pages, modals, and legacy project views should inherit its `--bookmark-*` tokens from `:root`. Per `VISION.md`, every future memex module (Notes, Tasks, Spaces) inherits this dashboard's anatomy, tokens, and interaction rules — this document is the template they build from.

## Creative North Star

**"The Operator's Desk"**

A personal working-memory workbench: a user-tinted canvas gradient behind frosted-glass omnilists, with lightweight side rails for spaces and tags. Color comes from the selected canvas theme—not ambient blue chrome. Typography is confident but compact (`Two Weekend Go`, italic brand). Depth is frosted translucency and hairline dividers, not stacked card shadows. Whether the rows hold links, markdown notes, or tasks, the desk is the same.

## Module Anatomy (canonical layout)

Every primitive module shares the dashboard's grid. Desktop: **spaces rail | omnilist | tags rail**

> Naming note: spaces are today's **profiles** — the code and some UI copy still say "profile" until the rename ships. Read "profiles rail" and "spaces rail" as the same element.

| Zone                              | Role                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------- |
| **Header** (`bookmark-toolbar`)   | Brand bubble (static), super-favorite shortcuts (center), Settings chip (right) |
| **Spaces rail** (left)            | Space filter chips, left-aligned toward feed                                    |
| **Omnilist** (center, max ~640px) | Frosted stack: omnibar + virtualized item list                                  |
| **Tags rail** (right)             | Tag filter chips, right-aligned toward feed                                     |

Mobile (<900px): rails become slide-over sheets with scrim; space/tag tabs above feed.

**Empty filter = show all.** No permanent "All" chips on space or tag rails.

When a space is selected, the tag rail scopes counts and chip list to items in that space.

### App shell (planned)

The memex shell adds a persistent **left sidebar** on desktop — module navigation only (Notes, Links, Tasks, Spaces), built from the existing chip vocabulary: transparent idle chips, `--bookmark-active-*` for the active module, brand bubble at top. The sidebar never carries filters; space and tag filtering stay inside each module's rails. Mobile collapses it to the existing drawer pattern or a bottom tab bar. See `VISION.md` §5.

## Canvas & Theme Color

User picks a canvas swatch in **Settings** (grey, blush, lavender, lilac, sky, mint, sage, peach, butter). Selection drives:

- `--bookmark-experiment-bg` — vertical gradient page background
- `--bookmark-canvas-base` — swatch base
- `--bookmark-active-bg` / `--bookmark-active-fg` — selected chip surfaces
- `--bookmark-prominent-bg` / `--bookmark-prominent-fg` / `--bookmark-prominent-text` — primary CTAs and "new tag/profile" links
- `--bookmark-row-hover-bg` — list row hover tint (`color-mix` from active bg)

Implementation: `src/utils/canvasColor.ts`, `src/constants/canvasColors.ts`.

Dark mode: `[data-theme='dark']` token swap + dark swatch variants.

## Color Roles

### Canvas & surfaces

- **Canvas gradient** (`--bookmark-experiment-bg`): Full-viewport background; header and desktop rails are transparent so canvas shows through.
- **Frosted stack** (`--bookmark-stack-frosted-*`): Omnibar + list container—translucent bubble fill, blur, soft shadow, 10px radius.
- **Brand bubble** (`--bookmark-brand-bubble-*`): Header wordmark shell, secondary chip fills, stack glass base.

### Text

- **Primary** (`--bookmark-text`): Titles, body.
- **Muted** (`--bookmark-muted`): Metadata, captions.
- **Secondary** (`--bookmark-secondary-text`): Unselected tag/profile labels, placeholder-adjacent greys—tied to `--bookmark-border-ink`.

### Accent vs prominent

- **Accent blue** (`--bookmark-accent`): Focus rings, selection outlines, keyboard focus—not primary button fills.
- **Prominent** (`--bookmark-prominent-*`): Select, Done, Add bookmark, New tag, New profile—mid-tone swatch-derived fills.
- **Active** (`--bookmark-active-*`): Selected filter chips (profiles/tags).

### Named rules

**Theme-first color.** Interactive emphasis follows the user's canvas pick, not a fixed product blue.

**Grey ink for idle filters.** Unselected chips are text-only or transparent with grey ink; color arrives on selection or soft hover.

**No hover border darkening on list rows.** Row dividers stay constant; hover uses `--bookmark-row-hover-bg` only.

## Typography

**Family:** `Two Weekend Go` for UI, brand, and display (see `src/fonts/two-weekend-go.css`).

| Level      | Size          | Weight     | Use                       |
| ---------- | ------------- | ---------- | ------------------------- |
| Brand      | clamp 21–24px | 500 italic | `memex` header bubble     |
| UI         | 13px          | 500        | Chips, list rows, omnibar |
| Caption    | 12px          | 600        | Counts, footer, kickers   |
| Heading sm | 14px          | 600–700    | Modal titles, row titles  |

**Fixed UI scale** on dashboard—no fluid heading clamps in rails or list.

## Elevation & Material

- **Frosted omnilist:** `backdrop-filter: blur(20px) saturate(180%)` with bubble background; falls back to opaque glass when `prefers-reduced-transparency`.
- **List inside stack:** Transparent rows, 1px bottom dividers (`--bookmark-list-row-divider`), no per-row card boxes.
- **Shadows:** Tight `--bookmark-shadow-border` on frosted stack and toasts—not wide floating card shadows.
- **Footer:** Fixed 28px bar on desktop (`desktop-footer`); dashboard uses `--bookmark-footer-offset: 28px` for bottom spacing.

## Components

### Header

- **Brand:** Non-interactive frosted bubble with italic `memex`.
- **Super favorites:** Favicon buttons in toolbar center.
- **Settings:** Secondary chip (6.75rem), opens account menu—canvas picker, dark mode, logout.

### Omnibar

- Tall single-row search inside frosted stack.
- **Add bookmark** appears when query is URL-like and no filter matches; uses prominent CTA styling.
- No blue focus ring on omnibar input—border-led focus.

### Filter chips (spaces & tags)

- **Unselected:** Transparent, `--bookmark-secondary-text`, soft hover bubble.
- **Selected:** Primary chip—theme `--bookmark-active-bg` / `--bookmark-active-fg`, brand bubble border.
- **Bulk assign mode:** Dashed accent border on chips (`is-bulk-target`); toast confirms apply.
- **New tag / New space:** Text buttons using `--bookmark-prominent-text`, underline on hover; same vertical metrics as chips (40px min-height). (Current UI copy says "New profile" until the spaces rename ships.)

### Link list

- Virtualized rows (~92px), favicon + title + URL + tag pills.
- Hover: theme tint background, unchanged divider.
- Selection mode: theme-tinted row fill (`--bookmark-row-selected-bg`); no outline or side accent.
- **Select/Done** + **Clear** float bottom-center of stack (prominent + secondary chips, 6.75rem width).
- New bookmarks prepend to top of list.

### Feedback toast

- **Position:** Absolute bottom-right of dashboard, above footer (`calc(var(--bookmark-footer-offset) + 12–24px)`).
- **Motion:** Slide/fade in (~280ms), out (~220ms); instant swap when `prefers-reduced-motion`.
- **Content:** OK mark + message; non-interactive (`pointer-events: none`).

### Modals & auth

- Native `<dialog class="app-modal">` pattern with muted header/footer.
- All new surfaces use `--bookmark-*` tokens—no legacy brutalist orange/blue campaign styling.

## Motion

- Fast transitions: 150ms; medium: 180ms (`cubic-bezier(0.2, 0.8, 0.2, 1)`).
- List stagger on filter change (respects reduced motion).
- Toast enter/exit animations.

## Do's and Don'ts

### Do

- Use `--bookmark-*` tokens for every new UI surface.
- Derive interactive color from canvas theme via `canvasColor.ts` surfaces.
- Keep action chips at **6.75rem** fixed width (Settings, Select, Done, Clear).
- Scope tag rail to the selected space when a space filter is active.
- Auto-apply active space/tag filters when capturing a new item from the omnibar.
- Reuse this dashboard anatomy (rails | frosted stack | omnibar capture) for every new memex module.
- Show bulk-action toasts immediately (optimistic), then persist in background.

### Don't

- Don't use fixed blue or ink-black as primary CTA fills—use `--bookmark-prominent-*`.
- Don't add "All" filter chips; empty selection means all.
- Don't darken list row borders on hover.
- Don't place inline feedback above the omnilist—use the bottom-right toast.
- Don't reintroduce decorative watermarks or heavy offset brutalist shadows on dashboard surfaces.
- Don't split typography between Inter/Jakarta and dashboard—**Two Weekend Go** is the product face.

## Component Library

Shared UI primitives live in `src/components/ui/` and render the existing token classes — new module surfaces compose these instead of re-writing markup:

| Primitive          | Renders                                             | Used by                            |
| ------------------ | --------------------------------------------------- | ---------------------------------- |
| `FilterChip`       | space/tag rail chips (idle, active, bulk-target)    | `ProfileFilterBar`, `TagFilterBar` |
| `InlineCreateForm` | rail-footer create input + Add/Cancel               | both rails                         |
| `ActionChip`       | `bookmark-toolbar-cta` variants (6.75rem chips)     | styleguide, future modules         |
| `FrostedStack`     | frosted-glass list container                        | module placeholders, styleguide    |
| `EmptyState`       | list empty title/subtitle                           | module placeholders                |
| `FeedbackToast`    | bottom-right status toast (presentational)          | `DashboardPage`                    |
| `Omnibar`          | search + capture bar with configurable action       | `BookmarkOmnibar`, `TasksPage`, `NotesPage` |
| `MarkdownText`     | rendered markdown reading view (GFM)                | `NoteEditor`, future Spaces module |
| `MarkdownTextarea` | markdown-aware textarea (lists, Tab, ⌘B/I/K)        | `NoteEditor`                       |
| `ViewToggleFab`    | frosted corner button, bottom-left; switches list/grid | all four module pages           |

**List vs grid:** every module list has a card-grid alternative (`useViewMode(moduleKey)`, persisted per module), switched by the bottom-left corner fab (which shows the view you'd switch TO, mirroring the toast's bottom-right position). Grid mode widens the stack to ~3× the list width (`.is-grid-view`, max 1920px) and lays cards with `auto-fill minmax(220px, 1fr)`, shedding columns as the viewport narrows. Cards (`LinkGridCard`, `NoteGridCard`, `TaskGridCard`) share one anatomy — header / title / excerpt / tag footer — and keep their row behaviors (open, toggle done, details, delete-with-confirm). List dimensions are unchanged.

**Reference page:** `/styleguide` (auth-protected, intentionally unlinked from app navigation) renders the full catalog — tokens, type, chips, omnibar, rows, empty state, toast, modal — under live canvas theming and dark mode. When adding or changing a primitive, update the styleguide page in the same change.

## Source of Truth in Code

| Concern          | Location                                                                 |
| ---------------- | ------------------------------------------------------------------------ |
| Design tokens    | `src/index.css` (`:root`, `[data-theme='dark']`, `.bookmark-dashboard`)  |
| Canvas theming   | `src/utils/canvasColor.ts`, `src/components/CanvasColorPicker.tsx`       |
| Dashboard layout | `src/pages/DashboardPage.tsx`                                            |
| Header           | `src/components/AppHeader.tsx`                                           |
| Omnibar          | `src/components/BookmarkOmnibar.tsx`                                     |
| Rails            | `src/components/ProfileFilterBar.tsx`, `src/components/TagFilterBar.tsx` |
| List             | `src/components/LinksList.tsx`, `src/components/LinkListRow.tsx`         |

When in doubt, match the dashboard implementation—not this document if they diverge; then update this document.
