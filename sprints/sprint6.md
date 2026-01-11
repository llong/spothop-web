# Sprint 6: Code Audit and Refactoring (Atomic Design)

## Overview
This sprint focused on auditing the codebase for complexity and refactoring components to follow atomic design principles. Business logic was extracted into custom hooks to improve maintainability and testability.

## Goals
- Audit and refactor large components into smaller, single-responsibility units.
- Extract complex logic into reusable custom hooks.
- Fix stability issues related to Google Maps API loading.
- Align component structure with route-specific organization rules.

## Tasks
1. **Logic Extraction into Hooks**
    - [x] `useSpotAddress`: Extracted reverse geocoding and address formatting.
    - [x] `useGeolocation`: Centralized map location and center functionality.
    - [x] `useSpotFavorites`: Encapsulated favoriting logic.

2. **Route-Specific Atomic Components**
    - [x] Refactor `SpotInfo` molecule with nested atoms (`SpotAddress`, `SpotSocialActions`, `SpotStats`).
    - [x] Refactor `SpotSidebar` molecule with `SidebarActions` atom.
    - [x] Refactor `SpotMap` molecule with `MapSearchAreaButton` atom.

3. **Stability and Bug Fixes**
    - [x] Centralize Google Maps `useLoadScript` in `__root.tsx`.
    - [x] Implement global `isGoogleMapsLoadedAtom` for synchronization.
    - [x] Fix `NotLoadingAPIFromGoogleMapsError` in search components.
    - [x] Correct import paths and naming conflicts after restructuring.

4. **Route Cleanup**
    - [x] Simplify `src/routes/spots/$spotId.lazy.tsx`.
    - [x] Simplify `src/routes/index.lazy.tsx`.
