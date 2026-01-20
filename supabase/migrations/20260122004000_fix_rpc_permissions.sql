-- Fix Permission Issue: Grant RPC Execution to Authenticated Users
-- The previous GRANT might not have taken effect properly

-- Drop and recreate the function with proper permissions
DROP FUNCTION IF EXISTS get_user_follow_stats(uuid);

-- Recreate with explicit permissions
CREATE OR REPLACE FUNCTION get_user_follow_stats(p_user_id uuid)
RETURNS TABLE (
    follower_count bigint,
    following_count bigint
) LANGUAGE plpgsql AS $$
BEGIN
    RETURN QUERY
    SELECT 
        (SELECT COUNT(*) FROM user_followers WHERE follower_id = p_user_id) as follower_count,
        (SELECT COUNT(*) FROM user_followers WHERE following_id = p_user_id) as following_count;
END;
$$;

-- Ensure all authenticated users can execute
GRANT EXECUTE ON FUNCTION get_user_follow_stats(uuid) TO authenticated;

-- Also grant to service role if it exists
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
        GRANT EXECUTE ON FUNCTION get_user_follow_stats(uuid) TO service_role;
    END IF;
END $$;