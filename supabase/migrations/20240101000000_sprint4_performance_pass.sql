-- Sprint 4: Performance & Security Pass

-- 1. FIX AUTH RLS INITIALIZATION PLAN (Lint 0003)
-- Replace auth.uid() with (select auth.uid()) for performance

-- Spots
DROP POLICY IF EXISTS "Authenticated users can insert spots" ON spots;
DROP POLICY IF EXISTS "Users can create spots" ON spots;
CREATE POLICY "authenticated_insert_spots" ON spots 
FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Spot creators can update their spots" ON spots;
DROP POLICY IF EXISTS "Users can update their own spots" ON spots;
DROP POLICY IF EXISTS "auth_update_spots" ON spots;
CREATE POLICY "authenticated_update_spots" ON spots 
FOR UPDATE TO authenticated 
USING ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "Users can delete their own spots" ON spots;
CREATE POLICY "authenticated_delete_spots" ON spots 
FOR DELETE TO authenticated 
USING ((select auth.uid()) = created_by);

-- Profiles
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
CREATE POLICY "authenticated_insert_profiles" ON profiles 
FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Enable update for users based on id" ON profiles;
CREATE POLICY "authenticated_update_profiles" ON profiles 
FOR UPDATE TO authenticated 
USING ((select auth.uid()) = id);

-- Spot Photos
DROP POLICY IF EXISTS "Users can delete their own photos" ON spot_photos;
CREATE POLICY "authenticated_delete_photos" ON spot_photos 
FOR DELETE TO authenticated 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert photos" ON spot_photos;
DROP POLICY IF EXISTS "spot_photos_insert_policy" ON spot_photos;
CREATE POLICY "authenticated_insert_photos" ON spot_photos 
FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own photos" ON spot_photos;
CREATE POLICY "authenticated_update_photos" ON spot_photos 
FOR UPDATE TO authenticated 
USING ((select auth.uid()) = user_id);

-- Spot Videos
DROP POLICY IF EXISTS "Users can delete their own videos" ON spot_videos;
CREATE POLICY "authenticated_delete_videos" ON spot_videos 
FOR DELETE TO authenticated 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can insert videos" ON spot_videos;
DROP POLICY IF EXISTS "spot_videos_insert_policy" ON spot_videos;
CREATE POLICY "authenticated_insert_videos" ON spot_videos 
FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own videos" ON spot_videos;
CREATE POLICY "authenticated_update_videos" ON spot_videos 
FOR UPDATE TO authenticated 
USING ((select auth.uid()) = user_id);

-- Media Comments
DROP POLICY IF EXISTS "media_comments_delete_policy" ON media_comments;
CREATE POLICY "authenticated_delete_media_comments" ON media_comments 
FOR DELETE TO authenticated 
USING ((select auth.uid()) = userid);

DROP POLICY IF EXISTS "media_comments_insert_policy" ON media_comments;
CREATE POLICY "authenticated_insert_media_comments" ON media_comments 
FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = userid);

DROP POLICY IF EXISTS "media_comments_update_policy" ON media_comments;
CREATE POLICY "authenticated_update_media_comments" ON media_comments 
FOR UPDATE TO authenticated 
USING ((select auth.uid()) = userid);

-- Media Tags
DROP POLICY IF EXISTS "media_tags_delete_policy" ON media_tags;
CREATE POLICY "authenticated_delete_media_tags" ON media_tags 
FOR DELETE TO authenticated 
USING ((select auth.uid()) = userid);

DROP POLICY IF EXISTS "media_tags_insert_policy" ON media_tags;
CREATE POLICY "authenticated_insert_media_tags" ON media_tags 
FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = userid);

-- Favorite Spots
DROP POLICY IF EXISTS "Users can manage their own favorite spots." ON user_favorite_spots;
CREATE POLICY "authenticated_manage_favorites" ON user_favorite_spots 
FOR ALL TO authenticated 
USING ((select auth.uid()) = user_id);

-- User Followers
DROP POLICY IF EXISTS "Users can insert their own follower rows." ON user_followers;
CREATE POLICY "authenticated_insert_followers" ON user_followers 
FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = follower_id);

DROP POLICY IF EXISTS "Users can delete their own follower rows." ON user_followers;
CREATE POLICY "authenticated_delete_followers" ON user_followers 
FOR DELETE TO authenticated 
USING ((select auth.uid()) = follower_id);

-- Media Likes
DROP POLICY IF EXISTS "Users can manage their own media likes" ON media_likes;
CREATE POLICY "authenticated_manage_media_likes" ON media_likes 
FOR ALL TO authenticated 
USING ((select auth.uid()) = user_id);

-- Spot Comments
DROP POLICY IF EXISTS "Users can insert their own comments" ON spot_comments;
CREATE POLICY "authenticated_insert_spot_comments" ON spot_comments 
FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON spot_comments;
CREATE POLICY "authenticated_update_spot_comments" ON spot_comments 
FOR UPDATE TO authenticated 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON spot_comments;
CREATE POLICY "authenticated_delete_spot_comments" ON spot_comments 
FOR DELETE TO authenticated 
USING ((select auth.uid()) = user_id);

-- Comment Reactions
DROP POLICY IF EXISTS "Users can manage their own reactions" ON comment_reactions;
CREATE POLICY "authenticated_manage_comment_reactions" ON comment_reactions 
FOR ALL TO authenticated 
USING ((select auth.uid()) = user_id);

-- Notifications
DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "authenticated_select_notifications" ON notifications 
FOR SELECT TO authenticated 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "authenticated_update_notifications" ON notifications 
FOR UPDATE TO authenticated 
USING ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can delete their own notifications" ON notifications;
CREATE POLICY "authenticated_delete_notifications" ON notifications 
FOR DELETE TO authenticated 
USING ((select auth.uid()) = user_id);

