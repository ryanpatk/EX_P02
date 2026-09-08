/**
 * memex-scraper — stateless URL-metadata worker.
 *
 * GET/POST /api/scrape?url=<target> → { success, data: { title, description,
 * image, logo, url, scrapedAt } }
 *
 * Deliberately knows nothing about the memex database or auth provider; access
 * is controlled by origin allowlisting (ALLOWED_ORIGINS var).
 */

export interface Env {
  ALLOWED_ORIGINS: string;
}

interface ScrapedData {
  title?: string;
  description?: string;
  image?: string;
  logo?: string;
  url: string;
  scrapedAt: string;
}

const FETCH_TIMEOUT_MS = 8000;
const MAX_HTML_BYTES = 1_500_000;

const BROWSER_HEADERS: Record<string, string> = {
  'User-Agent':
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36',
  Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  'Accept-Language': 'en-US,en;q=0.9',
};

const PRIVATE_HOST_PATTERN =
  /^(localhost|.*\.local|.*\.internal|0\.0\.0\.0|127\.|10\.|192\.168\.|169\.254\.|172\.(1[6-9]|2\d|3[01])\.|\[::1\]|\[f[cd])/i;

function corsHeaders(request: Request, env: Env): Record<string, string> {
  const origin = request.headers.get('Origin') ?? '';
  const allowed = (env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  const headers: Record<string, string> = {
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
    Vary: 'Origin',
  };
  if (allowed.includes('*')) {
    headers['Access-Control-Allow-Origin'] = '*';
  } else if (allowed.includes(origin)) {
    headers['Access-Control-Allow-Origin'] = origin;
  }
  return headers;
}

function json(body: unknown, status: number, cors: Record<string, string>): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json', ...cors },
  });
}

function normalizeTargetUrl(raw: string): URL | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  const withProtocol = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  try {
    const url = new URL(withProtocol);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return null;
    if (PRIVATE_HOST_PATTERN.test(url.hostname)) return null;
    return url;
  } catch {
    return null;
  }
}

function resolveUrl(candidate: string | undefined, base: string): string | undefined {
  if (!candidate) return undefined;
  try {
    const resolved = new URL(candidate.trim(), base);
    if (resolved.protocol !== 'http:' && resolved.protocol !== 'https:') return undefined;
    return resolved.href;
  } catch {
    return undefined;
  }
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#0?39;|&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

interface CollectedMeta {
  meta: Map<string, string>;
  titleText: string;
  icons: { href: string; rel: string; sizes: string }[];
}

async function collectMetadata(response: Response): Promise<CollectedMeta> {
  const collected: CollectedMeta = { meta: new Map(), titleText: '', icons: [] };
  let inTitle = false;

  const rewriter = new HTMLRewriter()
    .on('meta', {
      element(el) {
        const key = (el.getAttribute('property') || el.getAttribute('name') || '').toLowerCase();
        const content = el.getAttribute('content');
        if (key && content && !collected.meta.has(key)) {
          collected.meta.set(key, content);
        }
      },
    })
    .on('title', {
      element(el) {
        if (collected.titleText.trim()) return; // first <title> only (SVG can add more)
        inTitle = true;
        el.onEndTag(() => {
          inTitle = false;
        });
      },
      text(chunk) {
        if (inTitle) {
          collected.titleText += chunk.text;
        }
      },
    })
    .on('link', {
      element(el) {
        const rel = (el.getAttribute('rel') || '').toLowerCase();
        const href = el.getAttribute('href');
        if (href && /(^|\s)(icon|shortcut icon|apple-touch-icon)(\s|$)/.test(rel)) {
          collected.icons.push({ href, rel, sizes: el.getAttribute('sizes') || '' });
        }
      },
    });

  // Drive the streaming parse, but stop reading past a sane byte cap.
  const transformed = rewriter.transform(response);
  const reader = transformed.body?.getReader();
  if (reader) {
    let bytes = 0;
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      bytes += value?.byteLength ?? 0;
      if (bytes > MAX_HTML_BYTES) {
        await reader.cancel();
        break;
      }
    }
  }

  return collected;
}

function pickIcon(icons: CollectedMeta['icons'], baseUrl: string): string | undefined {
  // Prefer apple-touch-icon (usually largest/cleanest), then explicitly sized
  // icons, then anything.
  const scored = icons
    .map((icon) => {
      let score = 0;
      if (icon.rel.includes('apple-touch-icon')) score += 100;
      const size = parseInt(icon.sizes, 10);
      if (!Number.isNaN(size)) score += Math.min(size, 96);
      return { icon, score };
    })
    .sort((a, b) => b.score - a.score);

  return resolveUrl(scored[0]?.icon.href, baseUrl);
}

