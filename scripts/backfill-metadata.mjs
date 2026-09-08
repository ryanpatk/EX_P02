/**
 * One-time backfill: scrape real metadata for existing links via the
 * memex-scraper worker and persist it (title, description, favicon, preview
 * image). Only fills gaps — a bare-domain title counts as a gap; a real title
 * is never overwritten.
 *
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... SCRAPER_URL=... \
 *     node scripts/backfill-metadata.mjs [--dry-run]
 */
import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY
const SCRAPER_URL = process.env.SCRAPER_URL?.replace(/\/$/, '')
const DRY_RUN = process.argv.includes('--dry-run')
const DELAY_MS = 500

if (!SUPABASE_URL || !SERVICE_KEY || !SCRAPER_URL) {
  console.error('Missing env: need SUPABASE_URL (or VITE_SUPABASE_URL), SUPABASE_SERVICE_ROLE_KEY, SCRAPER_URL')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY)

const hostnameOf = (url) => {
  try {
    return new URL(url.includes('://') ? url : `https://${url}`).hostname.replace(/^www\./, '')
  } catch {
    return null
  }
}

const isBareTitle = (title, url) => {
  if (!title) return true
  const host = hostnameOf(url)
  const normalized = title.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '')
  return !normalized || normalized === host || normalized === `www.${host}` ||
    normalized === url.trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/+$/, '')
}

const scrape = async (url) => {
  const res = await fetch(`${SCRAPER_URL}/api/scrape?url=${encodeURIComponent(url)}`, {
    signal: AbortSignal.timeout(15000),
  })
  const body = await res.json()
  if (!body.success) throw new Error(body.error || `HTTP ${res.status}`)
  return body.data
}

const { data: links, error } = await supabase
  .from('links')
  .select('id, url, title, description, favicon_url, preview_image_url')
if (error) throw error

const candidates = links.filter(
  (l) => !l.preview_image_url || !l.description || isBareTitle(l.title, l.url),
)
console.log(`${links.length} links total, ${candidates.length} need metadata${DRY_RUN ? ' (dry run)' : ''}`)

let updated = 0
let failed = 0
for (const link of candidates) {
  try {
    const scraped = await scrape(link.url)
    const patch = {}
    if (scraped.title && isBareTitle(link.title, link.url)) patch.title = scraped.title
    if (scraped.description && !link.description) patch.description = scraped.description
    if (scraped.logo && !link.favicon_url) patch.favicon_url = scraped.logo
    if (scraped.image && !link.preview_image_url) patch.preview_image_url = scraped.image

    if (Object.keys(patch).length === 0) {
      console.log(`— nothing new for ${link.url}`)
    } else if (DRY_RUN) {
      console.log(`~ would update ${link.url}:`, Object.keys(patch).join(', '))
    } else {
      const { error: updateError } = await supabase.from('links').update(patch).eq('id', link.id)
      if (updateError) throw updateError
      updated += 1
      console.log(`✓ ${link.url}: ${Object.keys(patch).join(', ')}`)
    }
  } catch (err) {
    failed += 1
    console.warn(`✗ ${link.url}: ${err.message}`)
  }
  await new Promise((resolve) => setTimeout(resolve, DELAY_MS))
}

console.log(`Done. Updated ${updated}, failed ${failed}.`)
