/**
 * Open a URL in a new browser tab and try to keep focus on this window so the
 * tab loads in the background. Behavior follows the browser (most Chromium
 * builds honor the refocus; Safari/Firefox may still switch to the new tab).
 */
export function openUrlInBackgroundTab(url: string): void {
  window.open(url, '_blank', 'noopener,noreferrer');
  window.focus();
  requestAnimationFrame(() => {
    window.focus();
  });
}
