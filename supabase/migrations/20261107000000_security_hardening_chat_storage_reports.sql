-- Security hardening: chat participants, storage policies, reports, function grants, FK indexes.
-- Verified against live project wbkpofmvjcmdqbivocqc on 2026-11-07.

-- ============================================================
-- 1. Chat participants: stop self-joining arbitrary conversations
-- ============================================================

-- Helper: is the caller an admin of this conversation?
CREATE OR REPLACE FUNCTION public.is_chat_admin(chat_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.conversation_participants
        WHERE conversation_id = chat_id
          AND user_id = (SELECT auth.uid())
          AND role = 'admin'
    );
$$;
REVOKE EXECUTE ON FUNCTION public.is_chat_admin(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.is_chat_admin(uuid) TO authenticated;

DROP POLICY IF EXISTS "authenticated_insert_participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "authenticated_update_participants" ON public.conversation_participants;
DROP POLICY IF EXISTS "authenticated_delete_participants" ON public.conversation_participants;

-- Only the conversation creator (creating the chat) or a chat admin can add participants.
CREATE POLICY "insert_participants_creator_or_admin"
    ON public.conversation_participants FOR INSERT TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.conversations c
            WHERE c.id = conversation_id AND c.created_by = (SELECT auth.uid())
        )
        OR public.is_chat_admin(conversation_id)
    );

-- Users can update their own row (e.g. accept/reject invite); admins can update any row in their chat.
CREATE POLICY "update_participants_self_or_admin"
    ON public.conversation_participants FOR UPDATE TO authenticated
    USING (user_id = (SELECT auth.uid()) OR public.is_chat_admin(conversation_id))
    WITH CHECK (user_id = (SELECT auth.uid()) OR public.is_chat_admin(conversation_id));

-- Users can leave; admins can remove members.
CREATE POLICY "delete_participants_self_or_admin"
    ON public.conversation_participants FOR DELETE TO authenticated
    USING (user_id = (SELECT auth.uid()) OR public.is_chat_admin(conversation_id));

-- Non-admins cannot change anyone's role (including promoting themselves).
CREATE OR REPLACE FUNCTION public.protect_participant_role()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF NEW.role IS DISTINCT FROM OLD.role AND NOT public.is_chat_admin(OLD.conversation_id) THEN
        RAISE EXCEPTION 'Only chat admins can change participant roles';
    END IF;
    RETURN NEW;
END;
$$;
REVOKE EXECUTE ON FUNCTION public.protect_participant_role() FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS on_participant_update_protect_role ON public.conversation_participants;
CREATE TRIGGER on_participant_update_protect_role
    BEFORE UPDATE ON public.conversation_participants
    FOR EACH ROW EXECUTE FUNCTION public.protect_participant_role();

-- ============================================================
-- 2. Storage: remove catch-all policies, fix avatar policies
-- ============================================================

-- Any signed-in user could upload to ANY bucket / read ALL buckets.
DROP POLICY IF EXISTS "Allow all authenticated users to upload files" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to all buckets" ON storage.objects;

-- Avatar objects are named "<uid>.webp" by the client, but the old policies required "<uid>" exactly,
-- so avatar uploads only worked through the catch-all policy dropped above.
DROP POLICY IF EXISTS "Users can upload their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own avatar" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own avatar" ON storage.objects;

CREATE POLICY "Users can upload their own avatar" ON storage.objects FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'avatars' AND name = (SELECT auth.uid())::text || '.webp');
CREATE POLICY "Users can update their own avatar" ON storage.objects FOR UPDATE TO authenticated
    USING (bucket_id = 'avatars' AND name = (SELECT auth.uid())::text || '.webp');
CREATE POLICY "Users can delete their own avatar" ON storage.objects FOR DELETE TO authenticated
    USING (bucket_id = 'avatars' AND name = (SELECT auth.uid())::text || '.webp');

-- Server-side backstop for the client-side limits (client resizes photos to WebP <=1920x1080,
-- trims videos to <=20s and re-encodes to MP4, crops avatars to WebP). Applies to new uploads only.
-- 50 MB is also the Supabase free-plan global upload cap; raise it if your plan allows and you need to.
UPDATE storage.buckets SET file_size_limit = 52428800, allowed_mime_types = ARRAY['image/webp', 'video/mp4']
    WHERE id = 'spot-media';
UPDATE storage.buckets SET file_size_limit = 2097152, allowed_mime_types = ARRAY['image/webp']
    WHERE id = 'avatars';

-- ============================================================
-- 3. Reports: one report per user per target (client already handles 23505)
-- ============================================================

DELETE FROM public.content_reports a
USING public.content_reports b
WHERE a.ctid > b.ctid
  AND a.user_id = b.user_id
  AND a.target_id = b.target_id
  AND a.target_type = b.target_type;

