# Sprint 3: MVP Social & Community Features

## Overview
This sprint focuses on completing the social and community interaction features required for the MVP release. This includes enhancing user profiles, implementing community engagement tools (likes, comments, following), and adding real-time communication.

## Goals
- Enhance user social proof with follower and favorite statistics.
- Enable community moderation via spot flagging.
- Improve content engagement with media likes and spot comments.
- Bridge user communication with a real-time chat system.

## Prioritized Tasks

### 1. Social Stats (Low Complexity)
- [x] **Follower/Following Counts**
    - [x] Update `useProfile` hook to fetch aggregation counts from `user_followers`.
    - [x] Display counts on own and public profile pages.
- [x] **Favorite Aggregation**
    - [x] Fetch total favorite count for a spot.
    - [x] Fetch list of usernames who favorited the spot.
    - [x] Display count and clickable usernames in `SpotSidebar` or `SpotInfo`.

### 2. Spot Interactions (Medium Complexity)
- [x] **Spot Flagging**
    - [x] Create `spot_flags` table in Supabase.
    - [x] Implement flagging UI with reason input field on spot details page.
- [ ] **Media Liking**
    - [ ] Create `media_likes` table in Supabase (for photos and videos).
    - [ ] Add like toggle and count display to `SpotGallery` items.
- [ ] **Existing Spot Media Upload**
    - [ ] Add "Add Photo/Video" button to `SpotSidebar` for existing spots.
    - [ ] Integrate with `PhotoUpload` and `VideoUpload` components.

### 3. Profile Enhancement (Medium Complexity)
- [ ] **User Content Gallery**
    - [ ] Implement query to fetch all spots created by a specific user.
    - [ ] Implement query to fetch all photos/videos uploaded by a specific user.
    - [ ] Build a tabbed gallery view on the profile page showing "Created Spots" and "Uploaded Media".

### 4. Discussion System (Medium Complexity)
- [ ] **Spot Comments**
    - [ ] Create `spot_comments` table in Supabase.
    - [ ] Build comment section on spot details page with creation and listing.
- [ ] **Comment Interactions**
    - [ ] Create `comment_reactions` table.
    - [ ] Implement like/dislike functionality for individual comments.

### 5. Real-time Chat (High Complexity)
- [ ] **Chat Infrastructure**
    - [ ] Design `conversations` and `messages` schema.
    - [ ] Implement Supabase Realtime subscriptions for new messages.
- [ ] **Chat UI**
    - [ ] Create `ChatList` route/component to show active conversations.
    - [ ] Create `ChatRoom` route/component for individual message history.
    - [ ] Add "Message User" button to profile pages.

## Success Metrics
- Users can see their community impact via stats.
- Active discussions can take place on spot pages.
- Users can connect directly via following and chat.
- Inappropriate content can be reported by the community.
