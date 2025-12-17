import { useQuery, useQueryClient } from '@tanstack/react-query'
import supabase from '../supabase'

export interface ScrapedUrlData {
  title?: string
  description?: string
  image?: string
  logo?: string | null
  scrapedAt?: string
  url?: string
}

// Check if we're in local development mode
export const isLocalDev = () => {
  // Check Vite dev mode or localhost hostname
  return (
    import.meta.env.DEV ||
    window.location.hostname === 'localhost' ||
    window.location.hostname === '127.0.0.1'
  )
}

// Query keys
export const scraperKeys = {
  all: ['scraper'] as const,
  url: (url: string) => [...scraperKeys.all, url] as const,
}

// URL Scraper API function
export const urlScraperApi = {
  scrape: async (url: string): Promise<ScrapedUrlData> => {
    // Disable scraper when not in local dev mode
    if (!isLocalDev()) {
      // Return empty data to prevent errors, but don't scrape
      return {}
    }

    // Get the current session token
    const { data: { session } } = await supabase.auth.getSession()

    if (!session) {
      throw new Error('User not authenticated')
    }

    const response = await fetch('http://localhost:3001/api/scrape', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ url })
    })

    const result = await response.json()

    if (!result.success) {
      throw new Error(result.error || 'Scraping failed')
    }

    return result.data
  },
}

// Custom hook for scraping a URL (with persisted cache that refetches on mount)
export const useScrapeUrl = (url: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: scraperKeys.url(url),
    queryFn: () => urlScraperApi.scrape(url),
    enabled: enabled && !!url,
    staleTime: 0, // Always consider stale to refetch on mount
    gcTime: Infinity, // Cache indefinitely (persisted)
    refetchOnMount: true, // Always refetch on mount to get fresh data
  })
}

// Mutation-like hook that uses query cache
export const useUrlScraper = () => {
  const queryClient = useQueryClient()

  return {
    mutateAsync: async (url: string) => {
      const queryKey = scraperKeys.url(url)

      // Check cache first
      const cachedData = queryClient.getQueryData<ScrapedUrlData>(queryKey)
      if (cachedData) {
        return cachedData
      }

      // Fetch and cache with persisted cache that refetches on mount
      const data = await urlScraperApi.scrape(url)
      queryClient.setQueryData(queryKey, data)

      // Set query defaults to allow refetching on mount while keeping cache persisted
      queryClient.setQueryDefaults(queryKey, {
        staleTime: 0, // Always consider stale to refetch on mount
        gcTime: Infinity, // Cache indefinitely (persisted)
        refetchOnMount: true, // Always refetch on mount to get fresh data
      })

      return data
    },
  }
}

// Helper function to get cached scraped data
export const getCachedScrapedData = (
  queryClient: ReturnType<typeof useQueryClient>,
  url: string
): ScrapedUrlData | undefined => {
  return queryClient.getQueryData<ScrapedUrlData>(scraperKeys.url(url))
}

