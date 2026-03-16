# Sprint 19: Feed Optimization & Virtualization

This sprint focuses on improving the performance and efficiency of the global feed by implementing virtualization, reducing memory footprint through component lifting, and optimizing re-render logic in the feed items.

## Tasks

1.  **[Performance] Feed Virtualization** #task1
    -   Replace standard mapping with `react-virtuoso` in `FeedContent.tsx`.
    -   Implement `endReached` logic for infinite scrolling.
2.  **[Performance] Component Lifting & Memory Optimization** #task2
    -   Lift `FeedCommentDialog` from `FeedItemCard` to `FeedContent` to reduce total component count.
    -   Use centralized state for managing the active comment dialog.
3.  **[Performance] Helper Function Stability** #task3
    -   Move or memoize helper functions in `FeedItemCard` to prevent recreation on every render.
4.  **[Refactor] State Sync Optimization** #task4
    -   Refactor `useSpotFavorites` to remove `useEffect` sync loops and use more direct state initialization.
5.  **[Performance] List Stability** #task5
    -   Memoize the result of `allItems.flat()` in `useGlobalFeed` or `FeedContent`.
6.  **[Fix] Feed Location State** #task6
    -   Enrich feed items with missing state/province information using Google Reverse Geocoding.

## Quality Gate
- Virtualized list handles dynamic heights without jumping or blank spaces.
- Memory usage remains constant regardless of scroll depth.
- Re-renders for `FeedItemCard` are minimized (verified via Profiler).
- >85% code coverage for optimized components and hooks.
