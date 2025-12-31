# Sprint 4: Performance, PWA & UX Excellence

## Overview
This sprint focuses on the final "hardening" of the application to move from feature-complete to a production-ready MVP. Key priorities are mobile-native performance, offline accessibility, and design consistency.

## Goals
- Resolve all Supabase health and performance warnings.
- Achieve offline accessibility for critical user data (Favorites & Chat).
- Eliminate map sluggishness and improve perceived loading speeds.
- Provide a polished "native app" feel on mobile-web.

## Tasks

### 1. Database Performance & Security Pass
- [x] **RLS Optimization**
    - [x] Wrap `auth.uid()` calls in optimized subqueries `(select auth.uid())`.
- [x] **Policy Consolidation**
    - [x] Merge multiple permissive policies for comments and likes.
- [x] **Indexing**
    - [x] Add covering indexes for all unindexed foreign keys.
    - [x] Remove duplicate username indexes.
- [x] **Security Hardening**
    - [x] Set explicit `search_path` on all security definer functions.

### 2. PWA & Offline Capabilities
- [x] **PWA Foundation**
    - [x] Install and configure `vite-plugin-pwa`.
    - [x] Set up auto-update and asset caching.
- [x] **Targeted Offline Caching**
    - [x] Implement IndexedDB persistence for TanStack Query (via `idb-keyval`).
    - [x] Ensure Favorite Spots load instantly from local cache.
    - [x] Ensure Chat History is accessible offline.
- [x] **Connectivity UI**
    - [x] Add "Offline" indicator to the AppBar.
- [x] **External Navigation Bridge**
    - [x] Add "Get Directions" button using standard geo-linking.

### 3. UI/UX Polish
- [x] **Map Responsiveness**
    - [x] Implement Leaflet marker clustering for high-density areas.
- [x] **Modern Loading States**
    - [x] Replace spinners with MUI Skeleton components.
    - [x] Integrate skeletons in Home list and Spot details.
- [x] **Native Feel**
    - [x] Add route transitions for smoother navigation.
    - [x] Polish spacing and typography consistency across the app.

## Success Metrics
- 0 performance warnings in Supabase.
- 60fps map interactions.
- Functional offline mode for Favorites and Messages.
- Lighthouse Performance score > 90.
