# Sprint 10: Minimum Viable Feed (MVF)

## Overview
This sprint focuses on delivering a TikTok/Instagram-like global feed as the primary entry point for the app. This addresses the "cold start" problem where new areas lack local content, providing immediate value to users.

## Goals
- Pivot the default landing page to a global content feed.
- Implement infinite scroll with virtualization for performance.
- Enable core social interactions directly within the feed.
- Optimize media delivery for the feed format.

## Tasks

### 1. Database & Backend (Supabase)
- [x] Create `media_likes` table with RLS.
- [x] Create `media_comments` table with RLS.
- [x] Implement `get_global_feed_content` RPC with automated ranking (views, likes, comments, recency).
- [x] Implement `like_media` (as `handle_media_like`) RPC with basic abuse prevention.
- [ ] Implement `post_comment` RPC with basic abuse prevention.
- [x] Optimize database indexes for feed queries.

### 2. Frontend Infrastructure
- [x] Create `/feed` route and set as default app entry point.
- [x] Implement `FeedScreen` with infinite scroll and virtualization (PWA/Web optimized).
- [ ] Integrate Jotai and `localStorage` for feed state persistence.
- [x] Implement "Add Spot" banner on `/spots` page with "Don't show again" logic.

### 3. Components & UI
- [x] Develop `FeedItem` component using MUI and Material Design 3.
- [ ] Integrate `MediaCarousel` into `FeedItem`.
- [x] Implement "Favorite Spot" action in feed.
- [x] Implement "Like Media" action in feed (optimistic UI).
- [x] Implement "Comment" modal/overlay for feed items.
- [x] Add navigation to uploader profile and associated spot details.
- [ ] Implement skeleton loaders for feed items.
- [x] Implement offline message banner (no feed caching).

### 4. User Flow & Onboarding
- [ ] Update signup flow to redirect to `/feed` after username creation.
- [x] Implement empty feed fallback with spot creation tutorial and redirection to `/spots`.

### 5. Quality Assurance
- [ ] Conduct performance testing on various devices and network conditions.
- [ ] Implement unit and integration tests for feed features (Target: 80% coverage).
- [ ] Conduct UAT with closed beta group.

## Outcome
A functional, engaging global feed that increases immediate user value and provides a clear path to spot discovery and contribution.
