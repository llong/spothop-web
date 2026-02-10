# Project Backlog

## Media Processing & Optimization (Deferred)

### 1. Client-side Video Processing (FFmpeg.wasm) [DONE]
*   **Status:** Successfully implemented in `src/utils/videoProcessing.ts`.
*   **Implementation:**
    *   [x] Integrated `@ffmpeg/ffmpeg` and `@ffmpeg/util`.
    *   [x] Implemented `trimVideo` function with 720p scaling and H.264 encoding.
    *   [x] Added pre-flight capability checks for `SharedArrayBuffer`.

## Database & Query Optimizations (Deferred)

### 1. Server-side Follower Stats (RPC) [DONE]
*   **Status:** Successfully implemented via Supabase Migrations.
*   **Implementation:**
    *   [x] Created `get_user_follow_stats` RPC to handle counts on the server side.

## Global Feed & Engagement (Deferred)

### 1. Analytics for Feed-to-Map Transition [DEFERRED]
*   **Concept:** Track user journeys from the feed to the map and spot details.
*   **Metrics:** Scroll depth, time spent, likes per session, comments per session, click-through rate to map/details.

### 2. Error Handling (Frontend - Detailed) [PARTIAL]
*   **Status:** Basic error handling implemented in `FeedContent.tsx` and `MediaCarousel.tsx`.
*   **Remaining:** Fine-grained "broken link" overlays for individual items during scroll.

### 3. Improved User Onboarding [DONE]
*   **Status:** Successfully implemented in `src/routes/welcome/index.tsx`.
*   **Implementation:**
    *   [x] **Unique Username:** Users must now choose a unique username with specific character constraints (alphanumeric, dashes, underscores) and real-time database validation.
    *   [x] **Feature Tutorial:** Added a structured walkthrough of app features (Discover Spots, Share Media, Join the Feed) during the second step of onboarding.
    *   [x] **Validation:** Enhanced reserved keyword checking and display name formatting.

### 4. Feed Metrics & Optimizations [DEFERRED]
*   **Concept:** Further deep dive into performance metrics and ongoing optimizations for the feed based on user data.

### 5. Ad Placement Optimization
*   **Concept:** Research and optimize ad placements and formats for maximum effectiveness and minimal intrusion.

### 6. Monetization Analytics
*   **Concept:** Track specific data points to optimize ad performance and inform future premium feature development.

### 7. Brand Partnerships
*   **Concept:** Plan and execute brand partnerships once a user base of 500 active users is reached.

### 8. Automated Test Data Generation
*   **Concept:** Develop a test function and integrate it into the admin dashboard for generating diverse test data (spots, media, likes, comments) for the feed.

### 9. Personalized Content Recommendations
*   **Concept:** Develop personalized content suggestions based on user interaction history.
*   **Requirements:** Analyze likes, comments, and views to recommend relevant spots and users.
