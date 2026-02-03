-- Create dedicated RPC for following feed to simplify logic and debugging
-- Created at: 2026-01-31

CREATE OR REPLACE FUNCTION public.get_following_feed_content(
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0,
    p_user_id UUID DEFAULT NULL,
    p_spot_types TEXT[] DEFAULT NULL,
    p_difficulties TEXT[] DEFAULT NULL,
    p_min_risk INTEGER DEFAULT NULL,
    p_max_risk INTEGER DEFAULT NULL,
    p_rider_types TEXT[] DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_result JSONB;
BEGIN
    -- Return empty if no user_id provided
    IF p_user_id IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;

    WITH media_items AS (
        -- Photos
        SELECT 
            sp.id AS media_id,
            sp.spot_id,
            sp.user_id AS uploader_id,
            sp.url AS media_url,
            sp.thumbnailurl AS thumbnail_url,
            'photo'::media_type_enum AS media_type,
            sp.created_at,
            s.name AS spot_name,
            s.city,
            s.country,
            prof.username AS uploader_username,
            prof."displayName" AS uploader_display_name,
            prof."avatarUrl" AS uploader_avatar_url,
            true AS is_followed_by_user,
            COALESCE((SELECT COUNT(*)::int FROM public.media_likes ml WHERE ml.photo_id = sp.id), 0) AS like_count,
            COALESCE((SELECT COUNT(*)::int FROM public.media_comments mc WHERE mc.photo_id = sp.id), 0) AS comment_count
        FROM public.spot_photos sp
        JOIN public.spots s ON sp.spot_id = s.id
        JOIN public.profiles prof ON sp.user_id = prof.id
        JOIN public.user_follows uf ON uf.following_id = prof.id AND uf.follower_id = get_following_feed_content.p_user_id
        WHERE (p_spot_types IS NULL OR s.spot_type && p_spot_types::spot_type_enum[])
          AND (p_difficulties IS NULL OR s.difficulty = ANY(p_difficulties))
          AND (p_min_risk IS NULL OR s.kickout_risk >= p_min_risk)
          AND (p_max_risk IS NULL OR s.kickout_risk <= p_max_risk)
          AND (p_rider_types IS NULL OR prof."riderType" = ANY(p_rider_types))
        
        UNION ALL
        
        -- Videos
        SELECT 
            sv.id AS media_id,
            sv.spot_id,
            sv.user_id AS uploader_id,
            sv.url AS media_url,
            sv.thumbnail_url,
            'video'::media_type_enum AS media_type,
            sv.created_at,
            s.name AS spot_name,
            s.city,
            s.country,
            prof.username AS uploader_username,
            prof."displayName" AS uploader_display_name,
            prof."avatarUrl" AS uploader_avatar_url,
            true AS is_followed_by_user,
            COALESCE((SELECT COUNT(*)::int FROM public.media_likes ml WHERE ml.video_id = sv.id), 0) AS like_count,
            COALESCE((SELECT COUNT(*)::int FROM public.media_comments mc WHERE mc.video_id = sv.id), 0) AS comment_count
        FROM public.spot_videos sv
        JOIN public.spots s ON sv.spot_id = s.id
        JOIN public.profiles prof ON sv.user_id = prof.id
        JOIN public.user_follows uf ON uf.following_id = prof.id AND uf.follower_id = get_following_feed_content.p_user_id
        WHERE (p_spot_types IS NULL OR s.spot_type && p_spot_types::spot_type_enum[])
          AND (p_difficulties IS NULL OR s.difficulty = ANY(p_difficulties))
          AND (p_min_risk IS NULL OR s.kickout_risk >= p_min_risk)
          AND (p_max_risk IS NULL OR s.kickout_risk <= p_max_risk)
          AND (p_rider_types IS NULL OR prof."riderType" = ANY(p_rider_types))
    ),
    ranked_media AS (
        SELECT 
            *,
            (like_count * 2 + comment_count * 3 + EXTRACT(EPOCH FROM created_at) / 3600) AS popularity_score
        FROM media_items
        ORDER BY created_at DESC
        LIMIT p_limit
        OFFSET p_offset
    )
    SELECT jsonb_agg(ranked_media) INTO v_result FROM ranked_media;
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$$;