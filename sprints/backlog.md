# Project Backlog

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

## Global Feed & Engagement (Deferred)

### 1. Analytics for Feed-to-Map Transition
*   **Concept:** Track user journeys from the feed to the map and spot details.
*   **Metrics:** Scroll depth, time spent, likes per session, comments per session, click-through rate to map/details.

### 2. Error Handling (Frontend - Detailed)
*   **Concept:** Robust, user-friendly error handling for individual media items in the feed.
*   **Requirements:** Graceful fallback for broken links or failed video loads without breaking the entire scroll experience.

### 3. Improved User Onboarding
*   **Concept:** Choose a unique username (disallowing spaces/special characters other than dashes/underscores) and present comprehensive tutorials on app features.

### 4. Feed Metrics & Optimizations
*   **Concept:** Further deep dive into performance metrics and ongoing optimizations for the feed based on user data.

### 5. Ad Placement Optimization
*   **Concept:** Research and optimize ad placements and formats for maximum effectiveness and minimal intrusion.

### 6. Monetization Analytics
*   **Concept:** Track specific data points to optimize ad performance and inform future premium feature development.

### 7. Brand Partnerships
*   **Concept:** Plan and execute brand partnerships once a user base of 500 active users is reached.

### 8. Automated Test Data Generation
*   **Concept:** Develop a test function and integrate it into the admin dashboard for generating diverse test data (spots, media, likes, comments) for the feed.
