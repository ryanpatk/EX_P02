# memex — Production Vision

> **2026-10-24:** `ROADMAP.md` now sets the big picture and wins where the two disagree. It makes the Journal the home view (the stream becomes the Library and space boards), replaces Supabase with files you own synced like a database (§7 here is superseded), adds a React Native mobile app, and extends automatic capture. The primitives, spaces, tags, capture rule and non-goals below still hold.

**Status:** North-star product vision. Supersedes the "Superlinks single-purpose bookmark workbench" framing in `PRODUCT.md`. The current dashboard remains the canonical design surface; this document describes the larger product it becomes one module of.

---

## 1. What memex is

**memex is a personal working-memory system.** It holds the three things a person actually accumulates during knowledge work — **notes**, **links**, and **tasks** — and organizes them around the contexts that work happens in — **spaces**.

The current app (a bookmark manager / new-tab launchpage) does not get replaced. It becomes the **Links module**: one of four peer modules inside a larger shell. Everything the dashboard does today — omnibar capture, profile and tag rails, frosted omnilist, canvas theming — is preserved and becomes the template for how every other module looks and behaves.

The name is deliberate: Vannevar Bush's memex was "a device in which an individual stores all his books, records, and communications... an enlarged intimate supplement to his memory." That's the product: not a wiki, not a project-management tool, not an everything-app — a fast, structured supplement to one person's memory.

## 2. The paradigm shift

| | Superlinks (today) | memex (vision) |
|---|---|---|
| **Scope** | One surface: the bookmark dashboard | Four modules: Notes, Links, Tasks, Spaces |
| **Organizing unit** | Profiles (link groupings) | Spaces (cross-primitive contexts) |
| **Navigation** | Single page | Persistent left sidebar (desktop) switching module layouts |
| **Data model** | Links + tags + profiles | Three primitives (note, link, task) + spaces + tags |
| **Mental model** | "My link library" | "My working memory, filtered by context" |

The shift is **additive, not destructive**. The Links module *is* the current dashboard. Users who only ever use Links lose nothing.

## 3. Core concepts

### 3.1 Data primitives

Three primitives, deliberately minimal:

- **Note** — a piece of written thought. Title + **markdown body**, tagged, timestamped. Notes are for capture and reference, not a block-editor document system.
- **Link** — a URL with metadata (title, description, favicon, preview). Exactly what exists today.
- **Task** — a unit of intent. Title, optional detail, done/not-done, optional due date. Tasks are a working list, not a project-management hierarchy.

All three primitives share the same structural DNA:

- User-scoped, RLS-protected rows in Supabase
- Taggable with the same shared tag vocabulary
- Assignable to any number of spaces (many-to-many)
- Capturable from an omnibar in ≤2 seconds
- Rendered as rows in a frosted omnilist

### 3.2 Spaces — the fourth concept

A **space** is a context: "Job Search," "Home Renovation," "EX_P02," "Reading." Spaces are what today's **profiles** become — same data, promoted from "a grouping of links" to "a grouping of anything."

Spaces are deliberately dual-natured:

1. **As a filter (primitive-like):** every module — Notes, Links, Tasks — shows a spaces rail exactly where the profiles rail sits today. Select a space, and the list scopes to it. Empty selection = show all. This is the existing profile-filter interaction, generalized.
2. **As a destination (module):** the Spaces module shows each space as a composed view of its notes, links, and tasks together — the "context desk" for one area of life.

The rule of thumb: **primitives are what you collect; spaces are where you stand while you look at them.**

### 3.3 Interoperability

The core product bet is that the value is in the *connections*, not the silos:

