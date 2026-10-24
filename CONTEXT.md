# memex — Language

The words memex uses in code, copy and docs. Pick the word here; avoid the listed alternatives. Borrowed practice from pond's `CONTEXT.md`. See `ROADMAP.md` for how the pieces fit.

## Capture and display

**Journal**:
The home view: every entry in time order, with the composer. Scoped to Home or to one space.
_Avoid_: feed, stream (as the home view), notes to self (legacy name)

**Entry**:
One moment in the Journal: a jot, or a pointer to an item created or captured at that moment.
_Avoid_: message, post, event (as the product word)

**Jot**:
A short piece of text written in the Journal. Can become a note or task.
_Avoid_: message, self message (the DB table `self_messages` keeps its legacy name until Phase 4)

**Item**:
A link, note or task. Items live in the Library and can be in any number of spaces.
_Avoid_: record, object, card (cards are how items look)

**Link** / **Note** / **Task**:
The three item types. A note's body is plain markdown.
_Avoid_: bookmark (for link), document or page (for note), todo (for task, except as `#todo` syntax)

**Space**:
A context such as “Home reno” or “Job search”. Shown as a working board.
_Avoid_: profile (legacy DB name), project (legacy), folder, collection

**Board**:
How a space is laid out: pinned sites, tasks, notes, saves.
_Avoid_: dashboard, canvas

**Library**:
Every item ever captured, shown as Gallery, Table or Board.
_Avoid_: stream (legacy), archive, database (in copy)

**Saved view**:
A named set of Library filters with a layout and sort.
_Avoid_: smart folder, filter preset

**Tag**:
A label from the one shared vocabulary, on any item.

**Filing**:
Putting an item or jot into a space or tag. Unfiled is a normal state.
_Avoid_: organizing, sorting, categorizing

**Inbox**:
Unfiled items plus proposals (filing suggestions, agent changes) waiting for you to apply or dismiss.
_Avoid_: queue, triage

## Sources

**Source**:
A platform memex captures from: `x`, `pinterest`, `youtube`, `web`.
_Avoid_: provider, integration, site (in code)

**Source id**:
The platform's own id for a saved thing (post id, pin id, video id). `(source, sourceId)` is the dedupe key.

**List**:
Which of your lists on the source held it: `bookmarked`, `liked`, `saved`. One link can be on several.
_Avoid_: origin, kind

**Capture**:
The snapshot of what the source page contained (author, text, media, metrics, quoted post, link card). Stored on the link.
_Avoid_: scrape, metadata blob, harvest

**Captured by**:
How the item arrived: `app`, `extension`, `resync`, `share`, `api`, `agent`.

**Re-sync**:
The desktop app's periodic walk of your lists on a source, catching anything the extension missed.
_Avoid_: crawl, backfill, import (import means a one-time bulk load)

## Storage and sync

**Vault**:
The folder of plain files that is memex's source of truth. Lives in R2; mirrored to `~/memex`.
_Avoid_: database, store, backup (the vault is not a backup; it is the data)

**Writer**:
The single process (a Durable Object) that applies changes to the vault in order.
_Avoid_: server (too vague), master

**Change**:
One small edit sent by a device (`item.update`, `entry.create`, `item.file`…). Devices queue them in an **outbox** and pull the **change feed**.
_Avoid_: event (as the stored unit), mutation (in copy), op

**Index**:
The searchable SQLite derived from the vault. Always rebuildable; never the only copy of anything.

**Mirror**:
The local copy of the vault kept by the desktop app.
_Avoid_: sync folder, export (export means a one-off copy)
