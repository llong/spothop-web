# Sprint 18: Theme and Navigation Updates

This sprint focuses on implementing a global dark mode toggle, creating refined color palettes for light and dark modes, and updating the application navigation to improve content discovery (like Contests) and user experience across mobile and desktop.

## Tasks

1.  **[Feature] Theme Mode State** #task1
    -   Add `themeModeAtom` to `src/atoms/ui.ts` to persist user's preference using `atomWithStorage`.
2.  **[Feature] Dynamic Theme Configuration** #task2
    -   Refactor `src/theme.ts` to provide a dynamic `getAppTheme` function based on mode.
    -   Implement the new Light and Dark Mode color palettes using Baltic Blue, Teal, Verdigris, Mint Leaf, and Cream.
3.  **[Feature] Mobile Drawer Component** #task3
    -   Create `src/routes/-components/MobileDrawer.tsx`.
    -   Add Theme Toggle, Notifications, and Sign In/Sign Out buttons.
4.  **[Refactor] App Bar & Bottom Navigation** #task4
    -   Update `SearchAppBar.tsx` to include a Menu icon for the Mobile Drawer.
    -   Update `BottomNav.tsx` to prominently feature the `Contests` tab and remove out-of-place items.
5.  **[Refactor] Desktop Sidebar** #task5
    -   Update `Sidebar.tsx` to include the Theme Toggle at the bottom of the navigation menu.
6.  **[Fix] Build Errors** #task6
    -   Fix unused imports and type mismatches in test files.

## Quality Gate
- Theme correctly persists across full page reloads.
- Responsive breakpoints correctly transition navigation layouts (drawer on mobile, sidebar on desktop).
- >85% code coverage for new/modified components.
