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
- [ ] Create `media_likes` table with RLS.
- [ ] Create `media_comments` table with RLS.
- [ ] Implement `get_global_feed_content` RPC with automated ranking (views, likes, comments, recency).
- [ ] Implement `like_media` and `post_comment` RPCs with basic abuse prevention.
- [ ] Optimize database indexes for feed queries.

### 2. Frontend Infrastructure
- [ ] Create `/feed` route and set as default app entry point.
- [ ] Implement `FeedScreen` with infinite scroll and virtualization (PWA/Web optimized).
- [ ] Integrate Jotai and `localStorage` for feed state persistence.
- [ ] Implement "Add Spot" banner on `/spots` page with "Don't show again" logic.

### 3. Components & UI
- [ ] Develop `FeedItem` component using MUI and Material Design 3.
- [ ] Integrate `MediaCarousel` into `FeedItem`.
- [ ] Implement "Favorite Spot" action in feed.
- [ ] Implement "Like Media" action in feed (optimistic UI).
- [ ] Implement "Comment" modal/overlay for feed items.
- [ ] Add navigation to uploader profile and associated spot details.
- [ ] Implement skeleton loaders for feed items.
- [ ] Implement offline message banner (no feed caching).

### 4. User Flow & Onboarding
- [ ] Update signup flow to redirect to `/feed` after username creation.
- [ ] Implement empty feed fallback with spot creation tutorial and redirection to `/spots`.

### 5. Quality Assurance
- [ ] Conduct performance testing on various devices and network conditions.
- [ ] Implement unit and integration tests for feed features (Target: 80% coverage).
- [ ] Conduct UAT with closed beta group.

## Outcome
A functional, engaging global feed that increases immediate user value and provides a clear path to spot discovery and contribution.
