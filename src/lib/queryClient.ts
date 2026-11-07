import { QueryClient } from '@tanstack/react-query';
import { del } from 'idb-keyval';

/** IndexedDB key the query cache persister writes to (the library default, made explicit). */
export const PERSIST_KEY = 'REACT_QUERY_OFFLINE_CACHE';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

/**
 * Drops all cached query data, in memory and in the persisted IndexedDB copy.
 * Call on sign-out so the next person using this browser cannot see the previous user's messages,
 * profile, likes, etc.
 */
export async function clearQueryCache(): Promise<void> {
  queryClient.clear();
  try {
    await del(PERSIST_KEY);
  } catch (error) {
    console.warn('Could not clear the persisted query cache:', error);
  }
}
