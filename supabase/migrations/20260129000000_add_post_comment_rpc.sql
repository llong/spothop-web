-- Implement post_comment RPC with basic abuse prevention
-- Created at: 2026-01-29

CREATE OR REPLACE FUNCTION public.post_comment(
    p_media_id UUID,
    p_media_type TEXT,
    p_content TEXT,
    p_parent_id UUID DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_comment_id UUID;
    v_user_id UUID;
BEGIN
    -- 1. Get authenticated user ID
    v_user_id := auth.uid();
    
    -- 2. Basic Abuse Prevention: Check if user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 3. Basic Abuse Prevention: Content length check
    IF length(trim(p_content)) < 1 THEN
        RAISE EXCEPTION 'Comment cannot be empty';
    END IF;
    
    IF length(p_content) > 1000 THEN
        RAISE EXCEPTION 'Comment exceeds maximum length of 1000 characters';
    END IF;

    -- 4. Insert comment based on media type
    IF p_media_type = 'photo' THEN
        INSERT INTO public.media_comments (user_id, photo_id, media_type, content, parent_id)
        VALUES (v_user_id, p_media_id, 'photo'::media_type_enum, p_content, p_parent_id)
        RETURNING id INTO v_comment_id;
    ELSIF p_media_type = 'video' THEN
        INSERT INTO public.media_comments (user_id, video_id, media_type, content, parent_id)
        VALUES (v_user_id, p_media_id, 'video'::media_type_enum, p_content, p_parent_id)
        RETURNING id INTO v_comment_id;
    ELSE
        RAISE EXCEPTION 'Invalid media type';
    END IF;

    RETURN v_comment_id;
END;
$$;