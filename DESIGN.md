---
name: Superlinks
description: Focused bookmark workbench for personal link libraries
colors:
  canvas: "#f3f5f9"
  surface: "#ffffff"
  surface-muted: "#f8f9fc"
  border: "#e4e8f0"
  border-strong: "#d0d7e2"
  text: "#1c2433"
  text-muted: "#5c6679"
  accent: "#3d5eff"
  accent-strong: "#2f4ae6"
  active-bg: "#1c2433"
  active-fg: "#ffffff"
  control-bg: "#f1f4fa"
  control-border: "#dce2ee"
  danger: "#c62828"
  success: "#1b7f4a"
typography:
  display:
    fontFamily: "Inter, system-ui, -apple-system, Segoe UI, sans-serif"
    fontSize: "22px"
    fontWeight: 800
    lineHeight: 1.15
    letterSpacing: "-0.03em"
  body:
    fontFamily: "Plus Jakarta Sans, IBM Plex Sans, Helvetica Neue, sans-serif"
    fontSize: "13px"
    fontWeight: 400
    lineHeight: 1.45
  label:
    fontFamily: "Plus Jakarta Sans, IBM Plex Sans, Helvetica Neue, sans-serif"
    fontSize: "12px"
    fontWeight: 600
    lineHeight: 1.2
rounded:
  pill: "999px"
  card: "14px"
  input: "12px"
  control: "10px"
spacing:
  xs: "6px"
  sm: "12px"
  md: "16px"
  lg: "28px"
components:
  button-primary:
    backgroundColor: "{colors.active-bg}"
    textColor: "{colors.active-fg}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  button-secondary:
    backgroundColor: "{colors.control-bg}"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "0 16px"
    height: "44px"
  input-field:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.text}"
    rounded: "{rounded.input}"
    padding: "0 14px"
    height: "44px"
  tag-chip:
    backgroundColor: "transparent"
    textColor: "{colors.text}"
    rounded: "{rounded.pill}"
    padding: "6px 12px"
---

# Design System: Superlinks

## Overview

**Creative North Star: "The Link Operator's Desk"**

Superlinks looks like a single-purpose workbench: cool neutral surfaces, tight typography, and accent color only where it marks selection or primary action. The bookmark dashboard is the canonical surface—auth, modals, tag selectors, and project views inherit its `--bookmark-*` tokens from `:root`. The system rejects campaign-page decoration; depth comes from borders and surface steps, not stacked shadows.

**Key Characteristics:**

- Flat, border-defined panels on a soft canvas (`#f3f5f9`)
- Inter for header chrome; Plus Jakarta Sans for UI body copy
- Pill buttons and inputs at 44px touch height on mobile
- Tag/profile chips with stable dimensions; accent on hover/active only
- Native `<dialog>` modals with header/body/footer structure
- Dark theme via `[data-theme='dark']` token swap

## Colors

A restrained product palette: neutrals carry layout; one blue accent marks focus and selection; ink black (`#1c2433`) anchors primary buttons.

### Primary

- **Operator Ink** (`#1c2433`): Primary button fill, active chip background, primary text on light surfaces.

### Secondary

- **Signal Blue** (`#3d5eff` / strong `#2f4ae6`): Focus rings, selection borders, brand wordmark, active link states.

### Neutral

- **Canvas** (`#f3f5f9`): App and dashboard background.
- **Surface** (`#ffffff`): Cards, modals, list rows, auth panels.
- **Surface Muted** (`#f8f9fc`): Toolbars, modal headers/footers, subtle panels.
- **Border** (`#e4e8f0` / strong `#d0d7e2`): 1px structural edges—preferred over shadow.
- **Muted Text** (`#5c6679`): Secondary labels, URLs, captions—must stay ≥4.5:1 on white.

### Named Rules

**The One Accent Rule.** Accent blue appears on focus, selection, primary links, and bulk-target dashed chips—not as ambient page tint.

