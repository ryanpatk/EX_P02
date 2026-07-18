# Product

## Register

product

## Platform

web

## Users

Primary users are individuals who collect and revisit web links as part of personal knowledge work—research, side projects, reading lists, and reference libraries. They use the app in short, repeated sessions: capture a URL, tag it, assign it to a profile or project, filter a list, open links in background tabs, and move on. Context is usually a desktop browser at a desk; mobile is secondary but supported for lookup and light edits.

## Product Purpose

Superlinks is a personal knowledge management app for organizing bookmarks (and related notes) inside project workspaces. Success means links are easy to add, find, filter, and open without breaking flow—bulk tagging, profile rails, search, and a stable three-column dashboard should feel faster than browser bookmarks alone. The product exists to give one person a durable, searchable link library with enough structure (tags, profiles, projects) to stay useful as it grows.

## Positioning

A focused link workbench for people who outgrow browser bookmarks—not a team wiki, not a read-it-later magazine, not a generic AI dashboard.

## Brand Personality

Precise, calm, and operator-minded. The voice is direct and lowercase where it brands (`superlinks`), not marketing-loud. Emotional goal: **trust through clarity**—the UI should feel like a well-organized desk, not a campaign page. Three words: **focused, structured, fast**.

## Anti-references

- Generic SaaS landing pages (cream backgrounds, hero metrics, eyebrow kickers on every section)
- “AI tool” aesthetics: ghost cards (1px border + wide soft shadow), glassmorphism, gradient text, decorative grid overlays
- Legacy brutalist chrome in this repo (rainbow stripe cards, offset drop-shadow buttons, heavy 3px borders) except where intentionally retired
- Inconsistent controls between auth screens and the bookmark dashboard
- Modal-heavy flows for actions that should stay inline on the dashboard

## Design Principles

1. **Design serves the task.** Every screen should disappear into capture, filter, and open workflows; decoration that doesn’t convey state is removed.
2. **One component vocabulary.** Buttons, inputs, chips, rails, and modals share the same bookmark tokens whether on the dashboard, auth pages, or project views.
3. **Restrained color, explicit state.** Neutrals carry most surfaces; accent color marks selection, primary actions, and focus—not ambient decoration.
4. **Progressive density.** The dashboard can be information-dense; auth and empty states stay simple and legible.
5. **Honor reduced motion.** Motion communicates state changes (rails, selection, feedback), not page-load choreography.

## Accessibility & Inclusion

Target **WCAG 2.1 AA** for text contrast, focus visibility, and touch targets (44×44px on mobile interactive elements). Support `prefers-reduced-motion: reduce` globally. Form fields use visible labels on auth and modal flows. Dark mode is a first-class theme via `data-theme`, not an afterthought palette swap.
