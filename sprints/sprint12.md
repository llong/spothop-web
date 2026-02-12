# Sprint 12: Analytics & Insights

**Goal:** Implement comprehensive product analytics using PostHog to understand user behavior, engagement, and conversion flows.

## 1. Infrastructure & Core Setup (Completed)
- [x] **Install PostHog SDK**: Add `posthog-js` dependency.
- [x] **Environment Configuration**: Set up API Key and Host in `.env.local`.
- [x] **Initialization**: Create `src/lib/posthog.ts` singleton.
- [x] **React Provider**: Wrap app in `PostHogProvider` in `src/main.tsx`.
- [x] **Route Tracking**: Implement manual page view capturing in `src/routes/__root.tsx` for TanStack Router.
- [x] **User Identification**: Link PostHog sessions to Supabase Auth users (identify/reset) in `src/routes/__root.tsx`.

## 2. Feature Event Tracking (Completed)
We need to track high-value user actions to measure engagement and feature adoption.

### A. Spot Management
- [x] **Spot Creation**: Track when a user successfully creates a spot.
  - Event: `spot_created`
  - Props: `category`, `has_media`, `has_description`
- [x] **Spot Interaction**: Track viewing and navigation.
  - Event: `spot_viewed` (on details page load)
  - Event: `spot_navigated_to` (on "Get Directions" click)

### B. Social Engagement
- [x] **Likes**: Track when users like media.
  - Event: `media_liked`
- [x] **Comments**: Track when users comment.
  - Event: `comment_added`
- [x] **Follows**: Track user follows.
  - Event: `user_followed`

### C. Search & Discovery
- [x] **Search**: Track what users are looking for.
  - Event: `search_performed`
  - Props: `query`, `result_count`
- [x] **Feed**: Track feed interactions (filter changes).
  - Event: `feed_filter_changed`

## 3. Data Quality & Privacy
- [x] **PII Check**: Ensure no sensitive data (passwords, emails in wrong fields) is sent.
- [x] **Testing**: Verify events in PostHog "Live Events" view (Confirmed via console logs).

## 4. Dashboards (Post-Implementation)
- [ ] Create "Key Metrics" Dashboard in PostHog (DAU, Spots Created, Retention).
- [ ] Create "Spot Funnel" (View -> Navigate).
