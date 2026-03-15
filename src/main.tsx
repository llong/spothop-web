import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createStore, Provider } from 'jotai'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import './index.css'
import { pwaUpdateAtom } from '@/atoms/pwa'
// Import the generated route tree
import { routeTree } from './routeTree.gen'
import { persistQueryClient } from '@tanstack/react-query-persist-client'
// @ts-ignore
import { registerSW } from 'virtual:pwa-register'
import { createAsyncStoragePersister } from '@tanstack/query-async-storage-persister'
import { get, set, del } from 'idb-keyval'
import { PostHogProvider } from 'posthog-js/react'
import { HelmetProvider } from 'react-helmet-async'
import { initPostHog, analytics } from './lib/posthog'

// PostHog initialized in renderApp

// Create a new router instance
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const customStore = createStore();

// Configure IndexedDB persister for TanStack Query
const persister = createAsyncStoragePersister({
  storage: {
    getItem: (key) => get(key),
    setItem: (key, value) => set(key, value),
    removeItem: (key) => del(key),
  },
})

persistQueryClient({
  queryClient,
  persister,
  maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
})

// Explicitly delete problematic caches on boot to ensure returning users don't break
if ('caches' in window) {
  caches.delete('google-maps-cache').then((wasDeleted) => {
    if (wasDeleted) console.log('Deleted legacy google-maps-cache');
  });
}

// Auto-update service worker and reload the page if a new one is found
if ('serviceWorker' in navigator) {
  const updateSW = registerSW({
    onNeedRefresh() {
      // Notify user when a new service worker is available
      console.log('New content available, notifying user...');
      customStore.set(pwaUpdateAtom, {
        needRefresh: true,
        updateFunction: async (reloadPage?: boolean) => {
          await updateSW(reloadPage);
        }
      });
    },
    onOfflineReady() {
      console.log('App ready to work offline');
    },
  });

  // Check for updates every 60 minutes
  setInterval(() => {
    console.log('Checking for PWA updates...');
    updateSW();
  }, 60 * 60 * 1000);
}

// For now, let's just use a more robust way to exclude it from production
const renderApp = async () => {
  // Initialize PostHog
  await initPostHog();

  let DevToolsComponent = null;

  if (import.meta.env.MODE !== 'production') {
    const { DevTools } = await import('jotai-devtools');
    await import('jotai-devtools/styles.css');
    DevToolsComponent = DevTools;
  }

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <Provider store={customStore} >
      <HelmetProvider>
        <PostHogProvider client={analytics}>
          <QueryClientProvider client={queryClient}>
            {DevToolsComponent && <DevToolsComponent store={customStore} />}
            {import.meta.env.MODE !== 'production' && (
              <ReactQueryDevtools
                initialIsOpen={false}
                buttonPosition="bottom-left"
              />
            )}
            <RouterProvider router={router} />
          </QueryClientProvider>
        </PostHogProvider>
      </HelmetProvider>
    </Provider>,
  )
};

renderApp();
