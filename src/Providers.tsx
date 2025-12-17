import { Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { persistQueryClient } from "@tanstack/query-persist-client-core";
import { createSyncStoragePersister } from "@tanstack/query-sync-storage-persister";
import { SessionProvider } from "./context/SessionContext";

// For now, we'll use Chakra UI with default theme and rely on Tailwind for custom styling

// Create a persister using localStorage
const persister = createSyncStoragePersister({
  storage: window.localStorage,
  key: 'EX_P02_REACT_QUERY_OFFLINE_CACHE',
});

// Create a client instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      gcTime: 10 * 60 * 1000, // 10 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
    },
  },
});

// Persist the query client cache
// Type assertion needed due to version mismatch between @tanstack/react-query and persist packages
persistQueryClient({
  queryClient: queryClient as any,
  persister,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
  buster: '', // Change this to invalidate cache when needed
  dehydrateOptions: {
    shouldDehydrateQuery: (query) => {
      // Persist links, projects, tags, and scraped URL data
      const queryKey = query.queryKey;
      if (Array.isArray(queryKey)) {
        const firstKey = queryKey[0];
        return (
          firstKey === 'links' ||
          firstKey === 'projects' ||
          firstKey === 'tags' ||
          firstKey === 'scraper'
        );
      }
      return false;
    },
  },
});

const Providers = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider>
        <Outlet />
      </SessionProvider>
    </QueryClientProvider>
  );
};

export default Providers;
