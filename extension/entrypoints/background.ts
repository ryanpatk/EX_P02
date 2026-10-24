import { browser, type Browser } from 'wxt/browser';
import { defineBackground } from 'wxt/utils/define-background';
import { deleteLink, postCapture } from '@/utils/api';
import { flashBadge, updateBadge } from '@/utils/badge';
import { enqueue, flushQueue, FLUSH_ALARM } from '@/utils/queue';
import {
  getSettings,
  isConfigured,
  migrateLegacySettings,
  setSiteEnabled,
  SITE_LABEL,
  type Settings,
} from '@/utils/settings';
import type { CapturePayload, CaptureResult, ExtensionMessage, WatchedSite } from '@/utils/types';

const MENU_PAGE = 'memex-save-page';
const MENU_LINK = 'memex-save-link';
// Auto-save switches on the toolbar icon's right-click menu: flip them without
// opening the popup (which would save the current tab).
const MENU_SITE = 'memex-auto-';
const SITES = Object.keys(SITE_LABEL) as WatchedSite[];

/** Every save — popup, context menu, X, Pinterest — goes through here. */
async function capture(payload: CapturePayload): Promise<CaptureResult> {
  const settings = await getSettings();
  if (!isConfigured(settings)) return { status: 'setup' };

  const outcome = await postCapture(settings, payload);
  if (outcome.ok) {
    void flashBadge(outcome.duplicate ? 'duplicate' : 'saved');
    return { status: outcome.duplicate ? 'duplicate' : 'saved', link: outcome.link };
  }
  if (outcome.retry) {
    await enqueue(payload, outcome.message);
    await updateBadge();
    return {
      status: 'queued',
      message: outcome.auth
        ? 'memex rejected the access token — fix it in settings and this save will go through.'
        : 'memex is unreachable right now — this save will retry automatically.',
    };
  }
  void flashBadge('error');
  return { status: 'error', message: outcome.message };
}

async function createMenus(): Promise<void> {
  const { sites } = await getSettings();
  await browser.contextMenus.removeAll();
  browser.contextMenus.create({ id: MENU_PAGE, title: 'Save page to memex', contexts: ['page'] });
  browser.contextMenus.create({ id: MENU_LINK, title: 'Save link to memex', contexts: ['link'] });
  for (const site of SITES) {
    browser.contextMenus.create({
      id: MENU_SITE + site,
      title: `Auto-save ${SITE_LABEL[site]}`,
      type: 'checkbox',
      checked: sites[site],
      contexts: ['action'],
    });
  }
}

const isHttp = (url?: string): url is string => Boolean(url && /^https?:\/\//.test(url));

export default defineBackground(() => {
  browser.runtime.onInstalled.addListener(async () => {
    await migrateLegacySettings();
    await createMenus();
    await updateBadge();
  });

  browser.runtime.onStartup.addListener(() => {
    void flushQueue().then(updateBadge);
  });

  browser.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === FLUSH_ALARM) void flushQueue().then(updateBadge);
  });

  const captureFromMenu = (payload: CapturePayload) =>
    capture(payload).then((result) => {
      if (result.status === 'setup') void browser.runtime.openOptionsPage();
    });

  // Keep the menu checkmarks in step with the popup and settings page.
  browser.storage.onChanged.addListener((changes, area) => {
    const sites = (changes.settings?.newValue as Settings | undefined)?.sites;
    if (area !== 'local' || !sites) return;
    for (const site of SITES) {
      void browser.contextMenus.update(MENU_SITE + site, { checked: sites[site] !== false });
    }
  });

  browser.contextMenus.onClicked.addListener((info, tab) => {
    const site = SITES.find((s) => info.menuItemId === MENU_SITE + s);
    if (site) {
      void setSiteEnabled(site, Boolean(info.checked));
      return;
    }
    if (info.menuItemId === MENU_PAGE && isHttp(info.pageUrl)) {
      void captureFromMenu({
        url: info.pageUrl,
        title: tab?.title,
        favicon: tab?.favIconUrl,
        source: 'extension',
      });
    }
    if (info.menuItemId === MENU_LINK && isHttp(info.linkUrl)) {
      void captureFromMenu({ url: info.linkUrl, source: 'extension' });
    }
  });

  browser.runtime.onMessage.addListener(
    (message: ExtensionMessage, sender: Browser.runtime.MessageSender, sendResponse: (r: unknown) => void) => {
      if (message.type === 'capture') {
        const payload = { ...message.payload };
        // Content scripts can't see the tab favicon; fill it in here.
        if (!payload.favicon && sender.tab?.favIconUrl && isHttp(sender.tab.favIconUrl)) {
          payload.favicon = sender.tab.favIconUrl;
        }
        capture(payload).then(sendResponse, (err) =>
          sendResponse({ status: 'error', message: String(err) } satisfies CaptureResult),
        );
        return true;
      }
      if (message.type === 'undo') {
        getSettings()
          .then((s) => deleteLink(s, message.linkId))
          .then(sendResponse, () => sendResponse(false));
        return true;
      }
      if (message.type === 'flush') {
        flushQueue(true)
          .then(updateBadge)
          .then(() => sendResponse(true));
        return true;
      }
      return false;
    },
  );
});
