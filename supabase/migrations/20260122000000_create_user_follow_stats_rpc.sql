-- Sprint 9 RPC Function for User Follower Stats (Clean Version)
-- Returns follower and following counts in a single efficient query
-- Uses PostgreSQL CTE for better readability and performance

CREATE OR REPLACE FUNCTION get_user_follow_stats(p_user_id uuid)
RETURNS TABLE (
    follower_count bigint,
    following_count bigint
) LANGUAGE sql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM user_followers WHERE follower_id = p_user_id) as follower_count,
        (SELECT COUNT(*) FROM user_followers WHERE following_id = p_user_id) as following_count;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION get_user_follow_stats(uuid) TO authenticated;