-- Sprint 9 RPC Function for User Follower Stats
-- Returns follower and following counts in a single efficient query

CREATE OR REPLACE FUNCTION get_user_follow_stats(p_user_id uuid)
RETURNS TABLE (
    follower_count bigint,
    following_count bigint
) LANGUAGE sql AS $$
BEGIN
    -- Use CTEs for cleaner, more readable performance
    WITH follower_stats AS (
        SELECT 
            (SELECT COUNT(*) FROM user_followers WHERE follower_id = p_user_id) as follower_count,
            (SELECT COUNT(*) FROM user_followers WHERE following_id = p_user_id) as following_count
    )
    RETURN QUERY
    SELECT 
        fs.follower_count,
        fs.following_count
    FROM follower_stats fs;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_follow_stats(uuid) TO authenticated;