const YOUTUBE_HOST = /(^|\.)youtube\.com$|(^|\.)youtu\.be$/i;

/**
 * oEmbed fallback for YouTube: their watch pages intermittently 429 requests
 * from Workers egress IPs, but the public oEmbed endpoint is built for
 * server-to-server use and stays reliable.
 */
async function scrapeYouTubeOEmbed(target: URL): Promise<ScrapedData | null> {
  const res = await fetch(
    `https://www.youtube.com/oembed?url=${encodeURIComponent(target.href)}&format=json`,
    { signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) },
  );
  if (!res.ok) return null;

  const data = (await res.json()) as {
    title?: string;
    author_name?: string;
    thumbnail_url?: string;
  };
  if (!data.title) return null;

  return {
    title: data.title,
    description: data.author_name ? `YouTube · ${data.author_name}` : undefined,
    image: data.thumbnail_url,
    logo: 'https://www.google.com/s2/favicons?domain=youtube.com&sz=64',
    url: target.href,
    scrapedAt: new Date().toISOString(),
  };
}

async function fetchPage(target: URL): Promise<Response> {
  const attempt = () =>
    fetch(target.href, {
      headers: BROWSER_HEADERS,
      redirect: 'follow',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

  let response = await attempt();
  // Shared egress IPs get intermittently rate-limited; one retry usually
  // leaves through a different IP and succeeds.
  if (response.status === 429) {
    await new Promise((resolve) => setTimeout(resolve, 1200));
    response = await attempt();
  }
  return response;
}

async function scrape(target: URL): Promise<ScrapedData> {
  const response = await fetchPage(target);

  // Strict 200 only: anti-bot interstitials (e.g. Dribbble) answer 202 with an
  // empty shell page — treat anything else as a failed scrape, not thin data.
  if (response.status !== 200) {
    if (YOUTUBE_HOST.test(target.hostname)) {
      const fallback = await scrapeYouTubeOEmbed(target);
      if (fallback) return fallback;
    }
    throw new Error(`Upstream responded ${response.status}`);
  }

  const finalUrl = response.url || target.href;
  const contentType = response.headers.get('Content-Type') || '';
  if (!contentType.includes('html')) {
    throw new Error(`Not an HTML page (${contentType || 'unknown content type'})`);
  }

  const { meta, titleText, icons } = await collectMetadata(response);
  const get = (...keys: string[]) => {
    for (const key of keys) {
      const value = meta.get(key)?.trim();
      if (value) return value;
    }
    return undefined;
  };

  const title = get('og:title', 'twitter:title') || titleText.trim() || undefined;

  // YouTube sometimes answers datacenter IPs with a 200 consent-wall shell
  // (title "- YouTube", generic description) instead of the video page.
  // Validate content, not just status, and recover via oEmbed.
  if (
    YOUTUBE_HOST.test(target.hostname) &&
    (!title || title === '- YouTube' || title === 'YouTube')
  ) {
    const fallback = await scrapeYouTubeOEmbed(target);
    if (fallback) return fallback;
  }

  const description = get('og:description', 'twitter:description', 'description');
  const rawImage = get('og:image:secure_url', 'og:image', 'twitter:image', 'twitter:image:src');
  const image = resolveUrl(rawImage ? decodeEntities(rawImage) : undefined, finalUrl);
  const hostname = new URL(finalUrl).hostname;
  const logo =
    pickIcon(icons, finalUrl) ??
    `https://www.google.com/s2/favicons?domain=${hostname}&sz=64`;

  return {
    title: title ? decodeEntities(title) : undefined,
    description: description ? decodeEntities(description) : undefined,
    image,
    logo,
    url: finalUrl,
    scrapedAt: new Date().toISOString(),
  };
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const cors = corsHeaders(request, env);

    if (request.method === 'OPTIONS') {
      return new Response(null, { status: 204, headers: cors });
    }

    const requestUrl = new URL(request.url);
    if (requestUrl.pathname !== '/api/scrape') {
      return json({ success: false, error: 'Not found' }, 404, cors);
    }

    let rawTarget = requestUrl.searchParams.get('url') ?? '';
    if (!rawTarget && request.method === 'POST') {
      try {
        const body = (await request.json()) as { url?: string };
        rawTarget = body.url ?? '';
      } catch {
        // fall through to validation error
      }
    }

    const target = normalizeTargetUrl(rawTarget);
    if (!target) {
      return json({ success: false, error: 'Invalid or missing url' }, 400, cors);
    }

    try {
      const data = await scrape(target);
      return new Response(JSON.stringify({ success: true, data }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=86400',
          ...cors,
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Scrape failed';
      return json({ success: false, error: message }, 502, cors);
    }
  },
};
