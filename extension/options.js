const $ = (id) => document.getElementById(id);
const status = (message, ok) => {
  $('status').textContent = message;
  $('status').className = ok ? 'ok' : 'bad';
};

chrome.storage.sync
  .get({ apiUrl: '', token: '', sound: true })
  .then(({ apiUrl, token, sound }) => {
    $('apiUrl').value = apiUrl;
    $('token').value = token;
    $('sound').checked = sound;
  });

$('save').onclick = async () => {
  await chrome.storage.sync.set({
    apiUrl: $('apiUrl').value.trim().replace(/\/$/, ''),
    token: $('token').value.trim(),
    sound: $('sound').checked,
  });
  status('Saved ✓', true);
};

$('test').onclick = async () => {
  const apiUrl = $('apiUrl').value.trim().replace(/\/$/, '');
  const token = $('token').value.trim();
  if (!apiUrl || !token) {
    status('Fill in both fields first.', false);
    return;
  }
  status('Testing…', true);
  try {
    const res = await fetch(`${apiUrl}/api/tags`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await res.json();
    if (body.success) {
      status(`Connected ✓ (${body.data.length} tags visible)`, true);
    } else {
      status(body.error || `HTTP ${res.status}`, false);
    }
  } catch {
    status('Could not reach that address.', false);
  }
};
