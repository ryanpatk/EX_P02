# memex capture — browser extension

Saves pages to memex through the memex-api worker. Manifest V3, built with
[WXT](https://wxt.dev) + TypeScript. Chrome first; `npm run build:firefox`
produces a Firefox build (untested).
Roadmap and decisions: `docs/browser-extension-plan.md`.

## What it does

- **Toolbar / ⌘⇧S (Ctrl+Shift+S):** the popup opens and saves the active tab.
  It shows the saved title, **Undo**, and **Open in memex**. If the page is
  already saved it says “already in memex” (the API dedupes) and has no Undo.
- **Right-click:** “Save page to memex” and “Save link to memex”.
- **X bookmarks:** bookmarking a post on x.com saves it to memex (Home,
  untagged, `source = 'x:bookmark'`). Likes are ignored. The post's text,
  author and image are read from the page, because the scraper can't see past
  X's login wall.
- **Pinterest saves:** saving a pin to any board saves
  `pinterest.com/pin/<id>/` (`source = 'pinterest:save'`). The image comes from
  the page; title and description come from the scraper.
- A small pill (“Saved to memex”) confirms background saves on the page.
- **Auto-save switches:** turn X / Pinterest on or off from the bottom of the
  popup, or right-click the toolbar icon (doesn't save the current tab). Takes
  effect immediately, no tab reload.
- **Offline / failure queue:** if memex can't be reached, or the token is
  rejected, the save waits in a queue and retries with backoff (1 → 60 min,
  12 tries). The toolbar badge shows the count (`!` = token problem). Settings
  lists waiting and failed saves and has **Retry now**.

## How site watching works

X and Pinterest each get two content scripts at `document_start`:

1. `*-watch.content.ts` runs in the page's MAIN world. `utils/intercept.ts`
   wraps `fetch`/`XHR` and watches for the site's own successful save call:
   - X: the GraphQL `CreateBookmark` call; the rotating query id is ignored.
   - Pinterest: `/resource/(Repin|RepinSave|BoardPickerSave|…)Resource/create`.

   It posts only the item id to the window.
2. `*.content.ts` runs in the isolated world (`utils/bridge.ts`). It accepts
   numeric ids only, so the page can't inject URLs, and builds the URL itself.
   It reads metadata from the DOM (`sources/*.ts`) and sends the capture to
   the background worker, which calls the API.

Matching on the request name instead of buttons survives redesigns and
non-English UIs. If X renames `CreateBookmark` or Pinterest renames its
resources, the regexes in `sources/*.ts` are the only things to update. The
approach and interceptor are adapted from
[pond](https://github.com/raphaelsalaja/pond) (MIT).

## Develop / install

```bash
cd extension
npm install
npm run build          # → .output/chrome-mv3
npm run dev            # WXT dev mode with reload
npm run typecheck
```

1. Deploy `api/` (see `api/README.md`) and apply the migrations.
2. In memex: **Settings → Access tokens** → create a token, copy it.
3. `chrome://extensions` → **Developer mode** → **Load unpacked** →
   `extension/.output/chrome-mv3`.
4. In the extension's settings, paste the API address and token,
   **Test connection**, save. Reload any open X / Pinterest tabs.

After `npm run build`, click ↻ on the extension card in `chrome://extensions`
and reload X/Pinterest tabs.

## Files

- `wxt.config.ts` — manifest. Permissions: `activeTab`, `storage`, `alarms`,
  `contextMenus`. Host access is limited to x.com, twitter.com and
  pinterest.com.
- `entrypoints/background.ts` — the single capture path: API call, queue,
  badge, context menus.
- `entrypoints/popup/`, `entrypoints/options/` — popup and settings pages.
- `entrypoints/{x,pinterest}{,-watch}.content.ts` — site watchers.
- `sources/` — per-site request matching and DOM metadata.
- `utils/` — API client, settings (in `storage.local`, so the token isn't
  synced across devices), queue, badge, toast, sound, interceptor.
