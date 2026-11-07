-- 1. Optimized Toggle Media Like
CREATE OR REPLACE FUNCTION public.toggle_media_like(p_media_id UUID)
RETURNS TABLE (new_is_liked BOOLEAN, new_like_count INTEGER) AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_exists BOOLEAN;
    v_media_type TEXT;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    -- Determine media type (we check both tables since we haven't unified them yet)
    IF EXISTS (SELECT 1 FROM public.spot_photos WHERE id = p_media_id) THEN
        v_media_type := 'photo';
    ELSIF EXISTS (SELECT 1 FROM public.spot_videos WHERE id = p_media_id) THEN
        v_media_type := 'video';
    ELSE
        RAISE EXCEPTION 'Media not found';
    END IF;

    SELECT EXISTS(SELECT 1 FROM public.media_likes WHERE 
        user_id = v_user_id AND 
        (CASE WHEN v_media_type = 'photo' THEN photo_id = p_media_id ELSE video_id = p_media_id END)
    ) INTO v_exists;
    
    IF v_exists THEN
        DELETE FROM public.media_likes WHERE 
            user_id = v_user_id AND 
            (CASE WHEN v_media_type = 'photo' THEN photo_id = p_media_id ELSE video_id = p_media_id END);
        new_is_liked := false;
    ELSE
        IF v_media_type = 'photo' THEN
            INSERT INTO public.media_likes (user_id, photo_id, media_type) VALUES (v_user_id, p_media_id, 'photo'::media_type_enum);
        ELSE
            INSERT INTO public.media_likes (user_id, video_id, media_type) VALUES (v_user_id, p_media_id, 'video'::media_type_enum);
        END IF;
        new_is_liked := true;
    END IF;

    -- Fetch denormalized count (updated by triggers)
    IF v_media_type = 'photo' THEN
        SELECT like_count INTO new_like_count FROM public.spot_photos WHERE id = p_media_id;
    ELSE
        SELECT like_count INTO new_like_count FROM public.spot_videos WHERE id = p_media_id;
    END IF;
    
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Optimized Toggle Spot Favorite
CREATE OR REPLACE FUNCTION public.toggle_spot_favorite(p_spot_id UUID)
RETURNS TABLE (new_is_favorited BOOLEAN, new_favorite_count INTEGER) AS $$
DECLARE
    v_user_id UUID := auth.uid();
    v_exists BOOLEAN;
BEGIN
    IF v_user_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT EXISTS(SELECT 1 FROM public.user_favorite_spots WHERE user_id = v_user_id AND spot_id = p_spot_id) INTO v_exists;

    IF v_exists THEN
        DELETE FROM public.user_favorite_spots WHERE user_id = v_user_id AND spot_id = p_spot_id;
        new_is_favorited := false;
    ELSE
        INSERT INTO public.user_favorite_spots (user_id, spot_id) VALUES (v_user_id, p_spot_id);
        new_is_favorited := true;
    END IF;

    SELECT favorite_count INTO new_favorite_count FROM public.spots WHERE id = p_spot_id;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Optimized Get Global Feed Content with Cursor Pagination
CREATE OR REPLACE FUNCTION public.get_global_feed_content(
    p_limit integer, 
    p_cursor_timestamp timestamptz DEFAULT NULL, 
    p_user_id uuid DEFAULT NULL::uuid, 
    p_lat double precision DEFAULT NULL::double precision, 
    p_lng double precision DEFAULT NULL::double precision, 
    p_max_dist_km double precision DEFAULT NULL::double precision, 
    p_following_only boolean DEFAULT false, 
    p_spot_types spot_type_enum[] DEFAULT NULL::spot_type_enum[], 
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
            (ml_user.user_id IS NOT NULL) AS is_liked_by_user,
            (ufs_user.user_id IS NOT NULL) AS is_favorited_by_user,
            sp.like_count,
            sp.comment_count,
            s.favorite_count
        FROM public.spot_photos sp
        JOIN public.spots s ON sp.spot_id = s.id
        JOIN public.profiles prof ON sp.user_id = prof.id
        LEFT JOIN public.user_follows uf ON uf.following_id = prof.id AND uf.follower_id = p_user_id
        LEFT JOIN public.media_likes ml_user ON ml_user.photo_id = sp.id AND ml_user.user_id = p_user_id
        LEFT JOIN public.user_favorite_spots ufs_user ON ufs_user.spot_id = s.id AND ufs_user.user_id = p_user_id
        WHERE (p_cursor_timestamp IS NULL OR sp.created_at < p_cursor_timestamp)
          AND (p_lat IS NULL OR p_lng IS NULL OR p_max_dist_km IS NULL OR
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
            (ml_user.user_id IS NOT NULL) AS is_liked_by_user,
            (ufs_user.user_id IS NOT NULL) AS is_favorited_by_user,
            sv.like_count,
            sv.comment_count,
            s.favorite_count
        FROM public.spot_videos sv
        JOIN public.spots s ON sv.spot_id = s.id
        JOIN public.profiles prof ON sv.user_id = prof.id
        LEFT JOIN public.user_follows uf ON uf.following_id = prof.id AND uf.follower_id = p_user_id
        LEFT JOIN public.media_likes ml_user ON ml_user.video_id = sv.id AND ml_user.user_id = p_user_id
        LEFT JOIN public.user_favorite_spots ufs_user ON ufs_user.spot_id = s.id AND ufs_user.user_id = p_user_id
        WHERE (p_cursor_timestamp IS NULL OR sv.created_at < p_cursor_timestamp)
          AND (p_lat IS NULL OR p_lng IS NULL OR p_max_dist_km IS NULL OR
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
    ),
    ordered_items AS (
        SELECT 
            *,
            (like_count * 2 + comment_count * 3 + EXTRACT(EPOCH FROM created_at) / 3600) AS popularity_score
        FROM media_items
        ORDER BY created_at DESC -- Better for discovery feeds
        LIMIT p_limit
    )
    SELECT jsonb_agg(ordered_items) INTO v_result FROM ordered_items;
    
    RETURN COALESCE(v_result, '[]'::jsonb);
END; $function$;
