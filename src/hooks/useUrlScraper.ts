export interface ScrapedUrlData {
  title?: string
  description?: string
  image?: string
  logo?: string | null
  scrapedAt?: string
  url?: string
}

const SCRAPER_URL = (import.meta.env.VITE_SCRAPER_URL as string | undefined)?.replace(/\/$/, '')

// URL Scraper API — the memex-scraper Cloudflare Worker (see scraper/).
// Stateless and auth-provider-agnostic; access is origin-allowlisted.
export const urlScraperApi = {
  scrape: async (url: string): Promise<ScrapedUrlData> => {
    if (!SCRAPER_URL) {
      return {}
    }

    const response = await fetch(
      `${SCRAPER_URL}/api/scrape?url=${encodeURIComponent(url)}`,
      { signal: AbortSignal.timeout(9000) },
    )
    const result = await response.json()
    if (!result.success) {
      throw new Error(result.error || 'Scraping failed')
    }
    return result.data
  },

  /** Best-effort scrape for capture time: never throws, empty on failure. */
  tryScrape: async (url: string): Promise<ScrapedUrlData> => {
    try {
      return await urlScraperApi.scrape(url)
    } catch {
      return {}
    }
  },
}
