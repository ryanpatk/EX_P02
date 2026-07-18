const SESSION_KEYS = [
  'impeccable-live-session',
  'impeccable-live-session-handled',
  'impeccable-live-session-scroll',
] as const;

const LIVE_SCRIPT_URL = 'http://localhost:8400/live.js';

function clearImpeccableSessionKeys() {
  SESSION_KEYS.forEach((key) => {
    try {
      localStorage.removeItem(key);
    } catch {
      /* private mode */
    }
  });
}

/** Drop orphan sessions that have no variant wrapper in the live DOM. */
export function clearOrphanImpeccableSession() {
  if (document.querySelector('[data-impeccable-variants]')) return;

  const raw = localStorage.getItem('impeccable-live-session');
  if (!raw) return;

  try {
    const session = JSON.parse(raw) as { state?: string };
    const state = String(session.state ?? '').toUpperCase();
    if (['GENERATING', 'CYCLING', 'SAVING'].includes(state)) {
      clearImpeccableSessionKeys();
    }
  } catch {
    clearImpeccableSessionKeys();
  }
}

/**
 * Load Impeccable live after React has painted so pick/resume sees real DOM.
 * Sync tags injected into index.html by live.mjs run before React and break resume.
 */
export function bootstrapImpeccableLive() {
  if (!import.meta.env.DEV) return;

  document
    .querySelectorAll('script[src*="localhost:8400/live.js"]:not([data-impeccable-deferred])')
    .forEach((node) => node.remove());

  clearOrphanImpeccableSession();

  if (document.querySelector('script[data-impeccable-deferred]')) return;

  const script = document.createElement('script');
  script.src = LIVE_SCRIPT_URL;
  script.dataset.impeccableDeferred = 'true';
  script.onerror = () => {
    script.remove();
  };
  document.body.appendChild(script);
}