CREATE UNIQUE INDEX IF NOT EXISTS content_reports_user_target_unique
    ON public.content_reports (user_id, target_id, target_type);

-- ============================================================
-- 4. Function grants
-- ============================================================

-- Trigger functions must not be callable through /rest/v1/rpc.
REVOKE EXECUTE ON FUNCTION public.cleanup_content_dependencies() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_reports_on_delete() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_comment_reaction_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_comment_reply_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_media_comment_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_media_like_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_media_like_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_comment_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_spot_favorite_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_spot_favorite_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_follow_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_user_follow_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_on_new_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.protect_profile_roles() FROM PUBLIC, anon, authenticated;

-- Actions that require a signed-in user: no anonymous access.
REVOKE EXECUTE ON FUNCTION public.find_common_1on1_conversation(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.post_comment(uuid, text, text, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.toggle_media_like(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.toggle_spot_favorite(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.toggle_user_follow(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_media_like(uuid, text) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.handle_media_comment_reaction(uuid, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.find_common_1on1_conversation(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.post_comment(uuid, text, text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_media_like(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_spot_favorite(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.toggle_user_follow(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_media_like(uuid, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.handle_media_comment_reaction(uuid, text) TO authenticated;

-- Pin search_path on the functions the advisor flagged (feed RPCs are handled separately).
ALTER FUNCTION public.handle_media_comment_count() SET search_path = public;
ALTER FUNCTION public.handle_media_like_count() SET search_path = public;
ALTER FUNCTION public.handle_spot_favorite_count() SET search_path = public;
ALTER FUNCTION public.handle_user_follow_count() SET search_path = public;
ALTER FUNCTION public.toggle_media_like(uuid) SET search_path = public;
ALTER FUNCTION public.toggle_spot_favorite(uuid) SET search_path = public;
ALTER FUNCTION public.toggle_user_follow(uuid) SET search_path = public;

-- ============================================================
-- 5. Indexes (advisor: unindexed foreign keys; feed ordering; chat lookups)
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_messages_conversation_created ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages (sender_id);
CREATE INDEX IF NOT EXISTS idx_conversation_participants_user_id ON public.conversation_participants (user_id);
CREATE INDEX IF NOT EXISTS idx_conversations_created_by ON public.conversations (created_by);
CREATE INDEX IF NOT EXISTS idx_content_reports_target ON public.content_reports (target_id, target_type);
CREATE INDEX IF NOT EXISTS idx_spot_photos_created_at ON public.spot_photos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spot_videos_created_at ON public.spot_videos (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_spot_videos_spot_id ON public.spot_videos (spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_videos_user_id ON public.spot_videos (user_id);
CREATE INDEX IF NOT EXISTS idx_spot_comments_spot_id ON public.spot_comments (spot_id);
CREATE INDEX IF NOT EXISTS idx_spot_comments_user_id ON public.spot_comments (user_id);
CREATE INDEX IF NOT EXISTS idx_spot_comments_parent_id ON public.spot_comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_created ON public.notifications (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_actor_id ON public.notifications (actor_id);
CREATE INDEX IF NOT EXISTS idx_spots_created_by ON public.spots (created_by);
CREATE INDEX IF NOT EXISTS idx_user_favorite_spots_spot_id ON public.user_favorite_spots (spot_id);
CREATE INDEX IF NOT EXISTS idx_user_followers_following_id ON public.user_followers (following_id);
CREATE INDEX IF NOT EXISTS idx_user_blocks_blocked_id ON public.user_blocks (blocked_id);
CREATE INDEX IF NOT EXISTS idx_comment_reactions_user_id ON public.comment_reactions (user_id);
CREATE INDEX IF NOT EXISTS idx_media_comment_reactions_user_id ON public.media_comment_reactions (user_id);
CREATE INDEX IF NOT EXISTS idx_media_comments_parent_id ON public.media_comments (parent_id);
CREATE INDEX IF NOT EXISTS idx_media_tags_user_id ON public.media_tags (userid);
CREATE INDEX IF NOT EXISTS idx_media_tags_created_by ON public.media_tags (createdby);
CREATE INDEX IF NOT EXISTS idx_contest_entries_spot_id ON public.contest_entries (spot_id);
CREATE INDEX IF NOT EXISTS idx_contest_entries_user_id ON public.contest_entries (user_id);
CREATE INDEX IF NOT EXISTS idx_contest_judges_user_id ON public.contest_judges (user_id);
CREATE INDEX IF NOT EXISTS idx_contest_votes_contest_id ON public.contest_votes (contest_id);
CREATE INDEX IF NOT EXISTS idx_contest_votes_user_id ON public.contest_votes (user_id);
