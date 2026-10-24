import type { MouseEvent as ReactMouseEvent } from 'react';

const isMac = () => /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent);

/** Desktop = a fine pointer that can hover; phones and tablets keep the default. */
export const prefersBackgroundTabs = () =>
  typeof window !== 'undefined' && window.matchMedia('(hover: hover) and (pointer: fine)').matches;

/**
 * Open a URL in a new tab behind this one, so memex stays in front.
 *
 * There's no web API for a background tab, but browsers open one for a
 * ⌘-click (Mac) / Ctrl-click link, and honor that modifier on a synthetic
 * click made while the user's own click is still being handled. So call this
 * from a click or key handler. On touch devices it opens a normal new tab.
 */
export function openUrlInBackgroundTab(url: string): void {
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.target = '_blank';
  anchor.rel = 'noopener noreferrer';
  anchor.hidden = true;
  document.body.appendChild(anchor);

  if (prefersBackgroundTabs()) {
    const mac = isMac();
    anchor.dispatchEvent(
      new MouseEvent('click', {
        bubbles: false,
        cancelable: true,
        view: window,
        metaKey: mac,
        ctrlKey: !mac,
      }),
    );
  } else {
    anchor.click();
  }
  anchor.remove();
}

/**
 * onClick for a real `<a href target="_blank">`: a plain left click opens the
 * tab in the background on desktop. Modified and middle clicks are left to the
 * browser, so ⌘/Ctrl/Shift-click and "Copy link address" behave as usual.
 */
export function handleBackgroundLinkClick(event: ReactMouseEvent<HTMLAnchorElement>): void {
  event.stopPropagation();
  if (
    event.button !== 0 ||
    event.metaKey ||
    event.ctrlKey ||
    event.shiftKey ||
    event.altKey ||
    !prefersBackgroundTabs()
  ) {
    return;
  }
  event.preventDefault();
  openUrlInBackgroundTab(event.currentTarget.href);
}
