// Save-on-open popup: opening it (click or ⌘⇧S) captures the active tab.

const states = ['setup', 'saving', 'saved', 'error'];
const show = (name) => {
  for (const s of states) {
    document.getElementById(`state-${s}`).hidden = s !== name;
  }
};

const getSettings = () =>
  chrome.storage.sync.get({ apiUrl: '', token: '', sound: true });

// Short JOYFUL_SYSTEMS confirmation blip (two quick soft sine ticks).
const playBlip = async () => {
  try {
    const ctx = new AudioContext();
    const tick = (freq, at) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.06, at);
      gain.gain.exponentialRampToValueAtTime(0.0001, at + 0.07);
      osc.connect(gain).connect(ctx.destination);
      osc.start(at);
      osc.stop(at + 0.08);
    };
    tick(880, ctx.currentTime);
    tick(1320, ctx.currentTime + 0.06);
  } catch {
    // sound is never load-bearing
  }
};

const openOptions = () => chrome.runtime.openOptionsPage();

const capture = async () => {
  const { apiUrl, token, sound } = await getSettings();
  if (!apiUrl || !token) {
    show('setup');
    return;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab?.url ?? '';
  if (!/^https?:\/\//.test(url)) {
    show('error');
    document.getElementById('error-detail').textContent =
      'This page can’t be saved (only http/https).';
    return;
  }

  // Reopening on a page we just saved shouldn't create a duplicate.
  const { lastSave } = await chrome.storage.session.get('lastSave');
  if (lastSave?.url === url && Date.now() - lastSave.at < 5 * 60 * 1000) {
    show('saved');
    document.getElementById('saved-title').textContent =
      `Already saved: ${lastSave.title || url}`;
    wireUndo(apiUrl, token, lastSave.linkId, url);
    return;
  }

  show('saving');
  document.getElementById('saving-url').textContent = url;

  try {
    const res = await fetch(`${apiUrl.replace(/\/$/, '')}/api/capture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url, title: tab.title || undefined }),
    });
    const body = await res.json();
    if (!body.success) throw new Error(body.error || `HTTP ${res.status}`);

    const link = body.data.link;
    await chrome.storage.session.set({
      lastSave: { url, linkId: link.id, title: link.title || tab.title, at: Date.now() },
    });

    show('saved');
    document.getElementById('saved-title').textContent = link.title || url;
    if (sound) playBlip();
    wireUndo(apiUrl, token, link.id, url);
  } catch (err) {
    show('error');
    document.getElementById('error-detail').textContent =
      err.message === 'Failed to fetch'
        ? 'Could not reach the memex API. Check the API address in settings.'
        : err.message;
  }
};

const wireUndo = (apiUrl, token, linkId, url) => {
  document.getElementById('undo').onclick = async () => {
    try {
      await fetch(`${apiUrl.replace(/\/$/, '')}/api/links/${linkId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      await chrome.storage.session.remove('lastSave');
      show('error');
      document.querySelector('#state-error .headline').textContent = 'removed';
      document.querySelector('#state-error .headline').classList.remove('error');
      document.getElementById('error-detail').textContent = url;
      document.getElementById('retry').textContent = 'Save again';
    } catch {
      document.getElementById('undo').textContent = 'Undo failed';
    }
  };
};

document.getElementById('open-options').onclick = openOptions;
document.getElementById('open-options-error').onclick = openOptions;
document.getElementById('retry').onclick = async () => {
  await chrome.storage.session.remove('lastSave');
  capture();
};

capture();
