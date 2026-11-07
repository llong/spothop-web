-- Feed RPCs: trust auth.uid() instead of a client-supplied p_user_id, return the large photo thumbnail,
-- fix auto-moderation (report target types are 'media'/'spot', never 'photo'/'video'), and pin search_path.
-- Signatures are unchanged, so existing clients keep working; p_user_id is now ignored.
-- Verified against live project wbkpofmvjcmdqbivocqc on 2026-11-07.

-- Stale offset-based overload (client uses the p_cursor_timestamp version).
DROP FUNCTION IF EXISTS public.get_global_feed_content(
    integer, integer, uuid, double precision, double precision, double precision,
    boolean, public.spot_type_enum[], text[], integer, integer, text[], uuid
);

CREATE OR REPLACE FUNCTION public.get_global_feed_content(
    p_limit integer,
    p_cursor_timestamp timestamp with time zone DEFAULT NULL::timestamp with time zone,
    p_user_id uuid DEFAULT NULL::uuid,  -- DEPRECATED: ignored, auth.uid() is used
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
SET search_path = public
AS $function$
DECLARE
    v_result JSONB;
    v_uid UUID := (SELECT auth.uid());
BEGIN
    WITH media_items AS (
        SELECT
            sp.id AS media_id,
            sp.spot_id,
            sp.user_id AS uploader_id,
            sp.url AS media_url,
            COALESCE(sp.thumbnail_large_url, sp.thumbnail_small_url, sp.thumbnailurl) AS thumbnail_url,
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
        LEFT JOIN public.user_follows uf ON uf.following_id = prof.id AND uf.follower_id = v_uid
        LEFT JOIN public.media_likes ml_user ON ml_user.photo_id = sp.id AND ml_user.user_id = v_uid
        LEFT JOIN public.user_favorite_spots ufs_user ON ufs_user.spot_id = s.id AND ufs_user.user_id = v_uid
        WHERE (p_cursor_timestamp IS NULL OR sp.created_at < p_cursor_timestamp)
          AND (p_lat IS NULL OR p_lng IS NULL OR p_max_dist_km IS NULL OR
               ST_DWithin(s.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_max_dist_km * 1000))
          AND (NOT p_following_only OR (v_uid IS NOT NULL AND uf.follower_id IS NOT NULL))
          AND (p_spot_types IS NULL OR s.spot_type && p_spot_types::spot_type_enum[])
          AND (p_difficulties IS NULL OR s.difficulty = ANY(p_difficulties))
          AND (p_min_risk IS NULL OR s.kickout_risk >= p_min_risk)
          AND (p_max_risk IS NULL OR s.kickout_risk <= p_max_risk)
          AND (p_rider_types IS NULL OR prof."riderType" = ANY(p_rider_types))
          AND (p_author_id IS NULL OR sp.user_id = p_author_id)
          -- Auto-moderation: hide content (or its spot) reported by 5+ distinct users
          AND NOT EXISTS (
              SELECT 1 FROM public.content_reports cr
              WHERE (cr.target_id = sp.id AND cr.target_type = 'media')
                 OR (cr.target_id = s.id AND cr.target_type = 'spot')
              GROUP BY cr.target_id, cr.target_type
              HAVING COUNT(DISTINCT cr.user_id) >= 5
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
        LEFT JOIN public.user_follows uf ON uf.following_id = prof.id AND uf.follower_id = v_uid
        LEFT JOIN public.media_likes ml_user ON ml_user.video_id = sv.id AND ml_user.user_id = v_uid
        LEFT JOIN public.user_favorite_spots ufs_user ON ufs_user.spot_id = s.id AND ufs_user.user_id = v_uid
        WHERE (p_cursor_timestamp IS NULL OR sv.created_at < p_cursor_timestamp)
          AND (p_lat IS NULL OR p_lng IS NULL OR p_max_dist_km IS NULL OR
               ST_DWithin(s.location::geography, ST_SetSRID(ST_MakePoint(p_lng, p_lat), 4326)::geography, p_max_dist_km * 1000))
          AND (NOT p_following_only OR (v_uid IS NOT NULL AND uf.follower_id IS NOT NULL))
          AND (p_spot_types IS NULL OR s.spot_type && p_spot_types::spot_type_enum[])
          AND (p_difficulties IS NULL OR s.difficulty = ANY(p_difficulties))
          AND (p_min_risk IS NULL OR s.kickout_risk >= p_min_risk)
          AND (p_max_risk IS NULL OR s.kickout_risk <= p_max_risk)
          AND (p_rider_types IS NULL OR prof."riderType" = ANY(p_rider_types))
          AND (p_author_id IS NULL OR sv.user_id = p_author_id)
          AND NOT EXISTS (
              SELECT 1 FROM public.content_reports cr
              WHERE (cr.target_id = sv.id AND cr.target_type = 'media')
                 OR (cr.target_id = s.id AND cr.target_type = 'spot')
              GROUP BY cr.target_id, cr.target_type
              HAVING COUNT(DISTINCT cr.user_id) >= 5
          )
    ),
    ordered_items AS (
        SELECT
            *,
            (like_count * 2 + comment_count * 3 + EXTRACT(EPOCH FROM created_at) / 3600) AS popularity_score
        FROM media_items
        ORDER BY created_at DESC
        LIMIT p_limit
    )
    SELECT jsonb_agg(ordered_items) INTO v_result FROM ordered_items;

    RETURN COALESCE(v_result, '[]'::jsonb);
END;
$function$;

CREATE OR REPLACE FUNCTION public.get_following_feed_content(
    p_limit integer,
    p_offset integer,
    p_user_id uuid,  -- DEPRECATED: ignored, auth.uid() is used
    p_spot_types public.spot_type_enum[] DEFAULT NULL::public.spot_type_enum[],
    p_difficulties text[] DEFAULT NULL::text[],
    p_min_risk integer DEFAULT NULL::integer,
    p_max_risk integer DEFAULT NULL::integer,
    p_rider_types text[] DEFAULT NULL::text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
    v_result JSONB;
    v_uid UUID := (SELECT auth.uid());
BEGIN
    IF v_uid IS NULL THEN
        RETURN '[]'::jsonb;
    END IF;

    WITH media_items AS (
        SELECT
            sp.id AS media_id,
            sp.spot_id,
            sp.user_id AS uploader_id,
            sp.url AS media_url,
            COALESCE(sp.thumbnail_large_url, sp.thumbnail_small_url, sp.thumbnailurl) AS thumbnail_url,
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
            sp.like_count,
            sp.comment_count
        FROM public.spot_photos sp
        JOIN public.spots s ON sp.spot_id = s.id
        JOIN public.profiles prof ON sp.user_id = prof.id
        JOIN public.user_follows uf ON uf.following_id = prof.id AND uf.follower_id = v_uid
        WHERE (p_spot_types IS NULL OR s.spot_type && p_spot_types::spot_type_enum[])
          AND (p_difficulties IS NULL OR s.difficulty = ANY(p_difficulties))
          AND (p_min_risk IS NULL OR s.kickout_risk >= p_min_risk)
          AND (p_max_risk IS NULL OR s.kickout_risk <= p_max_risk)
          AND (p_rider_types IS NULL OR prof."riderType" = ANY(p_rider_types))
          AND NOT EXISTS (
              SELECT 1 FROM public.content_reports cr
              WHERE (cr.target_id = sp.id AND cr.target_type = 'media')
                 OR (cr.target_id = s.id AND cr.target_type = 'spot')
              GROUP BY cr.target_id, cr.target_type
              HAVING COUNT(DISTINCT cr.user_id) >= 5
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
            true AS is_followed_by_user,
            sv.like_count,
            sv.comment_count
        FROM public.spot_videos sv
        JOIN public.spots s ON sv.spot_id = s.id
        JOIN public.profiles prof ON sv.user_id = prof.id
        JOIN public.user_follows uf ON uf.following_id = prof.id AND uf.follower_id = v_uid
        WHERE (p_spot_types IS NULL OR s.spot_type && p_spot_types::spot_type_enum[])
          AND (p_difficulties IS NULL OR s.difficulty = ANY(p_difficulties))
          AND (p_min_risk IS NULL OR s.kickout_risk >= p_min_risk)
          AND (p_max_risk IS NULL OR s.kickout_risk <= p_max_risk)
          AND (p_rider_types IS NULL OR prof."riderType" = ANY(p_rider_types))
          AND NOT EXISTS (
              SELECT 1 FROM public.content_reports cr
              WHERE (cr.target_id = sv.id AND cr.target_type = 'media')
                 OR (cr.target_id = s.id AND cr.target_type = 'spot')
              GROUP BY cr.target_id, cr.target_type
              HAVING COUNT(DISTINCT cr.user_id) >= 5
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
$function$;
