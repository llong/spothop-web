# Sprint 2: Social & Discovery Enhancements

## Overview
Focus on improving spot discovery through filtering and enhancing social interaction by allowing users to follow each other.

## Goals
*   Implement advanced search filters for spots.
*   Contextualize search input visibility.
*   Enable social following features.

## Planned Tasks

### 1. Search Filters
*   **Requirements:** Filter spots by:
    *   Type (Rail, Ledge, etc.)
    *   Difficulty (Beginner, Intermediate, Advanced)
    *   Lighting (Lit/Unlit)
    *   Kickout Risk
*   **Implementation:**
    *   Create `FilterBar` component.
    *   Update spot list/map to respect filters.

### 2. Contextual Search Input
*   **Requirements:** The search input in the app bar should *only* be visible on the Spots page (home).
*   **Implementation:**
    *   Modify `SearchAppBar` or layout wrapper to check current route.

### 3. User Following
*   **Requirements:** Users can follow other users.
*   **Implementation:**
    *   Create `user_followers` table (migration).
    *   Update Profile UI to show "Follow/Unfollow" button.
    *   Implement backend logic/RLS.

## Success Criteria
*   Users can filter the spot map/list.
*   Search bar disappears on non-spot pages.
*   Users can successfully follow/unfollow others.
