# memex-scraper

Stateless Cloudflare Worker that turns a URL into link metadata:

```
GET /api/scrape?url=https://example.com/page
→ { "success": true, "data": { "title", "description", "image", "logo", "url", "scrapedAt" } }
```

It fetches the page with browser-like headers, streams it through `HTMLRewriter`
(no dependencies, no headless browser), and extracts Open Graph / Twitter-card
metadata, the `<title>`, and the best favicon. Verified working against GitHub,
Wikipedia, and Pinterest pins (which serve `og:image` server-side).

By design it knows nothing about the memex database or auth provider — it is a
pure `url in → JSON out` service, so it survives any backend migration. Access
control is origin allowlisting plus SSRF guards (http/https only, private
hosts rejected).

## Develop

```bash
cd scraper
npm install
npm run dev            # http://localhost:8787
curl "http://localhost:8787/api/scrape?url=https://github.com/anthropics/claude-code"
```

## Deploy

```bash
cd scraper
npx wrangler login     # once
npm run deploy         # → https://memex-scraper.<account>.workers.dev
```

Before deploying, add your production origin(s) to `ALLOWED_ORIGINS` in
`wrangler.jsonc` (comma-separated). Then point the app at the worker in `.env`:

```
VITE_SCRAPER_URL=https://memex-scraper.<account>.workers.dev
```

The app calls the worker once at capture time (`useCreateLink`) and stores the
results on the link row; display never scrapes live. Backfill existing links
with:

```bash
SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SCRAPER_URL=... \
  node scripts/backfill-metadata.mjs --dry-run   # then without --dry-run
```

## Known limits

- Sites that require JavaScript to render meta tags, or that block datacenter
  IPs, will fail or return thin data. If a domain matters and fails (test
  Pinterest from the deployed worker, not just local dev), the escalation path
  is Cloudflare Browser Rendering or a metadata API (e.g. Microlink) behind
  this same endpoint — the app contract doesn't change.
- Hotlinked `image` URLs can break if the host forbids embedding. If that
  becomes common, add an image-proxy route to this worker backed by the
  Cloudflare cache.
