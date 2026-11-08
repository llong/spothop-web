/// <reference types="vitest" />
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import { tanstackRouter } from "@tanstack/router-plugin/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { VitePWA } from "vite-plugin-pwa";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tanstackRouter({
      target: "react",
      autoCodeSplitting: true,
    }),
    react(),
    VitePWA({
      registerType: "autoUpdate",
      injectRegister: 'auto',
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
        navigateFallbackAllowlist: [/^(?!\/__).*/], // Allow all routes except those starting with /__ (Firebase/Vercel internals)
        // Completely exclude Google Maps from Service Worker interception
        // Setting handler: 'NetworkOnly' still intercepts the request and breaks Google Maps strict loader checks.
        navigateFallbackDenylist: [/^\/api\//, /maps\.googleapis\.com/, /fonts\.googleapis\.com/],
        runtimeCaching: [
          {
            // Public storage objects (photos, thumbnails, avatars) from any Supabase project, so this never
            // goes stale if the project changes. Authenticated/API requests are not matched.
            urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.co\/storage\/v1\/object\/public\/.*/,
            handler: 'CacheFirst',
            options: {
              // v2: the old cache could hold opaque (status 0) responses that break CORS-mode <img crossorigin>
              // requests for the same URL; main.tsx deletes the old cache.
              cacheName: 'supabase-media-cache-v2',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 * 30, // 30 days
              },
              // Only cache real (non-opaque) responses. An opaque response cached from a no-cors <img>
              // is served for later CORS-mode requests of the same URL and fails, showing a broken image.
              cacheableResponse: {
                statuses: [200],
              },
            },
          },
        ],
      },
      manifest: {
        name: "SpotHop",
        short_name: "SpotHop",
        description: "Discover and share skate spots",
        theme_color: "#A3CDA5",
        background_color: "#ffffff",
        display: "standalone",
        icons: [
          {
            src: "spothopIcon.png",
            sizes: "192x192",
            type: "image/png",
          },
          {
            src: "spothopIcon.png",
            sizes: "512x512",
            type: "image/png",
          },
        ],
      },
    }),
  ],
  server: {
    port: 5000,
    host: true,
  },
  build: {
    assetsInlineLimit: 0, // Prevent inlining assets to keep CSS small
    rollupOptions: {
      output: {
        manualChunks: {
          "vendor-mui": [
            "@mui/material",
            "@mui/icons-material",
            "@emotion/react",
            "@emotion/styled",
          ],
          "vendor-tanstack": [
            "@tanstack/react-router",
            "@tanstack/react-query",
            "@tanstack/react-table",
          ],
          "vendor-supabase": [
            "@supabase/supabase-js",
            "@supabase/auth-ui-react",
            "@supabase/auth-ui-shared",
          ],
          "vendor-leaflet": [
            "leaflet",
            "react-leaflet",
            "leaflet.markercluster",
            "react-leaflet-cluster",
          ],
        },
      },
    },
  },
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: "./src/setupTests.ts",
    // Hermetic test env: tests must not depend on a developer's .env (CI has none).
    // Real network calls are always mocked; these only let `createClient` construct.
    env: {
      VITE_SUPABASE_URL: "http://localhost:54321",
      VITE_SUPABASE_ANON_KEY: "test-anon-key",
    },
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      // Ratchet: set just under current coverage (Nov 2026: 58.9 / 50.9 / 53.8 / 61.4) so it can only go up.
      // The target in .clinerules is 85%; raise these as tests are added.
      thresholds: {
        statements: 58,
        branches: 50,
        functions: 53,
        lines: 61,
      },
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__/**",
        "src/routeTree.gen.ts",
        "src/types/database.types.ts",
        "src/main.tsx",
        "src/supabase.ts",
      ],
    },
  },
});
