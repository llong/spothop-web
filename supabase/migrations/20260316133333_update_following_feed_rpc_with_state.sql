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
            s.state,
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
            s.state,
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
