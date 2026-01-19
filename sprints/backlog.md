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
