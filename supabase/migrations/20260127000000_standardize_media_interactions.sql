-- Migration to standardize media comments and implement feed RPC
-- Created at: 2026-01-27

-- 1. Create media type enum if not exists
DO $$ BEGIN
    CREATE TYPE media_type_enum AS ENUM ('photo', 'video');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Standardize media_comments table
-- Drop existing table if it exists (it's empty)
DROP TABLE IF EXISTS public.media_comments CASCADE;

-- Recreate media_comments with standardized schema
CREATE TABLE public.media_comments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    photo_id UUID REFERENCES public.spot_photos(id) ON DELETE CASCADE,
    video_id UUID REFERENCES public.spot_videos(id) ON DELETE CASCADE,
    media_type media_type_enum NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    -- Ensure either photo_id or video_id is present, but not both or none
    CONSTRAINT media_id_check CHECK (
        (photo_id IS NOT NULL AND video_id IS NULL AND media_type = 'photo') OR
        (photo_id IS NULL AND video_id IS NOT NULL AND media_type = 'video')
    )
);

-- Add indexes for performance
CREATE INDEX idx_media_comments_user_id ON public.media_comments(user_id);
CREATE INDEX idx_media_comments_photo_id ON public.media_comments(photo_id);
CREATE INDEX idx_media_comments_video_id ON public.media_comments(video_id);
CREATE INDEX idx_media_comments_created_at ON public.media_comments(created_at);

-- 3. Ensure media_likes has proper indexes and constraints
-- Since media_likes already has data, we just add constraints and indexes
ALTER TABLE public.media_likes
DROP CONSTRAINT IF EXISTS media_id_check;

ALTER TABLE public.media_likes
ADD CONSTRAINT media_id_check CHECK (
    (photo_id IS NOT NULL AND video_id IS NULL AND media_type = 'photo') OR
    (photo_id IS NULL AND video_id IS NOT NULL AND media_type = 'video')
);

CREATE INDEX IF NOT EXISTS idx_media_likes_user_id ON public.media_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_photo_id ON public.media_likes(photo_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_video_id ON public.media_likes(video_id);

-- 4. Enable RLS and add policies
ALTER TABLE public.media_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to media comments"
    ON public.media_comments FOR SELECT
    USING (true);

CREATE POLICY "Allow authenticated users to post comments"
    ON public.media_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Allow users to update their own comments"
    ON public.media_comments FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Allow users to delete their own comments"
    ON public.media_comments FOR DELETE
    USING (auth.uid() = user_id);

-- (Assuming media_likes already has RLS, but if not, enable it)
ALTER TABLE public.media_likes ENABLE ROW LEVEL SECURITY;

-- 5. Implement get_global_feed_content RPC
CREATE OR REPLACE FUNCTION public.get_global_feed_content(
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH media_items AS (
        -- Combine photos and videos into a single result set
        SELECT 
            sp.id AS media_id,
            sp.spot_id,
            sp.user_id AS uploader_id,
            sp.url AS media_url,
            sp.thumbnailurl AS thumbnail_url, -- No underscore for photos
            'photo'::media_type_enum AS media_type,
            sp.created_at,
            s.name AS spot_name,
            s.city,
            s.country,
            p.username AS uploader_username,
            p."avatarUrl" AS uploader_avatar_url,
            COALESCE((SELECT COUNT(*) FROM public.media_likes ml WHERE ml.photo_id = sp.id), 0) AS like_count,
            COALESCE((SELECT COUNT(*) FROM public.media_comments mc WHERE mc.photo_id = sp.id), 0) AS comment_count
        FROM public.spot_photos sp
        JOIN public.spots s ON sp.spot_id = s.id
        JOIN public.profiles p ON sp.user_id = p.id
        
        UNION ALL
        
        SELECT 
            sv.id AS media_id,
            sv.spot_id,
            sv.user_id AS uploader_id,
            sv.url AS media_url,
            sv.thumbnail_url, -- Underscore for videos
            'video'::media_type_enum AS media_type,
            sv.created_at,
            s.name AS spot_name,
            s.city,
            s.country,
            p.username AS uploader_username,
            p."avatarUrl" AS uploader_avatar_url,
            COALESCE((SELECT COUNT(*) FROM public.media_likes ml WHERE ml.video_id = sv.id), 0) AS like_count,
            COALESCE((SELECT COUNT(*) FROM public.media_comments mc WHERE mc.video_id = sv.id), 0) AS comment_count
        FROM public.spot_videos sv
        JOIN public.spots s ON sv.spot_id = s.id
        JOIN public.profiles p ON sv.user_id = p.id
    ),
    ranked_media AS (
        -- Apply basic ranking logic:recency + popularity (likes/comments)
        SELECT 
            *,
            -- Simple popularity score (can be refined later)
            (like_count * 2 + comment_count * 3 + EXTRACT(EPOCH FROM created_at) / 3600) AS popularity_score
        FROM media_items
        ORDER BY popularity_score DESC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT jsonb_agg(ranked_media) INTO v_result FROM ranked_media;
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;

-- 6. Implement handle_media_like RPC
CREATE OR REPLACE FUNCTION public.handle_media_like(
    p_media_id UUID,
    p_media_type TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_user_id UUID;
    v_exists BOOLEAN;
BEGIN
    -- 1. Get authenticated user ID
    v_user_id := auth.uid();
    
    -- 2. Basic Abuse Prevention: Check if user is authenticated
    IF v_user_id IS NULL THEN
        RAISE EXCEPTION 'Not authenticated';
    END IF;

    -- 3. Insert or Delete like based on media type
    IF p_media_type = 'photo' THEN
        -- Check if already liked
        SELECT EXISTS (
            SELECT 1 FROM public.media_likes 
            WHERE user_id = v_user_id AND photo_id = p_media_id
        ) INTO v_exists;

        IF v_exists THEN
            DELETE FROM public.media_likes 
            WHERE user_id = v_user_id AND photo_id = p_media_id;
        ELSE
            INSERT INTO public.media_likes (user_id, photo_id, media_type)
            VALUES (v_user_id, p_media_id, 'photo'::media_type_enum);
        END IF;

    ELSIF p_media_type = 'video' THEN
        -- Check if already liked
        SELECT EXISTS (
            SELECT 1 FROM public.media_likes 
            WHERE user_id = v_user_id AND video_id = p_media_id
        ) INTO v_exists;

        IF v_exists THEN
            DELETE FROM public.media_likes 
            WHERE user_id = v_user_id AND video_id = p_media_id;
        ELSE
            INSERT INTO public.media_likes (user_id, video_id, media_type)
            VALUES (v_user_id, p_media_id, 'video'::media_type_enum);
        END IF;
    ELSE
        RAISE EXCEPTION 'Invalid media type';
    END IF;
END;
$$;