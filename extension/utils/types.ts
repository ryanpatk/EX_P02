/** Where a capture came from; stored on the link as `links.source`. */
export type CaptureSource = 'extension' | 'x:bookmark' | 'pinterest:save';

/** What the extension sends memex-api. Client metadata wins over scraped values. */
export interface CapturePayload {
  url: string;
  source: CaptureSource;
  title?: string;
  description?: string;
  image?: string;
  favicon?: string;
}

export interface SavedLink {
  id: string;
  url: string;
  title: string | null;
}

export type CaptureResult =
  | { status: 'saved'; link: SavedLink }
  | { status: 'duplicate'; link: SavedLink }
  | { status: 'queued'; message: string }
  | { status: 'setup' }
  | { status: 'error'; message: string };

export type ExtensionMessage =
  | { type: 'capture'; payload: CapturePayload }
  | { type: 'undo'; linkId: string }
  | { type: 'flush' };

/** Sites whose own save buttons we watch. */
export type WatchedSite = 'x' | 'pinterest';

/** MAIN-world → isolated-world envelope (window.postMessage). */
export const SAVE_EVENT = 'memex:site-save';
export interface SiteSaveEvent {
  type: typeof SAVE_EVENT;
  site: WatchedSite;
  id: string;
}
