# Sprint 11: Advanced Filtering & Personalization

## Overview
Once the core feed is established, this sprint adds layers of intelligence and customization to the discovery experience. We'll introduce filtering based on user preferences, social connections, and geographic distance.

## Goals
- Empower users to tailor their feed content.
- Increase relevance through social and location-based filters.
- Lay the groundwork for a personalized recommendation engine.

## Tasks

### 1. Backend Enhancements (Supabase)
- [x] Extend `get_global_feed_content` RPC with filtering parameters (`spot_type`, `difficulty`, `risk`, etc.).
- [x] Implement distance-based filtering using PostGIS (`ST_DWithin`).
- [x] Implement "Following" filter by joining with user follow data.
- [ ] Research and begin implementing simple recommendation logic (collaborative filtering).

### 2. Frontend Filtering UI
- [x] Develop a comprehensive Filter UI (Bottom Sheet/Dedicated Screen).
- [ ] Implement Search within the feed context.
- [x] Update `FeedScreen` to handle filter state and re-fetching.
- [x] Add "Follow/Unfollow" actions directly in feed items.

### 3. Personalization & Discovery
- [x] Implement Tab-based feed splitting (For You / Following).
- [x] Add "Near Me" feed toggle.
- [x] Implement Rider Type filtering (multiple selection).
- [ ] Develop personalized content suggestions based on user interaction history.

### 4. User Onboarding Improvements
- [ ] Refactor onboarding to allow manual username entry (unique, constrained).
- [ ] Add interactive tutorials for core features (create spot, add media, etc.).

### 5. Quality Assurance
- [x] Test complex filter combinations and edge cases.
- [x] Verify distance accuracy for location-based filters.
- [ ] Conduct UAT on personalization relevance.

## Outcome
A highly personalized discovery experience that keeps users engaged by showing them exactly what they care about most.
