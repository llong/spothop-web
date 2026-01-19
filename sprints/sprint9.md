# Sprint 9: Database & Query Optimizations

## Overview
Optimize database performance and scalability by moving computationally intensive logic or high-frequency query patterns from the application layer to the database layer using PostgreSQL functions (RPCs).

## Goals
- Improve performance of follower/following count calculations.
- Reduce bandwidth and client-side processing for social stats.
- Lay the foundation for large-scale social features.

## Tasks

### 1. Follower Stats Optimization
- [ ] 9.1.1 Create a PostgreSQL function `get_user_follow_stats(p_user_id uuid)` that returns follower and following counts in a single efficient query.
- [ ] 9.1.2 Add indexes to `user_followers` on `follower_id` and `following_id` if they don't already exist.
- [ ] 9.1.3 Update `profileService.ts` to use the new `get_user_follow_stats` RPC instead of manual filtering.
- [ ] 9.1.4 Verify performance improvements for users with many followers.

### 2. General Query Optimizations
- [ ] 9.2.1 Review frequently used queries for potential RPC conversion.
- [ ] 9.2.2 Implement batch fetching for profile data in social lists (followers/following lists).

## Success Criteria
- [ ] Follower/following counts are retrieved via a single RPC call.
- [ ] Reduced number of rows transferred from Supabase for social stats.
- [ ] Profile pages load faster for high-activity users.
