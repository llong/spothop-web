
-- Update get_global_feed_content to include latitude and longitude
CREATE OR REPLACE FUNCTION public.get_global_feed_content(
    p_limit integer,
    p_offset integer,
    p_user_id uuid DEFAULT NULL::uuid,
    p_lat double precision DEFAULT NULL::double precision,
    p_lng double precision DEFAULT NULL::double precision,
    p_max_dist_km double precision DEFAULT NULL::double precision,
    p_following_only boolean DEFAULT false,
    p_spot_types public.spot_type_enum[] DEFAULT NULL::public.spot_type_enum[],
    p_difficulties text[] DEFAULT NULL::text[],
    p_min_risk integer DEFAULT NULL::integer,
    p_max_risk integer DEFAULT NULL::integer,
    p_rider_types text[] DEFAULT NULL::text[],
    p_author_id uuid DEFAULT NULL::uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
            s.state,
            s.country,
            s.latitude,
            s.longitude,
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
            s.state,
            s.country,
            s.latitude,
            s.longitude,
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
END; $function$;

-- Update get_following_feed_content to include latitude and longitude
CREATE OR REPLACE FUNCTION public.get_following_feed_content(
    p_limit integer,
    p_offset integer,
    p_user_id uuid,
    p_spot_types public.spot_type_enum[] DEFAULT NULL::public.spot_type_enum[],
    p_difficulties text[] DEFAULT NULL::text[],
    p_min_risk integer DEFAULT NULL::integer,
    p_max_risk integer DEFAULT NULL::integer,
    p_rider_types text[] DEFAULT NULL::text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
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
            s.state,
            s.country,
            s.latitude,
            s.longitude,
            prof.username AS uploader_username,
            prof."displayName" AS uploader_display_name,
            prof."avatarUrl" AS uploader_avatar_url,
            true AS is_followed_by_user,
            COALESCE((SELECT COUNT(*)::int FROM public.media_likes ml WHERE ml.photo_id = sp.id), 0) AS like_count,
            COALESCE((SELECT COUNT(*)::int FROM public.media_comments mc WHERE mc.photo_id = sp.id), 0) AS comment_count
        FROM public.spot_photos sp
        JOIN public.spots s ON sp.spot_id = s.id
        JOIN public.profiles prof ON sp.user_id = prof.id
        JOIN public.user_follows uf ON uf.following_id = prof.id AND uf.follower_id = p_user_id
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
            s.state,
            s.country,
            s.latitude,
            s.longitude,
            prof.username AS uploader_username,
            prof."displayName" AS uploader_display_name,
            prof."avatarUrl" AS uploader_avatar_url,
            true AS is_followed_by_user,
            COALESCE((SELECT COUNT(*)::int FROM public.media_likes ml WHERE ml.video_id = sv.id), 0) AS like_count,
            COALESCE((SELECT COUNT(*)::int FROM public.media_comments mc WHERE mc.video_id = sv.id), 0) AS comment_count
        FROM public.spot_videos sv
        JOIN public.spots s ON sv.spot_id = s.id
        JOIN public.profiles prof ON sv.user_id = prof.id
        JOIN public.user_follows uf ON uf.following_id = prof.id AND uf.follower_id = p_user_id
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
END; $function$;
