# Sprint 15: Pro History Feature

## Goal
Implement the "Pro History" feature allowing users to link YouTube video clips (skate parts) to specific spots with start and end timestamps. This feature aims to differentiate professional content from user uploads and incentivize community contributions through recognition and gamification mechanics.

## Tasks

### 1. Database Schema
- [ ] Create migration `supabase/migrations/20260218000000_create_spot_video_links.sql`
    - Create table `spot_video_links`:
        - `id` (uuid, primary key)
        - `spot_id` (uuid, references spots)
        - `user_id` (uuid, references auth.users)
        - `youtube_video_id` (text)
        - `start_time` (integer, seconds)
        - `end_time` (integer, seconds, optional)
        - `description` (text, optional)
        - `created_at` (timestamp with time zone)
    - Create table `spot_video_link_likes`:
        - `id` (uuid, primary key)
        - `link_id` (uuid, references spot_video_links)
        - `user_id` (uuid, references auth.users)
        - `created_at` (timestamp with time zone)
    - Add RLS policies:
        - Public read access for both tables.
        - Authenticated insert for both tables.
        - Authenticated delete for own content (links/likes).

### 2. Type Definitions
- [ ] Update `src/types/index.ts`:
    - Add `SpotVideoLink` interface:
        - Includes fields from DB plus `like_count` and `is_liked_by_user`.
    - Update `Spot` interface:
        - Add `videoLinks?: SpotVideoLink[]`.

### 3. Service Layer
- [ ] Update `src/services/spotService.ts`:
    - Modify `fetchSpotDetails` to:
        - Join `spot_video_links`.
        - Join `spot_video_link_likes` (count & check user status).
        - Map results to `Spot.videoLinks`.
    - Add `addVideoLink(spotId, videoId, startTime, endTime, description)` method.
    - Add `toggleVideoLinkLike(linkId)` method.

### 4. UI Components
- [ ] Create `src/routes/spots/-components/ProParts/`:
    - `AddVideoLinkDialog.tsx`:
        - Form with YouTube URL input.
        - Start/End time inputs (MM:SS format).
        - Description input.
        - Logic to parse YouTube ID and convert time to seconds.
    - `VideoLinkItem.tsx`:
        - Display YouTube thumbnail (`https://img.youtube.com/vi/[ID]/hqdefault.jpg`).
        - Display description, contributor (avatar/username), and like button.
        - Handle click to play:
            - Show iframe player with `start` and `end` params.
            - `https://www.youtube.com/embed/[ID]?start=[start]&end=[end]&autoplay=1`
    - `ProPartsTab.tsx`:
        - List of `VideoLinkItem` components.
        - "Add Pro Clip" button (visible to auth users).

### 5. Integration
- [ ] Update `src/routes/spots/-components/DetailsMediaSection.tsx`:
    - Add "Pro History" tab (with distinct styling/icon).
    - Render `ProPartsTab` content when active.

### 6. Utils
- [ ] Create/Update `src/utils/videoProcessing.ts` (or similar):
    - Add `parseYoutubeId(url)` helper.
    - Add `timeToSeconds(mm:ss)` helper.
    - Add `secondsToTime(seconds)` helper.

## Success Criteria
- Users can view a list of "Pro Parts" linked to a spot.
- Users can add a new link with precise start/end times.
- Videos play correctly from the start timestamp and stop at the end timestamp.
- Users can like/unlike links, and counts update immediately.
- The UI clearly distinguishes "Pro History" from standard user uploads.
