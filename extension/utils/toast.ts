// A small “Saved to memex” pill on X / Pinterest after a background save.
// Shadow DOM keeps the host page's CSS out and ours in.
import { playBlip } from './sound';
import type { CaptureResult } from './types';

const STYLE = `
:host { all: initial; }
.toast {
  position: fixed; right: 24px; bottom: 24px; z-index: 2147483647;
  display: flex; align-items: center; gap: 8px;
  max-width: min(360px, calc(100vw - 48px));
  padding: 10px 16px; border-radius: 999px;
  background: oklch(0.22 0.012 264); color: oklch(0.96 0.005 264);
  box-shadow: 0 1px 2px rgb(0 0 0 / 0.2), 0 8px 24px rgb(0 0 0 / 0.18);
  font: 600 13px/1.4 ui-rounded, "SF Pro Rounded", system-ui, sans-serif;
  opacity: 0; transform: translateY(8px);
  transition: opacity 180ms ease-out, transform 180ms ease-out;
}
.toast.in { opacity: 1; transform: none; }
.dot { flex: none; width: 8px; height: 8px; border-radius: 999px; background: var(--dot); }
.text { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
@media (prefers-reduced-motion: reduce) { .toast { transition: none; transform: none; } }
`;

const COPY: Record<CaptureResult['status'], { text: string; dot: string }> = {
  saved: { text: 'Saved to memex', dot: '#00c500' },
  duplicate: { text: 'Already in memex', dot: '#5077ff' },
  queued: { text: 'memex offline — will save when it’s back', dot: '#ffb020' },
  setup: { text: 'memex: add your access token in the extension settings', dot: '#ff5a6f' },
  error: { text: 'Couldn’t save to memex', dot: '#ff5a6f' },
};

let root: ShadowRoot | null = null;
let hideTimer: ReturnType<typeof setTimeout> | undefined;

export function showCaptureToast(result: CaptureResult, sound: boolean): void {
  if (!root) {
    const host = document.createElement('memex-capture-toast');
    root = host.attachShadow({ mode: 'closed' });
    root.innerHTML = `<style>${STYLE}</style><div class="toast" role="status" aria-live="polite"><span class="dot" aria-hidden="true"></span><span class="text"></span></div>`;
    document.documentElement.append(host);
  }
  const toast = root.querySelector('.toast') as HTMLElement;
  const copy = COPY[result.status];
  toast.style.setProperty('--dot', copy.dot);
  root.querySelector('.text')!.textContent =
    result.status === 'error' ? `${copy.text}: ${result.message}` : copy.text;

  requestAnimationFrame(() => toast.classList.add('in'));
  if (sound && result.status === 'saved') playBlip();
  clearTimeout(hideTimer);
  hideTimer = setTimeout(() => toast.classList.remove('in'), result.status === 'saved' ? 2400 : 4800);
}
