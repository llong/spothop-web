# Project Backlog

## Global Feed & Engagement (Deferred)

### 1. Analytics for Feed-to-Map Transition [DEFERRED]
*   **Concept:** Track user journeys from the feed to the map and spot details.
*   **Metrics:** Scroll depth, time spent, likes per session, comments per session, click-through rate to map/details.

### 2. Error Handling (Frontend - Detailed) [PARTIAL]
*   **Status:** Basic error handling implemented in `FeedContent.tsx` and `MediaCarousel.tsx`.
*   **Remaining:** Fine-grained "broken link" overlays for individual items during scroll.

### 4. Feed Metrics & Optimizations [DEFERRED]
*   **Concept:** Further deep dive into performance metrics and ongoing optimizations for the feed based on user data.

### 5. Ad Placement Optimization
*   **Concept:** Research and optimize ad placements and formats for maximum effectiveness and minimal intrusion.

### 6. Monetization Analytics
*   **Concept:** Track specific data points to optimize ad performance and inform future premium feature development.

### 7. Brand Partnerships
*   **Concept:** Plan and execute brand partnerships once a user base of 500 active users is reached.

### 8. Automated Test data Generation
*   **Concept:** Develop a test function and integrate it into the admin dashboard for generating diverse test data (spots, media, likes, comments) for the feed.

### 9. Personalized Content Recommendations
*   **Concept:** Develop personalized content suggestions based on user interaction history.
*   **Requirements:** Analyze likes, comments, and views to recommend relevant spots and users.

## Chat Rich Media & Sharing

### 10. Internal Content Sharing
*   **Concept:** Allow users to share specific Spots and Contests directly into a chat.
*   **Steps:**
    1.  Add "Share to Chat" button to `SpotDetails` and `ContestDetailPage`.
    2.  Implement a conversation selector modal.
    3.  Define a rich message protocol (e.g., specific JSON structure or ID markers).
    4.  Create a `RichMessageCard` component to render shared spots/contests inside chat bubbles.

### 11. Image Attachments & Clipboard Support
*   **Concept:** Enable users to send photos from their devices or by pasting directly from the clipboard.
*   **Steps:**
    1.  Create `chat-media` Supabase storage bucket with appropriate RLS.
    2.  Add attachment button (paperclip) to chat input UI.
    3.  Implement `onPaste` handler in the chat input field to catch image data.
    4.  Create an image preview component for the "draft" message.
    5.  Integrate upload logic and show progress indicators.

### 12. External Link Previews
*   **Concept:** Show rich previews for external URLs (YouTube, Instagram, etc.).
*   **Steps:**
    1.  Create a Supabase Edge Function to scrape Open Graph metadata from URLs.
    2.  Update chat message rendering to detect URLs and fetch metadata from the Edge Function.
    3.  Display a link preview card below the message text.
