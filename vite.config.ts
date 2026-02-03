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
      workbox: {
        globPatterns: ["**/*.{js,css,html,ico,png,svg}"],
        cleanupOutdatedCaches: true,
        clientsClaim: true,
        skipWaiting: true,
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
    headers: {
      // Required for FFmpeg.wasm to use SharedArrayBuffer (multi-threading)
      // We are setting this to 'credentialless' temporarily to avoid CORP issues with Supabase images
      "Cross-Origin-Embedder-Policy": "credentialless",
      "Cross-Origin-Opener-Policy": "same-origin",
    },
  },
  optimizeDeps: {
    // Exclude FFmpeg.wasm related packages from Vite's dependency pre-bundling
    // This is crucial for FFmpeg.wasm to load its workers correctly without corruption.
    // See: https://github.com/ffmpegwasm/ffmpeg.wasm/issues/772
    exclude: ["@ffmpeg/ffmpeg", "@ffmpeg/util"],
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
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "json-summary"],
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__/**",
        "src/routeTree.gen.ts",
        "src/main.tsx",
        "src/supabase.ts",
      ],
    },
  },
});