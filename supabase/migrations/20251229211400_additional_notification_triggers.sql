-- 1. Trigger for Spot Favorite Notifications
CREATE OR REPLACE FUNCTION handle_spot_favorite_notification()
RETURNS TRIGGER AS $$
DECLARE
    spot_creator_id UUID;
BEGIN
    SELECT created_by INTO spot_creator_id FROM spots WHERE id = NEW.spot_id;
    
    -- Don't notify if favoriting own spot
    IF spot_creator_id != NEW.user_id THEN
        INSERT INTO notifications (user_id, actor_id, type, entity_id, entity_type, context_id)
        VALUES (spot_creator_id, NEW.user_id, 'like_spot', NEW.spot_id, 'spot', NEW.spot_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_spot_favorite
    AFTER INSERT ON user_favorite_spots
    FOR EACH ROW EXECUTE FUNCTION handle_spot_favorite_notification();


-- 2. Trigger for Media Like Notifications
CREATE OR REPLACE FUNCTION handle_media_like_notification()
RETURNS TRIGGER AS $$
DECLARE
    owner_id UUID;
    target_spot_id UUID;
BEGIN
    IF NEW.media_type = 'photo' THEN
        SELECT user_id, spot_id INTO owner_id, target_spot_id FROM spot_photos WHERE id = NEW.photo_id;
    ELSE
        SELECT user_id, spot_id INTO owner_id, target_spot_id FROM spot_videos WHERE id = NEW.video_id;
    END IF;
    
    -- Don't notify if liking own media
    IF owner_id != NEW.user_id THEN
        INSERT INTO notifications (user_id, actor_id, type, entity_id, entity_type, context_id)
        VALUES (owner_id, NEW.user_id, 'like_media', COALESCE(NEW.photo_id, NEW.video_id), 'media', target_spot_id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_media_like
    AFTER INSERT ON media_likes
    FOR EACH ROW EXECUTE FUNCTION handle_media_like_notification();


-- 3. Trigger for New Comment on Spot Notifications
CREATE OR REPLACE FUNCTION handle_new_comment_notification()
RETURNS TRIGGER AS $$
DECLARE
    spot_creator_id UUID;
BEGIN
    -- Only for root comments
    IF NEW.parent_id IS NULL THEN
        SELECT created_by INTO spot_creator_id FROM spots WHERE id = NEW.spot_id;
        
        -- Don't notify if commenting on own spot
        IF spot_creator_id != NEW.user_id THEN
            INSERT INTO notifications (user_id, actor_id, type, entity_id, entity_type, context_id)
            VALUES (spot_creator_id, NEW.user_id, 'comment', NEW.id, 'comment', NEW.spot_id);
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_new_comment
    AFTER INSERT ON spot_comments
    FOR EACH ROW EXECUTE FUNCTION handle_new_comment_notification();