- Spaces appear as **filter rails in every primitive module** (replacing/generalizing today's profiles rail in Links).
- Primitives appear as **selectable items inside Spaces** — from a space, you open a list modal ("Add notes," "Add links," "Add tasks") that shows the full collection of that primitive with checkboxes, and attach items to the space. This is the existing bulk-assign interaction pattern (dashed accent chips, optimistic toast), pointed the other direction.
- Tags remain a **single shared vocabulary** across all primitives — one tag list, usable on notes, links, and tasks alike.
- Membership is many-to-many everywhere: a link can live in three spaces; a task can live in none.

At the same time, **every module works alone**. Notes is a complete minimal notes app. Links is the complete current app. Tasks is a complete minimal todo app. A user can ignore spaces entirely and still have three good tools. Interop is leverage, never a prerequisite.

## 4. The four modules

Every module inherits the dashboard's canonical anatomy: **rails | frosted omnilist | rails**, an omnibar at the top of the stack for capture + search, canvas gradient behind everything.

### 4.1 Links (the current app, unchanged in spirit)

- Today's dashboard, verbatim: omnibar with URL detection → Add bookmark, virtualized link rows, tag rail on the right, super-favorite shortcuts in the header.
- One rename: the left rail's chips are now **spaces**, not profiles. Same data, same interaction, same scoped-tag-counts behavior.
- Remains the strongest candidate for "new tab page" duty; that use case is a first-class constraint (fast load, keyboard-first capture, open-in-background-tab).

### 4.2 Notes

- Same layout: spaces rail (left) | frosted stack (center) | tags rail (right).
- Omnibar doubles as search and capture: type text that matches nothing → **New note** prominent CTA (mirror of "Add bookmark").
- List rows: title + body preview (plain-text excerpt) + tag pills + relative timestamp.
- **Markdown is the note format.** Notes are authored as markdown and stored as markdown source; the reading view renders it (headings, emphasis, lists, code, links). Editing starts as a markdown textarea with auto-save; a live/side-by-side preview or in-place rendered editing can come later, but the source of truth is always plain markdown text — portable, greppable, encryptable.
- Selecting a row opens the note for editing — inline expansion or a focused editing surface within the stack, not a modal-heavy flow.
- Active space/tag filters auto-apply to new notes (same rule as bookmarks today).

### 4.3 Tasks

- Same layout: spaces rail | frosted stack | tags rail.
- Omnibar: type → **New task**. Capture in two seconds.
- List rows: checkbox + title + tag pills + optional due date. Done tasks drop to a collapsed "done" section; completion is a satisfying but reduced-motion-safe state change.
- Deliberately flat: no subtasks, no kanban, no assignees. Sort by manual order or due date. If it needs a Gantt chart, it doesn't belong in memex.

### 4.4 Spaces

- The composition surface, built as a **conglomerate stream**: a space's notes, links, and tasks interleaved in one frosted list, sorted by recent activity (`updated_at`), with mixed row types sharing one vertical rhythm.
- **Space-centric chrome, not filter chrome.** Unlike the primitive modules, Spaces has no side rails: the header center carries the current space's name with ← → arrows that carousel through spaces (wrap-around, last-viewed remembered). You are always standing in exactly one space.
- **No tag filtering in spaces.** Tags categorize raw elements inside the primitive modules; a space is already a curated context, so its stream offers search only.
- Rows keep their primitive behaviors in the stream — links open in a background tab, task checkboxes toggle, notes deep-link into the Notes editor — but destructive actions stay in their home modules.
- (A sectioned/bento arrangement of per-primitive stacks remains a possible future view mode, not the MVP.)
- Each section has an "add" affordance opening the **list modal** for that primitive: full collection, search, checkbox multi-select, attach. Built on the existing `app-modal` dialog pattern and bulk-select interactions.
- Items shown in a space are live — checking a task here checks it everywhere; a link opens in a background tab as always.
- Space management (create, rename, delete) lives here, replacing today's "New profile" text-button as the primary path (the rail affordance can remain).

## 5. App shell & navigation

> **Revised 2026-09-07.** The per-module tab shell described in earlier drafts shipped and was then replaced by a single mixed stream. This section describes the current model; §4's per-module layouts are superseded by it (the primitives' behaviors still hold).

- **One surface: the stream.** Notes, links, and tasks render interleaved by `updated_at` in one card grid inside the frosted stack — the link grid card is the template every primitive conforms to (leading slot · meta · title · excerpt · tags · hover actions).
- **Filters live above the grid, not in rails.** Two chip rows sit between the omnibar and the grid: element type (Notes · Links · Tasks) and tags, scoped to the current stream. Empty selection = show all. Both are URL state.
- **Desktop sidebar:** `memex` brand, then **Home**, then a segmented **Spaces** list with an inline new-space affordance. Home shows everything plus the globally pinned super favorites; a space shows its members plus the links pinned inside that space (`profile_links.is_super_favorite`). While items are selected, spaces become bulk-assign targets.
- **Mobile (<900px):** the sidebar becomes a horizontally scrollable bottom bar (Home, then spaces).
- **Routing:** `/home` and `/spaces/:id`. `/links`, `/notes`, `/tasks` redirect to Home with the matching type filter; `/spaces` redirects to Home. `/` and the auth pages land on the last-visited stream. Filter state (`?type=`, `?tags=`, `?untagged=1`) and the open note (`?note=`) are shareable/restorable via URL.
- Canvas theme and dark mode are global.

