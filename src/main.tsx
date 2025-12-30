import ReactDOM from 'react-dom/client'
import { RouterProvider, createRouter } from '@tanstack/react-router'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { createStore, Provider } from 'jotai'
import '@fontsource/roboto/300.css';
import '@fontsource/roboto/400.css';
import '@fontsource/roboto/500.css';
import '@fontsource/roboto/700.css';
import 'leaflet/dist/leaflet.css'
import './index.css'
import { DevTools } from 'jotai-devtools';
import 'jotai-devtools/styles.css';
import { Icon } from 'leaflet';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-ignore
delete Icon.Default.prototype._getIconUrl;

Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});


// Import the generated route tree
import { routeTree } from './routeTree.gen'

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



ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider store={customStore} >
    <QueryClientProvider client={queryClient}>
      {import.meta.env.MODE !== 'production' ? (
        <>
          <DevTools store={customStore} />
          <ReactQueryDevtools initialIsOpen={false} />
        </>
      ) : null}
      <RouterProvider router={router} />
    </QueryClientProvider>
  </Provider>,
)
