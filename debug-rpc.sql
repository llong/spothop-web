-- Sprint 9 Debug: Check what RPC function exists
SELECT proname, prosrc FROM pg_proc WHERE proname = 'get_user_follow_stats';