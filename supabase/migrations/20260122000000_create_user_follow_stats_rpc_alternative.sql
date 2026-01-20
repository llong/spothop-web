-- Sprint 9 RPC Function (Alternative Approach)
-- Simple return query without CTE to avoid parser issues

CREATE OR REPLACE FUNCTION get_user_follow_stats_simple(p_user_id uuid)
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
GRANT EXECUTE ON FUNCTION get_user_follow_stats_simple(uuid) TO authenticated;