# Sprint 7: Content Moderation & Platform Safety

## Overview
Establish administrative controls and a moderation dashboard to manage platform content and user behavior securely.

## Goals
- Add admin roles and user ban capabilities.
- Implement a centralized moderation dashboard.
- Enable deletion of spots, comments, and media by authorized staff.
- Secure moderation actions using Supabase RLS.

## Tasks
1. **[feat] Database Schema & Security**
    - [x] Create migration to add `role` and `is_banned` to `profiles`.
    - [x] Update RLS policies for global admin access.
    - [x] Add check constraints to prevent banned users from posting.
2. **[feat] Admin Service**
    - [x] Implement `adminService.ts` for backend operations.
    - [x] Add `useAdminQueries` hook for dashboard data fetching.
3. **[feat] Admin Dashboard Route & Layout**
    - [x] Create `/admin` protected route.
    - [x] Implement Dashboard layout with MUI Tabs.
4. **[feat] Reports Management UI**
    - [x] Create `ReportsList` component for the moderation queue.
    - [x] Implement report resolution actions (delete vs dismiss).
5. **[feat] User Management UI**
    - [x] Create `UserModeration` component.
    - [x] Add user search and ban/unban toggles.
6. **[fix] Navigation Integration**
    - [x] Add "Admin Dashboard" link to sidebar/app bar for admins.
7. **[chore] Cleanup & Testing**
    - [x] Write tests for admin services and hooks.
    - [x] Manual verification of content deletion flows.
