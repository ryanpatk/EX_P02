/** Normalizes paste/typed input to a URL string with scheme, or '' if not parseable. */
export function normalizeUrlInput(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  const candidate = t.includes('://') ? t : `https://${t}`;
  try {
    const u = new URL(candidate);
    if (!u.hostname) return '';
    return candidate;
  } catch {
    return '';
  }
}

export function isUrlLike(raw: string): boolean {
  return normalizeUrlInput(raw) !== '';
}
