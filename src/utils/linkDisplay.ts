const withProtocol = (url: string) => (url.includes('://') ? url : `https://${url}`);

const safeDecode = (value: string) => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

export const getHostname = (url: string, removeWww = true): string => {
  if (!url || typeof url !== 'string') {
    return 'Unknown';
  }

  try {
    let hostname = new URL(withProtocol(url)).hostname;
    if (removeWww) {
      hostname = hostname.replace(/^www\./, '');
    }
    return hostname;
  } catch {
    let cleaned = url.replace(/^https?:\/\//, '').split('/')[0];
    if (removeWww) {
      cleaned = cleaned.replace(/^www\./, '');
    }
    return cleaned || 'Unknown';
  }
};

/**
 * Full readable location: host + decoded path + query, no protocol or
 * trailing slash — e.g. "github.com/anthropics/claude-code".
 */
export const getUrlLabel = (url: string): string => {
  try {
    const parsed = new URL(withProtocol(url));
    const host = parsed.hostname.replace(/^www\./, '');
    const path = safeDecode(parsed.pathname).replace(/\/+$/, '');
    return `${host}${path}${parsed.search}`;
  } catch {
    return url.replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/+$/, '') || 'Unknown';
  }
};

/**
 * Title derived from the URL itself. Prefers the decoded path (the part that
 * distinguishes two links on the same site — "anthropics/claude-code"), and
 * falls back to the hostname for root URLs.
 */
export const getUrlTitle = (url: string): string => {
  try {
    const parsed = new URL(withProtocol(url));
    const path = safeDecode(parsed.pathname).replace(/^\/+|\/+$/g, '');
    if (path) {
      return `${path}${parsed.search}`;
    }
    return parsed.hostname.replace(/^www\./, '');
  } catch {
    return getUrlLabel(url);
  }
};

/**
 * A stored title is uninformative when it's just the bare hostname or the URL
 * itself (older captures saved the domain as the title).
 */
const isBareUrlTitle = (title: string, url: string): boolean => {
  const normalized = title.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  if (!normalized) return true;
  const host = getHostname(url, false).toLowerCase();
  const hostNoWww = host.replace(/^www\./, '');
  const urlNormalized = url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '');
  return normalized === host || normalized === hostNoWww || normalized === urlNormalized;
};

/**
 * Best display title for a link: freshly scraped title, then the stored title
 * (unless it's just the bare domain), then a path-aware title from the URL.
 */
export const getLinkTitle = (
  link: { url: string; title?: string | null },
  scrapedTitle?: string
): string => {
  if (scrapedTitle?.trim()) {
    return scrapedTitle;
  }
  const stored = link.title?.trim();
  if (stored && !isBareUrlTitle(stored, link.url)) {
    return stored;
  }
  return getUrlTitle(link.url);
};
