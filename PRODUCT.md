# Product

## Register

product

## Platform

web

## Product Name

**memex** (lowercase where it brands). Working title "Superlinks" is retired; the codebase codename remains EX_P02.

## Users

Primary users are individuals doing personal knowledge work — research, side projects, reading lists, life admin. They accumulate three kinds of material: written thoughts (notes), web references (links), and things to do (tasks). They use the app in short, repeated sessions: capture something in a couple of seconds, tag it, assign it to a space, filter a list, act, and move on. Context is usually a desktop browser at a desk — the Links module doubles as a new-tab launchpage — with mobile secondary for lookup and light edits.

## Product Purpose

memex is a personal working-memory system. It holds the three primitives a person accumulates during knowledge work — **notes** (markdown), **links**, and **tasks** — and organizes them around **spaces**, the contexts that work happens in. Four modules (Notes, Links, Tasks, Spaces) share one shell, one design language, one tag vocabulary, and one filtering model. Success means any primitive is captured in under two seconds, found in under ten, and every module is a complete mini-app on its own while spaces tie them together.

See `VISION.md` for the full production vision, module specifications, and phasing.

## Positioning

An enlarged, intimate supplement to one person's memory — not a team wiki, not a project-management suite, not a read-it-later magazine, not a block-editor document system, not a generic AI dashboard. A focused workbench for people who outgrow browser bookmarks, scattered notes apps, and todo sprawl.

## Brand Personality

Precise, calm, and operator-minded. The voice is direct and lowercase where it brands (`memex`), not marketing-loud. Emotional goal: **trust through clarity** — the UI should feel like a well-organized desk, not a campaign page. Three words: **focused, structured, fast**.

## Anti-references

- Generic SaaS landing pages (cream backgrounds, hero metrics, eyebrow kickers on every section)
- “AI tool” aesthetics: ghost cards (1px border + wide soft shadow), glassmorphism-as-decoration, gradient text, decorative grid overlays
- Legacy brutalist chrome in this repo (rainbow stripe cards, offset drop-shadow buttons, heavy 3px borders) except where intentionally retired
- Per-module identity colors or branding — the canvas theme is the user's, not the module's
- Inconsistent controls between auth screens and the module surfaces
- Modal-heavy flows for actions that should stay inline

## Design Principles

1. **Design serves the task.** Every screen should disappear into capture, filter, and act workflows; decoration that doesn’t convey state is removed.
2. **One component vocabulary.** Buttons, inputs, chips, rails, list rows, and modals share the same tokens across all four modules, auth pages, and settings. A task row and a note row are siblings of the link row, not new species.
3. **Restrained color, explicit state.** Neutrals carry most surfaces; the user's canvas theme marks selection, primary actions, and focus — not ambient decoration.
4. **Progressive density.** Module lists can be information-dense; auth and empty states stay simple and legible.
5. **Honor reduced motion.** Motion communicates state changes (rails, selection, feedback), not page-load choreography.
6. **Two-second capture.** No module gains features that slow down the omnibar capture loop.

## Accessibility & Inclusion

Target **WCAG 2.1 AA** for text contrast, focus visibility, and touch targets (44×44px on mobile interactive elements). Support `prefers-reduced-motion: reduce` globally. Form fields use visible labels on auth and modal flows. Dark mode is a first-class theme via `data-theme`, not an afterthought palette swap.