**The Flat Surface Rule.** Do not pair 1px borders with wide soft drop shadows on cards or buttons. Pick border OR a tight shadow (blur ≤8px), never both as decoration.

## Typography

**Display Font:** Inter (with system-ui stack)  
**Body Font:** Plus Jakarta Sans (with IBM Plex Sans fallback)  
**Character:** Header italic brand (`superlinks`) is tight and confident; body stays neutral and readable at 13px UI scale.

### Hierarchy

- **Display** (800, 22px, -0.03em): Page titles on auth cards, modal titles.
- **Title** (700, 14px): Section headings, list row titles.
- **Body** (400–500, 13px, 1.45): Default UI copy, omnibar, list metadata.
- **Label** (600, 12px): Form labels, filter captions, button text.
- **Small** (600, 11px): Counts, kickers, footer chrome.

### Named Rules

**The Fixed UI Scale Rule.** Dashboard UI uses fixed px steps (`13/12/14/11`), not fluid clamp headings—density stays predictable in side rails.

## Elevation

Flat-by-default. Depth is communicated with 1px borders and surface-muted backgrounds, not elevation shadows. Hover states may shift border color; selected rows use accent outline or 2px focus ring—not lift transforms on list cards.

### Named Rules

**The No Ghost Card Rule.** List rows and auth cards do not use `box-shadow: 0 4px 16px` plus border. Selection uses border/ring only.

## Components

### Buttons

- **Shape:** Full pill (`999px` radius), min-height 44px (36px compact variant).
- **Primary:** Operator ink fill, white label; hover darkens toward text color.
- **Secondary:** Control background, control border; hover uses surface-muted.
- **Danger:** White surface, danger text/border; soft danger background on hover.
- **Focus:** 2px accent outline, 2px offset—required on all interactive controls.

### Chips (tags & profiles)

- **Style:** Transparent default; per-tag color on hover/active only; bulk mode uses dashed accent border.
- **State:** Active neutral chips use ink fill; accent chips keep stable padding (5px/11px vs 6px/12px neutral).

### Cards / Containers

- **Corner Style:** 14px card radius.
- **Background:** Surface on canvas; no gradient fills.
- **Border:** 1px `bookmark-border`.
- **Internal Padding:** 12–16px list rows; 28px auth cards.

### Inputs / Fields

- **Style:** 12px radius, control border, surface fill, 13px text.
- **Focus:** Accent border + `:focus-visible` ring (no inset glow stacks).
- **Labels:** Always visible on auth/modal forms (`app-field-label`).

### Navigation

- **Toolbar:** 52px height, Inter brand left, compact pill CTAs right.
- **Rails:** Fixed-width tag/profile columns; mobile sheets slide over scrim.
- **Omnibar:** Single-row search with flush add button; focus-within accent border.

### Modals

- **Pattern:** Native `<dialog class="app-modal">` with muted header/footer bars.
- **Backdrop:** Semi-transparent scrim via `::backdrop`.

## Do's and Don'ts

### Do:

- **Do** use `--bookmark-*` tokens for any new surface (auth, modals, popovers, project pages).
- **Do** keep touch targets at 44px on mobile for rails, toolbar CTAs, and row actions.
- **Do** use visible form labels and `:focus-visible` rings on every custom control.
- **Do** open links in background tabs from list interactions when that matches dashboard behavior.

### Don't:

- **Don't** use rainbow stripe card headers, 3px heavy borders, or offset brutalist button shadows on new work.
- **Don't** pair 1px borders with wide soft shadows (ghost-card pattern).
- **Don't** use decorative grid overlays or cream “magazine warm” page backgrounds on product surfaces.
- **Don't** drop uppercase eyebrow kickers above every section—captions are sparse and functional only.
- **Don't** split component vocabulary between dashboard and auth (no legacy `btn-primary` brutalist styling).
