-- Add triggers for follow and comment reaction notifications
-- Created at: 2026-01-29

-- 1. Handle follow notification
CREATE OR REPLACE FUNCTION public.handle_user_follow_notification()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.notifications (user_id, actor_id, type, entity_id, entity_type)
    VALUES (
        NEW.following_id,
        NEW.follower_id,
        'follow',
        NEW.follower_id,
        'profile'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_user_follow
    AFTER INSERT ON public.user_follows
    FOR EACH ROW EXECUTE FUNCTION public.handle_user_follow_notification();

-- 2. Handle comment reaction notification
CREATE OR REPLACE FUNCTION public.handle_comment_reaction_notification()
RETURNS TRIGGER AS $$
DECLARE
    v_comment_owner_id UUID;
BEGIN
    -- Get the owner of the comment
    SELECT user_id INTO v_comment_owner_id FROM public.media_comments WHERE id = NEW.comment_id;

    -- Send notification if someone else reacts
    IF v_comment_owner_id IS NOT NULL AND v_comment_owner_id != NEW.user_id THEN
        INSERT INTO public.notifications (user_id, actor_id, type, entity_id, entity_type)
        VALUES (
            v_comment_owner_id,
            NEW.user_id,
            'like_comment',
            NEW.comment_id,
            'comment'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_comment_reaction
    AFTER INSERT ON public.comment_reactions
    FOR EACH ROW EXECUTE FUNCTION public.handle_comment_reaction_notification();