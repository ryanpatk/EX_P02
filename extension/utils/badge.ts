// Toolbar badge: a count while captures wait in the queue, “!” when the last
// failure was the token, and a brief ✓ / ↺ flash after a background save.
import { browser } from 'wxt/browser';
import { getQueueState } from './queue';

const GREEN = '#00c500';
const GREY = '#7a7f8c';
const CORAL = '#ff5a6f';

let flashTimer: ReturnType<typeof setTimeout> | undefined;

export async function updateBadge(): Promise<void> {
  if (flashTimer) return;
  const { queue } = await getQueueState();
  const authProblem = queue.some((q) => q.lastError === 'Access token rejected');
  await browser.action.setBadgeText({ text: queue.length ? (authProblem ? '!' : String(queue.length)) : '' });
  await browser.action.setBadgeBackgroundColor({ color: authProblem ? CORAL : GREY });
  await browser.action.setTitle({
    title: queue.length
      ? `Save to memex — ${queue.length} waiting to sync${authProblem ? ' (check your access token)' : ''}`
      : 'Save to memex',
  });
}

export async function flashBadge(kind: 'saved' | 'duplicate' | 'error'): Promise<void> {
  const text = kind === 'error' ? '!' : kind === 'duplicate' ? '=' : '✓';
  const color = kind === 'error' ? CORAL : kind === 'duplicate' ? GREY : GREEN;
  clearTimeout(flashTimer);
  await browser.action.setBadgeText({ text });
  await browser.action.setBadgeBackgroundColor({ color });
  flashTimer = setTimeout(() => {
    flashTimer = undefined;
    void updateBadge();
  }, 2500);
}
