-- 1. Enhance the generic cleanup function to handle notifications and polymorphic tags
CREATE OR REPLACE FUNCTION public.cleanup_content_dependencies()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Determine content type based on the table name
  IF TG_TABLE_NAME = 'spots' THEN
    -- Delete reports
    DELETE FROM content_reports WHERE target_id = OLD.id AND target_type = 'spot';
    -- Delete notifications (both direct and contextual)
    DELETE FROM notifications WHERE (entity_id = OLD.id AND entity_type = 'spot') OR (context_id = OLD.id);
  
  ELSIF TG_TABLE_NAME = 'spot_photos' OR TG_TABLE_NAME = 'spot_videos' THEN
    -- Delete reports
    DELETE FROM content_reports WHERE target_id = OLD.id AND target_type = 'media';
    -- Delete notifications
    DELETE FROM notifications WHERE entity_id = OLD.id AND entity_type = 'media';
    -- Delete media tags
    DELETE FROM media_tags WHERE mediaid = OLD.id;

  ELSIF TG_TABLE_NAME = 'spot_comments' OR TG_TABLE_NAME = 'media_comments' THEN
    -- Delete reports
    DELETE FROM content_reports WHERE target_id = OLD.id AND target_type = 'comment';
    -- Delete notifications
    DELETE FROM notifications WHERE entity_id = OLD.id AND entity_type = 'comment';
  END IF;

  RETURN OLD;
END;
$function$;

-- 2. Re-assign triggers to the new function
DROP TRIGGER IF EXISTS on_spot_delete_cleanup_reports ON public.spots;
CREATE TRIGGER on_spot_delete_cleanup_all
    BEFORE DELETE ON public.spots
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_content_dependencies();

DROP TRIGGER IF EXISTS on_photo_delete_cleanup_reports ON public.spot_photos;
CREATE TRIGGER on_photo_delete_cleanup_all
    BEFORE DELETE ON public.spot_photos
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_content_dependencies();

DROP TRIGGER IF EXISTS on_video_delete_cleanup_reports ON public.spot_videos;
CREATE TRIGGER on_video_delete_cleanup_all
    BEFORE DELETE ON public.spot_videos
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_content_dependencies();

DROP TRIGGER IF EXISTS on_comment_delete_cleanup_reports ON public.spot_comments;
CREATE TRIGGER on_comment_delete_cleanup_all
    BEFORE DELETE ON public.spot_comments
    FOR EACH ROW EXECUTE FUNCTION public.cleanup_content_dependencies();

-- 3. One-time "Garbage Collection" of existing orphaned data
-- Clean up notifications pointing to non-existent spots
DELETE FROM notifications 
WHERE entity_type = 'spot' 
AND NOT EXISTS (SELECT 1 FROM spots WHERE id = notifications.entity_id);

-- Clean up notifications pointing to non-existent media
DELETE FROM notifications 
WHERE entity_type = 'media' 
AND NOT EXISTS (SELECT 1 FROM spot_photos WHERE id = notifications.entity_id)
AND NOT EXISTS (SELECT 1 FROM spot_videos WHERE id = notifications.entity_id);