# Sprint 5: Testing & Bug Reporting

## Overview
This sprint focuses on establishing a robust testing framework for SpotHop, covering unit tests for core utilities and integration tests for primary user flows. We also defined manual test cases to ensure visual and interactive quality.

## Goals
- Establish a reusable mocking strategy for Supabase.
- Implement automated tests for business-critical logic.
- Document manual test cases for PWA and UX validation.

## Tasks

### 1. Test Infrastructure
- [x] **Feature Map**
    - [x] Create `DOCS/FEATURES_AND_FLOWS.md` to document core features and primary user paths.
- [x] **Manual Test Planning**
    - [x] Create `TESTING/MANUAL_TEST_CASES.md` with detailed steps for MT-001 through MT-013.
- [x] **Mocking Strategy**
    - [x] Create centralized `src/__mocks__/supabase.ts` for consistent testing.
- [x] **Global Configuration**
    - [x] Update `src/setupTests.ts` with necessary global mocks (e.g., `matchMedia`).

### 2. Automated Testing
- [x] **Unit Testing (Logic)**
    - [x] Implement `src/utils/imageOptimization.test.ts` with 100% coverage for URL generation and fallbacks.
- [x] **Integration Testing (Components)**
    - [x] Implement `src/routes/-components/SpotsListCard.test.tsx` to verify correct rendering of spot data and images.
- [x] **Bug Fixes (Regressions)**
    - [x] Fixed `FlagSpotDialog` tests (QueryClient requirement).
    - [x] Fixed `useFlagging` hook tests (Property mismatch).
    - [x] Fixed `imageOptimization` logic and tests (Null handling).

## Success Metrics
- 100% pass rate for new automated tests.
- Reusable `supabase` mock interface established.
- Comprehensive manual test registry available for pre-launch validation.
