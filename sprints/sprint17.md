# Sprint 17: Architectural Refactoring

This sprint focuses on refactoring long components and services (>250 lines) to improve maintainability, testability, and adherence to atomic design principles and project coding standards.

## Tasks

1.  **[Refactor] admin/contests.tsx** #task1
    -   Split UI into sub-components.
    -   Extract logic into hooks.
2.  **[Refactor] admin/index.lazy.tsx** #task2
    -   Split UI into sub-components.
    -   Extract logic into hooks.
3.  **[Refactor] ContestSubmissionModal.tsx** #task3
    -   Split UI into sub-components.
    -   Extract logic into hooks.
4.  **[Refactor] contests/$contestId.tsx** #task4
    -   Split UI into sub-components.
    -   Extract logic into hooks.
5.  **[Refactor] feed/index.lazy.tsx** #task5
    -   Split UI into sub-components.
    -   Extract logic into hooks.
6.  **[Refactor] profile/-components/UserContentGallery.tsx** #task6
    -   Split UI into sub-components.
    -   Extract logic into hooks.
7.  **[Refactor] spots/-components/ProParts/VideoLinkItem.tsx** #task7
    -   Split UI into sub-components.
    -   Extract logic into hooks.
8.  **[Refactor] spots/-components/VideoUpload.tsx** #task8
    -   Split UI into sub-components.
    -   Extract logic into hooks.
9.  **[Refactor] spots/$spotId.tsx** #task9
    -   Split UI into sub-components.
    -   Extract logic into hooks.
10. **[Refactor] spots/new.tsx** #task10
    -   Split UI into sub-components.
    -   Extract logic into hooks.
11. **[Refactor] welcome/index.tsx** #task11
    -   Split UI into sub-components.
    -   Extract logic into hooks.
12. **[Refactor] chatService.ts** #task12
    -   Modularize large service logic.
13. **[Refactor] profileService.ts** #task13
    -   Modularize large service logic.
14. **[Refactor] spotService.ts** #task14
    -   Modularize large service logic.

## Quality Gate
- No component exceeds 200 lines.
- Logic resides in hooks.
- MUI Grid v6+ syntax (size prop).
- No unused imports.
- >85% code coverage for new/modified code.