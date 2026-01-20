-- Sprint 9 RPC: Batch User Following Fetching  
-- Optimizes following list queries with efficient database pagination

CREATE OR REPLACE FUNCTION get_user_following_batch(
    p_user_id uuid,
    p_cursor uuid DEFAULT NULL,
    p_limit integer DEFAULT 20
)
RETURNS TABLE (
    user_id uuid,
    username text,
    avatar_url text,
    cursor uuid,
    has_more boolean
) LANGUAGE sql AS $$
BEGIN
    -- Use cursor-based pagination for efficient large list fetching
    RETURN QUERY
    SELECT 
        u.id as user_id,
        u.username,
        u.avatar_url,
        uf.following_id as cursor,
        CASE 
            WHEN COUNT(*) OVER() > p_limit THEN true
            ELSE false
        END as has_more
    FROM auth.users u
    JOIN user_followers uf ON uf.following_id = u.id
    WHERE uf.following_id = p_user_id
      AND (p_cursor IS NULL OR uf.following_id > p_cursor)
    ORDER BY uf.following_id
    LIMIT p_limit + 1;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_following_batch(uuid, uuid, integer) TO authenticated;