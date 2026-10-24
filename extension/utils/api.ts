import type { CapturePayload, SavedLink } from './types';
import type { Settings } from './settings';

export type ApiOutcome =
  | { ok: true; link: SavedLink; duplicate: boolean }
  /** retry: worth queueing (offline, 5xx, rate-limited, bad token that may be fixed). */
  | { ok: false; retry: boolean; auth: boolean; message: string };

const authHeaders = (s: Settings) => ({ Authorization: `Bearer ${s.token}` });

export async function postCapture(s: Settings, payload: CapturePayload): Promise<ApiOutcome> {
  let res: Response;
  try {
    res = await fetch(`${s.apiUrl}/api/capture`, {
      method: 'POST',
      headers: { ...authHeaders(s), 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20_000),
    });
  } catch {
    return { ok: false, retry: true, auth: false, message: 'Couldn’t reach memex' };
  }

  const body = (await res.json().catch(() => null)) as {
    success?: boolean;
    error?: string;
    data?: { link: SavedLink; duplicate?: boolean };
  } | null;

  if (res.ok && body?.success && body.data) {
    const { id, url, title } = body.data.link;
    return { ok: true, link: { id, url, title: title ?? null }, duplicate: Boolean(body.data.duplicate) };
  }
  const message = body?.error || `memex-api returned ${res.status}`;
  if (res.status === 401) return { ok: false, retry: true, auth: true, message: 'Access token rejected' };
  const retry = res.status >= 500 || res.status === 429;
  return { ok: false, retry, auth: false, message };
}

export async function deleteLink(s: Settings, linkId: string): Promise<boolean> {
  try {
    const res = await fetch(`${s.apiUrl}/api/links/${linkId}`, {
      method: 'DELETE',
      headers: authHeaders(s),
    });
    return res.ok;
  } catch {
    return false;
  }
}

/** Options-page check: lists tags, so it proves both reachability and the token. */
export async function testConnection(s: Pick<Settings, 'apiUrl' | 'token'>): Promise<string> {
  const res = await fetch(`${s.apiUrl}/api/tags`, { headers: { Authorization: `Bearer ${s.token}` } });
  const body = (await res.json().catch(() => null)) as { success?: boolean; error?: string } | null;
  if (!body?.success) throw new Error(body?.error || `HTTP ${res.status}`);
  return 'Connected';
}
