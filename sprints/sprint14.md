# Sprint 14: Contests & Community Incentives

## Overview
This sprint focuses on the implementation of a robust contest management and entry system. This feature is designed to incentivize the community to contribute high-quality spots and media through gamified challenges with tangible prizes.

## Goals
- Empower admins to create and manage time-bound contests with specific criteria.
- Implement a frictionless submission flow for users to enter contests using their created spots.
- Build a flexible voting system that supports both judged and public models.
- Ensure automated criteria validation (date ranges, media types, rider/spot types).

## Tasks

### 1. Database & Infrastructure (Supabase)
- [x] Create `contests` table (rules, timeframe, criteria JSONB, flyer_url, prize_info).
- [x] Create `contest_entries` table with status tracking and foreign keys to spots/media.
- [x] Create `contest_votes` table with constraints for fair voting (unique user/entry).
- [x] Implement database functions (RPCs) for criteria validation during submission.
- [x] Configure RLS policies to restrict contest management to admin roles.

### 2. Admin Features
- [x] Develop `adminContestService.ts` for CRUD operations on contests.
- [x] Build the Contest Management dashboard at `/admin/contests`.
- [x] Implement a rich-text or structured form for defining contest rules and criteria.
- [x] Add entry moderation via removal button/disqualification.
- [x] Implement flyer image upload functionality for contests (admin side).
- [x] Implement judge selection functionality for contests (admin side).

### 3. Public Contest Discovery
- [x] Create public `/contests` route listing active, upcoming, and past events.
- [x] Develop `ContestCard` and `ContestDetail` components showing flyer, rules, and prizes.
- [x] Implement `contestService.ts` for fetching public contest data and entries.
- [ ] Refactor contest details layout to be similar to feed card layout, spanning full width, professional, and color neutral. Include flyer image with graceful fallback.

### 4. Submission & Voting Flow
- [x] Build the `ContestSubmissionModal` that automatically filters the user's spots based on contest eligibility.
- [x] Implement the submission logic that links a spot and its required media to the contest.
- [x] Develop a gallery view for contest entries with voting interactions.
- [x] Enforce voting restrictions (one vote per user, optional rider-type restriction).
- [x] Investigate and fix failing submissions in `ContestSubmissionModal.tsx` and `contestService.ts`.
- [x] Ensure all Spot interface properties are available for contest restrictions, including geographic radius/specific spot.
- [x] Improve eligible spots list items in `ContestSubmissionModal.tsx` by displaying thumbnails and better details.
- [x] Enhance media selection and preview in `ContestSubmissionModal.tsx`.
- [x] On the "Ready to Submit" screen, display a large thumbnail of the spot's selected media.
- [x] Update "Confirm Submission" button to use the theme's primary color.
- [x] Implement "One Vote Per User Per Contest" enforcement.
- [x] Display total entry count on contest cards and detail pages.
- [x] Implement "Remove Entry" functionality for users to retract submissions.

### 5. Quality Assurance
- [ ] Unit tests for contest criteria validation logic.
- [ ] Integration tests for the entry submission and voting flow.
- [ ] Performance testing for the voting gallery with high entry counts.
- [ ] Validation of role-based access for contest creation.
- [ ] Address Posthog retries on Brave browser to respect tracker blocking.

## Success Metrics
- Admins can create a contest in < 2 minutes via the dashboard.
- Users see only eligible spots when attempting to submit an entry.
- 100% accurate enforcement of contest timeframe and media requirements.
- Zero duplicate votes allowed per user per contest (automated vote switching).

## Outcome
A scalable platform for community contests that drives spot creation and high-quality media uploads, rewarding active and creative users.