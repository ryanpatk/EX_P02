import { ACCEPTED_TLDS } from './tlds';

/** Scheme prepended when the user types a bare `domain.tld` with no scheme. */
const DEFAULT_SCHEME = 'http://';

/**
 * Normalizes paste/typed input to a URL string with scheme, or '' if it does
 * not look like a real URL.
 *
 * A value is accepted only when its hostname has at least two non-empty labels
 * and its final label (the TLD) is in the fixed allowlist. This keeps bare
 * words and arbitrary "word.word" text from being treated as URLs.
 */
export function normalizeUrlInput(raw: string): string {
  const t = raw.trim();
  if (!t) return '';
  // A valid host has no whitespace; bail early on anything spacey.
  if (/\s/.test(t)) return '';

  const candidate = t.includes('://') ? t : `${DEFAULT_SCHEME}${t}`;
  try {
    const u = new URL(candidate);
    const host = u.hostname.replace(/\.$/, '');
    if (!host) return '';

    const labels = host.split('.');
    if (labels.length < 2) return '';
    if (labels.some((label) => label.length === 0)) return '';

    const tld = labels[labels.length - 1].toLowerCase();
    if (!ACCEPTED_TLDS.has(tld)) return '';

    return candidate;
  } catch {
    return '';
  }
}

export function isUrlLike(raw: string): boolean {
  return normalizeUrlInput(raw) !== '';
}
