# Project Backlog

## Offline Capabilities & PWA Enhancements (Deferred)

### 1. Offline "Draft" Spot Creation
*   **Concept:** Allow users to complete the "New Spot" form and attach media while offline.
*   **Implementation:**
    *   Integrate `idb` (IndexedDB wrapper) to store form data and media blobs locally.
    *   Create a background sync mechanism (or a manual "Sync" button/prompt) to detect when connectivity is restored and upload queued spots to Supabase.
    *   Update `src/routes/spots/new.tsx` and `useMediaUpload` hook to handle the offline/queued state.

### 2. PWA Foundation & Caching
*   **Concept:** Ensure the app loads and functions without a network connection.
*   **Implementation:**
    *   Configure `vite-plugin-pwa` to generate a Service Worker.
    *   Implement a "Network-first, falling back to cache" strategy for API requests where appropriate (e.g., viewing a spot).
    *   Cache static assets (JS, CSS, icons) aggressively.

### 3. Cached Spot Details & Favorites
*   **Concept:** Automatically cache details of spots the user has recently viewed or favorited so they can be accessed later.
*   **Implementation:**
    *   Update the `useSpots` and `useProfile` hooks to cache fetched data in IndexedDB or via Service Worker runtime caching.
    *   Add a "Available Offline" indicator to the UI for cached spots.

### 4. Basic Offline Map Support
*   **Concept:** Allow users to navigate essentially even without live map tiles.
*   **Implementation:**
    *   Investigate and implement a caching strategy for Leaflet map tiles (e.g., caching tiles for the user's current city or a specific radius).
    *   *Constraint:* Be mindful of storage limits.

## Media Processing & Optimization (Deferred)

### 1. Client-side Video Processing (FFmpeg.wasm)
*   **Concept:** Enforce consistent quality and constraints for user-uploaded videos directly in the browser to reduce server load and storage costs.
*   **Requirements:**
    *   **Maximum Length:** 20 seconds.
    *   **Resolution:** 720p (1280x720).
    *   **Codec:** H.264 (AVC) in an MP4 container for maximum compatibility.
*   **Implementation Strategy:**
    *   Integrate `@ffmpeg/ffmpeg` and `@ffmpeg/util` (WebAssembly port of FFmpeg).
    *   **Trimming UI:** Build a custom `VideoTrimmer` component that allows users to select a 20-second segment from their original video using an interactive timeline with handles.
    *   **Transcoding:** Use a Web Worker to run FFmpeg commands to trim, scale (720p), and encode (H.264) the selected segment.
    *   **Preview:** Show a live preview of the trimmed version before confirming the upload.
*   **Technical Challenges:**
    *   **COOP/COEP Headers:** Requires specific server headers (`require-corp`, `same-origin`) to enable `SharedArrayBuffer` for multi-threaded FFmpeg.
    *   **Bundle Size:** FFmpeg.wasm is large (~30MB); should be lazy-loaded only when the user selects a video.
    *   **Performance:** Processing speed varies significantly based on the user's CPU; need to provide clear progress indicators.

## Database & Query Optimizations (Deferred)

### 1. Server-side Follower Stats (RPC)
*   **Concept:** Move follower/following count logic from TypeScript to a server-side PostgreSQL function (RPC) to handle large-scale growth.
