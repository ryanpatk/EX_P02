/**
 * Runs in the page's MAIN world (only web platform globals — no browser.*).
 * Wraps fetch and XHR once per page and hands every successful request that
 * matches a registered watcher its request body, so we see a site's own
 * “bookmark” / “save” calls without depending on its DOM.
 *
 * Adapted from pond's interceptor (github.com/raphaelsalaja/pond,
 * apps/extension/utils/intercept.ts, MIT © 2026 Raphael Salaja).
 */
import { SAVE_EVENT, type SiteSaveEvent, type WatchedSite } from './types';

export interface SaveWatcher {
  site: WatchedSite;
  /** Cheap URL/method test; runs on every request the page makes. */
  match(url: string, method: string): boolean;
  /** Item id from the request body, or null if this call isn't a save. */
  idFromBody(body: string): string | null;
}

/** Hand a save to the isolated-world content script. */
function emit(site: WatchedSite, id: string): void {
  const event: SiteSaveEvent = { type: SAVE_EVENT, site, id };
  window.postMessage(event, window.location.origin);
}

async function bodyToText(body: unknown): Promise<string | null> {
  if (body == null) return null;
  if (typeof body === 'string') return body;
  if (body instanceof URLSearchParams) return body.toString();
  if (body instanceof FormData) {
    const params = new URLSearchParams();
    body.forEach((value, key) => params.append(key, typeof value === 'string' ? value : '[file]'));
    return params.toString();
  }
  if (body instanceof Blob) return body.text().catch(() => null);
  if (body instanceof ArrayBuffer || ArrayBuffer.isView(body)) {
    return new TextDecoder().decode(body as ArrayBuffer);
  }
  return null;
}

function handle(watcher: SaveWatcher, body: string | null): void {
  if (!body) return;
  try {
    const id = watcher.idFromBody(body);
    if (id) emit(watcher.site, id);
  } catch {
    // a parsing miss must never break the page
  }
}

declare global {
  interface Window {
    __memexWatchers?: SaveWatcher[];
  }
}

export function watchSaves(watcher: SaveWatcher): void {
  if (window.__memexWatchers) {
    window.__memexWatchers.push(watcher);
    return;
  }
  const watchers: SaveWatcher[] = [watcher];
  window.__memexWatchers = watchers;
  const matching = (url: string, method: string) =>
    watchers.filter((w) => {
      try {
        return w.match(url, method);
      } catch {
        return false;
      }
    });

  const origFetch = window.fetch;
  window.fetch = function memexFetch(this: Window, input: RequestInfo | URL, init?: RequestInit) {
    const request = input instanceof Request ? input : null;
    const url = request ? request.url : String(input);
    const method = String(init?.method ?? request?.method ?? 'GET').toUpperCase();
    const matched = matching(url, method);
    // Clone before the page consumes the body.
    const requestClone = matched.length && request && init?.body == null ? request.clone() : null;
    const promise = origFetch.call(this, input, init);
    if (matched.length) {
      promise
        .then(async (response) => {
          if (!response.ok) return;
          const body = init?.body != null ? await bodyToText(init.body) : await requestClone?.text().catch(() => null);
          for (const w of matched) handle(w, body ?? null);
        })
        .catch(() => {});
    }
    return promise;
  };

  const proto = XMLHttpRequest.prototype;
  const origOpen = proto.open;
  const origSend = proto.send;
  const meta = new WeakMap<XMLHttpRequest, { url: string; method: string }>();

  proto.open = function memexOpen(this: XMLHttpRequest, method: string, url: string | URL, ...rest: unknown[]) {
    meta.set(this, { method: String(method).toUpperCase(), url: String(url) });
    return (origOpen as (...args: unknown[]) => void).call(this, method, url, ...rest);
  } as typeof proto.open;

  proto.send = function memexSend(this: XMLHttpRequest, body?: Document | XMLHttpRequestBodyInit | null) {
    const m = meta.get(this);
    const matched = m ? matching(m.url, m.method) : [];
    if (matched.length) {
      this.addEventListener(
        'load',
        () => {
          if (this.status < 200 || this.status >= 300) return;
          void bodyToText(body).then((text) => {
            for (const w of matched) handle(w, text);
          });
        },
        { once: true },
      );
    }
    return origSend.call(this, body);
  };
}
