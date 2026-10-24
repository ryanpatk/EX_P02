// Save-on-open popup: opening it (click or ⌘⇧S) captures the active tab.
import { browser } from 'wxt/browser';
import { getSettings, linkInAppUrl, setSiteEnabled } from '@/utils/settings';
import { playBlip } from '@/utils/sound';
import type { CaptureResult, ExtensionMessage, WatchedSite } from '@/utils/types';

type State = 'setup' | 'saving' | 'saved' | 'duplicate' | 'queued' | 'error';

const show = (name: State) => {
  for (const el of document.querySelectorAll<HTMLElement>('.state')) {
    el.hidden = el.id !== `state-${name}`;
  }
  return document.getElementById(`state-${name}`)!;
};
const field = (state: HTMLElement, name: string) =>
  state.querySelector<HTMLElement>(`[data-field="${name}"]`)!;

const send = <T>(message: ExtensionMessage) => browser.runtime.sendMessage(message) as Promise<T>;

for (const el of document.querySelectorAll<HTMLElement>('.open-options')) {
  el.onclick = () => void browser.runtime.openOptionsPage();
}

async function capture(): Promise<void> {
  const settings = await getSettings();
  const [tab] = await browser.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url ?? '';
  if (!/^https?:\/\//.test(url)) {
    field(show('error'), 'message').textContent = 'This page can’t be saved (only http/https).';
    return;
  }

  field(show('saving'), 'url').textContent = url;
  let result: CaptureResult;
  try {
    result = await send<CaptureResult>({
      type: 'capture',
      payload: { url, title: tab?.title || undefined, favicon: tab?.favIconUrl, source: 'extension' },
    });
  } catch (err) {
    result = { status: 'error', message: String(err) };
  }

  const state = show(result.status);
  if (result.status === 'saved' || result.status === 'duplicate') {
    field(state, 'title').textContent = result.link.title || result.link.url;
    for (const a of state.querySelectorAll<HTMLAnchorElement>('.open-app')) {
      a.href = linkInAppUrl(settings, result.link.id);
    }
  }
  if (result.status === 'saved') {
    if (settings.sound) playBlip();
    wireUndo(result.link.id, url);
  }
  if (result.status === 'queued' || result.status === 'error') {
    field(state, 'message').textContent = result.message;
  }
}

function wireUndo(linkId: string, url: string): void {
  const undo = document.getElementById('undo') as HTMLButtonElement;
  undo.onclick = async () => {
    undo.disabled = true;
    const ok = await send<boolean>({ type: 'undo', linkId }).catch(() => false);
    if (!ok) {
      undo.disabled = false;
      undo.textContent = 'Undo failed — retry';
      return;
    }
    const state = show('error');
    const headline = field(state, 'headline');
    headline.textContent = 'removed';
    headline.classList.remove('error');
    field(state, 'message').textContent = url;
    document.getElementById('retry')!.textContent = 'Save again';
  };
}

async function wireSiteSwitches(): Promise<void> {
  const { sites } = await getSettings();
  for (const site of Object.keys(sites) as WatchedSite[]) {
    const input = document.getElementById(`site-${site}`) as HTMLInputElement;
    input.checked = sites[site];
    // Takes effect immediately: open tabs read the setting on every save.
    input.onchange = () => void setSiteEnabled(site, input.checked);
  }
}

document.getElementById('retry')!.onclick = () => void capture();

void wireSiteSwitches();

void capture();
