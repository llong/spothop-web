DROP FUNCTION IF EXISTS public.handle_user_follow(uuid);

CREATE OR REPLACE FUNCTION public.toggle_user_follow(p_following_id UUID)
RETURNS TABLE (new_is_followed BOOLEAN, new_follower_count INTEGER) AS $$
DECLARE
    v_follower_id UUID := auth.uid();
    v_exists BOOLEAN;
BEGIN
    IF v_follower_id IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

    SELECT EXISTS(SELECT 1 FROM public.user_follows WHERE follower_id = v_follower_id AND following_id = p_following_id) INTO v_exists;

    IF v_exists THEN
        DELETE FROM public.user_follows WHERE follower_id = v_follower_id AND following_id = p_following_id;
        new_is_followed := false;
    ELSE
        INSERT INTO public.user_follows (follower_id, following_id) VALUES (v_follower_id, p_following_id);
        new_is_followed := true;
    END IF;

    SELECT follower_count INTO new_follower_count FROM public.profiles WHERE id = p_following_id;
    RETURN NEXT;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