-- User Blocks
DROP POLICY IF EXISTS "Users can manage their own blocks" ON user_blocks;
CREATE POLICY "authenticated_manage_blocks" ON user_blocks 
FOR ALL TO authenticated 
USING ((select auth.uid()) = blocker_id);

-- Chat System Updates
DROP POLICY IF EXISTS "auth_insert_conversations" ON conversations;
CREATE POLICY "authenticated_insert_conversations" ON conversations 
FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = created_by);

DROP POLICY IF EXISTS "auth_insert_participants" ON conversation_participants;
CREATE POLICY "authenticated_insert_participants" ON conversation_participants 
FOR INSERT TO authenticated 
WITH CHECK ((select auth.uid()) = user_id OR is_chat_participant(conversation_id));

DROP POLICY IF EXISTS "auth_update_participants" ON conversation_participants;
CREATE POLICY "authenticated_update_participants" ON conversation_participants 
FOR UPDATE TO authenticated 
USING ((select auth.uid()) = user_id OR is_chat_participant(conversation_id));

DROP POLICY IF EXISTS "auth_select_conversations" ON conversations;
CREATE POLICY "authenticated_select_conversations" ON conversations 
FOR SELECT TO authenticated 
USING (is_chat_participant(id) OR (select auth.uid()) = created_by);


-- 2. CONSOLIDATE MULTIPLE PERMISSIVE POLICIES (Lint 0006)

-- Comment Reactions
DROP POLICY IF EXISTS "Anyone can view comment reactions" ON comment_reactions;
CREATE POLICY "anyone_select_comment_reactions" ON comment_reactions 
FOR SELECT USING (true);

-- Media Likes
DROP POLICY IF EXISTS "Anyone can view media likes" ON media_likes;
CREATE POLICY "anyone_select_media_likes" ON media_likes 
FOR SELECT USING (true);

-- Spot Photos
DROP POLICY IF EXISTS "Photos are viewable by everyone" ON spot_photos;
DROP POLICY IF EXISTS "spot_photos_select_policy" ON spot_photos;
CREATE POLICY "anyone_select_photos" ON spot_photos 
FOR SELECT USING (true);

-- Spot Videos
DROP POLICY IF EXISTS "Videos are viewable by everyone" ON spot_videos;
DROP POLICY IF EXISTS "spot_videos_select_policy" ON spot_videos;
CREATE POLICY "anyone_select_videos" ON spot_videos 
FOR SELECT USING (true);


-- 3. REMOVE DUPLICATE INDEXES (Lint 0009)
-- Drop the constraint first if it exists, as it depends on the index
ALTER TABLE profiles DROP CONSTRAINT IF EXISTS unique_username;
DROP INDEX IF EXISTS unique_username;


-- 4. ADD MISSING INDEXES FOR FOREIGN KEYS (Lint 0001)

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON notifications(actor_id);

-- Conversations
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON conversations(created_by);
CREATE INDEX IF NOT EXISTS idx_participants_user_id ON conversation_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_participants_conversation_id ON conversation_participants(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON messages(sender_id);

-- Comments & Reactions
CREATE INDEX IF NOT EXISTS idx_spot_comments_spot_id ON spot_comments(spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_comments_user_id ON spot_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_spot_comments_parent_id ON spot_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON comment_reactions(user_id);

-- Media & Likes
CREATE INDEX IF NOT EXISTS idx_spot_photos_spot_id ON spot_photos(spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_photos_user_id ON spot_photos(user_id);
CREATE INDEX IF NOT EXISTS idx_spot_videos_spot_id ON spot_videos(spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_videos_user_id ON spot_videos(user_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_photo_id ON media_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_video_id ON media_likes(video_id);
CREATE INDEX IF NOT EXISTS idx_media_comments_userid ON media_comments(userid);
CREATE INDEX IF NOT EXISTS idx_media_tags_userid ON media_tags(userid);

-- Social
CREATE INDEX IF NOT EXISTS idx_user_followers_following_id ON user_followers(following_id);
CREATE INDEX IF NOT EXISTS idx_user_favorite_spots_spot_id ON user_favorite_spots(spot_id);
CREATE INDEX IF NOT EXISTS idx_content_reports_user_id ON content_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON user_blocks(blocked_id);


-- 5. SET FUNCTION SEARCH PATH (Lint 0011)

ALTER FUNCTION public.check_spot_status SET search_path = public;
ALTER FUNCTION public.find_common_1on1_conversation SET search_path = public;
ALTER FUNCTION public.handle_comment_reply_notification SET search_path = public;
ALTER FUNCTION public.handle_media_like_notification SET search_path = public;
ALTER FUNCTION public.handle_new_comment_notification SET search_path = public;
ALTER FUNCTION public.handle_spot_favorite_notification SET search_path = public;
ALTER FUNCTION public.is_chat_participant SET search_path = public;
ALTER FUNCTION public.notify_on_new_message SET search_path = public;
ALTER FUNCTION public.spots_in_view SET search_path = public;
ALTER FUNCTION public.spots_within_distance SET search_path = public;
ALTER FUNCTION public.update_spot_location SET search_path = public;
ALTER FUNCTION public.update_updated_at_column SET search_path = public;


-- 6. ENABLE RLS ON POSTGIS TABLES (Lint 0013)
ALTER TABLE IF EXISTS public.spatial_ref_sys ENABLE ROW LEVEL SECURITY;
CREATE POLICY "allow_read_spatial_ref_sys" ON public.spatial_ref_sys FOR SELECT USING (true);
