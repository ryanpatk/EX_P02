# memex-api

Cloudflare Worker exposing a small capture API for the browser extension (and
any future client). Token-authenticated; today it writes through to Supabase
with a service-role key, and when the database migrates only this worker
changes — clients keep the same contract.

## Routes

All routes require `Authorization: Bearer mx_…` (create tokens in memex under
**Settings → Access tokens**).

| Route                  | Method | Body / result                                          |
| ---------------------- | ------ | ------------------------------------------------------ |
| `/api/capture`         | POST   | `{ url, title?, note?, spaceId?, tagIds? }` → created link (metadata enriched via memex-scraper when `SCRAPER_URL` is set) |
| `/api/links/:id`       | DELETE | undo a capture (scoped to the token's user)            |
| `/api/spaces`          | GET    | `[{ id, name }]`                                       |
| `/api/tags`            | GET    | `[{ id, name }]`                                       |

CORS is wide open (`*`) by design — access control is the token, so clients
(extension pages, scripts) work from any origin without preregistration.

## Deploy

```bash
cd api
npm install
npx wrangler login                          # once
npx wrangler secret put SUPABASE_SERVICE_KEY # paste the service-role key
npm run deploy                              # → https://memex-api.<account>.workers.dev
```

Set `SCRAPER_URL` in `wrangler.jsonc` to your deployed memex-scraper URL so
captures get titles/descriptions/preview images. Apply the token table first:

```bash
supabase db push   # applies supabase/migrations/20260906120000_add_api_tokens.sql
```

## Local dev

```bash
npm run dev   # http://localhost:8788
# secrets for dev go in api/.dev.vars (gitignored):
#   SUPABASE_SERVICE_KEY=...
curl -X POST http://localhost:8788/api/capture \
  -H "Authorization: Bearer mx_..." -H "Content-Type: application/json" \
  -d '{"url":"https://example.com"}'
```

## Security model

- Tokens are 256-bit random values; only their SHA-256 hash is stored
  (`api_tokens` table). Revocation = deleting the row (Settings UI).
- The service-role key exists only as a Cloudflare secret — never in the repo
  or any client.
- The worker verifies row ownership explicitly (`user_id` scoping on every
  query) since the service role bypasses RLS.