## 6. Design language

memex extends the existing system — "The Link Operator's Desk" grows into **"The Operator's Desk"**. Nothing about the aesthetic changes; it gets more rooms.

- **Tokens:** every new surface uses the existing `--bookmark-*` token set (a future mechanical rename to `--mx-*` is cosmetic and optional). No new color roles without a demonstrated need.
- **Canvas theming:** the user's canvas swatch drives active/prominent/hover surfaces across all four modules, exactly as it does today. Modules do not get identity colors; the theme is the user's, not the module's.
- **Material:** frosted stacks (`blur(20px) saturate(180%)`), hairline dividers, tight border-shadows. No new elevation vocabulary.
- **Type:** Two Weekend Go everywhere, same fixed UI scale (13px UI / 12px caption / italic brand).
- **Components reused, not reinvented:** chips (40px, 6.75rem action width), rails, omnibar, virtualized list rows, `app-modal` dialogs, bottom-right toasts, bulk-select mode. A task row and a note row are siblings of the link row, not new species.
- **Existing rules hold everywhere:** empty filter = show all (no "All" chips); grey ink for idle filters; theme-first color; no hover border-darkening; reduced-motion honored.

The design principles in `PRODUCT.md` carry over unchanged — design serves the task, one component vocabulary, restrained color, progressive density, honest motion — now applied across four modules instead of one.

## 7. Data model evolution

Target Supabase schema (all user-scoped, RLS-enforced):

- **`spaces`** — rename/evolve of today's `profiles` (id, user_id, name, later: sort order, starred).
- **`links`** — as today.
- **`notes`** — id, user_id, title, body (markdown source), timestamps, order_index. (Client-side encryption of note bodies remains a later-phase goal per the original PRD; markdown-as-plain-text keeps encryption straightforward.)
- **`tasks`** — id, user_id, title, detail, is_done, due_date, timestamps, order_index.
- **`tags`** — as today, shared across primitives.
- **Membership joins:** `space_links` (rename of `profile_links`), `space_notes`, `space_tasks` — per-primitive join tables with order_index, mirroring the proven `profile_links` shape. Tag joins likewise: `link_tags` (existing), `note_tags`, `task_tags`.
- **`projects`** — legacy; superseded by spaces. Migrate any real data into spaces, then retire the table and the `/projects` routes.

Migration posture: profiles → spaces is a rename plus generalization; no user-visible data loss, no forced re-organization.

## 8. Non-goals

Held over and extended from the current anti-references:

- Not a team tool — single-user, no sharing/collab/permissions.
- Not a block editor or wiki — notes are notes, no backlink graphs or transclusion.
- Not project management — tasks are flat; no boards, sprints, or dependencies.
- Not a read-it-later magazine, not an "AI dashboard."
- No module gets features that break the two-second capture rule.
- No new visual language — no gradients-as-decoration, ghost cards, or per-module branding.

## 9. Phasing

1. **Shell + Spaces rename** — left sidebar and routes; profiles become spaces end-to-end (schema, hooks, UI copy); Links module = current dashboard mounted in the shell. Ship with only Links "lit up" if needed.
2. **Tasks** — smallest new primitive; proves the module template (omnibar capture, spaces/tags rails, list rows) generalizes.
3. **Notes** — capture + list + markdown editing with auto-save and rendered reading view.
4. **Spaces module** — space views composing all three primitives; list-modal attach flows; retire legacy projects.
5. **Deepening** — search across primitives from any omnibar, richer note editing, encryption, mobile polish, keyboard-command layer.

Each phase ships a complete, usable state; interop arrives with Spaces (phase 4) but nothing before it depends on it.

---

*When this document and the implementation diverge, the dashboard implementation is the design truth (per `DESIGN.md`); this document is the product truth for where we're going. Update both deliberately.*
