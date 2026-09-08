# memex capture — browser extension (MVP)

One-click save of the current tab to memex. Vanilla Manifest V3, no build step.
See `docs/browser-extension-plan.md` for the full roadmap; this is Phase 1.

## What it does

- Click the toolbar icon (or press **⌘⇧S** / **Ctrl+Shift+S**) → the popup
  opens and immediately saves the active tab via the memex-api worker.
- Shows the saved title, offers **Undo**, guards against accidental
  double-saves of the same page, and plays a short confirmation blip
  (JOYFUL_SYSTEMS; toggle in settings).
- Metadata (real title, description, preview image) is filled in server-side
  by memex-api + memex-scraper.

## Install (unpacked, for now)

1. Deploy `api/` (see `api/README.md`) and apply the `api_tokens` migration.
2. In memex: **Settings → Access tokens** → create a token, copy it.
3. `chrome://extensions` → enable **Developer mode** → **Load unpacked** →
   select this `extension/` directory.
4. Open the extension's options page, paste the API address and token,
   **Test connection**, save.

## Files

- `manifest.json` — MV3; `activeTab` + `storage` permissions only.
- `popup.{html,js,css}` — save-on-open popup (the whole UX).
- `options.{html,js}` — API address, token, sound toggle.
- `icons/` — generated JOYFUL_SYSTEMS blue.

No host permissions are needed: memex-api allows cross-origin calls and access
is gated by the bearer token.
