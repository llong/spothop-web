-- Production hardening migration based on Gemini audit
-- 1. Standardize search_path for SECURITY DEFINER functions
-- 2. Implement auto-moderation threshold for feed content

-- Update get_global_feed_content with search_path and auto-moderation
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
SET search_path = public
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
            prof.username AS uploader_username,
            prof."displayName" AS uploader_display_name,
            prof."avatarUrl" AS uploader_avatar_url,
            (uf.follower_id IS NOT NULL) AS is_followed_by_user,
            COALESCE((SELECT COUNT(*)::int FROM public.media_likes ml WHERE ml.photo_id = sp.id), 0) AS like_count,
            COALESCE((SELECT COUNT(*)::int FROM public.media_comments mc WHERE mc.photo_id = sp.id), 0) AS comment_count
        FROM public.spot_photos sp
        JOIN public.spots s ON sp.spot_id = s.id
        JOIN public.profiles prof ON sp.user_id = prof.id
        LEFT JOIN public.user_follows uf ON uf.following_id = prof.id AND uf.follower_id = p_user_id
        WHERE (p_lat IS NULL OR p_lng IS NULL OR p_max_dist_km IS NULL OR
               ST_DWithin(s.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_max_dist_km * 1000))
          AND (NOT p_following_only OR (p_user_id IS NOT NULL AND uf.follower_id IS NOT NULL))
          AND (p_spot_types IS NULL OR s.spot_type && p_spot_types::spot_type_enum[])
          AND (p_difficulties IS NULL OR s.difficulty = ANY(p_difficulties))
          AND (p_min_risk IS NULL OR s.kickout_risk >= p_min_risk)
          AND (p_max_risk IS NULL OR s.kickout_risk <= p_max_risk)
          AND (p_rider_types IS NULL OR prof."riderType" = ANY(p_rider_types))
          AND (p_author_id IS NULL OR sp.user_id = p_author_id)
          -- Auto-moderation: hide content with 5 or more reports
          AND NOT EXISTS (
              SELECT 1 FROM public.content_reports cr 
              WHERE cr.target_id = sp.id AND cr.target_type = 'photo'
              GROUP BY cr.target_id 
              HAVING COUNT(*) >= 5
          )
          AND NOT EXISTS (
              SELECT 1 FROM public.content_reports cr 
              WHERE cr.target_id = s.id AND cr.target_type = 'spot'
              GROUP BY cr.target_id 
              HAVING COUNT(*) >= 5
          )
        
        UNION ALL
        
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
            (uf.follower_id IS NOT NULL) AS is_followed_by_user,
            COALESCE((SELECT COUNT(*)::int FROM public.media_likes ml WHERE ml.video_id = sv.id), 0) AS like_count,
            COALESCE((SELECT COUNT(*)::int FROM public.media_comments mc WHERE mc.video_id = sv.id), 0) AS comment_count
        FROM public.spot_videos sv
        JOIN public.spots s ON sv.spot_id = s.id
        JOIN public.profiles prof ON sv.user_id = prof.id
        LEFT JOIN public.user_follows uf ON uf.following_id = prof.id AND uf.follower_id = p_user_id
        WHERE (p_lat IS NULL OR p_lng IS NULL OR p_max_dist_km IS NULL OR
               ST_DWithin(s.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_max_dist_km * 1000))
          AND (NOT p_following_only OR (p_user_id IS NOT NULL AND uf.follower_id IS NOT NULL))
          AND (p_spot_types IS NULL OR s.spot_type && p_spot_types::spot_type_enum[])
          AND (p_difficulties IS NULL OR s.difficulty = ANY(p_difficulties))
          AND (p_min_risk IS NULL OR s.kickout_risk >= p_min_risk)
          AND (p_max_risk IS NULL OR s.kickout_risk <= p_max_risk)
          AND (p_rider_types IS NULL OR prof."riderType" = ANY(p_rider_types))
          AND (p_author_id IS NULL OR sv.user_id = p_author_id)
          -- Auto-moderation: hide content with 5 or more reports
          AND NOT EXISTS (
              SELECT 1 FROM public.content_reports cr 
              WHERE cr.target_id = sv.id AND cr.target_type = 'video'
              GROUP BY cr.target_id 
              HAVING COUNT(*) >= 5
          )
          AND NOT EXISTS (
              SELECT 1 FROM public.content_reports cr 
              WHERE cr.target_id = s.id AND cr.target_type = 'spot'
              GROUP BY cr.target_id 
              HAVING COUNT(*) >= 5
          )
    ),
    ranked_media AS (
        SELECT 
            *,
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

-- Update get_following_feed_content with search_path and auto-moderation
CREATE OR REPLACE FUNCTION public.get_following_feed_content(
    p_limit INTEGER DEFAULT 10,
    p_offset INTEGER DEFAULT 0,
    p_user_id UUID DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    WITH media_items AS (
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
            TRUE AS is_followed_by_user,
            COALESCE((SELECT COUNT(*)::int FROM public.media_likes ml WHERE ml.photo_id = sp.id), 0) AS like_count,
            COALESCE((SELECT COUNT(*)::int FROM public.media_comments mc WHERE mc.photo_id = sp.id), 0) AS comment_count
        FROM public.spot_photos sp
        JOIN public.spots s ON sp.spot_id = s.id
        JOIN public.profiles prof ON sp.user_id = prof.id
        JOIN public.user_follows uf ON uf.following_id = prof.id AND uf.follower_id = p_user_id
        WHERE 
          -- Auto-moderation: hide content with 5 or more reports
          NOT EXISTS (
              SELECT 1 FROM public.content_reports cr 
              WHERE cr.target_id = sp.id AND cr.target_type = 'photo'
              GROUP BY cr.target_id 
              HAVING COUNT(*) >= 5
          )
          AND NOT EXISTS (
              SELECT 1 FROM public.content_reports cr 
              WHERE cr.target_id = s.id AND cr.target_type = 'spot'
              GROUP BY cr.target_id 
              HAVING COUNT(*) >= 5
          )
        
        UNION ALL
        
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
            TRUE AS is_followed_by_user,
            COALESCE((SELECT COUNT(*)::int FROM public.media_likes ml WHERE ml.video_id = sv.id), 0) AS like_count,
            COALESCE((SELECT COUNT(*)::int FROM public.media_comments mc WHERE mc.video_id = sv.id), 0) AS comment_count
        FROM public.spot_videos sv
        JOIN public.spots s ON sv.spot_id = s.id
        JOIN public.profiles prof ON sv.user_id = prof.id
        JOIN public.user_follows uf ON uf.following_id = prof.id AND uf.follower_id = p_user_id
        WHERE 
          -- Auto-moderation: hide content with 5 or more reports
          NOT EXISTS (
              SELECT 1 FROM public.content_reports cr 
              WHERE cr.target_id = sv.id AND cr.target_type = 'video'
              GROUP BY cr.target_id 
              HAVING COUNT(*) >= 5
          )
          AND NOT EXISTS (
              SELECT 1 FROM public.content_reports cr 
              WHERE cr.target_id = s.id AND cr.target_type = 'spot'
              GROUP BY cr.target_id 
              HAVING COUNT(*) >= 5
          )
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

-- Standardize search_path for SECURITY DEFINER functions
ALTER FUNCTION public.handle_user_follow(UUID) SET search_path = public;
ALTER FUNCTION public.handle_media_like(UUID, media_type_enum) SET search_path = public;
ALTER FUNCTION public.handle_media_comment_reaction(UUID, TEXT) SET search_path = public;
ALTER FUNCTION public.post_comment(UUID, media_type_enum, TEXT, UUID) SET search_path = public;
ALTER FUNCTION public.get_user_follow_stats(UUID) SET search_path = public;
ALTER FUNCTION public.get_user_followers_batch(UUID, UUID, INTEGER) SET search_path = public;
ALTER FUNCTION public.get_user_following_batch(UUID, UUID, INTEGER) SET search_path = public;
ALTER FUNCTION public.find_common_1on1_conversation(UUID, UUID) SET search_path = public;
ALTER FUNCTION public.get_user_follow_stats_simple(UUID) SET search_path = public;
ALTER FUNCTION public.is_admin() SET search_path = public;
ALTER FUNCTION public.is_banned() SET search_path = public;
ALTER FUNCTION public.is_chat_participant(UUID) SET search_path = public;
ALTER FUNCTION public.spots_in_view(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) SET search_path = public;
ALTER FUNCTION public.spots_within_distance(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION) SET search_path = public;
ALTER FUNCTION public.handle_comment_reply_notification() SET search_path = public;
ALTER FUNCTION public.handle_media_like_notification() SET search_path = public;
ALTER FUNCTION public.handle_new_comment_notification() SET search_path = public;
ALTER FUNCTION public.handle_spot_favorite_notification() SET search_path = public;
ALTER FUNCTION public.protect_profile_roles() SET search_path = public;
ALTER FUNCTION public.cleanup_reports_on_delete() SET search_path = public;
ALTER FUNCTION public.notify_on_new_message() SET search_path = public;
ALTER FUNCTION public.handle_user_follow_notification() SET search_path = public;
ALTER FUNCTION public.handle_comment_reaction_notification() SET search_path = public;
ALTER FUNCTION public.cleanup_content_dependencies() SET search_path = public;
