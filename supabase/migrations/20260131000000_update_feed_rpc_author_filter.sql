-- Migration to update get_global_feed_content RPC with author filter and type fixes
-- Created at: 2026-01-31

-- Update get_global_feed_content RPC
CREATE OR REPLACE FUNCTION public.get_global_feed_content(
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0,
    p_user_id UUID DEFAULT NULL,
    p_lat DOUBLE PRECISION DEFAULT NULL,
    p_lng DOUBLE PRECISION DEFAULT NULL,
    p_max_dist_km DOUBLE PRECISION DEFAULT NULL,
    p_following_only BOOLEAN DEFAULT FALSE,
    p_spot_types TEXT[] DEFAULT NULL,
    p_difficulties TEXT[] DEFAULT NULL,
    p_min_risk INTEGER DEFAULT NULL,
    p_max_risk INTEGER DEFAULT NULL,
    p_rider_types TEXT[] DEFAULT NULL,
    p_author_id UUID DEFAULT NULL
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
            sp.thumbnailurl AS thumbnail_url,
            'photo'::media_type_enum AS media_type,
            sp.created_at,
            s.name AS spot_name,
            s.city,
            s.country,
            p.username AS uploader_username,
            p."displayName" AS uploader_display_name,
            p."avatarUrl" AS uploader_avatar_url,
            (
                SELECT EXISTS (
                    SELECT 1 FROM public.user_follows 
                    WHERE follower_id = p_user_id AND following_id = p.id
                )
            ) AS is_followed_by_user,
            COALESCE((SELECT COUNT(*)::int FROM public.media_likes ml WHERE ml.photo_id = sp.id), 0) AS like_count,
            COALESCE((SELECT COUNT(*)::int FROM public.media_comments mc WHERE mc.photo_id = sp.id), 0) AS comment_count
        FROM public.spot_photos sp
        JOIN public.spots s ON sp.spot_id = s.id
        JOIN public.profiles p ON sp.user_id = p.id
        WHERE (p_lat IS NULL OR p_lng IS NULL OR p_max_dist_km IS NULL OR
               ST_DWithin(s.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_max_dist_km * 1000))
          AND (NOT p_following_only OR p_user_id IS NULL OR EXISTS (
                SELECT 1 FROM public.user_follows 
                WHERE follower_id = p_user_id AND following_id = p.id
          ))
          AND (p_spot_types IS NULL OR s.spot_type && p_spot_types::spot_type_enum[])
          AND (p_difficulties IS NULL OR s.difficulty = ANY(p_difficulties))
          AND (p_min_risk IS NULL OR s.kickout_risk >= p_min_risk)
          AND (p_max_risk IS NULL OR s.kickout_risk <= p_max_risk)
          AND (p_rider_types IS NULL OR p."riderType" = ANY(p_rider_types))
          AND (p_author_id IS NULL OR sp.user_id = p_author_id)
        
        UNION ALL
        
        SELECT 
            sv.id AS media_id,
            sv.spot_id,
            sv.user_id AS uploader_id,
            sv.url AS media_url,
            sv.thumbnail_url, -- thumbnail_url for videos
            'video'::media_type_enum AS media_type,
            sv.created_at,
            s.name AS spot_name,
            s.city,
            s.country,
            p.username AS uploader_username,
            p."displayName" AS uploader_display_name,
            p."avatarUrl" AS uploader_avatar_url,
            (
                SELECT EXISTS (
                    SELECT 1 FROM public.user_follows 
                    WHERE follower_id = p_user_id AND following_id = p.id
                )
            ) AS is_followed_by_user,
            COALESCE((SELECT COUNT(*)::int FROM public.media_likes ml WHERE ml.video_id = sv.id), 0) AS like_count,
            COALESCE((SELECT COUNT(*)::int FROM public.media_comments mc WHERE mc.video_id = sv.id), 0) AS comment_count
        FROM public.spot_videos sv
        JOIN public.spots s ON sv.spot_id = s.id
        JOIN public.profiles p ON sv.user_id = p.id
        WHERE (p_lat IS NULL OR p_lng IS NULL OR p_max_dist_km IS NULL OR
               ST_DWithin(s.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_max_dist_km * 1000))
          AND (NOT p_following_only OR p_user_id IS NULL OR EXISTS (
                SELECT 1 FROM public.user_follows 
                WHERE follower_id = p_user_id AND following_id = p.id
          ))
          AND (p_spot_types IS NULL OR s.spot_type && p_spot_types::spot_type_enum[])
          AND (p_difficulties IS NULL OR s.difficulty = ANY(p_difficulties))
          AND (p_min_risk IS NULL OR s.kickout_risk >= p_min_risk)
          AND (p_max_risk IS NULL OR s.kickout_risk <= p_max_risk)
          AND (p_rider_types IS NULL OR p."riderType" = ANY(p_rider_types))
          AND (p_author_id IS NULL OR sv.user_id = p_author_id)
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